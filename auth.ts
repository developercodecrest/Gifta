import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getMongoClient, getMongoDb } from "@/lib/mongodb";
import { upsertProfile } from "@/lib/server/ecommerce-service";
import { ensureAuthUserById, ensureAuthUserRole, getAuthUserByEmail, verifyOtpAndGetUser } from "@/lib/server/otp-service";

const hasMongoConfig = Boolean(process.env.MONGODB_URI);
const mongoClient = hasMongoConfig ? getMongoClient() : undefined;
const PRODUCTION_APP_ORIGIN = "https://gifta.in";
const PRODUCTION_WWW_ORIGIN = "https://www.gifta.in";

function toOrigin(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

const adapter: Adapter | undefined = mongoClient
  ? (() => {
      const baseAdapter = MongoDBAdapter(mongoClient);
      const getUser = baseAdapter.getUser?.bind(baseAdapter);
      const getUserByEmail = baseAdapter.getUserByEmail?.bind(baseAdapter);
      const updateUser = baseAdapter.updateUser?.bind(baseAdapter);

      if (!getUser || !getUserByEmail || !updateUser) {
        throw new Error("MongoDB adapter is missing required user methods");
      }

      const findUserByEmailInsensitive = async (email: string) => {
        const normalizedEmail = normalizeEmail(email);
        const direct = await getUserByEmail(normalizedEmail);
        if (direct) {
          return direct;
        }

        const db = await getMongoDb();
        const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const existing = await db.collection<{ _id?: unknown }>("users").findOne({
          email: { $regex: `^${escaped}$`, $options: "i" },
        });

        if (!existing?._id) {
          return null;
        }

        return getUser(String(existing._id));
      };

      return {
        ...baseAdapter,
        async getUserByEmail(email) {
          return findUserByEmailInsensitive(email);
        },
        async createUser(user) {
          const normalizedEmail = normalizeEmail(user.email);
          const existing = await findUserByEmailInsensitive(normalizedEmail);
          if (existing) {
            return existing;
          }

          const db = await getMongoDb();
          const users = db.collection<{
            _id: unknown;
            name?: string | null;
            email: string;
            emailVerified?: Date | null;
            image?: string | null;
          }>("users");

          await users.updateOne(
            { email: normalizedEmail },
            {
              $setOnInsert: {
                name: user.name ?? null,
                email: normalizedEmail,
                emailVerified: user.emailVerified ?? null,
                image: user.image ?? null,
              },
            },
            { upsert: true },
          );

          const createdOrExisting = await users.findOne({ email: normalizedEmail });
          if (!createdOrExisting?._id) {
            throw new Error("Failed to resolve user after createUser upsert");
          }

          return {
            id: String(createdOrExisting._id),
            name: createdOrExisting.name ?? null,
            email: createdOrExisting.email,
            emailVerified: createdOrExisting.emailVerified ?? null,
            image: createdOrExisting.image ?? null,
          };
        },
        async updateUser(user) {
          return updateUser({
            ...user,
            ...(user.email ? { email: normalizeEmail(user.email) } : {}),
          });
        },
      } satisfies Adapter;
    })()
  : undefined;
const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: true,
    profile(profile) {
      return {
        id: profile.sub,
        email: profile.email?.trim().toLowerCase() ?? "",
        name: profile.name,
        image: profile.picture,
      };
    },
  }),
  ...(hasMongoConfig
    ? [
        Credentials({
          name: "Email OTP",
          credentials: {
            email: { label: "Email", type: "email" },
            otp: { label: "OTP", type: "text" },
            intent: { label: "Intent", type: "text" },
          },
          async authorize(credentials) {
            const email = credentials?.email;
            const otp = credentials?.otp;
            const intent = credentials?.intent;

            if (typeof email !== "string" || typeof otp !== "string") {
              return null;
            }

            const normalizedEmail = email.trim().toLowerCase();
            const resolvedIntent = intent === "signup" ? "signup" : "signin";

            if (resolvedIntent === "signin") {
              const existingUser = await getAuthUserByEmail(normalizedEmail);
              if (!existingUser) {
                return null;
              }
            }

            const user = await verifyOtpAndGetUser({
              email: normalizedEmail,
              otp,
              createIfMissing: resolvedIntent === "signup",
            });
            if (!user) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(adapter ? { adapter } : {}),
  trustHost: true,
  session: {
    strategy: mongoClient ? "database" : "jwt",
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  providers,
  callbacks: {
    async redirect({ url, baseUrl }) {
      const configuredOrigin =
        toOrigin(process.env.NEXTAUTH_URL) ??
        toOrigin(process.env.AUTH_URL) ??
        PRODUCTION_APP_ORIGIN;
      const baseOrigin = toOrigin(baseUrl) ?? baseUrl;
      const preferredOrigin =
        process.env.NODE_ENV === "production" && baseOrigin.includes("vercel.app")
          ? configuredOrigin
          : baseOrigin;
      const allowedOrigins = new Set([baseOrigin, configuredOrigin, PRODUCTION_APP_ORIGIN, PRODUCTION_WWW_ORIGIN]);

      if (url.startsWith("/")) {
        return `${preferredOrigin}${url}`;
      }

      try {
        const target = new URL(url);
        if (allowedOrigins.has(target.origin)) {
          return `${target.origin}${target.pathname}${target.search}${target.hash}`;
        }
      } catch {
        // Fall back to preferred origin below
      }

      return preferredOrigin;
    },
    async signIn({ user, account }) {
      if (mongoClient) {
        const provider = account?.provider;
        let resolvedUserId = user.id;

        if (provider === "google" && user.email) {
          // For OAuth, use email as source of truth to avoid creating a second user doc
          // when an OTP/credentials user already exists with the same email.
          const ensuredUser = await ensureAuthUserRole(user.email, "user");
          resolvedUserId = ensuredUser.id;
        } else if (user.id) {
          const ensuredUser = await ensureAuthUserById({
            userId: user.id,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            defaultRole: "user",
          });
          resolvedUserId = ensuredUser.id;
        } else if (user.email) {
          const ensuredUser = await ensureAuthUserRole(user.email, "user");
          resolvedUserId = ensuredUser.id;
        }

        if (provider === "google" && resolvedUserId) {
          await upsertProfile(
            {
              email: user.email ?? undefined,
              fullName: user.name ?? undefined,
            },
            resolvedUserId,
          );
        }
      }
      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token.sub ?? "";
        session.user.email = user?.email ?? session.user.email ?? null;
        session.user.name = user?.name ?? session.user.name ?? null;
        session.user.image = user?.image ?? session.user.image ?? null;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      delete token.email;
      delete token.name;
      delete token.picture;
      delete (token as Record<string, unknown>).role;
      return token;
    },
  },
});

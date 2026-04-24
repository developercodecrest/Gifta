import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getMongoClient, getMongoDb } from "@/lib/mongodb";
import { parseRole } from "@/lib/roles";
import { getPrimaryGoogleClientId, getPrimaryGoogleClientSecret, hasGoogleWebAuthConfig } from "@/lib/server/google-auth-config";
import { createMobileTokenBundle, getUserFromAccessToken } from "@/lib/server/mobile-session-service";
import { upsertProfile } from "@/lib/server/ecommerce-service";
import { ensureAuthUserById, ensureAuthUserRole, getAuthUserByEmail, verifyOtpAndGetUser } from "@/lib/server/otp-service";

const hasMongoConfig = Boolean(process.env.MONGODB_URI);
const mongoClient = hasMongoConfig ? getMongoClient() : undefined;
const PRODUCTION_APP_ORIGIN = "https://gifta.in";
const PRODUCTION_WWW_ORIGIN = "https://www.gifta.in";
const AUTH_DEBUG = process.env.AUTH_DEBUG === "1";

function maskEmail(value: string | null | undefined) {
  if (!value) return "-";
  const [name, domain] = value.split("@");
  if (!name || !domain) return "-";
  const maskedName = name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}***`;
  return `${maskedName}@${domain}`;
}

function authDebugLog(event: string, details: Record<string, unknown>) {
  if (!AUTH_DEBUG) return;
  console.info(`[auth-debug] ${event}`, details);
}

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

function normalizePhone(value: string | null | undefined) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return "";
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
  ...(hasGoogleWebAuthConfig()
    ? [
        Google({
          clientId: getPrimaryGoogleClientId(),
          clientSecret: getPrimaryGoogleClientSecret(),
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
      ]
    : []),
  ...(hasMongoConfig
    ? [
        Credentials({
          name: "OTP / Token",
          credentials: {
            id: { label: "id", type: "text" },
            email: { label: "Email", type: "email" },
            fullname: { label: "fullname", type: "text" },
            phone: { label: "phone", type: "text" },
            otp: { label: "OTP", type: "text" },
            token: { label: "token", type: "text" },
            role: { label: "role", type: "text" },
            intent: { label: "Intent", type: "text" },
          },
          async authorize(credentials) {
            const id = typeof credentials?.id === "string" ? credentials.id.trim() : "";
            const email = credentials?.email;
            const fullName = typeof credentials?.fullname === "string" ? credentials.fullname.trim() : "";
            const phone = normalizePhone(typeof credentials?.phone === "string" ? credentials.phone : "");
            const otp = credentials?.otp;
            const token = typeof credentials?.token === "string" ? credentials.token.trim() : "";
            const role = typeof credentials?.role === "string" ? credentials.role.trim() : "";
            const intent = credentials?.intent;

            // aasaan-web style credentials handoff where API already verified OTP and issued token.
            if (id && token) {
              const tokenUser = await getUserFromAccessToken(token);
              if (!tokenUser || tokenUser.id !== id) {
                authDebugLog("credentials.authorize.rejected_invalid_token", {
                  userId: id,
                });
                return null;
              }

              const ensured = await ensureAuthUserById({
                userId: tokenUser.id,
                email: tokenUser.email,
                name: fullName || tokenUser.fullName,
                phone: phone || undefined,
                defaultRole: parseRole(role || tokenUser.role),
              });

              authDebugLog("credentials.authorize.success_token", {
                userId: ensured.id,
                email: maskEmail(ensured.email),
                role: ensured.role,
              });

              return {
                id: ensured.id,
                email: ensured.email,
                name: fullName || ensured.fullName || ensured.name,
                phone: ensured.phone,
                role: ensured.role,
                token,
                fullname: fullName || ensured.fullName || ensured.name || "",
              };
            }

            if (typeof email !== "string" || typeof otp !== "string") {
              return null;
            }

            const normalizedEmail = email.trim().toLowerCase();
            const resolvedIntent = intent === "signup" ? "signup" : "signin";

            authDebugLog("credentials.authorize.start", {
              email: maskEmail(normalizedEmail),
              intent: resolvedIntent,
              hasOtp: Boolean(otp.trim()),
            });

            if (resolvedIntent === "signin") {
              const existingUser = await getAuthUserByEmail(normalizedEmail);
              authDebugLog("credentials.authorize.lookup", {
                email: maskEmail(normalizedEmail),
                exists: Boolean(existingUser),
              });
              if (!existingUser) {
                authDebugLog("credentials.authorize.rejected_missing_user", {
                  email: maskEmail(normalizedEmail),
                });
                return null;
              }
            }

            const user = await verifyOtpAndGetUser({
              email: normalizedEmail,
              otp,
              createIfMissing: resolvedIntent === "signup",
              fullName: fullName || undefined,
              phone: phone || undefined,
            });
            if (!user) {
              authDebugLog("credentials.authorize.rejected_invalid_otp", {
                email: maskEmail(normalizedEmail),
              });
              return null;
            }

            authDebugLog("credentials.authorize.success", {
              email: maskEmail(user.email),
              userId: user.id,
              role: user.role,
            });

            const tokenBundle = await createMobileTokenBundle({
              userId: user.id,
            });

            return {
              id: user.id,
              email: user.email,
              name: user.fullName ?? user.name,
              role: user.role,
              phone: user.phone,
              token: tokenBundle?.token,
              fullname: user.fullName ?? user.name ?? "",
            };
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(adapter ? { adapter } : {}),
  trustHost: true,
  debug: AUTH_DEBUG,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  providers,
  callbacks: {
    async authorized({ auth: authState, request }) {
      const pathname = request.nextUrl.pathname;
      const adminPath = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
      if (!adminPath) {
        return true;
      }

      return Boolean(authState?.user);
    },
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
          authDebugLog("callbacks.redirect.allowed", {
            targetOrigin: target.origin,
            path: `${target.pathname}${target.search}`,
            baseOrigin,
          });
          return `${target.origin}${target.pathname}${target.search}${target.hash}`;
        }
      } catch {
        // Fall back to preferred origin below
      }

      authDebugLog("callbacks.redirect.fallback", {
        url,
        baseOrigin,
        preferredOrigin,
      });

      return preferredOrigin;
    },
    async signIn({ user, account }) {
      authDebugLog("callbacks.signIn.start", {
        provider: account?.provider ?? "unknown",
        userId: user.id,
        email: maskEmail(user.email ?? undefined),
      });
      if (mongoClient) {
        const provider = account?.provider;
        let resolvedUserId = user.id;

        if (provider === "google" && user.email) {
          // For OAuth, use email as source of truth to avoid creating a second user doc
          // when an OTP/credentials user already exists with the same email.
          const ensuredUser = await ensureAuthUserRole(user.email, "USER");
          resolvedUserId = ensuredUser.id;
        } else if (user.id) {
          const ensuredUser = await ensureAuthUserById({
            userId: user.id,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            phone: user.phone ?? undefined,
            defaultRole: "USER",
          });
          resolvedUserId = ensuredUser.id;
        } else if (user.email) {
          const ensuredUser = await ensureAuthUserRole(user.email, "USER");
          resolvedUserId = ensuredUser.id;
        }

        if (provider === "google" && resolvedUserId) {
          await upsertProfile(
            {
              email: user.email ?? undefined,
              fullName: user.fullname ?? user.name ?? undefined,
            },
            resolvedUserId,
          );
        }
      }
      authDebugLog("callbacks.signIn.success", {
        provider: account?.provider ?? "unknown",
        userId: user.id,
        email: maskEmail(user.email ?? undefined),
      });
      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token.id ?? token.sub ?? "";
        session.user.email = (user?.email ?? token.email ?? session.user.email ?? "") as string;
        session.user.name = (user?.fullname ?? (token.fullname as string | undefined) ?? user?.name ?? token.name ?? session.user.name ?? null) as string | null;
        session.user.image = user?.image ?? session.user.image ?? null;
        session.user.phone = (token.phone as string | undefined) ?? user?.phone ?? "";
        session.user.role = parseRole((token.role as string | undefined) ?? user?.role ?? "USER");
      }
      session.token = (token.token as string | undefined) ?? session.token;
      authDebugLog("callbacks.session", {
        sessionUserId: session.user?.id,
        tokenSub: token.sub,
        sessionRole: session.user?.role,
      });
      return session;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.id = user.id;
        token.email = user.email;
        token.name = user.fullname ?? user.name;
        token.phone = user.phone;
        token.role = parseRole(user.role ?? "USER");
        token.token = user.token;
        token.fullname = user.fullname ?? user.name ?? "";
      }
      return token;
    },
  },
});

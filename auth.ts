import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getMongoClient } from "@/lib/mongodb";
import { upsertProfile } from "@/lib/server/ecommerce-service";
import { ensureAuthUserById, ensureAuthUserRole, verifyOtpAndGetUser } from "@/lib/server/otp-service";

const hasMongoConfig = Boolean(process.env.MONGODB_URI);
const mongoClient = hasMongoConfig ? getMongoClient() : undefined;
const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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

            const user = await verifyOtpAndGetUser({
              email,
              otp,
              createIfMissing: intent === "signup",
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
  ...(mongoClient ? { adapter: MongoDBAdapter(mongoClient) } : {}),
  session: {
    strategy: mongoClient ? "database" : "jwt",
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (mongoClient) {
        if (user.id) {
          await ensureAuthUserById({
            userId: user.id,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            defaultRole: "user",
          });
        } else if (user.email) {
          await ensureAuthUserRole(user.email, "user");
        }

        if (account?.provider === "google" && user.id) {
          await upsertProfile(
            {
              email: user.email,
              fullName: user.name ?? undefined,
            },
            user.id,
          );
        }
      }
      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token.sub ?? "";
        session.user.email = undefined;
        session.user.name = undefined;
        session.user.image = undefined;
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

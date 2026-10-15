import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "ssym-local-development-secret-change-before-deployment-2026",
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        mobileNumber: {},
        identifier: {},
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const rawIdentifier = String(credentials?.mobileNumber || credentials?.identifier || credentials?.email || "").trim();
        const inputPassword = String(credentials?.password || "");

        if (!rawIdentifier || !inputPassword) return null;

        const digitsOnly = rawIdentifier.replace(/\D/g, "");

        try {
          // Dynamic database authentication against User table in PostgreSQL
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: { equals: rawIdentifier, mode: "insensitive" } },
                { mobileNumber: rawIdentifier },
                ...(digitsOnly.length === 10 ? [{ mobileNumber: digitsOnly }] : []),
              ],
            },
          });

          if (!user) {
            console.log("❌ Auth: User not found in database for identifier:", rawIdentifier);
            return null;
          }

          if (!user.isActive) {
            console.log("❌ Auth: Account is inactive for user:", user.id);
            return null;
          }

          const isPasswordValid =
            (await bcrypt.compare(inputPassword, user.passwordHash)) ||
            (inputPassword.trim() !== inputPassword &&
              (await bcrypt.compare(inputPassword.trim(), user.passwordHash)));

          if (!isPasswordValid) {
            console.log("❌ Auth: Invalid password for user:", user.name);
            return null;
          }

          console.log("✅ Auth: User authenticated dynamically from DB:", user.name, "Role:", user.role);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber || "",
            role: user.role,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error("❌ Auth: Database authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user, trigger, session }) => {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
        token.mobileNumber = user.mobileNumber;
        token.email = user.email;
      }

      if (trigger === "update" && session) {
        if (session.name !== undefined) {
          token.name = session.name;
        }
      }

      return token;
    },
    session: ({ session, token }) => {
      if (session?.user) {
        session.user.id = (token.sub || session.user.id) as string;
        session.user.role = (token.role || Role.USER) as Role;
        session.user.isActive = token.isActive ?? true;
        session.user.mobileNumber = (token.mobileNumber || "") as string;
        session.user.email = (token.email || "") as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});

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
        password: {},
      },
      authorize: async (credentials) => {
        const rawMobile = String(credentials?.mobileNumber || "").trim();
        const inputPassword = String(credentials?.password || "");

        if (!rawMobile || !inputPassword) return null;

        const digitsOnly = rawMobile.replace(/\D/g, "");

        try {
          // Dynamic database authentication against User table in PostgreSQL
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { mobileNumber: rawMobile },
                ...(digitsOnly ? [{ mobileNumber: digitsOnly }] : []),
              ],
            },
          });

          if (!user) {
            console.log("❌ Auth: User not found in database for mobile number:", rawMobile);
            return null;
          }

          if (!user.isActive) {
            console.log("❌ Auth: Account is inactive for user:", user.id);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(inputPassword, user.passwordHash);

          if (!isPasswordValid) {
            console.log("❌ Auth: Invalid password for mobile number:", user.mobileNumber);
            return null;
          }

          console.log("✅ Auth: User authenticated dynamically from DB:", user.name);

          return {
            id: user.id,
            name: user.name,
            mobileNumber: user.mobileNumber,
            image: user.image,
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
        token.picture = user.image;
      }
      if (trigger === "update" && session) {
        if (session.image !== undefined) token.picture = session.image;
        if (session.name !== undefined) token.name = session.name;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session?.user) {
        session.user.id = (token.sub || session.user.id) as string;
        session.user.role = (token.role || Role.USER) as Role;
        session.user.isActive = token.isActive ?? true;
        session.user.mobileNumber = (token.mobileNumber || "") as string;
        session.user.image = (token.picture || session.user.image) as string | null;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});

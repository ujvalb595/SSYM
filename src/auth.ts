import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        mobileNumber: {},
        password: {},
      },
      authorize: async (credentials) => {
        const rawInput = String(credentials?.mobileNumber || "").trim();
        const inputPassword = String(credentials?.password || "");

        if (!rawInput || !inputPassword) return null;

        const digitsOnly = rawInput.replace(/\D/g, "");

        // Demo credentials fallback
        if (
          process.env.NODE_ENV !== "production" &&
          process.env.SSYM_DEMO_ADMIN_USERNAME &&
          process.env.SSYM_DEMO_ADMIN_PASSWORD &&
          rawInput === process.env.SSYM_DEMO_ADMIN_USERNAME &&
          inputPassword === process.env.SSYM_DEMO_ADMIN_PASSWORD
        ) {
          return {
            id: "demo-super-admin",
            name: "Super Admin",
            mobileNumber: rawInput,
            role: Role.SUPER_ADMIN,
            isActive: true,
          };
        }

        // Mobile number acts as the username
        const user = await prisma.user.findFirst({
          where: {
            mobileNumber: digitsOnly,
          },
        });

        if (!user) return null;

        if (!user.isActive) return null;

        const isPasswordValid = await bcrypt.compare(
          inputPassword,
          user.passwordHash
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session?.user) {
        session.user.id = (token.sub || session.user.id) as string;
        session.user.role = (token.role || Role.SUPER_ADMIN) as Role;
        session.user.isActive = token.isActive ?? true;
        session.user.mobileNumber = (token.mobileNumber || "") as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});

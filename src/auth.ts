import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: async (credentials) => {
        const parsed = z
          .object({
            username: z.string().min(1, "Mobile number is required"),
            password: z.string().min(1, "Password is required"),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const rawInput = parsed.data.username.trim();
        const digitsOnly = rawInput.replace(/\D/g, "");
        const inputPassword = parsed.data.password;

        // 1. Demo credentials fallback (if env variables are set)
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
            role: "SUPER_ADMIN",
            isActive: true,
          };
        }

        // 2. Database authentication by mobileNumber
        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { mobileNumber: rawInput },
                ...(digitsOnly ? [{ mobileNumber: digitsOnly }] : []),
              ],
            },
          });

          if (!user) {
            console.log("❌ Auth: User not found in DB for input:", rawInput);
            return null;
          }

          if (!user.isActive) {
            console.log("❌ Auth: User is inactive:", user.id);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(inputPassword, user.passwordHash);

          if (!isPasswordValid) {
            console.log("❌ Auth: Password mismatch for user:", user.mobileNumber);
            return null;
          }

          console.log("✅ Auth: Authentication successful for:", user.name);

          return {
            id: user.id,
            name: user.name,
            mobileNumber: user.mobileNumber,
            role: user.role,
            isActive: true,
          };
        } catch (error) {
          console.error("❌ Auth: Database authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.isActive = user.isActive ?? true;
        token.mobileNumber = user.mobileNumber;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session?.user) {
        session.user.id = (token.sub || session.user.id) as string;
        session.user.role = (token.role || "SUPER_ADMIN") as any;
        session.user.isActive = token.isActive ?? true;
        session.user.mobileNumber = (token.mobileNumber || "") as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});

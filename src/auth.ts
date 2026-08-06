import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [Credentials({
    credentials: { username: {}, password: {} },
    authorize: async (credentials) => {
      const parsed = z.object({ username: z.string().min(3), password: z.string().min(8) }).safeParse(credentials);
      if (!parsed.success) return null;
      if (
        process.env.NODE_ENV !== "production" &&
        parsed.data.username === process.env.SSYM_DEMO_ADMIN_USERNAME &&
        parsed.data.password === process.env.SSYM_DEMO_ADMIN_PASSWORD
      ) {
        return { id: "demo-super-admin", name: "Super Admin", email: "admin@ssym.local", role: "SUPER_ADMIN", isActive: true };
      }
      if (!process.env.PRISMA_DATABASE_URL) return null;
      const user = await prisma.user.findUnique({ where: { email: parsed.data.username } });
      if (!user?.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
      return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
    },
  })],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) { token.role = user.role; token.isActive = user.isActive; }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.sub!;
      session.user.role = token.role!;
      session.user.isActive = token.isActive!;
      return session;
    },
  },
  pages: { signIn: "/login" },
});

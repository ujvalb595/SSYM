import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User { role: Role; isActive: boolean; }
  interface Session { user: { id: string; role: Role; isActive: boolean } & NonNullable<Session["user"]>; }
}

declare module "next-auth/jwt" {
  interface JWT { role?: Role; isActive?: boolean; }
}

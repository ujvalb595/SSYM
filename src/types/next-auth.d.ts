import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: Role;
    isActive: boolean;
    mobileNumber?: string;
    email?: string | null;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      isActive: boolean;
      mobileNumber?: string;
      email?: string | null;
    } & NonNullable<Session["user"]>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    isActive?: boolean;
    mobileNumber?: string;
    email?: string | null;
  }
}

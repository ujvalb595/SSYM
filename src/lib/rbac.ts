import { Role } from "@prisma/client";
import { auth } from "@/auth";

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user.isActive || !roles.includes(session.user.role)) throw new Error("Forbidden");
  return session;
}

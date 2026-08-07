import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const memberSchema = z.object({
  name: z.string().trim().min(2).max(100),
  mobile: z.string().trim().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."),
  birthDate: z.coerce.date(),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.isActive || ![Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = memberSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid member data." }, { status: 400 });

  const { name, mobile, birthDate, password } = parsed.data;
  try {
    const member = await prisma.user.create({
      data: { name, mobileNumber: mobile, birthDate, passwordHash: await bcrypt.hash(password, 12), role: Role.USER },
      select: { id: true, name: true, mobileNumber: true, birthDate: true },
    });
    await prisma.auditLog.create({ data: { userId: session.user.id, action: "CREATE", entity: "User", entityId: member.id, metadata: { name, mobile } } });
    return Response.json({ member }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return Response.json({ message: "This mobile number is already registered." }, { status: 409 });
    return Response.json({ message: "Unable to add member. Please try again." }, { status: 500 });
  }
}

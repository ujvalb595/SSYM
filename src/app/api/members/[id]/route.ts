import { BloodGroup, Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateMemberSchema = z.object({
  name: z.string().trim().min(2).max(100),
  mobile: z.string().trim().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."),
  birthDate: z.string().optional().nullable(),
  bloodGroup: z.nativeEnum(BloodGroup).optional().nullable(),
  password: z.string().min(8).max(100).optional().or(z.literal("")),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isActive) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return Response.json({ message: "Member ID is required" }, { status: 400 });

  const isSelf = session.user.id === id;
  const isAdminOrSuperAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role);

  if (!isAdminOrSuperAdmin && !isSelf) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateMemberSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid member data." },
      { status: 400 }
    );
  }

  const { name, mobile, birthDate, bloodGroup, password, role, isActive } = parsed.data;

  // Check if mobile number is used by another user
  const existing = await prisma.user.findFirst({
    where: {
      mobileNumber: mobile,
      NOT: { id },
    },
  });

  if (existing) {
    return Response.json(
      { message: "This mobile number is already registered to another user." },
      { status: 409 }
    );
  }

  try {
    const updateData: Prisma.UserUpdateInput = {
      name,
      mobileNumber: mobile,
      bloodGroup: bloodGroup || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      updatedBy: { connect: { id: session.user.id } },
    };

    if (isAdminOrSuperAdmin) {
      if (role) {
        updateData.role = role;
      }

      if (typeof isActive === "boolean") {
        updateData.isActive = isActive;
      }
    }

    if (password && password.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const member = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        birthDate: true,
        bloodGroup: true,
        role: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "User",
        entityId: member.id,
        metadata: { name, mobile },
      },
    });

    return Response.json({ member });
  } catch (error) {
    console.error("Error updating member:", error);
    return Response.json(
      { message: "Unable to update member. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user.isActive || ![Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return Response.json({ message: "Member ID is required" }, { status: 400 });

  // Prevent admin from deleting themselves
  if (id === session.user.id) {
    return Response.json(
      { message: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  try {
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, mobileNumber: true },
    });

    if (!userToDelete) {
      return Response.json({ message: "Member not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entity: "User",
        entityId: id,
        metadata: { name: userToDelete.name, mobile: userToDelete.mobileNumber },
      },
    });

    return Response.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return Response.json(
      { message: "Unable to delete member. Please try again." },
      { status: 500 }
    );
  }
}

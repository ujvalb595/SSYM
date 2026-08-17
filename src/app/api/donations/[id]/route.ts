import { Role } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const editDonationSchema = z.object({
  donorName: z.string().trim().min(2, "Donor name must be at least 2 characters").max(150),
  title: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.coerce.date(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role);
  if (!isAdmin) {
    return Response.json(
      { message: "Permission denied. Only Admins and Super Admins can edit donations." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ message: "Donation ID is required" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = editDonationSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid donation data." },
      { status: 400 }
    );
  }

  const { donorName, title, description, amount, date } = parsed.data;

  try {
    let updatedDonation: Record<string, unknown>;

    if (prisma.donation) {
      updatedDonation = (await prisma.donation.update({
        where: { id },
        data: {
          donorName,
          title: title || null,
          description: description || null,
          amount,
          date,
          createdById: session.user.id,
        },
        include: {
          createdBy: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      })) as unknown as Record<string, unknown>;
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "Donation" SET "donorName" = $1, title = $2, description = $3, amount = $4, date = $5, "createdById" = $6, "updatedAt" = NOW() WHERE id = $7`,
        donorName,
        title || null,
        description || null,
        amount,
        new Date(date),
        session.user.id,
        id
      );
      updatedDonation = { id, donorName, title, description, amount, date, createdById: session.user.id };
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entity: "Donation",
          entityId: id,
          metadata: { donorName, title, amount },
        },
      });
    } catch {
      // Ignore audit log error
    }

    return Response.json({ donation: updatedDonation });
  } catch (error) {
    console.error("Error updating donation:", error);
    return Response.json(
      { message: "Unable to update donation. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role);
  if (!isAdmin) {
    return Response.json(
      { message: "Permission denied. Only Admins and Super Admins can delete donations." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ message: "Donation ID is required" }, { status: 400 });
  }

  try {
    if (prisma.donation) {
      await prisma.donation.delete({ where: { id } });
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM "Donation" WHERE id = $1`, id);
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE",
          entity: "Donation",
          entityId: id,
        },
      });
    } catch {
      // Ignore audit log error
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting donation:", error);
    return Response.json(
      { message: "Unable to delete donation. Please try again." },
      { status: 500 }
    );
  }
}

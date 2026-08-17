import { Role } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const editExpenseSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
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
      { message: "Permission denied. Only Admins and Super Admins can edit expenses." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ message: "Expense ID is required" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = editExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid expense data." },
      { status: 400 }
    );
  }

  const { title, description, amount, date } = parsed.data;

  try {
    let updatedExpense: Record<string, unknown>;

    if (prisma.expense) {
      updatedExpense = (await prisma.expense.update({
        where: { id },
        data: {
          title,
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
        `UPDATE "Expense" SET title = $1, description = $2, amount = $3, date = $4, "createdById" = $5, "updatedAt" = NOW() WHERE id = $6`,
        title,
        description || null,
        amount,
        new Date(date),
        session.user.id,
        id
      );
      updatedExpense = { id, title, description, amount, date, createdById: session.user.id };
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entity: "Expense",
          entityId: id,
          metadata: { title, amount },
        },
      });
    } catch {
      // Ignore audit log error
    }

    return Response.json({ expense: updatedExpense });
  } catch (error) {
    console.error("Error updating expense:", error);
    return Response.json(
      { message: "Unable to update expense. Please try again." },
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
      { message: "Permission denied. Only Admins and Super Admins can delete expenses." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ message: "Expense ID is required" }, { status: 400 });
  }

  try {
    if (prisma.expense) {
      await prisma.expense.delete({ where: { id } });
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM "Expense" WHERE id = $1`, id);
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE",
          entity: "Expense",
          entityId: id,
        },
      });
    } catch {
      // Ignore audit log error
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return Response.json(
      { message: "Unable to delete expense. Please try again." },
      { status: 500 }
    );
  }
}

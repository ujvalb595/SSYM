import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const expenseSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  description: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.coerce.date(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = expenseSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid expense data." },
      { status: 400 }
    );
  }

  const { title, description, amount, date } = parsed.data;

  try {
    let expense: Record<string, unknown>;

    if (prisma.expense) {
      expense = (await prisma.expense.create({
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
      const newId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Expense" ("id", "title", "description", "amount", "date", "createdById", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        newId,
        title,
        description || null,
        amount,
        new Date(date),
        session.user.id
      );
      expense = { id: newId, title, amount };
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          entity: "Expense",
          entityId: String(expense.id || ""),
          metadata: { title, amount },
        },
      });
    } catch {
      // Ignore audit log error if any
    }

    return Response.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return Response.json(
      { message: "Unable to add expense. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    let expenses: Record<string, unknown>[] = [];
    if (prisma.expense) {
      expenses = (await prisma.expense.findMany({
        include: {
          createdBy: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: { date: "desc" },
      })) as unknown as Record<string, unknown>[];
    } else {
      expenses = (await prisma.$queryRawUnsafe(`
        SELECT 
          e.id, 
          e.title, 
          e.description, 
          e.amount, 
          e.date, 
          e."createdById", 
          u.name AS "createdByName", 
          u.role AS "createdByRole"
        FROM "Expense" e
        LEFT JOIN "User" u ON e."createdById" = u.id
        ORDER BY e.date DESC
      `)) as Record<string, unknown>[];
    }

    return Response.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return Response.json(
      { message: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

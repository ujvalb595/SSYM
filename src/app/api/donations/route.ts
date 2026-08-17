import { Role } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const donationSchema = z.object({
  donorName: z.string().trim().min(2, "Donor name must be at least 2 characters").max(150),
  title: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.coerce.date(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role);
  if (!isAdmin) {
    return Response.json(
      { message: "Permission denied. Only Admins and Super Admins can add donations." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = donationSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid donation data." },
      { status: 400 }
    );
  }

  const { donorName, title, description, amount, date } = parsed.data;

  try {
    let donation: Record<string, unknown>;

    if (prisma.donation) {
      donation = (await prisma.donation.create({
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
      const newId = `don_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Donation" ("id", "donorName", "title", "description", "amount", "date", "createdById", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        newId,
        donorName,
        title || null,
        description || null,
        amount,
        new Date(date),
        session.user.id
      );
      donation = { id: newId, donorName, title, amount };
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          entity: "Donation",
          entityId: String(donation.id || ""),
          metadata: { donorName, title, amount },
        },
      });
    } catch {
      // Ignore audit log error
    }

    return Response.json({ donation }, { status: 201 });
  } catch (error) {
    console.error("Error creating donation:", error);
    return Response.json(
      { message: "Unable to add donation. Please try again." },
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
    let donations: Record<string, unknown>[] = [];
    if (prisma.donation) {
      donations = (await prisma.donation.findMany({
        include: {
          createdBy: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      })) as unknown as Record<string, unknown>[];
    } else {
      donations = (await prisma.$queryRawUnsafe(`
        SELECT 
          d.id, 
          d."donorName", 
          d.title, 
          d.description, 
          d.amount, 
          d.date, 
          d."createdById", 
          u.name AS "createdByName", 
          u.role AS "createdByRole"
        FROM "Donation" d
        LEFT JOIN "User" u ON d."createdById" = u.id
        ORDER BY d."updatedAt" DESC
      `)) as Record<string, unknown>[];
    }

    return Response.json({ donations });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return Response.json(
      { message: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}

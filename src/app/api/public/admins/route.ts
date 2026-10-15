import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EXCLUDE_ORG_USER_FILTER } from "@/lib/constants";

export async function GET() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [Role.SUPER_ADMIN, Role.ADMIN] },
        isActive: true,
        mobileNumber: { not: null },
        ...EXCLUDE_ORG_USER_FILTER,
      },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        role: true,
      },
      orderBy: [
        { role: "asc" },
        { name: "asc" },
      ],
    });

    return Response.json({ admins });
  } catch (error) {
    console.error("Failed to fetch admin contacts:", error);
    return Response.json(
      { message: "Failed to fetch admin contacts", admins: [] },
      { status: 500 }
    );
  }
}

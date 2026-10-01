import { BloodGroup, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncMemberBirthdayToGoogleCalendar } from "@/lib/google-calendar";

const memberSchema = z.object({
  name: z.string({ error: "Full name is required." }).trim().min(2, "Full name must be at least 2 characters.").max(100, "Full name must be 100 characters or less."),
  mobile: z.string({ error: "Mobile number is required." }).trim().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."),
  birthDate: z.coerce.date({ error: "Birthdate is required. Please enter a valid date." }),
  bloodGroup: z.nativeEnum(BloodGroup, { error: "Please select a valid blood group." }).optional().nullable(),
  password: z.string({ error: "Password is required." }).min(8, "Password must be at least 8 characters.").max(100, "Password must be 100 characters or less."),
  role: z.nativeEnum(Role).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.isActive || ![Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // The popup uses "birthdate"; normalize it to the API schema field "birthDate".
  const normalizedBody = {
    ...body,
    birthDate: body.birthDate ?? body.birthdate,
  };

  const parsed = memberSchema.safeParse(normalizedBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return Response.json(
      {
        message: issue?.message ?? "Please check the entered member details.",
        field: issue?.path?.[0] ?? null,
      },
      { status: 400 }
    );
  }

  const { name, mobile, birthDate, bloodGroup, password, role } = parsed.data;

  // Only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN, regular ADMIN can assign ADMIN or USER
  let assignedRole: Role = Role.USER;
  if (role) {
    if (session.user.role === Role.SUPER_ADMIN) {
      assignedRole = role;
    } else if (session.user.role === Role.ADMIN && role !== Role.SUPER_ADMIN) {
      assignedRole = role;
    }
  }

  try {
    const member = await prisma.user.create({
      data: {
        name,
        mobileNumber: mobile,
        birthDate,
        bloodGroup: bloodGroup || null,
        passwordHash: await bcrypt.hash(password, 12),
        role: assignedRole,
        createdById: session.user.id,
        updatedById: session.user.id,
      },
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
        action: "CREATE",
        entity: "User",
        entityId: member.id,
        metadata: { name, mobile },
      },
    });

    // Automatically sync birthday to Google Calendar
    if (member.birthDate) {
      try {
        await syncMemberBirthdayToGoogleCalendar({
          memberId: member.id,
          memberName: member.name,
          birthDate: member.birthDate,
          mobileNumber: member.mobileNumber,
        });
      } catch (calErr) {
        console.error("Failed to automatically sync birthday to Google Calendar:", calErr);
      }
    }

    return Response.json({ member }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return Response.json({ message: "This mobile number is already registered." }, { status: 409 });
    }
    return Response.json({ message: "Unable to add member. Please try again." }, { status: 500 });
  }
}

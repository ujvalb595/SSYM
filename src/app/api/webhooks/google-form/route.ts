import { NextRequest, NextResponse } from "next/server";
import { BloodGroup } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { syncMemberBirthdayToGoogleCalendar } from "@/lib/google-calendar";

// Comprehensive normalizer for Blood Group
function normalizeBloodGroup(input?: string | null): BloodGroup | null {
  if (!input) return null;
  const s = input.trim().toUpperCase().replace(/\s+/g, "");

  if (s.includes("AB+") || s.includes("ABPOS")) return "AB_POSITIVE";
  if (s.includes("AB-") || s.includes("ABNEG")) return "AB_NEGATIVE";
  if (s.includes("A+") || s.includes("APOS") || s === "A_POSITIVE") return "A_POSITIVE";
  if (s.includes("A-") || s.includes("ANEG") || s === "A_NEGATIVE") return "A_NEGATIVE";
  if (s.includes("B+") || s.includes("BPOS") || s === "B_POSITIVE") return "B_POSITIVE";
  if (s.includes("B-") || s.includes("BNEG") || s === "B_NEGATIVE") return "B_NEGATIVE";
  if (s.includes("O+") || s.includes("OPOS") || s === "O_POSITIVE") return "O_POSITIVE";
  if (s.includes("O-") || s.includes("ONEG") || s === "O_NEGATIVE") return "O_NEGATIVE";

  return null;
}

// Mobile normalizer (handles Indian prefixes +91, 0, spaces, dashes)
function normalizeMobile(mobileStr?: string | null): string {
  if (!mobileStr) return "";
  const digits = String(mobileStr).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

// Robust date parser for Google Form values (ISO, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)
function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();

  // Try direct Date parsing (handles ISO format e.g. 2001-05-18 or 2001-05-18T00:00:00.000Z)
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD
      const [year, month, day] = parts.map((p) => parseInt(p, 10));
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Handle slash or dot separated dates (e.g. DD/MM/YYYY or MM/DD/YYYY)
  const separator = trimmed.includes("/") ? "/" : trimmed.includes(".") ? "." : null;
  if (separator) {
    const parts = trimmed.split(separator);
    if (parts.length === 3) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);

      if (year < 100) year += 1900;

      let day: number;
      let month: number;

      if (p2 > 12) {
        // MM/DD/YYYY format
        month = p1;
        day = p2;
      } else if (p1 > 12) {
        // DD/MM/YYYY format
        day = p1;
        month = p2;
      } else {
        // Indian standard default: DD/MM/YYYY
        day = p1;
        month = p2;
      }

      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Fallback to native constructor
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Helper to look up fuzzy field names from Google Form payload (supports English & Gujarati)
function findFieldValue(body: Record<string, unknown>, candidateKeys: string[]): string | undefined {
  const bodyKeys = Object.keys(body);

  for (const candidate of candidateKeys) {
    const target = candidate.toLowerCase().replace(/[\s\-_:?*.]/g, "");

    // 1. Exact match after stripping whitespace and punctuation
    for (const key of bodyKeys) {
      const cleanKey = key.toLowerCase().replace(/[\s\-_:?*.]/g, "");
      if (cleanKey === target) {
        const val = body[key];
        if (Array.isArray(val)) return val[0] != null ? String(val[0]).trim() : undefined;
        if (val != null) return String(val).trim();
      }
    }

    // 2. Contains match
    for (const key of bodyKeys) {
      const cleanKey = key.toLowerCase().replace(/[\s\-_:?*.]/g, "");
      if (cleanKey.includes(target) || target.includes(cleanKey)) {
        const val = body[key];
        if (Array.isArray(val)) return val[0] != null ? String(val[0]).trim() : undefined;
        if (val != null) return String(val).trim();
      }
    }
  }

  return undefined;
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "SSYM Google Form Webhook Endpoint is ready to receive submissions.",
    acceptedFields: {
      name: "Full Name of member (e.g. 'Aarav Patel' or 'નામ')",
      mobile: "10-digit mobile number (e.g. '9876543210' or 'મોબાઈલ નંબર')",
      birthDate: "Date of Birth (e.g. '1998-05-15' or 'જન્મ તારીખ')",
      bloodGroup: "Blood group (e.g. 'B+', 'O+' or 'બ્લડ ગ્રુપ')",
    },
    instructions: "POST JSON or form data with x-webhook-secret header or ?secret= query parameter.",
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret Key for Security
    const configuredSecret = process.env.GOOGLE_FORM_WEBHOOK_SECRET || "ssym_secret_form_sync_2026";
    const authHeader = req.headers.get("x-webhook-secret");
    const urlSecret = req.nextUrl.searchParams.get("secret");

    let body: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyData = formData as any;
      if (typeof anyData.entries === "function") {
        for (const [key, value] of anyData.entries()) {
          body[key] = typeof value === "string" ? value : String(value);
        }
      }
    } else {
      // Fallback try JSON
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const bodySecret = typeof body.secret === "string" ? body.secret : undefined;
    const providedSecret = authHeader || urlSecret || bodySecret;

    if (configuredSecret && providedSecret !== configuredSecret) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid webhook secret token." },
        { status: 401 }
      );
    }

    // 2. Extract values intelligently supporting English & Gujarati Google Form question labels
    const rawName =
      (typeof body.name === "string" ? body.name : undefined) ||
      findFieldValue(body, ["નામ", "સભ્યનામ", "fullname", "membername", "name", "yourname", "applicantname"]);

    const rawMobile =
      (typeof body.mobile === "string" ? body.mobile : undefined) ||
      findFieldValue(body, ["મોબાઈલનંબર", "મોબાઈલ", "mobilenumber", "phone", "phonenumber", "contact", "contactnumber", "whatsapp", "whatsappnumber", "mobile"]);

    const rawBirthDate =
      (typeof body.birthDate === "string" ? body.birthDate : undefined) ||
      (typeof body.birthdate === "string" ? body.birthdate : undefined) ||
      findFieldValue(body, ["જન્મતારીખ", "જન્મ", "birthdate", "dateofbirth", "dob", "birth", "birthday"]);

    const rawBloodGroup =
      (typeof body.bloodGroup === "string" ? body.bloodGroup : undefined) ||
      (typeof body.bloodgroup === "string" ? body.bloodgroup : undefined) ||
      findFieldValue(body, ["બ્લડગ્રુપ", "બ્લડ", "bloodgroup", "blood", "bloodtype"]);

    if (!rawName || !rawMobile) {
      return NextResponse.json(
        {
          message: "Name and Mobile number are required.",
          received: { rawName, rawMobile },
        },
        { status: 400 }
      );
    }

    const cleanName = rawName.trim();
    const cleanMobile = normalizeMobile(rawMobile);
    const parsedDate = parseDate(rawBirthDate);
    const parsedBg = normalizeBloodGroup(rawBloodGroup);

    if (cleanMobile.length !== 10) {
      return NextResponse.json(
        {
          message: `Invalid mobile number: "${rawMobile}". Must be a valid 10-digit number.`,
        },
        { status: 400 }
      );
    }

    // 3. Check for Existing User in Database
    const existing = await prisma.user.findUnique({
      where: { mobileNumber: cleanMobile },
    });

    if (existing) {
      // Automatically update the existing member's information
      const updatedUser = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: cleanName || existing.name,
          ...(parsedDate ? { birthDate: parsedDate } : {}),
          ...(parsedBg ? { bloodGroup: parsedBg } : {}),
        },
      });

      // Log the update in AuditLog
      await prisma.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "User",
          entityId: existing.id,
          metadata: {
            source: "GOOGLE_FORM_WEBHOOK",
            name: cleanName,
            mobile: cleanMobile,
            birthDate: parsedDate?.toISOString(),
            bloodGroup: parsedBg,
          },
        },
      });

      // Synchronize birthday to Google Calendar in background (non-blocking)
      const targetBirthDate = parsedDate || existing.birthDate;
      if (targetBirthDate) {
        syncMemberBirthdayToGoogleCalendar({
          memberId: existing.id,
          memberName: cleanName,
          birthDate: targetBirthDate,
          mobileNumber: cleanMobile,
        }).catch((calErr) => {
          console.error("Google Calendar Birthday Sync error:", calErr);
        });
      }

      return NextResponse.json(
        {
          message: `Member "${cleanName}" details updated successfully from Google Form!`,
          action: "updated",
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            mobile: updatedUser.mobileNumber,
            birthDate: updatedUser.birthDate,
            bloodGroup: updatedUser.bloodGroup,
          },
        },
        { status: 200 }
      );
    }

    // 4. Create New Member
    const defaultPasswordHash = await bcrypt.hash("Ssym@123", 12);

    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        mobileNumber: cleanMobile,
        birthDate: parsedDate,
        bloodGroup: parsedBg,
        passwordHash: defaultPasswordHash,
        role: "USER",
        isActive: true,
      },
    });

    // Record creation in AuditLog
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "User",
        entityId: newUser.id,
        metadata: {
          source: "GOOGLE_FORM_WEBHOOK",
          name: cleanName,
          mobile: cleanMobile,
          birthDate: parsedDate?.toISOString(),
          bloodGroup: parsedBg,
        },
      },
    });

    // Synchronize birthday to Google Calendar in background (non-blocking)
    if (parsedDate) {
      syncMemberBirthdayToGoogleCalendar({
        memberId: newUser.id,
        memberName: cleanName,
        birthDate: parsedDate,
        mobileNumber: cleanMobile,
      }).catch((calErr) => {
        console.error("Google Calendar Birthday Sync error:", calErr);
      });
    }

    return NextResponse.json(
      {
        message: `Member "${cleanName}" registered successfully from Google Form!`,
        action: "created",
        user: {
          id: newUser.id,
          name: newUser.name,
          mobile: newUser.mobileNumber,
          birthDate: newUser.birthDate,
          bloodGroup: newUser.bloodGroup,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error processing Google Form webhook" },
      { status: 500 }
    );
  }
}


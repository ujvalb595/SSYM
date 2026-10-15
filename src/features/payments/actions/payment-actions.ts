"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma, Prisma } from "@/lib/prisma";
import { EXCLUDE_ORG_USER_FILTER } from "@/lib/constants";
import { Role, PaymentStatus } from "@prisma/client";
import type { PaymentItemData } from "@/features/payments/components/payments-requests-table";

export async function submitPaymentRequest(selectedMonthValues: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!selectedMonthValues || selectedMonthValues.length === 0) {
    throw new Error("No months selected");
  }

  const userId = session.user.id;
  const amountPerMonth = 500;

  // Process each selected month string format: "YYYY-MM"
  for (const item of selectedMonthValues) {
    const [yearStr, monthStr] = item.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(month)) continue;

    // Upsert payment request for the user for this month/year
    await prisma.payment.upsert({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      update: {
        status: PaymentStatus.PENDING,
        amount: amountPerMonth,
        submittedAt: new Date(),
        createdById: userId,
      },
      create: {
        userId,
        month,
        year,
        amount: amountPerMonth,
        status: PaymentStatus.PENDING,
        createdById: userId,
      },
    });
  }

  revalidatePath("/payments");
  return { success: true, count: selectedMonthValues.length };
}

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        mobileNumber: true;
      };
    };
    approvedBy: {
      select: {
        name: true;
      };
    };
    createdBy: {
      select: {
        id: true;
        name: true;
        role: true;
      };
    };
  };
}>;

function serializePayment(p: PaymentWithRelations): PaymentItemData {
  const isCreatedByPaymentAdmin =
    p.createdBy?.role === Role.PAYMENT_ADMIN ||
    (p.remarks?.toLowerCase().includes("payment admin") ?? false);

  return {
    id: p.id,
    userId: p.userId,
    createdById: p.createdById ?? null,
    month: p.month,
    year: p.year,
    amount: Number(p.amount),
    status: p.status,
    remarks: p.remarks ?? null,
    submittedAt: p.submittedAt ? p.submittedAt.toISOString() : new Date().toISOString(),
    approvedAt: p.approvedAt ? p.approvedAt.toISOString() : null,
    user: p.user ? { name: p.user.name ?? "", mobileNumber: p.user.mobileNumber ?? "" } : undefined,
    approvedBy: p.approvedBy?.name ? { name: p.approvedBy.name } : null,
    createdBy: p.createdBy ? { id: p.createdBy.id, name: p.createdBy.name, role: p.createdBy.role } : null,
    requiresSuperAdminApproval: isCreatedByPaymentAdmin,
  };
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role;

  // Payment Admins are not allowed to approve or reject payments
  if (role === Role.PAYMENT_ADMIN) {
    throw new Error("Permission denied. Payment Admins cannot approve or reject payments.");
  }

  // Only Super Admin and Admin can verify and approve/reject payments
  if (role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
    throw new Error(
      "Permission denied. Only Super Admin and Admin can verify and approve payments."
    );
  }

  // Get the payment first so we can check who requested it and who created it
  const existingPayment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!existingPayment) {
    throw new Error("Payment request not found.");
  }

  // Prevent an admin from approving/rejecting their own request
  if (existingPayment.userId === session.user.id) {
    throw new Error(
      "You cannot approve or reject your own payment request."
    );
  }

  // Only pending requests can be processed
  if (existingPayment.status !== PaymentStatus.PENDING) {
    throw new Error(
      "This payment request has already been processed."
    );
  }

  // CRITICAL REQUIREMENT: Payment requests raised by a Payment Admin can ONLY be approved by Super Admin!
  const isCreatedByPaymentAdmin =
    existingPayment.createdBy?.role === Role.PAYMENT_ADMIN ||
    (existingPayment.remarks?.toLowerCase().includes("payment admin") ?? false);

  if (isCreatedByPaymentAdmin && role !== Role.SUPER_ADMIN) {
    throw new Error(
      "Permission denied. Payment requests raised by a Payment Admin can only be approved by a Super Admin."
    );
  }

  const updated = await prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status,
      approvedById: session.user.id,
      approvedAt:
        status === PaymentStatus.APPROVED
          ? new Date()
          : null,
    },
    include: {
      user: {
        select: {
          name: true,
          mobileNumber: true,
        },
      },
      approvedBy: {
        select: {
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  // Record action in PaymentApprovalLog
  try {
    await prisma.paymentApprovalLog.create({
      data: {
        paymentId,
        adminId: session.user.id,
        status,
        remarks:
          status === PaymentStatus.APPROVED
            ? isCreatedByPaymentAdmin
              ? `Approved by Super Admin (${session.user.name || "Super Admin"}) [Raised by Payment Admin]`
              : `Approved by ${role === Role.SUPER_ADMIN ? "Super Admin" : "Admin"} (${session.user.name || "Admin"})`
            : isCreatedByPaymentAdmin
            ? `Rejected by Super Admin (${session.user.name || "Super Admin"}) [Raised by Payment Admin]`
            : `Rejected by ${role === Role.SUPER_ADMIN ? "Super Admin" : "Admin"} (${session.user.name || "Admin"})`,
      },
    });
  } catch (logErr) {
    console.error("Failed to write to PaymentApprovalLog:", logErr);
  }

  revalidatePath("/payments");

  return {
    success: true,
    payment: serializePayment(updated),
  };
}

export async function getPaymentsData() {
  const session = await auth();
  if (!session?.user?.id) {
    return { userPayments: [], allPayments: [], isAdmin: false };
  }

  const role = session.user.role;
  const isAdmin =
    role === Role.ADMIN ||
    role === Role.SUPER_ADMIN ||
    role === Role.PAYMENT_ADMIN;

  if (isAdmin) {
    // For admins, fetch all payments in one query and derive user payments in memory
    const rawAllPayments = await prisma.payment.findMany({
      include: {
        user: {
          select: { name: true, mobileNumber: true },
        },
        approvedBy: {
          select: { name: true },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const userPaymentRows = rawAllPayments
      .filter((p) => p.userId === session.user.id)
      .sort((a, b) => (b.year - a.year !== 0 ? b.year - a.year : b.month - a.month));

    return {
      userPayments: userPaymentRows.map(serializePayment),
      allPayments: rawAllPayments.map(serializePayment),
      isAdmin,
    };
  }

  // For regular users, only fetch their own payments
  const rawUserPayments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    include: {
      user: {
        select: { name: true, mobileNumber: true },
      },
      approvedBy: {
        select: { name: true },
      },
      createdBy: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return {
    userPayments: rawUserPayments.map(serializePayment),
    allPayments: [],
    isAdmin: false,
  };
}

export async function getUsersForPayment() {
  const session = await auth();
  if (!session?.user?.id) return [];
  const role = session.user.role;
  if (
    role !== Role.ADMIN &&
    role !== Role.SUPER_ADMIN &&
    role !== Role.PAYMENT_ADMIN
  ) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...EXCLUDE_ORG_USER_FILTER,
    },
    select: { id: true, name: true, membershipNumber: true },
    orderBy: { name: 'asc' }
  });
  return users;
}

export async function adminSubmitPaymentRequest(
  userId: string,
  selectedMonthValues: string[],
  paymentDate: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const role = session.user.role;
  if (
    role !== Role.ADMIN &&
    role !== Role.SUPER_ADMIN &&
    role !== Role.PAYMENT_ADMIN
  ) {
    throw new Error("Permission denied. Only admins and payment managers can add payments on behalf of users.");
  }

  if (!selectedMonthValues || selectedMonthValues.length === 0) {
    throw new Error("No months selected");
  }

  const amountPerMonth = 500;
  const adminId = session.user.id;
  const parsedDate = paymentDate ? new Date(paymentDate) : new Date();

  const isPaymentAdmin = role === Role.PAYMENT_ADMIN;
  const initialStatus = isPaymentAdmin ? PaymentStatus.PENDING : PaymentStatus.APPROVED;
  const approvedAt = isPaymentAdmin ? null : new Date();
  const approvedById = isPaymentAdmin ? null : adminId;
  const adminName = session.user.name || "Payment Admin";
  const remarks = isPaymentAdmin
    ? `Raised by Payment Admin (${adminName}) - Pending Super Admin Approval`
    : "Added manually by admin";

  for (const item of selectedMonthValues) {
    const [yearStr, monthStr] = item.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (isNaN(year) || isNaN(month)) continue;

    // Check if payment already exists for this member and month
    const existing = await prisma.payment.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
    });

    // If already approved, do not overwrite with pending
    if (existing && existing.status === PaymentStatus.APPROVED && isPaymentAdmin) {
      continue;
    }

    await prisma.payment.upsert({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      update: {
        status: initialStatus,
        amount: amountPerMonth,
        submittedAt: parsedDate,
        approvedAt,
        approvedById,
        createdById: adminId,
        remarks,
      },
      create: {
        userId,
        month,
        year,
        amount: amountPerMonth,
        status: initialStatus,
        submittedAt: parsedDate,
        approvedAt,
        approvedById,
        createdById: adminId,
        remarks,
      },
    });
  }

  revalidatePath("/payments");
  return { success: true, isPending: isPaymentAdmin };
}

export async function updatePaymentTransaction(
  paymentId: string,
  data: {
    amount: number;
    month: number;
    year: number;
    paymentDate: string;
    remarks?: string | null;
    status?: PaymentStatus;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const role = session.user.role;

  // Only Super Admin has access to edit transactions created by admin
  if (role !== Role.SUPER_ADMIN) {
    throw new Error("Permission denied. Only Super Admin can edit transactions.");
  }

  const existing = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      createdBy: {
        select: { id: true, name: true, role: true },
      },
      user: {
        select: { id: true, name: true },
      },
    },
  });

  if (!existing) {
    throw new Error("Transaction not found.");
  }

  // Validate that transaction was created by an admin
  const isCreatedByAdmin =
    existing.createdBy?.role === Role.ADMIN ||
    existing.createdBy?.role === Role.SUPER_ADMIN ||
    existing.createdBy?.role === Role.PAYMENT_ADMIN ||
    (existing.remarks?.toLowerCase().includes("admin") ?? false) ||
    Boolean(existing.createdById);

  if (!isCreatedByAdmin) {
    throw new Error("Permission denied. Only transactions created by an admin can be edited.");
  }

  // If month or year is being changed, ensure no duplicate entry exists for this member
  if (data.month !== existing.month || data.year !== existing.year) {
    const conflict = await prisma.payment.findUnique({
      where: {
        userId_month_year: {
          userId: existing.userId,
          month: data.month,
          year: data.year,
        },
      },
    });

    if (conflict && conflict.id !== paymentId) {
      throw new Error(`A payment record already exists for ${existing.user.name} for month ${data.month}/${data.year}.`);
    }
  }

  const parsedDate = data.paymentDate ? new Date(data.paymentDate) : existing.submittedAt;
  const newStatus = data.status || existing.status;

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      amount: data.amount,
      month: data.month,
      year: data.year,
      submittedAt: parsedDate,
      approvedAt: newStatus === PaymentStatus.APPROVED ? (existing.approvedAt || new Date()) : null,
      status: newStatus,
      remarks: data.remarks !== undefined ? data.remarks : existing.remarks,
    },
  });

  // Log in AuditLog
  try {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_TRANSACTION",
        entity: "Payment",
        entityId: paymentId,
        metadata: {
          previous: {
            amount: Number(existing.amount),
            month: existing.month,
            year: existing.year,
            status: existing.status,
          },
          updated: {
            amount: data.amount,
            month: data.month,
            year: data.year,
            status: newStatus,
          },
        },
      },
    });
  } catch (auditErr) {
    console.error("AuditLog error:", auditErr);
  }

  revalidatePath("/payments");
  return { success: true };
}

export async function deletePaymentTransaction(paymentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const role = session.user.role;

  // Only Super Admin has access to delete transactions created by admin
  if (role !== Role.SUPER_ADMIN) {
    throw new Error("Permission denied. Only Super Admin can delete transactions.");
  }

  const existing = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      createdBy: {
        select: { id: true, name: true, role: true },
      },
      user: {
        select: { id: true, name: true },
      },
    },
  });

  if (!existing) {
    throw new Error("Transaction not found.");
  }

  const isCreatedByAdmin =
    existing.createdBy?.role === Role.ADMIN ||
    existing.createdBy?.role === Role.SUPER_ADMIN ||
    existing.createdBy?.role === Role.PAYMENT_ADMIN ||
    (existing.remarks?.toLowerCase().includes("admin") ?? false) ||
    Boolean(existing.createdById);

  if (!isCreatedByAdmin) {
    throw new Error("Permission denied. Only transactions created by an admin can be deleted.");
  }

  await prisma.payment.delete({
    where: { id: paymentId },
  });

  // Log in AuditLog
  try {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_TRANSACTION",
        entity: "Payment",
        entityId: paymentId,
        metadata: {
          member: existing.user.name,
          month: existing.month,
          year: existing.year,
          amount: Number(existing.amount),
        },
      },
    });
  } catch (auditErr) {
    console.error("AuditLog error:", auditErr);
  }

  revalidatePath("/payments");
  return { success: true };
}

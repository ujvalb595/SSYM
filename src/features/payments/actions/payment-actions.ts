"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, PaymentStatus } from "@prisma/client";

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
      },
      create: {
        userId,
        month,
        year,
        amount: amountPerMonth,
        status: PaymentStatus.PENDING,
      },
    });
  }

  revalidatePath("/payments");
  return { success: true, count: selectedMonthValues.length };
}

function serializePayment(p: any) {
  return {
    id: p.id,
    userId: p.userId,
    month: p.month,
    year: p.year,
    amount: Number(p.amount),
    status: p.status,
    submittedAt: p.submittedAt ? p.submittedAt.toISOString() : new Date().toISOString(),
    approvedAt: p.approvedAt ? p.approvedAt.toISOString() : null,
    user: p.user ? { name: p.user.name, mobileNumber: p.user.mobileNumber } : undefined,
    approvedBy: p.approvedBy ? { name: p.approvedBy.name } : null,
  };
}

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role;
  if (role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
    throw new Error("Permission denied. Only admins can approve or reject payments.");
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      approvedById: session.user.id,
      approvedAt: status === PaymentStatus.APPROVED ? new Date() : null,
    },
    include: {
      user: {
        select: { name: true, mobileNumber: true },
      },
      approvedBy: {
        select: { name: true },
      },
    },
  });

  revalidatePath("/payments");
  return { success: true, payment: serializePayment(updated) };
}

export async function getPaymentsData() {
  const session = await auth();
  if (!session?.user?.id) {
    return { userPayments: [], allPayments: [], isAdmin: false };
  }

  const role = session.user.role;
  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;

  // Fetch payments for logged-in user
  const rawUserPayments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    include: {
      user: {
        select: { name: true, mobileNumber: true },
      },
      approvedBy: {
        select: { name: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  // Fetch all payments across mandal
  const rawAllPayments = await prisma.payment.findMany({
    include: {
      user: {
        select: { name: true, mobileNumber: true },
      },
      approvedBy: {
        select: { name: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return {
    userPayments: rawUserPayments.map(serializePayment),
    allPayments: rawAllPayments.map(serializePayment),
    isAdmin,
  };
}

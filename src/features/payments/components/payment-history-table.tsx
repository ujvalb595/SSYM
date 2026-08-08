"use client";

import { PaymentStatusBadge } from "@/features/payments/components/payment-status-badge";
import { PaymentStatus } from "@prisma/client";

const MONTH_NAMES_MAP: Record<number, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sept", 10: "Oct", 11: "Nov", 12: "Dec",
};

export interface HistoryItemData {
  id: string;
  userId: string;
  month: number;
  year: number;
  amount: number;
  status: PaymentStatus;
  submittedAt: Date | string;
  approvedAt?: Date | string | null;
  user?: { name: string; mobileNumber: string };
  approvedBy?: { name: string } | null;
}

export function PaymentHistoryTable({ items }: { items: HistoryItemData[] }) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-stone-500">
        No completed payment history found yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-[#faf9ff] text-xs uppercase tracking-wide text-stone-400">
          <tr>
            <th className="px-6 py-4 font-semibold">Member</th>
            <th className="px-6 py-4 font-semibold">Month</th>
            <th className="px-6 py-4 font-semibold">Amount</th>
            <th className="px-6 py-4 font-semibold">Date Paid</th>
            <th className="px-6 py-4 font-semibold">Approved By</th>
            <th className="px-6 py-4 text-right font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const monthLabel = `${MONTH_NAMES_MAP[item.month] || item.month} ${item.year}`;
            const dateStr = new Date(item.approvedAt || item.submittedAt).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            );
            const memberName = item.user?.name || "Member";
            const initials = memberName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();
            const approverName = item.approvedBy?.name || "Admin";

            return (
              <tr
                key={item.id}
                className="border-t border-stone-100 transition hover:bg-violet-50/40"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-xs font-bold text-[#7657f6]">
                      {initials}
                    </span>
                    <div>
                      <span className="font-semibold text-[#302a49]">{memberName}</span>
                      {item.user?.mobileNumber && (
                        <p className="text-xs text-stone-400">{item.user.mobileNumber}</p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 font-medium text-stone-700">{monthLabel}</td>

                <td className="px-6 py-4 font-semibold text-[#302a49]">
                  ₹{Number(item.amount).toLocaleString()}
                </td>

                <td className="px-6 py-4 text-stone-500">{dateStr}</td>

                <td className="px-6 py-4 font-medium text-stone-700">{approverName}</td>

                <td className="px-6 py-4 text-right">
                  <PaymentStatusBadge status={PaymentStatus.APPROVED} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

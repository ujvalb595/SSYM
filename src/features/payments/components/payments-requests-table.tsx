"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, Crown, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { PaymentStatus, Role } from "@prisma/client";
import { updatePaymentStatus } from "@/features/payments/actions/payment-actions";
import { PaymentStatusBadge } from "@/features/payments/components/payment-status-badge";
import { EditTransactionDialog } from "@/features/payments/components/edit-transaction-dialog";

const MONTH_NAMES_MAP: Record<number, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sept", 10: "Oct", 11: "Nov", 12: "Dec",
};

export interface PaymentItemData {
  id: string;
  userId: string;
  createdById?: string | null;
  month: number;
  year: number;
  amount: number;
  status: PaymentStatus;
  remarks?: string | null;
  submittedAt: Date | string;
  approvedAt?: Date | string | null;
  user?: { name: string; mobileNumber: string };
  approvedBy?: { name: string } | null;
  createdBy?: { id: string; name: string; role: Role } | null;
  requiresSuperAdminApproval?: boolean;
}

interface PaymentsRequestsTableProps {
  initialRequests: PaymentItemData[];
  isAdmin: boolean;
  canApprove?: boolean;
  isSuperAdmin?: boolean;
  currentUserId?: string;
  hideStatus?: boolean;
  hideApprovedBy?: boolean;
}

export function PaymentsRequestsTable({
  initialRequests,
  isAdmin,
  canApprove = false,
  isSuperAdmin = false,
  currentUserId,
  hideStatus = false,
  hideApprovedBy = false,
}: PaymentsRequestsTableProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<PaymentItemData[]>(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const handleAction = async (paymentId: string, newStatus: PaymentStatus, name: string) => {
    setLoadingId(paymentId);
    try {
      await updatePaymentStatus(paymentId, newStatus);
      router.refresh();

      // Optimistic state update
      setRequests((prev) =>
        prev.map((item) =>
          item.id === paymentId ? { ...item, status: newStatus } : item
        )
      );

      if (newStatus === PaymentStatus.APPROVED) {
        toast.success(`Payment Approved!`, {
          description: `Payment request for ${name} has been approved (Status: Done).`,
        });
      } else {
        toast.error(`Payment Rejected`, {
          description: `Payment request for ${name} has been rejected (Status: Reject).`,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update payment status";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-stone-500">
        No payment requests found.
      </div>
    );
  }

  const showActionColumn =
    (canApprove || isAdmin) &&
    requests.some((r) => r.status === PaymentStatus.PENDING);

  return (
    <div className="overflow-x-auto max-h-[620px] overflow-y-auto no-scrollbar relative">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="sticky top-0 z-20 bg-[#faf9ff] text-xs uppercase tracking-wide text-stone-400 border-b border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] backdrop-blur-md">
          <tr>
            {isAdmin && <th className="px-6 py-4 font-semibold">Member</th>}
            <th className="px-6 py-4 font-semibold">Month Requested</th>
            <th className="px-6 py-4 font-semibold">Date Submitted</th>
            <th className="px-6 py-4 font-semibold">Amount</th>
            {!hideApprovedBy && <th className="px-6 py-4 text-right font-semibold">Approved By</th>}
            {!hideStatus && <th className="px-6 py-4 text-right font-semibold">Status</th>}
            {showActionColumn && (
              <th className="px-6 py-4 text-right font-semibold">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const monthLabel = `${MONTH_NAMES_MAP[req.month] || req.month} ${req.year}`;
            const submittedDateStr = new Date(req.submittedAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const memberName = req.user?.name || "Member";
            const initials = memberName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();
            const approverName = req.approvedBy?.name || (req.status === PaymentStatus.PENDING ? "-" : "Admin");

            const isRaisedByPaymentAdmin =
              req.requiresSuperAdminApproval ||
              req.createdBy?.role === Role.PAYMENT_ADMIN ||
              (req.remarks?.toLowerCase().includes("payment admin") ?? false);

            const isOwnRequest = req.userId === currentUserId;
            const canApproveThisRow =
              (isSuperAdmin || (canApprove && !isRaisedByPaymentAdmin)) && !isOwnRequest;

            return (
              <tr
                key={req.id}
                className="border-t border-stone-100 transition hover:bg-violet-50/40"
              >
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-xs font-bold text-[#7657f6]">
                        {initials}
                      </span>
                      <div>
                        <span className="font-semibold text-[#302a49]">{memberName}</span>
                        {req.user?.mobileNumber && (
                          <p className="text-xs text-stone-400">{req.user.mobileNumber}</p>
                        )}
                        {isRaisedByPaymentAdmin ? (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/70">
                              <CreditCard size={11} className="text-emerald-600" />
                              Raised by Payment Admin {req.createdBy?.name ? `(${req.createdBy.name})` : ""}
                            </span>
                          </div>
                        ) : req.remarks ? (
                          <span className="mt-1 inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200/70">
                            {req.remarks}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                )}

                <td className="px-6 py-4 font-medium text-stone-700">{monthLabel}</td>

                <td className="px-6 py-4 text-stone-500">{submittedDateStr}</td>

                <td className="px-6 py-4 font-semibold text-[#302a49]">
                  ₹{Number(req.amount).toLocaleString()}
                </td>

                {!hideApprovedBy && (
                  <td className="px-6 py-4 text-stone-500 text-right">
                    {approverName}
                  </td>
                )}

                {!hideStatus && (
                  <td className="px-6 py-4 text-right">
                    <PaymentStatusBadge status={req.status} />
                  </td>
                )}

                {showActionColumn && (
                  <td className="px-6 py-4">
                    {req.status === PaymentStatus.PENDING && (
                      <div className="flex justify-end gap-2">
                        {canApproveThisRow ? (
                          <>
                            <button
                              type="button"
                              disabled={loadingId === req.id}
                              onClick={() => handleAction(req.id, PaymentStatus.APPROVED, memberName)}
                              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-200 hover:brightness-105 transition disabled:opacity-50"
                            >
                              <CircleCheck size={16} /> Approve
                            </button>

                            <button
                              type="button"
                              disabled={loadingId === req.id}
                              onClick={() => handleAction(req.id, PaymentStatus.REJECTED, memberName)}
                              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ef4444] to-[#dc2626] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-red-200 hover:brightness-105 transition disabled:opacity-50"
                            >
                              <CircleX size={16} /> Reject
                            </button>

                            {isSuperAdmin && (
                              <EditTransactionDialog
                                transaction={{
                                  id: req.id,
                                  userId: req.userId,
                                  memberName,
                                  month: req.month,
                                  year: req.year,
                                  amount: Number(req.amount),
                                  status: req.status,
                                  submittedAt: req.submittedAt,
                                  remarks: req.remarks,
                                }}
                              />
                            )}
                          </>
                        ) : isRaisedByPaymentAdmin && !isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <Crown size={13} className="text-amber-500" />
                            Super Admin Approval Required
                          </span>
                        ) : isOwnRequest ? (
                          <span className="text-xs text-stone-400 italic">Own Request</span>
                        ) : (
                          <span className="text-xs text-stone-400">Pending Review</span>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

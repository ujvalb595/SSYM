"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PaymentStatus } from "@prisma/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  updatePaymentTransaction,
  deletePaymentTransaction,
} from "@/features/payments/actions/payment-actions";

const MANDAL_MONTHS = [
  { label: "Oct 2026", month: 10, year: 2026, value: "2026-10" },
  { label: "Nov 2026", month: 11, year: 2026, value: "2026-11" },
  { label: "Dec 2026", month: 12, year: 2026, value: "2026-12" },
  { label: "Jan 2027", month: 1, year: 2027, value: "2027-01" },
  { label: "Feb 2027", month: 2, year: 2027, value: "2027-02" },
  { label: "Mar 2027", month: 3, year: 2027, value: "2027-03" },
  { label: "Apr 2027", month: 4, year: 2027, value: "2027-04" },
  { label: "May 2027", month: 5, year: 2027, value: "2027-05" },
  { label: "Jun 2027", month: 6, year: 2027, value: "2027-06" },
  { label: "Jul 2027", month: 7, year: 2027, value: "2027-07" },
  { label: "Aug 2027", month: 8, year: 2027, value: "2027-08" },
  { label: "Sept 2027", month: 9, year: 2027, value: "2027-09" },
];

export interface TransactionEditData {
  id: string;
  userId: string;
  memberName?: string;
  month: number;
  year: number;
  amount: number;
  status: PaymentStatus;
  submittedAt: Date | string;
  remarks?: string | null;
}

interface EditTransactionDialogProps {
  transaction: TransactionEditData;
}

export function EditTransactionDialog({ transaction }: EditTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialMonthVal = `${transaction.year}-${String(transaction.month).padStart(2, "0")}`;
  const [selectedMonthKey, setSelectedMonthKey] = useState(initialMonthVal);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [status, setStatus] = useState<PaymentStatus>(transaction.status);
  const [remarks, setRemarks] = useState(transaction.remarks || "");

  const initialDateStr = (() => {
    try {
      const d = new Date(transaction.submittedAt);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch {
      // fallback
    }
    return new Date().toISOString().split("T")[0];
  })();

  const [date, setDate] = useState(initialDateStr);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedMonthKey(`${transaction.year}-${String(transaction.month).padStart(2, "0")}`);
      setAmount(transaction.amount.toString());
      setStatus(transaction.status);
      setRemarks(transaction.remarks || "");
      try {
        const d = new Date(transaction.submittedAt);
        if (!isNaN(d.getTime())) {
          setDate(d.toISOString().split("T")[0]);
        }
      } catch {
        // fallback
      }
      setError(null);
    }
  }, [open, transaction]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const msg = "Please enter a valid amount greater than 0.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const [yearStr, monthStr] = selectedMonthKey.split("-");
    const parsedYear = parseInt(yearStr, 10);
    const parsedMonth = parseInt(monthStr, 10);

    if (isNaN(parsedYear) || isNaN(parsedMonth)) {
      const msg = "Please select a valid month.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await updatePaymentTransaction(transaction.id, {
        amount: numAmount,
        month: parsedMonth,
        year: parsedYear,
        paymentDate: date,
        status,
        remarks: remarks.trim() || null,
      });

      if (res?.success) {
        toast.success("Transaction updated successfully!");
        setOpen(false);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update transaction.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await deletePaymentTransaction(transaction.id);
      if (res?.success) {
        toast.success("Transaction deleted successfully!");
        setDeleteConfirmOpen(false);
        setOpen(false);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete transaction.";
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Edit transaction"
        title="Super Admin: Edit or Delete Transaction"
        className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 shadow-xs hover:border-[#7257f4] hover:bg-violet-50 hover:text-[#7257f4] transition"
      >
        <Pencil size={13} />
        Edit
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-[#7257f4]">
                      <Pencil size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">
                        Edit Admin Transaction
                      </h3>
                      <p className="text-xs text-stone-500">
                        Super Admin control for {transaction.memberName || "Member"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                  {error && (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600">
                      {error}
                    </div>
                  )}

                  {/* Member Name Info */}
                  <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-stone-500">Member</p>
                      <p className="text-sm font-bold text-[#24203a]">{transaction.memberName || "Member"}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-violet-700 border border-violet-200">
                      <ShieldCheck size={12} />
                      Super Admin Access
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-700">
                        Paid Month <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedMonthKey}
                        onChange={(e) => setSelectedMonthKey(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      >
                        {MANDAL_MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-700">
                        Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-semibold text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-700">
                        Payment Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-700">
                        Status <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-semibold text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      >
                        <option value={PaymentStatus.APPROVED}>APPROVED (Done)</option>
                        <option value={PaymentStatus.PENDING}>PENDING (In Review)</option>
                        <option value={PaymentStatus.REJECTED}>REJECTED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700">
                      Remarks / Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Added manually by admin, offline payment"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      disabled={deleting || loading}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 cursor-pointer transition"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || deleting}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-200 hover:brightness-105 transition disabled:opacity-50 cursor-pointer"
                      >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Transaction"
        description={`Are you sure you want to delete this payment record of ₹${transaction.amount.toLocaleString()} for ${transaction.memberName || "this member"}? This will permanently remove the transaction and mark this month as unpaid.`}
        confirmText="Delete Transaction"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}

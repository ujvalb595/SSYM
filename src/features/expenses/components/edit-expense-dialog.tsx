"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function EditExpenseDialog({
  expense,
}: {
  expense: {
    id: string;
    title: string;
    description?: string | null;
    amount: number;
    date: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(expense.title);
  const [description, setDescription] = useState(expense.description || "");
  const [amount, setAmount] = useState(expense.amount.toString());
  
  // Format initial date string to YYYY-MM-DD for date input
  const initialDateStr = (() => {
    try {
      const d = new Date(expense.date);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch {
      // fallback
    }
    return new Date().toISOString().split("T")[0];
  })();

  const [date, setDate] = useState(initialDateStr);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(expense.title);
      setDescription(expense.description || "");
      setAmount(expense.amount.toString());
      try {
        const d = new Date(expense.date);
        if (!isNaN(d.getTime())) {
          setDate(d.toISOString().split("T")[0]);
        }
      } catch {
        // fallback
      }
    }
  }, [open, expense]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter an expense title.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          amount: numAmount,
          date: date || new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update expense.");
        setLoading(false);
        return;
      }

      setOpen(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to delete expense.");
        setDeleting(false);
        return;
      }
      setDeleteConfirmOpen(false);
      setOpen(false);
      setDeleting(false);
      router.refresh();
    } catch {
      setError("Failed to delete expense.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Edit ${expense.title}`}
        title="Edit expense"
        className="rounded-lg p-2 text-stone-500 transition hover:bg-violet-100 hover:text-[#7257f4] focus:outline-none focus:ring-2 focus:ring-violet-300"
      >
        <Pencil size={17} />
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-[#7257f4]">
                      <Pencil size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">
                        Edit Expense
                      </h3>
                      <p className="text-xs text-stone-500">
                        Update expenditure details
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
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

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700">
                      Expense Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sound System Rent"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700">
                      Description / Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Additional details about this expenditure..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-700">
                        Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="2500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs font-semibold text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-700">
                        Expense Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      disabled={deleting || loading}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || deleting}
                        className="flex items-center gap-2 rounded-xl bg-[#7257f4] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5f44e2] disabled:opacity-50 cursor-pointer"
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
        title="Delete Expense Record"
        description={`Are you sure you want to delete the expense "${expense.title}" of ₹${expense.amount.toLocaleString()}? This action cannot be undone.`}
        confirmText="Delete Expense"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}

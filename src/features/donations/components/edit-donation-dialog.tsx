"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2, Trash2 } from "lucide-react";

export function EditDonationDialog({
  donation,
}: {
  donation: {
    id: string;
    donorName: string;
    title?: string | null;
    description?: string | null;
    amount: number;
    date: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [donorName, setDonorName] = useState(donation.donorName);
  const [title, setTitle] = useState(donation.title || "");
  const [description, setDescription] = useState(donation.description || "");
  const [amount, setAmount] = useState(donation.amount.toString());

  const initialDateStr = (() => {
    try {
      const d = new Date(donation.date);
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

  useEffect(() => {
    if (open) {
      setDonorName(donation.donorName);
      setTitle(donation.title || "");
      setDescription(donation.description || "");
      setAmount(donation.amount.toString());
      try {
        const d = new Date(donation.date);
        if (!isNaN(d.getTime())) {
          setDate(d.toISOString().split("T")[0]);
        }
      } catch {
        // fallback
      }
    }
  }, [open, donation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!donorName.trim()) {
      setError("Please enter donor name.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/donations/${donation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: donorName.trim(),
          title: title.trim() || null,
          description: description.trim() || null,
          amount: numAmount,
          date: date || new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update donation.");
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

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete this donation from "${donation.donorName}"?`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/donations/${donation.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to delete donation.");
        setDeleting(false);
        return;
      }
      setOpen(false);
      setDeleting(false);
      router.refresh();
    } catch {
      setError("Failed to delete donation.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Edit donation from ${donation.donorName}`}
        title="Edit donation"
        className="rounded-lg p-2 text-stone-500 transition hover:bg-violet-100 hover:text-[#7257f4] focus:outline-none focus:ring-2 focus:ring-violet-300"
      >
        <Pencil size={17} />
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-[#7257f4]">
                      <Pencil size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">
                        Edit Donation
                      </h3>
                      <p className="text-xs text-stone-500">
                        Update donation details
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

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                  {error && (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700">
                      Donor Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-700">
                      Donation Purpose / Cause
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Festival Sponsorship"
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
                      placeholder="Additional details..."
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
                        placeholder="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs font-semibold text-stone-800 focus:border-[#7257f4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-700">
                        Donation Date <span className="text-rose-500">*</span>
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
                      onClick={handleDelete}
                      disabled={deleting || loading}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      {deleting ? "Deleting..." : "Delete"}
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || deleting}
                        className="flex items-center gap-2 rounded-xl bg-[#7257f4] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5f44e2] disabled:opacity-50"
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
    </>
  );
}

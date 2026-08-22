"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ChartNoAxesCombined,
  FileText,
  IndianRupee,
  Plus,
  X,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";

export function AddExpensesDialog() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const date = String(form.get("date") || "");
    const amount = Number(form.get("amount") || 0);

    if (!title) {
      setError("Please enter expense name.");
      setSubmitting(false);
      return;
    }

    if (!amount || amount <= 0) {
      setError("Please enter a valid positive amount.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          date: date || new Date().toISOString(),
          amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create expense.");
        setSubmitting(false);
        return;
      }

      setSaved(true);
      setTimeout(() => {
        formElement.reset();
        setOpen(false);
        setSaved(false);
        setSubmitting(false);
        router.refresh();
      }, 600);
    } catch {
      setError("An unexpected network error occurred.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="primary"
        size="md"
        onClick={() => setOpen(true)}
      >
        <Plus size={18} />
        <span>Add Expense</span>
      </Button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-100">
                <div className="bg-gradient-to-r from-[#7257f4] to-[#bd59ec] px-6 py-5 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold tracking-[0.16em] text-white/80 uppercase">
                        Expense Management
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold text-white">Add New Expense</h2>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="rounded-xl p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {saved ? (
                  <div className="my-8 rounded-2xl bg-emerald-50 p-6 text-center text-emerald-800 border border-emerald-200 mx-6">
                    <p className="font-extrabold text-base">Expense Record Added! 🎉</p>
                    <p className="mt-1 text-xs text-emerald-600 font-medium">The expense has been successfully logged.</p>
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-4 p-6">
                    {error ? (
                      <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                        {error}
                      </div>
                    ) : null}

                    <div>
                      <label className="input-label">
                        Expense Title / Item *
                      </label>
                      <div className="relative">
                        <ChartNoAxesCombined size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          required
                          name="title"
                          placeholder="e.g. Sound System, Decoration, Refreshments"
                          className="input-base pl-9 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="input-label">
                        Expense Detail & Notes
                      </label>
                      <div className="relative">
                        <FileText size={16} className="absolute left-3.5 top-3 text-stone-400" />
                        <textarea
                          name="description"
                          rows={2}
                          placeholder="Describe purpose or vendor information"
                          className="input-base pl-9 text-xs sm:text-sm resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="input-label">
                          Expense Date *
                        </label>
                        <DatePicker
                          name="date"
                          required
                          defaultValue={new Date().toISOString().split("T")[0]}
                          placeholder="Select date"
                        />
                      </div>

                      <div>
                        <label className="input-label">
                          Amount (₹) *
                        </label>
                        <div className="relative">
                          <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            required
                            name="amount"
                            type="number"
                            step="0.01"
                            min="1"
                            placeholder="Amount in ₹"
                            className="input-base pl-9 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={submitting}
                      >
                        Add Expense
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

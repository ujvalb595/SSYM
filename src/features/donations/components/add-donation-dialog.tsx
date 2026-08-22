"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  FileText,
  IndianRupee,
  Plus,
  User,
  X,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";

export function AddDonationDialog() {
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

    const donorName = String(form.get("donorName") || "").trim();
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const date = String(form.get("date") || "");
    const amount = Number(form.get("amount") || 0);

    if (!donorName) {
      setError("Please enter donor name.");
      setSubmitting(false);
      return;
    }

    if (!amount || amount <= 0) {
      setError("Please enter a valid positive donation amount.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName,
          title: title || null,
          description: description || null,
          date: date || new Date().toISOString(),
          amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to add donation.");
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
        <span>Add Donation</span>
      </Button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-100">
                <div className="bg-gradient-to-r from-[#7257f4] to-[#bd59ec] px-6 py-5 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold tracking-[0.16em] text-white/80 uppercase">
                        Donation Management
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold text-white">Add New Donation</h2>
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
                    <p className="font-extrabold text-base">Donation Record Added! 🎉</p>
                    <p className="mt-1 text-xs text-emerald-600 font-medium">The donation has been successfully logged.</p>
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
                        Donor Name *
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          required
                          name="donorName"
                          placeholder="e.g. Ramesh Patel, Shanti Trust"
                          className="input-base pl-9 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="input-label">
                        Donation Purpose / Cause
                      </label>
                      <div className="relative">
                        <HeartHandshake size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          name="title"
                          placeholder="e.g. Festival Sponsorship, Building Fund"
                          className="input-base pl-9 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="input-label">
                        Donation Details & Notes
                      </label>
                      <div className="relative">
                        <FileText size={16} className="absolute left-3.5 top-3 text-stone-400" />
                        <textarea
                          name="description"
                          rows={2}
                          placeholder="Describe additional notes or payment mode (e.g. Cash, UPI)"
                          className="input-base pl-9 text-xs sm:text-sm resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="input-label">
                          Donation Date *
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
                        Add Donation
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

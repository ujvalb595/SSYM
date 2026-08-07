"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ChartArea,
  ChartNoAxesColumn,
  ChartNoAxesCombined,
  IndianRupee,
  LockKeyhole,
  Phone,
  Plus,
  UserRound,
  X,
} from "lucide-react";

export function AddExpensesDialog() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
    }, 900);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:brightness-105"
      >
        <Plus size={17} /> Add Expenses
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-member-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            aria-label="Close dialog"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#28203e]/35 backdrop-blur-sm"
          />
          <section className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#654dde] to-[#ad58ef] px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-white/70">
                    MEMBER DIRECTORY
                  </p>
                  <h2 id="add-member-title" className="mt-1 text-xl font-bold">
                    Add New Expense
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white"
                >
                  <X size={21} />
                </button>
              </div>
            </div>
            <form onSubmit={submit} className="space-y-4 p-6">
              <Field label="Expense" icon={<ChartNoAxesCombined size={17} />}>
                <input
                  required
                  name="Expense"
                  placeholder="Enter expense name"
                  className="field"
                />
              </Field>
              <Field label="Expense Detail" icon={<ChartNoAxesCombined size={17} />}>
                <textarea
                  required
                  name="Expensedetail"
                  placeholder="Enter expense detail"
                  className="field"
                />
              </Field>
              <Field label="Expense Date" icon={<CalendarDays size={17} />}>
                <input
                  required
                  name="Expensedate"
                  type="date"
                  className="field"
                />
              </Field>
              <Field label="Amount" icon={<IndianRupee size={17} />}>
                <input
                  required
                  name="Amount"
                  type="number"
                  inputMode="numeric"
                  placeholder="Enter amount"
                  className="field"
                />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[#e5e0f1] px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button className="rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200">
                  {saved ? "Expense added" : "Add Expense"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      <style jsx>{`
        .field {
          width: 100%;
          border: 1px solid #e6e1f3;
          border-radius: 0.75rem;
          padding: 0.7rem 0.85rem;
          outline: none;
          font-size: 0.875rem;
        }
        .field:focus {
          border-color: #8660ee;
          box-shadow: 0 0 0 4px #ede9fe;
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#403958]">
        <span className="text-[#7657f6]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

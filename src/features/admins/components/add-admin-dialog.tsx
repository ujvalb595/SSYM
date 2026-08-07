"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, LockKeyhole, Phone, Plus, ShieldCheck, UserRound, X } from "lucide-react";

import type { AdminUser } from "./admin-card";

export function AddAdminDialog({ onAdminAdded }: { onAdminAdded?: (admin: AdminUser) => void }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newAdmin = {
      id: "admin-" + Date.now(),
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      role: formData.get("role") as string,
      title: formData.get("title") as string || "System Administrator",
      avatar: "",
      joinedAt: "Just now",
      isActive: true,
    };

    setSaved(true);
    if (onAdminAdded) {
      onAdminAdded(newAdmin);
    }

    setTimeout(() => {
      setOpen(false);
      setSaved(false);
    }, 800);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:brightness-105"
      >
        <Plus size={17} /> Add Admin
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-admin-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Close dialog"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#28203e]/40 backdrop-blur-sm"
          />

          <section className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#654dde] via-[#8657ef] to-[#ad58ef] px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-white/70">ADMIN MANAGEMENT</p>
                  <h2 id="add-admin-title" className="mt-1 text-xl font-bold">Add New Administrator</h2>
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
              <Field label="Full Name" icon={<UserRound size={17} />}>
                <input required name="name" placeholder="e.g. Vikramaditya Parmar" className="field" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mobile Number" icon={<Phone size={17} />}>
                  <input required name="mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" placeholder="9876543210" className="field" />
                </Field>

                <Field label="Admin Role" icon={<ShieldCheck size={17} />}>
                  <select name="role" className="field bg-white">
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </Field>
              </div>

              <Field label="Designation / Department" icon={<CalendarDays size={17} />}>
                <input name="title" placeholder="e.g. Event Coordinator & Admin" className="field" />
              </Field>

              <Field label="Temporary Password" icon={<LockKeyhole size={17} />}>
                <input required name="password" type="password" minLength={8} placeholder="Set secure password" className="field" />
              </Field>

              <p className="rounded-lg bg-violet-50 px-3.5 py-2.5 text-xs text-violet-800 leading-relaxed">
                The new administrator will receive access with these credentials based on their assigned role privileges.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[#e5e0f1] px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:brightness-105"
                >
                  {saved ? "Admin Added!" : "Add Administrator"}
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
          transition: all 0.2s;
        }
        .field:focus {
          border-color: #8660ee;
          box-shadow: 0 0 0 4px #ede9fe;
        }
      `}</style>
    </>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[#403958]">
        <span className="text-[#7657f6]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, LockKeyhole, Phone, Plus, UserRound, X } from "lucide-react";

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), birthDate: form.get("birthdate"), mobile: form.get("mobile"), password: form.get("password") }) });
    const result = await response.json();
    if (!response.ok) { setError(result.message ?? "Unable to add member."); setSubmitting(false); return; }
    setSaved(true);
    setTimeout(() => { event.currentTarget.reset(); setOpen(false); setSaved(false); setSubmitting(false); router.refresh(); }, 700);
  }

  return <><button onClick={() => { setError(""); setOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:brightness-105"><Plus size={17} /> Add member</button>{open && <div role="dialog" aria-modal="true" aria-labelledby="add-member-title" className="fixed inset-0 z-50 flex items-center justify-center p-4"><button aria-label="Close dialog" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#28203e]/35 backdrop-blur-sm" /><section className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="bg-gradient-to-r from-[#654dde] to-[#ad58ef] px-6 py-5 text-white"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold tracking-[0.16em] text-white/70">MEMBER DIRECTORY</p><h2 id="add-member-title" className="mt-1 text-xl font-bold">Add New Member</h2></div><button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white"><X size={21} /></button></div></div><form onSubmit={submit} className="space-y-4 p-6"><Field label="Full Name" icon={<UserRound size={17} />}><input required name="name" placeholder="Enter member name" className="field" /></Field><Field label="Birthdate" icon={<CalendarDays size={17} />}><input required name="birthdate" type="date" className="field" /></Field><Field label="Mobile Number" icon={<Phone size={17} />}><input required name="mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" placeholder="10-digit mobile number" className="field" /></Field><Field label="Password" icon={<LockKeyhole size={17} />}><input required name="password" type="password" minLength={8} placeholder="Set a secure password" className="field" /></Field>{error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}<p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">The member can use this password to sign in after their account is created.</p><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-[#e5e0f1] px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancel</button><button disabled={submitting} className="rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 disabled:opacity-60">{saved ? "Member added" : submitting ? "Adding…" : "Add Member"}</button></div></form></section></div>}<style jsx>{`.field { width: 100%; border: 1px solid #e6e1f3; border-radius: 0.75rem; padding: 0.7rem 0.85rem; outline: none; font-size: 0.875rem; } .field:focus { border-color: #8660ee; box-shadow: 0 0 0 4px #ede9fe; }`}</style></>;
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) { return <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#403958]"><span className="text-[#7657f6]">{icon}</span>{label}</span>{children}</label>; }

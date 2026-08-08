"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, LockKeyhole, Pencil, Phone, UserRound, X } from "lucide-react";

export interface MemberData {
  id: string;
  name: string;
  mobile: string;
  rawBirthDate?: string; // YYYY-MM-DD
  bloodGroup?: string;
}

const bloodGroupOptions = [
  { label: "A+", value: "A_POSITIVE" },
  { label: "A-", value: "A_NEGATIVE" },
  { label: "B+", value: "B_POSITIVE" },
  { label: "B-", value: "B_NEGATIVE" },
  { label: "AB+", value: "AB_POSITIVE" },
  { label: "AB-", value: "AB_NEGATIVE" },
  { label: "O+", value: "O_POSITIVE" },
  { label: "O-", value: "O_NEGATIVE" },
];

export function EditMemberDialog({ member }: { member: MemberData }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formElement = event.currentTarget;
    const values = new FormData(formElement);

    const name = String(values.get("name") || "").trim();
    const mobile = String(values.get("mobile") || "").trim();
    const birthDate = String(values.get("birthDate") || "");
    const bloodGroup = String(values.get("bloodGroup") || "");
    const password = String(values.get("password") || "");

    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile,
          birthDate: birthDate || null,
          bloodGroup: bloodGroup || null,
          password: password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update member.");
        setLoading(false);
        return;
      }

      setOpen(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${member.name}`}
        title="Edit member"
        className="rounded-lg p-2 text-violet-600 transition hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
      >
        <Pencil size={17} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-[#24203a]">Edit Member</h3>
                <p className="text-xs text-stone-500">Update member information</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                  <input
                    required
                    defaultValue={member.name}
                    name="name"
                    type="text"
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-[#e8e3f2] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                  <input
                    required
                    defaultValue={member.mobile.replace(/\s+/g, "")}
                    name="mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-[#e8e3f2] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Birth Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                    <input
                      defaultValue={member.rawBirthDate || ""}
                      name="birthDate"
                      type="date"
                      className="w-full rounded-xl border border-[#e8e3f2] py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    defaultValue={member.bloodGroup || ""}
                    className="w-full rounded-xl border border-[#e8e3f2] px-3 py-2.5 text-sm outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100 bg-white"
                  >
                    <option value="">Select</option>
                    {bloodGroupOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  New Password <span className="font-normal text-stone-400">(Optional)</span>
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    placeholder="Leave blank to keep current password"
                    className="w-full rounded-xl border border-[#e8e3f2] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-[#7257f4] to-[#a858ef] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:brightness-105 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { FormEvent, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Droplet,
  Eye,
  EyeOff,
  LockKeyhole,
  Phone,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";

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

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    const name = String(form.get("name") || "").trim();
    const birthdate = String(form.get("birthdate") || "").trim();
    const bloodGroup = String(form.get("bloodGroup") || "").trim();
    const mobile = String(form.get("mobile") || "").trim();
    const password = String(form.get("password") || "").trim();

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthdate, bloodGroup, mobile, password }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(result.message ?? "Unable to add member.");
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
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="primary"
        size="md"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Plus size={18} />
        <span>Add Member</span>
      </Button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-100 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#7257f4] to-[#bd59ec] px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.16em] text-white/80 uppercase">Member Directory</p>
                  <h2 className="mt-1 text-xl font-extrabold text-white">Add New Member</h2>
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
                <p className="font-extrabold text-base">Member Added Successfully! 🎉</p>
                <p className="mt-1 text-xs text-emerald-600 font-medium">The member account has been registered.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4 p-6">
                <div>
                  <label className="input-label">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input required name="name" placeholder="Enter member name" className="input-base pl-9 text-xs sm:text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">
                      Birthdate *
                    </label>
                    <DatePicker name="birthdate" placeholder="Select date" required />
                  </div>

                  <div>
                    <label className="input-label">
                      Blood Group
                    </label>
                    <CustomSelect
                      name="bloodGroup"
                      defaultValue=""
                      placeholder="Select Blood Group"
                      options={bloodGroupOptions}
                      icon={<Droplet size={15} />}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      required
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      className="input-base pl-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">
                    Account Password *
                  </label>
                  <div className="relative">
                    <LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      placeholder="Set a secure password"
                      className="input-base pl-9 pr-10 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                    {error}
                  </div>
                )}

                <div className="rounded-2xl bg-violet-50 p-3 text-xs text-[#7257f4] font-medium border border-violet-100">
                  The member can use this mobile number and password to sign in after their account is created.
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
                    {submitting ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { Droplet, Eye, EyeOff, LockKeyhole, Phone, Plus, ShieldAlert, UserRound, X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomSelect } from "@/components/ui/custom-select";

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

const roleOptions = [
  { label: "Admin", value: "ADMIN" },
  { label: "Super Admin", value: "SUPER_ADMIN" },
];

export function AddAdminDialog() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          birthDate: form.get("birthdate"),
          mobile: form.get("mobile"),
          bloodGroup: form.get("bloodGroup") || null,
          password: form.get("password"),
          role: form.get("role") || Role.ADMIN,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.message ?? "Unable to create admin.");
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
      }, 500);
    } catch {
      setError("An unexpected network error occurred.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-900/20 transition hover:from-amber-600 hover:to-amber-700 active:scale-95"
      >
        <Plus size={18} />
        Add New Admin
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg rounded-2xl border border-stone-100 bg-white p-6 shadow-2xl md:p-8">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <ShieldAlert size={20} />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-[#24203a]">Create Admin Account</h3>
                      <p className="text-xs text-stone-500">
                        Grant administrative permissions to a new user
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    <X size={18} />
                  </button>
                </div>

                {saved ? (
                  <div className="my-8 rounded-xl bg-emerald-50 p-6 text-center text-emerald-800 border border-emerald-200">
                    <p className="font-bold text-base">Admin Created Successfully! 🎉</p>
                    <p className="mt-1 text-xs text-emerald-600">The admin account is ready to log in.</p>
                  </div>
                ) : (
                  <form onSubmit={submit} className="mt-5 space-y-4">
                    {error ? (
                      <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                        {error}
                      </div>
                    ) : null}

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          name="name"
                          required
                          placeholder="e.g. Rahul Verma"
                          className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          name="mobile"
                          required
                          pattern="\d{10}"
                          placeholder="10-digit mobile number"
                          className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">
                          Birth Date *
                        </label>
                        <DatePicker
                          name="birthdate"
                          required
                          placeholder="Select birth date"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">
                          Blood Group
                        </label>
                        <CustomSelect
                          name="bloodGroup"
                          placeholder="Select group"
                          options={bloodGroupOptions}
                          icon={<Droplet size={16} />}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        Admin Role *
                      </label>
                      <CustomSelect
                        name="role"
                        defaultValue="ADMIN"
                        options={roleOptions}
                        icon={<ShieldAlert size={16} />}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        Temporary Password *
                      </label>
                      <div className="relative">
                        <LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          placeholder="At least 8 characters"
                          className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password visibility"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
                      >
                        {submitting ? "Creating..." : "Create Admin"}
                      </button>
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

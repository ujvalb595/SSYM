"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BloodGroup, Role } from "@prisma/client";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Eye,
  EyeOff,
  LockKeyhole,
  Phone,
  Save,
  Shield,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

export interface ProfileUserData {
  id: string;
  name: string;
  mobileNumber: string;
  role: Role;
  isActive: boolean;
  rawBirthDate?: string;
  bloodGroup?: BloodGroup | null;
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

export function MemberProfileForm({
  user,
  currentUserRole,
  currentUserId,
}: {
  user: ProfileUserData;
  currentUserRole: Role;
  currentUserId: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  const isAdminOrSuperAdmin = (["SUPER_ADMIN", "ADMIN"] as Role[]).includes(currentUserRole);
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;
  const isSelf = currentUserId === user.id;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formElement = event.currentTarget;
    const values = new FormData(formElement);
    const name = String(values.get("name") || "").trim();
    const mobile = String(values.get("mobile") || "").trim();
    const birthDate = String(values.get("birthDate") || "");
    const bloodGroup = String(values.get("bloodGroup") || "");
    const password = String(values.get("password") || "");
    const roleVal = String(values.get("role") || "");
    const isActiveRaw = values.get("isActive");
    const isActiveVal = isActiveRaw !== null ? isActiveRaw === "true" : undefined;

    try {
      const response = await fetch(`/api/members/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile,
          birthDate: birthDate || null,
          bloodGroup: bloodGroup || null,
          password: password || undefined,
          role: isAdminOrSuperAdmin ? roleVal || undefined : undefined,
          isActive: isAdminOrSuperAdmin ? isActiveVal : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update profile.");
        setLoading(false);
        return;
      }

      setSuccess("Profile updated successfully!");
      setLoading(false);
      const pwdField = formElement.querySelector<HTMLInputElement>('input[name="password"]');
      if (pwdField) pwdField.value = "";
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    setError("");
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/members/${user.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete member.");
        setDeleteLoading(false);
        setDeleteOpen(false);
        return;
      }

      router.push("/members");
      router.refresh();
    } catch {
      setError("Failed to delete member. Please try again.");
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {/* Section 1: Personal Details */}
        <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <h3 className="text-lg font-bold text-[#24203a] mb-4">Personal Details</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  required
                  defaultValue={user.name}
                  name="name"
                  type="text"
                  placeholder="Enter full name"
                  className="h-11 w-full rounded-xl border border-[#e8e3f2] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  required
                  defaultValue={user.mobileNumber}
                  name="mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  className="h-11 w-full rounded-xl border border-[#e8e3f2] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Birth Date
              </label>
              <DatePicker name="birthDate" defaultValue={user.rawBirthDate} placeholder="Select birth date" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Blood Group
              </label>
              <CustomSelect
                name="bloodGroup"
                defaultValue={user.bloodGroup || ""}
                placeholder="Select Blood Group"
                options={bloodGroupOptions}
                icon={<Droplet size={18} />}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Account Role & Permissions (Admins Only) */}
        {isAdminOrSuperAdmin && (
          <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-[#7257f4]" size={20} />
              <h3 className="text-lg font-bold text-[#24203a]">Role & Access Control</h3>
            </div>
            <div className="max-w-md">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                User Role
              </label>
              <CustomSelect
                name="role"
                defaultValue={user.role}
                disabled={!isSuperAdmin && user.role === Role.SUPER_ADMIN}
                options={[
                  { label: "Member (User)", value: Role.USER },
                  { label: "Admin", value: Role.ADMIN },
                  ...(isSuperAdmin ? [{ label: "Super Admin", value: Role.SUPER_ADMIN }] : []),
                ]}
                icon={<Shield size={18} />}
              />
            </div>
          </div>
        )}

        {/* Section 3: Password Reset */}
        <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <h3 className="text-lg font-bold text-[#24203a] mb-1">Reset Password</h3>
          <p className="text-xs text-stone-500 mb-4">
            Enter a new password below if you wish to change or reset this user&apos;s account password.
          </p>
          <div className="max-w-md">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                placeholder="Leave blank to keep existing password"
                className="h-11 w-full rounded-xl border border-[#e8e3f2] bg-white pl-10 pr-11 text-sm outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          {isAdminOrSuperAdmin && !isSelf ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 size={17} /> Delete Member
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7257f4] to-[#a858ef] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:brightness-105 disabled:opacity-50"
          >
            <Save size={18} /> {loading ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Delete Confirm Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-bold text-[#24203a]">Delete Member Profile</h3>
              </div>
              <button
                onClick={() => setDeleteOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-600 leading-relaxed">
                Are you sure you want to delete <strong className="font-bold text-[#24203a]">{user.name}</strong>?
                This action cannot be undone and will permanently remove their member record from the mandal database.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

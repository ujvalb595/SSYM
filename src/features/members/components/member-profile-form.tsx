"use client";

import { FormEvent, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BloodGroup, Role } from "@prisma/client";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  MemberPaymentStatusCard,
  UserPaymentRecord,
} from "@/features/members/components/member-payment-status-card";
import {
  AlertTriangle,
  Calendar,
  Camera,
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
  image?: string | null;
  role: Role;
  isActive: boolean;
  rawBirthDate?: string;
  bloodGroup?: BloodGroup | null;
}

interface MemberProfileFormProps {
  user: ProfileUserData;
  currentUserRole: Role;
  currentUserId: string;
  birthDateText?: string;
  bloodGroupText?: string;
  roleText?: string;
  canViewPaymentStatus?: boolean;
  formattedPayments?: UserPaymentRecord[];
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
  birthDateText = "Not provided",
  bloodGroupText = "Not provided",
  roleText = "Mandal Member",
  canViewPaymentStatus = false,
  formattedPayments = [],
}: MemberProfileFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user.image || null);
  const router = useRouter();
  const { update: updateSession } = useSession();

  const isAdminOrSuperAdmin = (["SUPER_ADMIN", "ADMIN"] as Role[]).includes(currentUserRole);
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;
  const isSelf = currentUserId === user.id;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setProfileImage(result);
      toast.success("Profile photo selected. Click 'Save Profile' to apply changes.");
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          name: isAdminOrSuperAdmin ? name : undefined,
          mobile: isAdminOrSuperAdmin ? mobile : undefined,
          image: profileImage,
          birthDate: birthDate || null,
          bloodGroup: bloodGroup || null,
          password: password || undefined,
          role: isAdminOrSuperAdmin ? roleVal || undefined : undefined,
          isActive: isAdminOrSuperAdmin ? isActiveVal : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update profile.");
        setLoading(false);
        return;
      }

      if (isSelf) {
        await updateSession({ image: profileImage });
      }

      toast.success("Profile updated successfully!");
      setLoading(false);
      const pwdField = formElement.querySelector<HTMLInputElement>('input[name="password"]');
      if (pwdField) pwdField.value = "";
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/members/${user.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete member.");
        setDeleteLoading(false);
        setDeleteOpen(false);
        return;
      }

      toast.success("Member account deleted successfully.");
      router.push("/members");
      router.refresh();
    } catch {
      toast.error("Failed to delete member. Please try again.");
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Top User Banner & Account Overview Box (Combined Card) */}
      <section className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
        {/* Banner Header */}
        <div className="relative flex items-center justify-between bg-gradient-to-r from-[#654dde] via-[#8657ef] to-[#bd5ce8] px-6 py-7 text-white">
          <div className="flex items-center gap-5">
            {/* Avatar Box with Overlay Camera Upload Button */}
            <div className="relative group flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/40 bg-white/20 shadow-lg backdrop-blur-sm">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-extrabold text-white">
                  {user.name.slice(0, 2).toUpperCase() || "MB"}
                </span>
              )}

              {/* Camera Overlay Icon */}
              <label
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white backdrop-blur-[2px]"
                title="Upload Profile Picture"
              >
                <Camera size={22} className="text-white" />
                <span className="text-[10px] font-bold mt-0.5">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">{user.name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
                  {roleText}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Upload Button on Banner */}
          <label className="hidden sm:inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition cursor-pointer">
            <Camera size={16} /> Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Account Overview Quick Stats */}
        <div className="p-6">
          <h3 className="text-base font-bold text-[#24203a] mb-4">Account Overview</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Mobile Number */}
            <div className="flex items-center gap-3 rounded-xl bg-[#faf9ff] p-4">
              <span className="text-[#7657f6]">
                <Phone size={18} />
              </span>
              <div>
                <p className="text-xs font-medium text-stone-500">Mobile Number</p>
                <p className="mt-0.5 text-sm font-semibold text-[#24203a]">
                  {user.mobileNumber || "Not provided"}
                </p>
              </div>
            </div>

            {/* Birthdate */}
            <div className="flex items-center gap-3 rounded-xl bg-[#faf9ff] p-4">
              <span className="text-[#7657f6]">
                <Calendar size={18} />
              </span>
              <div>
                <p className="text-xs font-medium text-stone-500">Birthdate</p>
                <p className="mt-0.5 text-sm font-semibold text-[#24203a]">
                  {birthDateText}
                </p>
              </div>
            </div>

            {/* Blood Group */}
            <div className="flex items-center gap-3 rounded-xl bg-[#faf9ff] p-4">
              <span className="text-[#7657f6]">
                <Droplet size={18} />
              </span>
              <div>
                <p className="text-xs font-medium text-stone-500">Blood Group</p>
                <p className="mt-0.5 text-sm font-semibold text-[#24203a]">
                  {bloodGroupText}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3 rounded-xl bg-[#faf9ff] p-4">
              <span className="text-[#7657f6]">
                <Shield size={18} />
              </span>
              <div>
                <p className="text-xs font-medium text-stone-500">Role</p>
                <p className="mt-0.5 text-sm font-semibold text-[#24203a]">
                  {roleText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Month-Wise Payment Status Box */}
      {canViewPaymentStatus && (
        <MemberPaymentStatusCard payments={formattedPayments} />
      )}

      {/* 3. Member Profile Form / Edit Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <h3 className="text-lg font-bold text-[#24203a] mb-4">Edit Personal Details</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 flex items-center justify-between">
                <span>Full Name</span>
                {!isAdminOrSuperAdmin && (
                  <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                    <LockKeyhole size={11} /> Admin Only
                  </span>
                )}
              </label>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  required
                  disabled={!isAdminOrSuperAdmin}
                  defaultValue={user.name}
                  name="name"
                  type="text"
                  placeholder="Enter full name"
                  className={`h-11 w-full rounded-xl border border-[#e8e3f2] pl-10 pr-4 text-sm outline-none transition ${
                    !isAdminOrSuperAdmin
                      ? "bg-stone-100 text-stone-500 cursor-not-allowed border-stone-200"
                      : "bg-white text-[#24203a] focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                  }`}
                />
              </div>
              {!isAdminOrSuperAdmin && (
                <p className="mt-1 text-[11px] font-semibold text-stone-400">
                  Name change requires Admin approval.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 flex items-center justify-between">
                <span>Mobile Number</span>
                {!isAdminOrSuperAdmin && (
                  <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                    <LockKeyhole size={11} /> Admin Only
                  </span>
                )}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  required
                  disabled={!isAdminOrSuperAdmin}
                  defaultValue={user.mobileNumber}
                  name="mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  className={`h-11 w-full rounded-xl border border-[#e8e3f2] pl-10 pr-4 text-sm outline-none transition ${
                    !isAdminOrSuperAdmin
                      ? "bg-stone-100 text-stone-500 cursor-not-allowed border-stone-200"
                      : "bg-white text-[#24203a] focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
                  }`}
                />
              </div>
              {!isAdminOrSuperAdmin && (
                <p className="mt-1 text-[11px] font-semibold text-stone-400">
                  Mobile number change requires Admin approval.
                </p>
              )}
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

        {/* Role & Access Control (Admins Only) */}
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

        {/* Reset Password */}
        <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <h3 className="text-lg font-bold text-[#24203a] mb-1">Reset Password</h3>
          <p className="text-xs text-stone-500 mb-4">
            Enter a new password below if you wish to change your account password.
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
                placeholder="Leave blank to keep current password"
                className="h-11 w-full rounded-xl border border-[#e8e3f2] bg-white pl-10 pr-12 text-sm outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {isAdminOrSuperAdmin && !isSelf && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              <Trash2 size={18} /> Delete Account
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7257f4] to-[#bd59ec] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition cursor-pointer"
          >
            <Save size={18} /> {loading ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-[#ebe7f6]">
            <div className="flex items-center justify-between border-b border-[#f4f2fa] pb-3">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle size={20} className="text-rose-600" /> Delete Member Account
              </h3>
              <button
                onClick={() => setDeleteOpen(false)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-stone-600 font-medium leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#24203a]">{user.name}</strong>? All user data, payment logs, and associated records will be removed.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

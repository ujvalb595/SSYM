"use client";

import { useState } from "react";
import { CalendarDays, Ellipsis, Phone, ShieldCheck, Shield, CheckCircle2, UserCheck } from "lucide-react";

export interface AdminUser {
  id: string;
  name: string;
  mobile?: string;
  role: "SUPER_ADMIN" | "ADMIN" | string;
  title?: string;
  avatar?: string;
  joinedAt?: string;
  isActive?: boolean;
}

export function AdminCard({ admin }: { admin: AdminUser }) {
  const [imageError, setImageError] = useState(false);

  const isSuperAdmin = admin.role === "SUPER_ADMIN";

  // Extract initials (e.g. "Super Admin" -> "SA", "Aarav Patel" -> "AP")
  const initials = admin.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#ede8f7] bg-white shadow-[0_10px_25px_rgb(77_55_135_/_0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d7ccf7] hover:shadow-[0_20px_35px_rgb(77_55_135_/_0.12)]">
      {/* Top Banner */}
      <div className="relative h-24 w-full bg-gradient-to-r from-[#5f47d9] via-[#8255ef] to-[#c05ce9] p-4">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] opacity-15" />

        {/* Role Badge on Top Right */}
        <div className="absolute right-4 top-4 z-10">
          {isSuperAdmin ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md border border-white/30">
              <ShieldCheck size={14} className="text-amber-300" />
              Super Admin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md border border-white/20">
              <Shield size={14} className="text-violet-200" />
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Avatar Container overlapping top banner */}
      <div className="px-6 pb-6 pt-0">
        <div className="-mt-12 flex items-end justify-between">
          <div className="relative">
            <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-[#7257f4] to-[#bf5eea] shadow-lg shadow-violet-500/20">
              {admin.avatar && !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={admin.avatar}
                  alt={admin.name}
                  onError={() => setImageError(true)}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black tracking-wide text-white">{initials}</span>
              )}
            </div>
            {/* Active Status Badge */}
            {admin.isActive !== false && (
              <span
                title="Active Account"
                className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow"
              >
                <CheckCircle2 size={12} />
              </span>
            )}
          </div>

          <button
            aria-label="More actions"
            className="rounded-xl border border-stone-200/80 p-2 text-stone-400 transition hover:bg-violet-50 hover:text-[#7257f4]"
          >
            <Ellipsis size={18} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-[#24203a] transition group-hover:text-[#654dde]">
            {admin.name}
          </h3>
          <p className="text-xs font-medium text-stone-500">
            {admin.title || (isSuperAdmin ? "Head Administrator" : "Mandal Administrator")}
          </p>
        </div>

        {/* Details list */}
        <div className="mt-5 space-y-2.5 border-t border-stone-100 pt-4 text-xs font-medium text-stone-600">
          {admin.mobile && (
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-[#7657f6]">
                <Phone size={14} />
              </span>
              <span className="font-semibold text-stone-800">{admin.mobile}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-[#7657f6]">
              <CalendarDays size={14} />
            </span>
            <span>Joined {admin.joinedAt || "2026"}</span>
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="mt-6 flex items-center gap-2">
          {admin.mobile ? (
            <a
              href={`tel:${admin.mobile}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-200 transition hover:brightness-105"
            >
              <Phone size={14} />
              Call Now
            </a>
          ) : (
            <button
              disabled
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 py-2.5 text-xs font-semibold text-stone-400"
            >
              <Phone size={14} />
              Call
            </button>
          )}

          <button className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e6e1f3] bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 transition hover:border-[#8660ee] hover:bg-violet-50 hover:text-[#7257f4]">
            <UserCheck size={14} />
            Profile
          </button>
        </div>
      </div>
    </div>
  );
}

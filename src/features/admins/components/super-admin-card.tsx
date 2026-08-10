"use client";

import { Crown, ShieldCheck, Users } from "lucide-react";
import { PromoteMemberDialog, NonAdminUser } from "./promote-member-dialog";

export function SuperAdminCard({
  nonAdminMembers,
  superAdminCount,
  adminCount,
}: {
  nonAdminMembers: NonAdminUser[];
  superAdminCount: number;
  adminCount: number;
}) {
  return (
    <section className="relative rounded-2xl bg-gradient-to-r from-[#191535] via-[#281c4e] to-[#3a1d68] p-6 text-white shadow-xl shadow-purple-950/20 border border-purple-500/20 md:p-8">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute right-0 top-0 size-72 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 bottom-0 size-72 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30">
            <Crown size={14} className="text-amber-400" />
            Super Admin Exclusive Control
          </div>

          <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl drop-shadow-sm">
            Super Admin Command Center
          </h3>

          <p className="text-sm text-stone-200 leading-relaxed font-normal">
            As a Super Admin, you hold full administrative authority over the mandal. You can grant admin rights, promote existing members to administrators, or manage role permissions.
          </p>

          <div className="flex flex-wrap gap-3 pt-2 text-xs font-medium text-stone-200">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 border border-white/15 backdrop-blur-md">
              <Crown size={15} className="text-amber-400" />
              <span className="font-semibold text-white">{superAdminCount} Super Admins</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 border border-white/15 backdrop-blur-md">
              <ShieldCheck size={15} className="text-violet-300" />
              <span className="font-semibold text-white">{adminCount} Admins</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 border border-white/15 backdrop-blur-md">
              <Users size={15} className="text-fuchsia-300" />
              <span className="font-semibold text-white">{nonAdminMembers.length} Members Eligible for Promotion</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-start lg:justify-end min-w-[200px]">
          <PromoteMemberDialog members={nonAdminMembers} />
        </div>
      </div>
    </section>
  );
}

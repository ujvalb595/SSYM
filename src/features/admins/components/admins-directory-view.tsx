"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { Crown, ShieldCheck, UserCheck, Search } from "lucide-react";
import { AdminCardsGrid, AdminCardItem } from "./admin-cards-grid";
import { PromoteMemberDialog, NonAdminUser } from "./promote-member-dialog";

export function AdminsDirectoryView({
  adminItems,
  nonAdminMembers,
  superAdminCount,
  adminCount,
  currentUserId,
  currentUserRole,
  isSuperAdmin,
}: {
  adminItems: AdminCardItem[];
  nonAdminMembers: NonAdminUser[];
  superAdminCount: number;
  adminCount: number;
  currentUserId: string;
  currentUserRole: Role;
  isSuperAdmin: boolean;
}) {
  const [search, setSearch] = useState("");

  const filteredAdmins = adminItems.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.mobile.includes(search)
  );

  return (
    <div className="space-y-7">
      {/* Top Header with Searchbar & + Add Admin Button side-by-side at top right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#24203a]">
              Admins Directory
            </h2>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                isSuperAdmin
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-violet-100 text-[#7257f4] border border-violet-200"
              }`}
            >
              {isSuperAdmin ? "👑 Super Admin Mode" : "Shield Admin Access"}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            View and manage mandal administrators and permission levels.
          </p>
        </div>

        {/* Both Searchbar & + Add Admin Button side-by-side */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-full sm:w-64">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              size={17}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#e8e3f2] bg-white py-2 pl-10 pr-4 text-sm outline-none shadow-xs placeholder:text-stone-400 focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
              placeholder="Search admins by name or mobile..."
            />
          </label>

          {isSuperAdmin ? (
            <PromoteMemberDialog members={nonAdminMembers} />
          ) : null}
        </div>
      </div>

      {/* Admin Quick Metrics Bar */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-xl bg-violet-100 text-[#7257f4]">
            <ShieldCheck size={24} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Administrators</p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">{adminItems.length}</h4>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Crown size={24} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/70">Super Admins</p>
            <h4 className="text-2xl font-extrabold text-amber-900">{superAdminCount}</h4>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <UserCheck size={24} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Mandal Admins</p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">{adminCount}</h4>
          </div>
        </div>
      </section>

      {/* Admins Grid */}
      <AdminCardsGrid
        admins={filteredAdmins}
        totalCount={adminItems.length}
        search={search}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}

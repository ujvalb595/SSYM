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
    <div className="space-y-6">
      {/* Top Header with Searchbar & + Add Admin Button side-by-side at top right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="heading-xl">
              Admins Directory
            </h1>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                isSuperAdmin
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "badge-brand"
              }`}
            >
              {isSuperAdmin ? "👑 Super Admin Mode" : "Shield Admin Access"}
            </span>
          </div>
          <p className="text-subtitle">
            View and manage mandal administrators and permission levels.
          </p>
        </div>

        {/* Both Searchbar & + Add Admin Button side-by-side */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-full sm:w-64">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              size={16}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9 text-xs"
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
        <div className="card-base flex items-center gap-4 p-5">
          <span className="btn-icon size-12 rounded-2xl">
            <ShieldCheck size={24} />
          </span>
          <div>
            <p className="text-caption">Total Administrators</p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">{adminItems.length}</h4>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 border-amber-200 bg-amber-50/50 p-5">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Crown size={24} />
          </span>
          <div>
            <p className="text-caption text-amber-800/70">Super Admins</p>
            <h4 className="text-2xl font-extrabold text-amber-900">{superAdminCount}</h4>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 p-5">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
            <UserCheck size={24} />
          </span>
          <div>
            <p className="text-caption">Standard Admins</p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">{adminCount}</h4>
          </div>
        </div>
      </section>

      {/* Admin Cards Grid */}
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

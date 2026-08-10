"use client";

import Link from "next/link";
import { Role } from "@prisma/client";
import { CalendarDays, Crown, ExternalLink, Phone, ShieldCheck } from "lucide-react";
import { AdminRowActions } from "./admin-row-actions";

export interface AdminCardItem {
  id: string;
  name: string;
  mobile: string;
  role: Role;
  joinedDate: string;
  bloodGroup: string;
  isActive: boolean;
  initials: string;
}

export function AdminCardsGrid({
  admins,
  totalCount,
  search,
  currentUserId,
  currentUserRole,
}: {
  admins: AdminCardItem[];
  totalCount: number;
  search: string;
  currentUserId: string;
  currentUserRole: Role;
}) {
  return (
    <section className="space-y-5">
      {/* Counter Label */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-500">
          Showing <span className="font-bold text-[#24203a]">{admins.length}</span> of {totalCount} active administrators
        </p>
      </div>

      {/* Cards Grid */}
      {admins.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <p className="text-base font-bold text-[#24203a]">No Administrators Found</p>
          <p className="mt-1 text-xs text-stone-500">
            {search ? `No administrator matching "${search}" was found.` : "No administrators logged."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin) => {
            const isSuperAdminRole = admin.role === Role.SUPER_ADMIN;
            const isSelf = admin.id === currentUserId;

            return (
              <div
                key={admin.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md"
              >
                {/* Top Banner with Avatar & Role */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-12 items-center justify-center rounded-2xl text-sm font-bold shadow-sm ${
                          isSuperAdminRole
                            ? "bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 text-amber-900 border border-amber-300/80"
                            : "bg-gradient-to-br from-violet-100 via-fuchsia-100 to-violet-200 text-[#7257f4]"
                        }`}
                      >
                        {admin.initials}
                      </span>
                      <div>
                        <h4 className="font-bold text-[#24203a] text-base flex items-center gap-1.5">
                          {admin.name}
                          {isSelf ? (
                            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-[#7257f4]">
                              You
                            </span>
                          ) : null}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          {isSuperAdminRole ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
                              <Crown size={12} className="text-amber-600" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-[#7257f4]">
                              <ShieldCheck size={12} />
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Dropdown Menu */}
                    <AdminRowActions
                      admin={{
                        id: admin.id,
                        name: admin.name,
                        mobile: admin.mobile,
                        role: admin.role,
                      }}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                    />
                  </div>

                  {/* Card Key Details */}
                  <div className="mt-5 space-y-2.5 rounded-xl bg-[#faf9ff] p-3.5 border border-stone-100 text-xs">
                    <div className="flex items-center justify-between text-stone-600">
                      <span className="flex items-center gap-2 font-medium">
                        <Phone size={14} className="text-stone-400" />
                        Mobile No.
                      </span>
                      <span className="font-semibold text-[#24203a]">{admin.mobile}</span>
                    </div>

                    <div className="flex items-center justify-between text-stone-600">
                      <span className="flex items-center gap-2 font-medium">
                        <CalendarDays size={14} className="text-stone-400" />
                        Joined Date
                      </span>
                      <span className="font-semibold text-[#24203a]">{admin.joinedDate}</span>
                    </div>

                    <div className="flex items-center justify-between text-stone-600">
                      <span className="font-medium">Blood Group</span>
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-bold text-rose-700">
                        {admin.bloodGroup}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-600">
                      <span className="font-medium">Account Status</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 text-[11px]">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="mt-5 pt-3 border-t border-stone-100 flex justify-end">
                  <Link
                    href={`/members/${admin.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7257f4] hover:text-[#583ccf] transition"
                  >
                    View Profile
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

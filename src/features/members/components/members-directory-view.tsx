"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UsersRound, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AddMemberDialog } from "./add-member-dialog";
import { EditMemberDialog } from "./edit-member-dialog";

export interface MemberRowData {
  id: string;
  name: string;
  mobile: string;
  birthDate: string;
  rawBirthDate?: string;
  bloodGroup?: string;
  rawBloodGroup?: string;
  initials: string;
  addedUpdatedBy?: string;
  addedUpdatedByRole?: string;
}

const PAGE_SIZE = 10;

export function MembersDirectoryView({
  members,
  totalCount,
  canManageMembers,
  isSuperAdmin,
}: {
  members: MemberRowData[];
  totalCount: number;
  canManageMembers: boolean;
  isSuperAdmin: boolean;
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const query = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.mobile.includes(query) ||
        (m.bloodGroup && m.bloodGroup.toLowerCase().includes(query)) ||
        (m.birthDate && m.birthDate.toLowerCase().includes(query))
    );
  }, [members, search]);

  const totalFiltered = filteredMembers.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedMembers = filteredMembers.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const startRecord = totalFiltered === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + PAGE_SIZE, totalFiltered);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="heading-xl">
            Members
          </h1>
          <p className="text-subtitle">
            View and manage your mandal member directory.
          </p>
        </div>

        {canManageMembers && <AddMemberDialog />}
      </div>

      {/* Directory Table Card Box */}
      <section className="card-base overflow-hidden">
        {/* Box Top Toolbar */}
        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="btn-icon size-10">
              <UsersRound size={20} />
            </span>
            <div>
              <h3 className="heading-md">All Members</h3>
              <p className="text-subtitle">
                {search
                  ? `Showing ${totalFiltered} of ${totalCount} registered members`
                  : `${totalCount} registered members`}
              </p>
            </div>
          </div>

          {/* Searchbar inside Card Box Header */}
          <label className="relative block">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              size={16}
            />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input-base pl-9 text-xs sm:w-72"
              placeholder="Search members by name, mobile..."
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#faf9ff] text-caption border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 font-bold">Member</th>
                <th className="px-6 py-4 font-bold">Mobile No.</th>
                <th className="px-6 py-4 font-bold">Birth Date</th>
                <th className="px-6 py-4 font-bold">Blood Group</th>
                {isSuperAdmin && (
                  <th className="px-6 py-4 font-bold">Added / Updated By</th>
                )}
                {canManageMembers && (
                  <th className="px-6 py-4 text-right font-bold">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManageMembers ? (isSuperAdmin ? 6 : 5) : (isSuperAdmin ? 5 : 4)}
                    className="p-12 text-center"
                  >
                    <p className="heading-md">No Members Found</p>
                    <p className="text-subtitle mt-1">
                      {search
                        ? `No members found matching "${search}".`
                        : "No members registered yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-t border-stone-100 transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-brand uppercase">
                          {member.initials || member.name.charAt(0)}
                        </span>
                        <div>
                          <Link
                            href={`/members/${member.id}`}
                            className="font-bold text-[#24203a] hover:text-brand hover:underline"
                          >
                            {member.name}
                          </Link>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium text-stone-600">
                      {member.mobile}
                    </td>

                    <td className="px-6 py-4 text-stone-600">
                      {member.birthDate || "—"}
                    </td>

                    <td className="px-6 py-4">
                      {member.bloodGroup ? (
                        <span className="badge-brand">
                          {member.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {isSuperAdmin && (
                      <td className="px-6 py-4">
                        {member.addedUpdatedBy ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2 py-1 text-xs text-stone-600">
                            <span className="font-semibold">{member.addedUpdatedBy}</span>
                            {member.addedUpdatedByRole && (
                              <span className="text-[10px] text-stone-400">
                                ({member.addedUpdatedByRole.replace("_", " ")})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">Self / Initial</span>
                        )}
                      </td>
                    )}

                    {canManageMembers && (
                      <td className="px-6 py-4 text-right">
                        <EditMemberDialog
                          member={{
                            id: member.id,
                            name: member.name,
                            mobile: member.mobile,
                            rawBirthDate: member.rawBirthDate,
                            bloodGroup: member.rawBloodGroup || member.bloodGroup,
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-stone-100 px-6 py-4 text-sm text-stone-500">
          <span>
            Showing {startRecord}–{endRecord} of {totalFiltered} members
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={safePage === 1}
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    pg === safePage
                      ? "bg-brand text-white shadow-xs font-bold"
                      : "border border-stone-200 hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={safePage === totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

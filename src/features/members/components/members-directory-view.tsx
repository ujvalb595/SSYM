"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, UsersRound, X } from "lucide-react";
import { AddMemberDialog } from "./add-member-dialog";
import { MemberActions } from "./member-actions";

export interface MemberRowData {
  id: string;
  name: string;
  mobile: string;
  birthDate: string;
  rawBirthDate?: string;
  bloodGroup: string;
  rawBloodGroup?: string;
  initials: string;
}

interface MembersDirectoryViewProps {
  members: MemberRowData[];
  totalCount: number;
  canManageMembers: boolean;
}

const PAGE_SIZE = 10;

export function MembersDirectoryView({
  members,
  totalCount,
  canManageMembers,
}: MembersDirectoryViewProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter members based on search query (name, mobile, blood group, birthDate)
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.mobile.toLowerCase().includes(q) ||
      m.bloodGroup.toLowerCase().includes(q) ||
      m.birthDate.toLowerCase().includes(q)
    );
  });

  // Calculate pagination
  const totalFiltered = filteredMembers.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + PAGE_SIZE);

  const startRecord = totalFiltered === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + PAGE_SIZE, totalFiltered);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-7">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#24203a]">
            Members
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            View and manage your mandal member directory.
          </p>
        </div>

        {canManageMembers && <AddMemberDialog />}
      </div>

      {/* Directory Table Card Box */}
      <section className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
        {/* Box Top Toolbar */}
        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-100 p-2.5 text-[#7257f4]">
              <UsersRound size={20} />
            </span>
            <div>
              <h3 className="font-bold text-[#24203a]">All Members</h3>
              <p className="text-xs text-stone-500">
                {search
                  ? `Showing ${totalFiltered} of ${totalCount} registered members`
                  : `${totalCount} registered members`}
              </p>
            </div>
          </div>

          {/* Searchbar inside Card Box Header */}
          <label className="relative block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              size={17}
            />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-[#e8e3f2] py-2 pl-10 pr-9 text-sm outline-none placeholder:text-stone-400 focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100 sm:w-72"
              placeholder="Search members by name, mobile..."
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
              >
                <X size={15} />
              </button>
            )}
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#faf9ff] text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Member</th>
                <th className="px-6 py-4 font-semibold">Mobile No.</th>
                <th className="px-6 py-4 font-semibold">Birth Date</th>
                <th className="px-6 py-4 font-semibold">Blood Group</th>
                {canManageMembers && (
                  <th className="px-6 py-4 text-right font-semibold">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t border-stone-100 transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-xs font-bold text-[#7657f6]">
                          {m.initials}
                        </span>
                        <Link
                          href={`/members/${m.id}`}
                          className="font-semibold text-[#302a49] hover:text-[#7257f4] hover:underline"
                        >
                          {m.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{m.mobile}</td>
                    <td className="px-6 py-4 text-stone-600">{m.birthDate}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                        {m.bloodGroup}
                      </span>
                    </td>
                    {canManageMembers && (
                      <td className="px-6 py-4 text-right">
                        <MemberActions
                          member={{
                            id: m.id,
                            name: m.name,
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={canManageMembers ? 5 : 4}
                    className="p-12 text-center text-stone-500"
                  >
                    <p className="font-bold text-[#24203a]">No members found</p>
                    <p className="mt-1 text-xs text-stone-400">
                      No members match &quot;{search}&quot;. Try adjusting your search query.
                    </p>
                  </td>
                </tr>
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
                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    pg === safePage
                      ? "bg-[#7257f4] text-white shadow-sm"
                      : "border border-stone-200 hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={safePage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

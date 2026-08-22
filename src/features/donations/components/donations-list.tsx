"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { HeartHandshake, IndianRupee, Search, User } from "lucide-react";
import { EditDonationDialog } from "./edit-donation-dialog";

export interface DonationItemData {
  id: string;
  donorName: string;
  title?: string | null;
  description?: string | null;
  amount: number;
  date: string;
  createdById: string;
  createdByName: string;
  createdByRole: Role;
}

interface DonationsListProps {
  donations: DonationItemData[];
  currentUserId: string;
  currentUserRole: Role;
  canManageDonations: boolean;
}

export function DonationsList({
  donations,
  currentUserRole,
  canManageDonations,
}: DonationsListProps) {
  const [search, setSearch] = useState("");

  const filteredDonations = donations.filter(
    (d) =>
      d.donorName.toLowerCase().includes(search.toLowerCase()) ||
      (d.title && d.title.toLowerCase().includes(search.toLowerCase())) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase())) ||
      d.createdByName.toLowerCase().includes(search.toLowerCase()) ||
      d.amount.toString().includes(search) ||
      d.date.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filteredDonations.reduce((sum, item) => sum + item.amount, 0);

  const canEdit = canManageDonations || currentUserRole === Role.ADMIN || currentUserRole === Role.SUPER_ADMIN;

  return (
    <section className="space-y-6">
      {/* Metric Cards Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-5 shadow-xs">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
            <IndianRupee size={24} />
          </span>
          <div>
            <p className="text-caption text-emerald-800/80">
              Total Amount Received
            </p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">
              ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h4>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 p-5">
          <span className="btn-icon size-12 rounded-2xl">
            <HeartHandshake size={24} />
          </span>
          <div>
            <p className="text-caption">
              Total Donations Logged
            </p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">{donations.length} Records</h4>
          </div>
        </div>
      </div>

      {/* Main Donations Table Card */}
      <div className="card-base overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="btn-icon size-10">
              <HeartHandshake size={20} />
            </span>
            <div>
              <h3 className="heading-md">All Mandal Donations</h3>
              <p className="text-subtitle">
                Showing {filteredDonations.length} of {donations.length} donation entries
              </p>
            </div>
          </div>

          <label className="relative block">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              size={16}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9 text-xs sm:w-72"
              placeholder="Search by donor, cause, or detail..."
            />
          </label>
        </div>

        {/* Donations Table */}
        <div className="overflow-x-auto">
          {filteredDonations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="heading-md">No Donation Records Found</p>
              <p className="text-subtitle mt-1">
                {search ? `No donations matching "${search}".` : "Click Add Donation above to log your first donation."}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#faf9ff] text-caption border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Donor Name</th>
                  <th className="px-6 py-4 font-bold">Purpose / Cause</th>
                  <th className="px-6 py-4 font-bold">Detail</th>
                  <th className="px-6 py-4 font-bold">Donation Date</th>
                  <th className="px-6 py-4 font-bold">Logged By</th>
                  <th className="px-6 py-4 text-right font-bold">Amount</th>
                  {canEdit && <th className="px-6 py-4 text-right font-bold">Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-stone-100 transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4 font-bold text-[#24203a]">
                      {item.donorName}
                    </td>

                    <td className="px-6 py-4 font-semibold text-stone-700">
                      {item.title || "General Donation"}
                    </td>

                    <td className="px-6 py-4 text-stone-600 max-w-xs truncate">
                      {item.description || "—"}
                    </td>

                    <td className="px-6 py-4 text-stone-600 font-medium">{item.date}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-brand">
                          <User size={13} />
                        </span>
                        <span className="text-xs font-medium text-stone-700">
                          {item.createdByName}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-emerald-700">
                      ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <EditDonationDialog donation={item} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

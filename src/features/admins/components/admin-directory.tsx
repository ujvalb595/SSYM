"use client";

import { useState } from "react";
import { Search, Shield, ShieldCheck, UserCheck, Users } from "lucide-react";
import { AdminCard, type AdminUser } from "./admin-card";
import { AddAdminDialog } from "./add-admin-dialog";

export function AdminDirectory({ initialAdmins }: { initialAdmins: AdminUser[] }) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<"ALL" | "SUPER_ADMIN" | "ADMIN">("ALL");

  function handleAdminAdded(newAdmin: AdminUser) {
    setAdmins((prev) => [newAdmin, ...prev]);
  }

  // Filter admins based on search query and role
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin.mobile && admin.mobile.includes(searchQuery)) ||
      (admin.title && admin.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      selectedRole === "ALL"
        ? true
        : selectedRole === "SUPER_ADMIN"
        ? admin.role === "SUPER_ADMIN"
        : admin.role === "ADMIN";

    return matchesSearch && matchesRole;
  });

  const totalCount = admins.length;
  const superAdminCount = admins.filter((a) => a.role === "SUPER_ADMIN").length;
  const adminCount = admins.filter((a) => a.role === "ADMIN").length;

  return (
    <div className="space-y-7">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-white bg-white p-5 shadow-[0_10px_25px_rgb(77_55_135_/_0.05)]">
          <span className="flex size-12 items-center justify-center rounded-xl bg-violet-100 text-[#7657f6]">
            <Users size={22} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Admins</p>
            <p className="text-2xl font-bold text-[#24203a]">{totalCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white bg-white p-5 shadow-[0_10px_25px_rgb(77_55_135_/_0.05)]">
          <span className="flex size-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Super Admins</p>
            <p className="text-2xl font-bold text-[#24203a]">{superAdminCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white bg-white p-5 shadow-[0_10px_25px_rgb(77_55_135_/_0.05)]">
          <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <UserCheck size={22} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Active Admins</p>
            <p className="text-2xl font-bold text-[#24203a]">{admins.filter((a) => a.isActive !== false).length}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Tabs */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white bg-white p-4 shadow-[0_10px_25px_rgb(77_55_135_/_0.05)] sm:flex-row sm:items-center sm:justify-between">
        {/* Role Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-[#faf9ff] p-1 border border-stone-100">
          <button
            onClick={() => setSelectedRole("ALL")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              selectedRole === "ALL"
                ? "bg-white text-[#7657f6] shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            All Admins ({totalCount})
          </button>
          <button
            onClick={() => setSelectedRole("SUPER_ADMIN")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedRole === "SUPER_ADMIN"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <ShieldCheck size={14} />
            Super Admins ({superAdminCount})
          </button>
          <button
            onClick={() => setSelectedRole("ADMIN")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedRole === "ADMIN"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Shield size={14} />
            Admins ({adminCount})
          </button>
        </div>

        {/* Right side controls: Search input & Add Admin button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <label className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, mobile..."
              className="w-full rounded-xl border border-[#e8e3f2] bg-white py-2 pl-9 pr-4 text-xs outline-none transition placeholder:text-stone-400 focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100"
            />
          </label>
          <AddAdminDialog onAdminAdded={handleAdminAdded} />
        </div>
      </div>

      {/* Admin Cards Grid */}
      {filteredAdmins.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAdmins.map((admin) => (
            <AdminCard key={admin.id} admin={admin} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-[#7657f6]">
            <Users size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-[#24203a]">No administrators found</h3>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            No administrator matching standard search criteria or selected filters could be found.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedRole("ALL");
            }}
            className="mt-4 rounded-xl bg-violet-100 px-4 py-2 text-xs font-semibold text-[#7657f6] hover:bg-[#7657f6] hover:text-white transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

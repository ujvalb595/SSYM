"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { UserCheck, Shield, Search, X, Plus } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

export interface NonAdminUser {
  id: string;
  name: string;
  mobile: string;
  role: string;
}

const roleOptions = [
  { label: "Admin", value: "ADMIN" },
  { label: "Super Admin", value: "SUPER_ADMIN" },
];

export function PromoteMemberDialog({ members }: { members: NonAdminUser[] }) {
  const [open, setOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile.includes(search)
  );

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  async function handlePromote() {
    if (!selectedMemberId) {
      setError("Please select a member to promote.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/members/${selectedMemberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedMember?.name,
          mobile: selectedMember?.mobile,
          role: selectedRole as Role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to promote member.");
        setSubmitting(false);
        return;
      }

      setSuccessMsg(
        `${selectedMember?.name} is now promoted to ${
          selectedRole === "SUPER_ADMIN" ? "Super Admin" : "Admin"
        }!`
      );
      setTimeout(() => {
        setOpen(false);
        setSuccessMsg("");
        setSelectedMemberId("");
        setSubmitting(false);
        router.refresh();
      }, 1000);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#7257f4] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5f44e2] active:scale-95"
      >
        <Plus size={16} className="stroke-[2.5]" />
        Add Admin
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg rounded-2xl border border-stone-100 bg-white p-6 shadow-2xl md:p-8">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-[#7257f4]">
                      <Shield size={20} />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-[#24203a]">
                        Add Admin
                      </h3>
                      <p className="text-xs text-stone-500">
                        Promote an existing mandal member to Admin
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    <X size={18} />
                  </button>
                </div>

                {successMsg ? (
                  <div className="my-8 rounded-xl bg-emerald-50 p-6 text-center text-emerald-800 border border-emerald-200">
                    <p className="font-bold text-base">{successMsg}</p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {error ? (
                      <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                        {error}
                      </div>
                    ) : null}

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        Select Member *
                      </label>
                      <div className="relative mb-2">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                        />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search member by name or mobile..."
                          className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#7257f4] focus:ring-4 focus:ring-violet-100"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto rounded-xl border border-stone-200 divide-y divide-stone-100 bg-stone-50/50">
                        {filteredMembers.length === 0 ? (
                          <p className="p-4 text-center text-xs text-stone-400">
                            {members.length === 0
                              ? "No eligible non-admin members found."
                              : "No members match your search."}
                          </p>
                        ) : (
                          filteredMembers.map((m) => {
                            const isSelected = m.id === selectedMemberId;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setSelectedMemberId(m.id)}
                                className={`w-full flex items-center justify-between p-3 text-left transition ${
                                  isSelected
                                    ? "bg-violet-100/70 text-[#5436df] font-semibold"
                                    : "hover:bg-stone-100 text-stone-700"
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-semibold">{m.name}</p>
                                  <p className="text-xs text-stone-400">{m.mobile}</p>
                                </div>
                                {isSelected ? (
                                  <span className="rounded-full bg-[#7257f4] p-1 text-white">
                                    <UserCheck size={12} />
                                  </span>
                                ) : null}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        Assign Role *
                      </label>
                      <CustomSelect
                        name="targetRole"
                        defaultValue={selectedRole}
                        onChange={(val: string) => setSelectedRole(val)}
                        options={roleOptions}
                        icon={<Shield size={16} />}
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePromote}
                        disabled={submitting || !selectedMemberId}
                        className="rounded-xl bg-[#7257f4] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#5f44e2] disabled:opacity-50"
                      >
                        {submitting ? "Adding Admin..." : "Confirm Add Admin"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

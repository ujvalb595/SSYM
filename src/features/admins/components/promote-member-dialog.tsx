"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { UserCheck, Shield, Search, X, Plus } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";

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

  async function handlePromote() {
    if (!selectedMemberId) {
      setError("Please select a member first.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admins/${selectedMemberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole as Role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to update role.");
        setSubmitting(false);
        return;
      }

      setSuccessMsg("Member role updated successfully! 🎉");
      setTimeout(() => {
        setOpen(false);
        setSuccessMsg("");
        setSelectedMemberId("");
        setSubmitting(false);
        router.refresh();
      }, 700);
    } catch {
      setError("An error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="primary"
        size="md"
        onClick={() => setOpen(true)}
      >
        <Plus size={16} />
        <span>Add Admin</span>
      </Button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg rounded-3xl border border-stone-100 bg-white p-6 shadow-2xl md:p-8 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="btn-icon size-10">
                      <Shield size={20} />
                    </span>
                    <div>
                      <h3 className="heading-md">
                        Add Admin
                      </h3>
                      <p className="text-subtitle">
                        Promote an existing mandal member to Admin
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {successMsg ? (
                  <div className="my-8 rounded-2xl bg-emerald-50 p-6 text-center text-emerald-800 border border-emerald-200">
                    <p className="font-extrabold text-base">{successMsg}</p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {error ? (
                      <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                        {error}
                      </div>
                    ) : null}

                    <div>
                      <label className="input-label">
                        Search Member *
                      </label>
                      <div className="relative">
                        <Search
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Type member name or mobile..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="input-base pl-9 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="input-label">
                        Select Member ({filteredMembers.length} available)
                      </label>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-2xl border border-stone-200 p-2">
                        {filteredMembers.length === 0 ? (
                          <p className="p-4 text-center text-xs text-stone-400 font-medium">
                            No eligible members found.
                          </p>
                        ) : (
                          filteredMembers.map((m) => {
                            const isSelected = selectedMemberId === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setSelectedMemberId(m.id)}
                                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs transition cursor-pointer ${
                                  isSelected
                                    ? "bg-violet-50 font-bold text-brand border border-violet-200"
                                    : "hover:bg-stone-50 text-stone-700"
                                }`}
                              >
                                <div>
                                  <span className="font-bold text-[#24203a]">{m.name}</span>
                                  <span className="ml-2 text-stone-400">
                                    {m.mobile}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <span className="rounded-full bg-brand p-1 text-white">
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
                      <label className="input-label">
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

                    <div className="mt-6 flex justify-end gap-2.5 border-t border-stone-100 pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handlePromote}
                        disabled={submitting || !selectedMemberId}
                        loading={submitting}
                      >
                        Confirm Add Admin
                      </Button>
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

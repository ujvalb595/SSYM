"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { Crown, ExternalLink, MoreHorizontal, Shield, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface RoleDialogConfig {
  newRole: Role;
  title: string;
  description: string;
  confirmText: string;
  variant: "danger" | "warning" | "info";
  icon?: React.ReactNode;
}

export function AdminRowActions({
  admin,
  currentUserId,
  currentUserRole,
}: {
  admin: {
    id: string;
    name: string;
    mobile: string;
    role: Role;
  };
  currentUserId: string;
  currentUserRole: Role;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number; openUpwards: boolean } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<RoleDialogConfig | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;
  const isSelf = currentUserId === admin.id;

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!open) {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 200;

      setCoords({
        top: openUpwards ? rect.top - 4 : rect.bottom + 4,
        right: Math.max(8, window.innerWidth - rect.right),
        openUpwards,
      });
    }
    setOpen((prev) => !prev);
  };

  const handleInitiateRoleChange = (newRole: Role) => {
    if (isSelf) {
      toast.error("You cannot change your own role from this panel.");
      return;
    }

    setOpen(false);

    if (newRole === Role.USER) {
      setConfirmConfig({
        newRole,
        title: "Demote to Regular Member",
        description: `Are you sure you want to demote ${admin.name} to a regular Member? They will lose all administrative privileges.`,
        confirmText: "Demote Member",
        variant: "danger",
        icon: <UserMinus size={22} className="text-rose-600" />,
      });
    } else if (newRole === Role.SUPER_ADMIN) {
      setConfirmConfig({
        newRole,
        title: "Promote to Super Admin",
        description: `Are you sure you want to promote ${admin.name} to Super Admin? This user will have full access to manage all aspects of the Mandal.`,
        confirmText: "Promote to Super Admin",
        variant: "warning",
        icon: <Crown size={22} className="text-amber-600" />,
      });
    } else {
      setConfirmConfig({
        newRole,
        title: "Set as Mandal Admin",
        description: `Change ${admin.name}'s role to Mandal Admin?`,
        confirmText: "Update Role",
        variant: "info",
        icon: <Shield size={22} className="text-[#7257f4]" />,
      });
    }
  };

  async function handleConfirmRoleChange() {
    if (!confirmConfig) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/members/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: admin.name,
          mobile: admin.mobile,
          role: confirmConfig.newRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Failed to update admin role.");
        setLoading(false);
        return;
      }

      toast.success(
        confirmConfig.newRole === Role.USER
          ? `${admin.name} demoted to Member.`
          : `${admin.name} promoted successfully!`
      );
      setConfirmConfig(null);
      setLoading(false);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleToggle}
        className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && mounted && coords
        ? createPortal(
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
              />
              <div
                style={{
                  top: coords.openUpwards ? undefined : `${coords.top}px`,
                  bottom: coords.openUpwards ? `${window.innerHeight - coords.top}px` : undefined,
                  right: `${coords.right}px`,
                }}
                className="fixed z-[95] w-48 rounded-xl border border-stone-100 bg-white py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
              >
                <Link
                  href={`/members/${admin.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-violet-50 hover:text-[#7257f4]"
                >
                  <ExternalLink size={15} />
                  View Profile
                </Link>

                {isSuperAdmin && !isSelf ? (
                  <>
                    <div className="my-1 border-t border-stone-100" />
                    {admin.role !== Role.SUPER_ADMIN ? (
                      <button
                        type="button"
                        onClick={() => handleInitiateRoleChange(Role.SUPER_ADMIN)}
                        disabled={loading}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 text-left cursor-pointer disabled:opacity-50"
                      >
                        <Crown size={15} />
                        Promote to Super Admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInitiateRoleChange(Role.ADMIN)}
                        disabled={loading}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 text-left cursor-pointer disabled:opacity-50"
                      >
                        <Shield size={15} />
                        Set as Mandal Admin
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleInitiateRoleChange(Role.USER)}
                      disabled={loading}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer disabled:opacity-50"
                    >
                      <UserMinus size={15} />
                      Demote to Member
                    </button>
                  </>
                ) : null}
              </div>
            </>,
            document.body
          )
        : null}

      {confirmConfig && (
        <ConfirmDialog
          open={!!confirmConfig}
          onClose={() => setConfirmConfig(null)}
          onConfirm={handleConfirmRoleChange}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmText={confirmConfig.confirmText}
          cancelText="Cancel"
          variant={confirmConfig.variant}
          icon={confirmConfig.icon}
          loading={loading}
        />
      )}
    </>
  );
}

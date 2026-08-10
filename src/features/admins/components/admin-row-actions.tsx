"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { Crown, ExternalLink, MoreHorizontal, Shield, UserMinus } from "lucide-react";

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

  async function handleRoleChange(newRole: Role) {
    if (isSelf) {
      alert("You cannot change your own role from this panel.");
      return;
    }

    const confirmMsg =
      newRole === Role.USER
        ? `Are you sure you want to demote ${admin.name} to a regular Member?`
        : `Promote ${admin.name} to Super Admin?`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/members/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: admin.name,
          mobile: admin.mobile,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to update admin role.");
        setLoading(false);
        return;
      }

      setOpen(false);
      setLoading(false);
      router.refresh();
    } catch {
      alert("Network error.");
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
                        onClick={() => handleRoleChange(Role.SUPER_ADMIN)}
                        disabled={loading}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 text-left"
                      >
                        <Crown size={15} />
                        Promote to Super Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(Role.ADMIN)}
                        disabled={loading}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 text-left"
                      >
                        <Shield size={15} />
                        Set as Mandal Admin
                      </button>
                    )}

                    <button
                      onClick={() => handleRoleChange(Role.USER)}
                      disabled={loading}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
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
    </>
  );
}

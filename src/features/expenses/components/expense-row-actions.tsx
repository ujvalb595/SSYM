"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { MoreHorizontal, Trash2 } from "lucide-react";

export function ExpenseRowActions({
  expense,
  currentUserRole,
  onDeleteSuccess,
}: {
  expense: {
    id: string;
    title: string;
    createdById: string;
  };
  currentUserId?: string;
  currentUserRole: Role;
  onDeleteSuccess?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number; openUpwards: boolean } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = currentUserRole === Role.SUPER_ADMIN || currentUserRole === Role.ADMIN;
  const canDelete = isAdmin;

  if (!canDelete) return null;

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!open) {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 180;

      setCoords({
        top: openUpwards ? rect.top - 4 : rect.bottom + 4,
        right: Math.max(8, window.innerWidth - rect.right),
        openUpwards,
      });
    }
    setOpen((prev) => !prev);
  };

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the expense "${expense.title}"?`)) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to delete expense.");
        setLoading(false);
        return;
      }

      setOpen(false);
      setLoading(false);
      if (onDeleteSuccess) {
        onDeleteSuccess(expense.id);
      }
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
                className="fixed z-[95] w-44 rounded-xl border border-stone-100 bg-white py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {loading ? "Deleting..." : "Delete Expense"}
                </button>
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
}

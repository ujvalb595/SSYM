"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteMemberDialog({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete member.");
        setLoading(false);
        return;
      }

      toast.success(`Member "${memberName}" deleted successfully.`);
      setOpen(false);
      setLoading(false);
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred while deleting member.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${memberName}`}
        title="Delete member"
        className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 cursor-pointer"
      >
        <Trash2 size={17} />
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete Member"
        description={`Are you sure you want to delete member "${memberName}"? This action cannot be undone and will permanently remove their profile.`}
        confirmText="Delete Member"
        cancelText="Cancel"
        variant="danger"
        loading={loading}
      />
    </>
  );
}

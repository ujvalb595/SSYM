"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  if (!open || !mounted) return null;

  const variantStyles = {
    danger: {
      iconBg: "bg-rose-50 border border-rose-200 text-rose-600",
      buttonVariant: "danger" as const,
      icon: <Trash2 size={22} />,
    },
    warning: {
      iconBg: "bg-amber-50 border border-amber-200 text-amber-600",
      buttonVariant: "primary" as const,
      icon: <AlertTriangle size={22} />,
    },
    info: {
      iconBg: "bg-violet-50 border border-violet-200 text-[#7257f4]",
      buttonVariant: "primary" as const,
      icon: <AlertTriangle size={22} />,
    },
  }[variant];

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl border border-stone-100 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Icon & Close */}
        <div className="flex items-start justify-between">
          <div className={`flex size-12 items-center justify-center rounded-2xl ${variantStyles.iconBg}`}>
            {variantStyles.icon}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-[#24203a] tracking-tight">{title}</h3>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variantStyles.buttonVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

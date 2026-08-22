"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        "bg-gradient-to-r from-[#7257f4] to-[#bd59ec] text-white shadow-md shadow-violet-200/60 hover:opacity-95 active:scale-95 font-bold",
      accent:
        "bg-[#7257f4] text-white hover:bg-[#5f44e2] shadow-md shadow-violet-200/50 active:scale-95 font-bold",
      secondary:
        "border border-stone-200 bg-white text-stone-700 hover:bg-violet-50/50 hover:text-[#7257f4] hover:border-violet-200 active:scale-95 font-semibold",
      danger:
        "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 font-bold",
      ghost:
        "text-stone-600 hover:bg-violet-50 hover:text-[#7257f4] active:scale-95 font-semibold",
    }[variant];

    const sizeStyles = {
      sm: "px-3.5 py-1.5 text-xs rounded-xl",
      md: "px-5 py-2.5 text-xs sm:text-sm rounded-2xl",
      lg: "px-6 py-3 text-sm rounded-2xl",
      icon: "size-9 p-2 rounded-xl justify-center",
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`inline-flex items-center gap-2 justify-center transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {loading && <Loader2 size={15} className="animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  name?: string;
  options: SelectOption[];
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  icon?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md" | "default";
  className?: string;
  dropdownClassName?: string;
  align?: "left" | "right";
  onChange?: (value: string) => void;
}

export function CustomSelect({
  name,
  options,
  defaultValue = "",
  value,
  placeholder = "Select option",
  icon,
  disabled = false,
  size = "default",
  className = "",
  dropdownClassName = "",
  align = "left",
  onChange,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(value !== undefined ? value : defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelected(value);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === selected);

  const handleSelect = (val: string) => {
    if (disabled) return;
    setSelected(val);
    if (onChange) onChange(val);
    setOpen(false);
  };

  const isSm = size === "sm";
  const isMd = size === "md";

  const heightClass = isSm ? "h-8 text-xs py-1" : isMd ? "h-9.5 text-xs py-1.5" : "h-11 text-sm py-2";
  const paddingLeftClass = icon ? (isSm ? "pl-8" : "pl-10") : isSm ? "pl-2.5" : "pl-3.5";
  const paddingRightClass = isSm ? "pr-7" : "pr-9";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {name && <input type="hidden" name={name} value={selected} />}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`${heightClass} ${paddingLeftClass} ${paddingRightClass} w-full cursor-pointer rounded-xl border border-[#e8e3f2] bg-white font-medium text-[#24203a] outline-none transition hover:border-[#bd59ec] focus:border-[#8660ee] focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-stone-100 flex items-center justify-between text-left`}
      >
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            {icon}
          </span>
        )}

        <span className={`truncate ${selectedOption ? "text-[#24203a] font-semibold" : "text-stone-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 transition-transform duration-200 ${
            open ? "rotate-180 text-[#7257f4]" : ""
          }`}
          size={isSm ? 13 : 15}
        />
      </button>

      {open && !disabled && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full z-[100] mt-1.5 max-h-56 min-w-[140px] w-full overflow-y-auto rounded-2xl border border-stone-100 bg-white/95 p-1.5 shadow-[0_16px_40px_rgb(77_55_135_/_0.22)] backdrop-blur-md animate-in fade-in zoom-in-95 space-y-0.5 no-scrollbar ${dropdownClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === selected;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-[#7257f4] to-[#bd59ec] text-white shadow-xs"
                    : "text-stone-700 hover:bg-violet-50 hover:text-[#7257f4]"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={14} className="text-white shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

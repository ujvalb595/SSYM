"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function CustomSelect({
  name,
  options,
  defaultValue = "",
  placeholder = "Select option",
  icon,
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === selected);

  const handleSelect = (val: string) => {
    if (disabled) return;
    setSelected(val);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input type="hidden" name={name} value={selected} />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="h-11 w-full cursor-pointer rounded-xl border border-[#e8e3f2] bg-white pl-10 pr-10 text-sm font-medium text-[#24203a] outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-stone-100 flex items-center justify-between text-left"
      >
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
            {icon}
          </span>
        )}

        <span className={selectedOption ? "text-[#24203a] font-semibold" : "text-stone-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 transition-transform ${
            open ? "rotate-180 text-[#7257f4]" : ""
          }`}
          size={16}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-white bg-white/95 p-1.5 shadow-[0_20px_50px_rgb(77_55_135_/_0.18)] backdrop-blur-md animate-in fade-in zoom-in-95 space-y-1">
          {options.map((opt) => {
            const isSelected = opt.value === selected;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-gradient-to-r from-[#7257f4] to-[#a858ef] text-white shadow-md shadow-violet-200"
                    : "text-stone-700 hover:bg-violet-50 hover:text-[#7257f4]"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={16} className="text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

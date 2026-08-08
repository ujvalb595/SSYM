"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown, X } from "lucide-react";

export interface MonthOption {
  label: string; // e.g. "Oct 2025"
  value: string; // e.g. "2025-10"
  disabled?: boolean;
  disabledReason?: string;
}

interface MonthMultiSelectProps {
  options: MonthOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MonthMultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select months",
}: MonthMultiSelectProps) {
  const [open, setOpen] = useState(false);
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

  const toggleOption = (val: string) => {
    const targetOpt = options.find((o) => o.value === val);
    if (targetOpt?.disabled) return;

    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const selectAll = () => {
    const availableValues = options.filter((o) => !o.disabled).map((o) => o.value);
    onChange(availableValues);
  };

  const clearAll = () => {
    onChange([]);
  };

  // Label display logic
  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.label);

  let displayText = placeholder;
  if (selectedLabels.length === 1) {
    displayText = selectedLabels[0];
  } else if (selectedLabels.length > 1) {
    displayText = `${selectedLabels.length} Months Selected (${selectedLabels.join(", ")})`;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-11 w-full cursor-pointer rounded-xl border border-[#e8e3f2] bg-white pl-10 pr-10 text-sm font-medium text-[#24203a] outline-none transition focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100 flex items-center justify-between text-left overflow-hidden"
      >
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
          <Calendar size={18} />
        </span>

        <span className={`truncate ${selectedValues.length > 0 ? "text-[#24203a] font-semibold" : "text-stone-400"}`}>
          {displayText}
        </span>

        <ChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 transition-transform ${
            open ? "rotate-180 text-[#7257f4]" : ""
          }`}
          size={16}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-72 w-full overflow-hidden rounded-2xl border border-white bg-white/95 shadow-[0_20px_50px_rgb(77_55_135_/_0.18)] backdrop-blur-md animate-in fade-in zoom-in-95 flex flex-col">
          {/* Action Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-3.5 py-2 text-xs font-semibold text-stone-500">
            <span>{selectedValues.length} selected</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[#7257f4] hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-stone-400 hover:text-stone-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1.5 space-y-1 max-h-56">
            {options.map((opt) => {
              const isSelected = selectedValues.includes(opt.value);
              const isDisabled = Boolean(opt.disabled);

              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && toggleOption(opt.value)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    isDisabled
                      ? "cursor-not-allowed bg-stone-100/80 text-stone-400 opacity-60"
                      : isSelected
                      ? "cursor-pointer bg-gradient-to-r from-[#7257f4] to-[#a858ef] text-white shadow-md shadow-violet-200"
                      : "cursor-pointer text-stone-700 hover:bg-violet-50 hover:text-[#7257f4]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-4 rounded border flex items-center justify-center transition ${
                        isDisabled
                          ? "border-stone-300 bg-stone-200"
                          : isSelected
                          ? "border-white bg-white/20"
                          : "border-stone-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span>{opt.label}</span>
                  </div>

                  {isDisabled && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-md">
                      {opt.disabledReason || "Done"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

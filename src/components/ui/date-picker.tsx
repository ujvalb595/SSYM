"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  name: string;
  defaultValue?: string; // YYYY-MM-DD
  placeholder?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  name,
  defaultValue = "",
  placeholder = "Select date",
  required = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial date parsing
  const initialDate = defaultValue ? new Date(defaultValue) : null;
  const validInitial = initialDate && !isNaN(initialDate.getTime()) ? initialDate : null;

  const [selectedDate, setSelectedDate] = useState<Date | null>(validInitial);
  const [viewDate, setViewDate] = useState<Date>(validInitial || new Date());

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Navigation helpers
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setViewDate(new Date(newYear, currentMonth, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setViewDate(new Date(currentYear, newMonth, 1));
  };

  const handleSelectDay = (day: number) => {
    const newSelected = new Date(currentYear, currentMonth, day);
    setSelectedDate(newSelected);
    setOpen(false);
  };

  // Calculate days in month & starting offset
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Format YYYY-MM-DD for hidden input
  const formattedIso = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : "";

  // Format display string e.g. "26 Dec 2001"
  const displayString = selectedDate
    ? selectedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  // Generate Year Options (from 1940 to current year + 5)
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1940 + 6 }, (_, i) => 1940 + i).reverse();

  return (
    <div ref={containerRef} className="relative w-full">
      <input type="hidden" name={name} value={formattedIso} required={required} />

      <div
        onClick={() => setOpen((prev) => !prev)}
        className="h-11 w-full cursor-pointer rounded-xl border border-[#e8e3f2] bg-white pl-10 pr-4 text-sm font-medium text-[#24203a] outline-none transition focus-within:border-[#8660ee] focus-within:ring-4 focus-within:ring-violet-100 flex items-center justify-between"
      >
        <CalendarIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <span className={displayString ? "text-[#24203a]" : "text-stone-400"}>
          {displayString || placeholder}
        </span>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white bg-white/95 p-4 shadow-[0_20px_50px_rgb(77_55_135_/_0.2)] backdrop-blur-md animate-in fade-in zoom-in-95">
          {/* Header Controls */}
          <div className="mb-3 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1 text-stone-500 hover:bg-violet-50 hover:text-[#7257f4]"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex gap-1">
              <select
                value={currentMonth}
                onChange={handleMonthChange}
                className="cursor-pointer rounded-lg bg-violet-50/80 px-2 py-1 text-xs font-bold text-[#7257f4] outline-none hover:bg-violet-100"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={handleYearChange}
                className="cursor-pointer rounded-lg bg-violet-50/80 px-2 py-1 text-xs font-bold text-[#7257f4] outline-none hover:bg-violet-100"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1 text-stone-500 hover:bg-violet-50 hover:text-[#7257f4]"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="mb-1 grid grid-cols-7 text-center text-xs font-bold text-stone-400">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
            {/* Blank padding days for week start */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getDate() === dayNum &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`flex h-8 w-full items-center justify-center rounded-xl transition ${
                    isSelected
                      ? "bg-gradient-to-r from-[#7257f4] to-[#a858ef] text-white font-bold shadow-md shadow-violet-200"
                      : "text-stone-700 hover:bg-violet-100 hover:text-[#7257f4]"
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

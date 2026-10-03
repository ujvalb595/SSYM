"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  HeartHandshake,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, ReportDataPayload } from "@/lib/export-excel";
import { exportToPDF } from "@/lib/export-pdf";
import { CustomSelect } from "@/components/ui/custom-select";

export type FilterPeriodType =
  | "this_month"
  | "last_month"
  | "this_year"
  | "all"
  | "last_7_days"
  | "last_30_days"
  | "single_date"
  | "custom_month"
  | "custom_range";

export interface FilterState {
  period: FilterPeriodType;
  month?: number;
  year?: number;
  date?: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  label: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const currentMonthName = MONTH_NAMES[currentMonth - 1];

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DashboardHeaderActions({
  onFilterChange,
}: {
  onFilterChange?: (filter: FilterState) => void;
}) {
  const [filter, setFilter] = useState<FilterState>({
    period: "this_month",
    month: currentMonth,
    year: currentYear,
    label: `${currentMonthName} ${currentYear}`,
  });

  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<"excel" | "pdf" | null>(null);
  const [exportPeriod, setExportPeriod] = useState<FilterPeriodType>("this_month");
  const [mounted, setMounted] = useState(false);

  // Tab mode in filter popover: "presets" | "calendar" | "month_year"
  const [filterTab, setFilterTab] = useState<"presets" | "calendar" | "month_year">("calendar");

  // Calendar Picker States
  const [calendarMode, setCalendarMode] = useState<"single" | "range">("single");
  const [calViewDate, setCalViewDate] = useState<Date>(new Date());
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | null>(new Date());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);

  // Custom Month & Year States
  const [customMonth, setCustomMonth] = useState<number>(currentMonth);
  const [customYear, setCustomYear] = useState<number>(currentYear);

  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    }
    if (filterMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [filterMenuOpen]);

  const handleSelectPreset = (period: FilterPeriodType) => {
    let newFilter: FilterState = { period, label: "All Time" };

    if (period === "this_month") {
      newFilter = {
        period,
        month: currentMonth,
        year: currentYear,
        label: `${currentMonthName} ${currentYear}`,
      };
    } else if (period === "last_month") {
      const prevDate = new Date(currentYear, currentMonth - 2, 1);
      const prevM = prevDate.getMonth() + 1;
      const prevY = prevDate.getFullYear();
      newFilter = {
        period,
        month: prevM,
        year: prevY,
        label: `${MONTH_NAMES[prevM - 1]} ${prevY}`,
      };
    } else if (period === "this_year") {
      newFilter = {
        period,
        year: currentYear,
        label: `Year ${currentYear}`,
      };
    } else if (period === "last_7_days") {
      newFilter = {
        period,
        label: "Last 7 Days",
      };
    } else if (period === "last_30_days") {
      newFilter = {
        period,
        label: "Last 30 Days",
      };
    } else if (period === "all") {
      newFilter = {
        period,
        label: "All Time Records",
      };
    }

    setFilter(newFilter);
    setExportPeriod(period);
    setFilterMenuOpen(false);
    if (onFilterChange) onFilterChange(newFilter);
    toast.success(`Filter applied: ${newFilter.label}`);
  };

  const handleApplyCustomMonth = () => {
    const label = `${MONTH_NAMES[customMonth - 1]} ${customYear}`;
    const newFilter: FilterState = {
      period: "custom_month",
      month: customMonth,
      year: customYear,
      label,
    };
    setFilter(newFilter);
    setExportPeriod("custom_month");
    setFilterMenuOpen(false);
    if (onFilterChange) onFilterChange(newFilter);
    toast.success(`Filter applied: ${label}`);
  };

  // Calendar Day Click Handler
  const handleCalendarDayClick = (dayNum: number) => {
    const clickedDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth(), dayNum);

    if (calendarMode === "single") {
      setSelectedSingleDate(clickedDate);
    } else {
      // Range mode
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(clickedDate);
        setRangeEnd(null);
      } else if (rangeStart && !rangeEnd) {
        if (clickedDate < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(clickedDate);
        } else {
          setRangeEnd(clickedDate);
        }
      }
    }
  };

  const handleApplyCalendarFilter = () => {
    if (calendarMode === "single") {
      if (!selectedSingleDate) {
        toast.error("Please click on a date from the calendar.");
        return;
      }
      const iso = toIsoDate(selectedSingleDate);
      const label = formatDisplayDate(selectedSingleDate);
      const newFilter: FilterState = {
        period: "single_date",
        date: iso,
        startDate: iso,
        endDate: iso,
        label: `Date: ${label}`,
      };
      setFilter(newFilter);
      setExportPeriod("single_date");
      setFilterMenuOpen(false);
      if (onFilterChange) onFilterChange(newFilter);
      toast.success(`Filtered for: ${label}`);
    } else {
      // Range
      if (!rangeStart) {
        toast.error("Please select a start date.");
        return;
      }
      const end = rangeEnd || rangeStart;
      const startIso = toIsoDate(rangeStart);
      const endIso = toIsoDate(end);
      const label = `${formatDisplayDate(rangeStart)} - ${formatDisplayDate(end)}`;
      const newFilter: FilterState = {
        period: "custom_range",
        startDate: startIso,
        endDate: endIso,
        label,
      };
      setFilter(newFilter);
      setExportPeriod("custom_range");
      setFilterMenuOpen(false);
      if (onFilterChange) onFilterChange(newFilter);
      toast.success(`Date Range applied: ${label}`);
    }
  };

  const handleResetFilter = () => {
    handleSelectPreset("this_month");
  };

  const fetchReportData = async (targetPeriod: FilterPeriodType): Promise<ReportDataPayload> => {
    const params = new URLSearchParams();
    params.set("period", targetPeriod);

    if (targetPeriod === "custom_month") {
      params.set("month", String(customMonth));
      params.set("year", String(customYear));
    } else if (targetPeriod === "single_date") {
      const d = filter.date || (selectedSingleDate ? toIsoDate(selectedSingleDate) : toIsoDate(new Date()));
      params.set("date", d);
      params.set("startDate", d);
      params.set("endDate", d);
    } else if (targetPeriod === "custom_range") {
      if (filter.startDate) params.set("startDate", filter.startDate);
      if (filter.endDate) params.set("endDate", filter.endDate);
      else if (rangeStart) {
        params.set("startDate", toIsoDate(rangeStart));
        params.set("endDate", toIsoDate(rangeEnd || rangeStart));
      }
    } else if (targetPeriod === "this_month") {
      params.set("month", String(currentMonth));
      params.set("year", String(currentYear));
    }

    const res = await fetch(`/api/reports/export?${params.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to fetch report data from server");
    }
    const result = await res.json();
    return result as ReportDataPayload;
  };

  const handleDownload = async (format: "excel" | "pdf") => {
    setDownloadingFormat(format);
    try {
      toast.info(`Preparing ${format === "excel" ? "multi-tab Excel spreadsheet" : "PDF statement"}...`);
      const reportData = await fetchReportData(exportPeriod);

      if (format === "excel") {
        exportToExcel(reportData);
        toast.success("Excel report downloaded with 4 tabs! 📊");
      } else {
        exportToPDF(reportData);
        toast.success("PDF financial statement downloaded! 📄");
      }
      setExportModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Calendar Calculation Helpers
  const calYear = calViewDate.getFullYear();
  const calMonth = calViewDate.getMonth();
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const handlePrevCalMonth = () => {
    setCalViewDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextCalMonth = () => {
    setCalViewDate(new Date(calYear, calMonth + 1, 1));
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* 1. FILTER BUTTON & RICH DROPDOWN */}
      <div className="relative" ref={filterMenuRef}>
        <button
          type="button"
          onClick={() => setFilterMenuOpen((prev) => !prev)}
          className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs ${
            filter.period !== "this_month"
              ? "border-[#7257f4] bg-violet-50/70 text-[#7257f4] ring-2 ring-violet-200"
              : "border-stone-200 bg-white text-stone-700 hover:border-[#bd59ec] hover:text-[#7257f4] hover:bg-violet-50/40"
          }`}
        >
          <Filter size={16} className="text-[#7257f4] shrink-0" />
          <span className="max-w-[160px] truncate sm:max-w-none">{filter.label}</span>
          <ChevronDown
            size={14}
            className={`text-stone-400 transition-transform duration-200 ${filterMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {filterMenuOpen && (
          <div className="absolute right-0 top-full z-[80] mt-2 w-80 sm:w-96 rounded-3xl border border-stone-100 bg-white p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header & Mode Tabs */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 mb-3 px-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Filter Data</p>
                <p className="text-[11px] text-stone-500">Pick date, range, or period</p>
              </div>
              {filter.period !== "this_month" && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#7257f4] hover:underline cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-stone-100/70 p-1 rounded-2xl mb-3">
              <button
                type="button"
                onClick={() => setFilterTab("calendar")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition cursor-pointer ${
                  filterTab === "calendar"
                    ? "bg-white text-[#7257f4] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <CalendarIcon size={13} />
                <span>Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("presets")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition cursor-pointer ${
                  filterTab === "presets"
                    ? "bg-white text-[#7257f4] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Sparkles size={13} />
                <span>Presets</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("month_year")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition cursor-pointer ${
                  filterTab === "month_year"
                    ? "bg-white text-[#7257f4] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Layers size={13} />
                <span>Month/Year</span>
              </button>
            </div>

            {/* ======================================================== */}
            {/* TAB 1: INTERACTIVE CALENDAR FILTER */}
            {/* ======================================================== */}
            {filterTab === "calendar" && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Single Date vs Date Range Toggle */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex bg-violet-50/60 p-0.5 rounded-xl border border-violet-100">
                    <button
                      type="button"
                      onClick={() => setCalendarMode("single")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        calendarMode === "single"
                          ? "bg-white text-[#7257f4] shadow-xs"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      Single Date
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarMode("range")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        calendarMode === "range"
                          ? "bg-white text-[#7257f4] shadow-xs"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      Date Range
                    </button>
                  </div>

                  {calendarMode === "range" && (
                    <span className="text-[11px] font-semibold text-stone-400">
                      {!rangeStart
                        ? "Click start date"
                        : !rangeEnd
                        ? "Click end date"
                        : "Range selected"}
                    </span>
                  )}
                </div>

                {/* Calendar View Box */}
                <div className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-3">
                  {/* Calendar Month Header */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={handlePrevCalMonth}
                      className="rounded-lg p-1.5 text-stone-500 hover:bg-violet-100 hover:text-[#7257f4] transition cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-28">
                        <CustomSelect
                          value={String(calMonth)}
                          options={MONTH_NAMES.map((m, i) => ({ label: m, value: String(i) }))}
                          onChange={(val) => setCalViewDate(new Date(calYear, Number(val), 1))}
                          size="sm"
                        />
                      </div>
                      <div className="w-20">
                        <CustomSelect
                          value={String(calYear)}
                          options={[currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4].map((y) => ({
                            label: String(y),
                            value: String(y),
                          }))}
                          onChange={(val) => setCalViewDate(new Date(Number(val), calMonth, 1))}
                          size="sm"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleNextCalMonth}
                      className="rounded-lg p-1.5 text-stone-500 hover:bg-violet-100 hover:text-[#7257f4] transition cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Days of Week */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400 mb-1">
                    {DAYS_OF_WEEK.map((d) => (
                      <span key={d} className="py-0.5">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <span key={`blank-${i}`} />
                    ))}

                    {Array.from({ length: daysInCalMonth }).map((_, i) => {
                      const dayNum = i + 1;

                      let isSelected = false;
                      let isInRange = false;
                      let isRangeBoundary = false;

                      if (calendarMode === "single" && selectedSingleDate) {
                        isSelected =
                          selectedSingleDate.getDate() === dayNum &&
                          selectedSingleDate.getMonth() === calMonth &&
                          selectedSingleDate.getFullYear() === calYear;
                      } else if (calendarMode === "range") {
                        if (rangeStart && !rangeEnd) {
                          isRangeBoundary =
                            rangeStart.getDate() === dayNum &&
                            rangeStart.getMonth() === calMonth &&
                            rangeStart.getFullYear() === calYear;
                        } else if (rangeStart && rangeEnd) {
                          const startDay = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
                          const endDay = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
                          const currentDay = new Date(calYear, calMonth, dayNum);

                          isRangeBoundary =
                            currentDay.getTime() === startDay.getTime() ||
                            currentDay.getTime() === endDay.getTime();
                          isInRange =
                            currentDay.getTime() > startDay.getTime() &&
                            currentDay.getTime() < endDay.getTime();
                        }
                      }

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => handleCalendarDayClick(dayNum)}
                          className={`flex h-7 w-full items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                            isSelected || isRangeBoundary
                              ? "bg-gradient-to-r from-[#7257f4] to-[#bd59ec] text-white font-bold shadow-xs"
                              : isInRange
                              ? "bg-violet-100 text-[#7257f4] font-medium"
                              : "text-stone-700 hover:bg-violet-100 hover:text-[#7257f4]"
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Status & Apply Button */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-stone-400">Selected</p>
                    <p className="text-xs font-bold text-[#24203a] truncate">
                      {calendarMode === "single"
                        ? selectedSingleDate
                          ? formatDisplayDate(selectedSingleDate)
                          : "None"
                        : rangeStart
                        ? `${formatDisplayDate(rangeStart)}${rangeEnd ? ` → ${formatDisplayDate(rangeEnd)}` : " (Select end)"}`
                        : "None"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCalendarFilter}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-[#7257f4] to-[#bd59ec] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-200 hover:opacity-95 transition cursor-pointer"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: PRESETS */}
            {/* ======================================================== */}
            {filterTab === "presets" && (
              <div className="space-y-1 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => handleSelectPreset("this_month")}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    filter.period === "this_month"
                      ? "bg-violet-50 text-[#7257f4] font-bold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-[#7257f4]" />
                    <span>This Month ({currentMonthName} {currentYear})</span>
                  </div>
                  {filter.period === "this_month" && <Check size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset("last_month")}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    filter.period === "last_month"
                      ? "bg-violet-50 text-[#7257f4] font-bold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-stone-400" />
                    <span>Last Month</span>
                  </div>
                  {filter.period === "last_month" && <Check size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset("last_7_days")}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    filter.period === "last_7_days"
                      ? "bg-violet-50 text-[#7257f4] font-bold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-stone-400" />
                    <span>Last 7 Days</span>
                  </div>
                  {filter.period === "last_7_days" && <Check size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset("last_30_days")}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    filter.period === "last_30_days"
                      ? "bg-violet-50 text-[#7257f4] font-bold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-stone-400" />
                    <span>Last 30 Days</span>
                  </div>
                  {filter.period === "last_30_days" && <Check size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset("this_year")}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    filter.period === "this_year"
                      ? "bg-violet-50 text-[#7257f4] font-bold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-stone-400" />
                    <span>This Year ({currentYear})</span>
                  </div>
                  {filter.period === "this_year" && <Check size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset("all")}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    filter.period === "all"
                      ? "bg-violet-50 text-[#7257f4] font-bold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-stone-400" />
                    <span>All Time (Complete History)</span>
                  </div>
                  {filter.period === "all" && <Check size={14} />}
                </button>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: MONTH & YEAR */}
            {/* ======================================================== */}
            {filterTab === "month_year" && (
              <div className="space-y-3 p-1 animate-in fade-in duration-150">
                <p className="text-xs text-stone-500">
                  Select a specific month and year to audit records.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Month</label>
                    <CustomSelect
                      value={String(customMonth)}
                      options={MONTH_NAMES.map((m, i) => ({ label: m, value: String(i + 1) }))}
                      onChange={(val) => setCustomMonth(Number(val))}
                      size="md"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Year</label>
                    <CustomSelect
                      value={String(customYear)}
                      options={[currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5].map((y) => ({
                        label: String(y),
                        value: String(y),
                      }))}
                      onChange={(val) => setCustomYear(Number(val))}
                      size="md"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustomMonth}
                  className="w-full rounded-xl bg-gradient-to-r from-[#7257f4] to-[#bd59ec] py-2 text-xs font-bold text-white shadow-md shadow-violet-200 hover:opacity-95 transition cursor-pointer"
                >
                  Apply Month Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. DOWNLOAD / EXPORT BUTTON */}
      <button
        type="button"
        onClick={() => setExportModalOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7257f4] to-[#bd59ec] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-violet-200 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
      >
        <Download size={16} />
        <span>Export Report</span>
      </button>

      {/* 3. EXPORT MODAL */}
      {exportModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-stone-100 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#7257f4] to-[#bd59ec] text-white shadow-md shadow-violet-200/50">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#24203a] tracking-tight">Download Financial Report</h3>
                  <p className="text-xs text-stone-500">
                    Export Payments, Donations, Expenses & Global Summary
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                disabled={downloadingFormat !== null}
                className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scope / Filter Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Report Scope / Period
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: "this_month", label: "This Month" },
                  { key: "last_month", label: "Last Month" },
                  { key: "this_year", label: `Year ${currentYear}` },
                  { key: "all", label: "All Time" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setExportPeriod(item.key as FilterPeriodType)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-bold transition cursor-pointer text-center ${
                      exportPeriod === item.key
                        ? "border-[#7257f4] bg-violet-50 text-[#7257f4] shadow-xs"
                        : "border-stone-200 bg-stone-50/70 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sheet Tabs Preview Box */}
            <div className="rounded-2xl border border-violet-100 bg-[#faf8fe] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#24203a] flex items-center gap-1.5">
                  <Layers size={15} className="text-[#7257f4]" />
                  Included in Document:
                </span>
                <span className="badge-brand">Multi-Tab Format</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-xl bg-white p-2 border border-violet-50 text-stone-700 font-medium">
                  <TrendingUp size={14} className="text-violet-600 shrink-0" />
                  <span>1. Global Summary & Totals</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white p-2 border border-violet-50 text-stone-700 font-medium">
                  <CreditCard size={14} className="text-blue-600 shrink-0" />
                  <span>2. Member Payments</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white p-2 border border-violet-50 text-stone-700 font-medium">
                  <HeartHandshake size={14} className="text-fuchsia-600 shrink-0" />
                  <span>3. Community Donations</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white p-2 border border-violet-50 text-stone-700 font-medium">
                  <Receipt size={14} className="text-rose-600 shrink-0" />
                  <span>4. Expenses & Bills</span>
                </div>
              </div>
            </div>

            {/* Download Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Excel Download Button */}
              <button
                type="button"
                onClick={() => handleDownload("excel")}
                disabled={downloadingFormat !== null}
                className="group relative flex flex-col items-start gap-2.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 text-left hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    {downloadingFormat === "excel" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <FileSpreadsheet size={20} />
                    )}
                  </span>
                  <span className="rounded-full bg-emerald-200/60 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide">
                    .XLSX
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950">Excel Workbook</h4>
                  <p className="text-[11px] text-emerald-700/90 mt-0.5 leading-snug">
                    Multi-tab spreadsheet with live totals & clean cell styling
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  <span>Download Excel</span>
                  <ArrowRight size={13} />
                </div>
              </button>

              {/* PDF Download Button */}
              <button
                type="button"
                onClick={() => handleDownload("pdf")}
                disabled={downloadingFormat !== null}
                className="group relative flex flex-col items-start gap-2.5 rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-4 text-left hover:border-[#7257f4] hover:bg-violet-50 hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#7257f4] text-white shadow-xs">
                    {downloadingFormat === "pdf" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <FileText size={20} />
                    )}
                  </span>
                  <span className="rounded-full bg-violet-200/60 px-2 py-0.5 text-[10px] font-extrabold text-violet-800 uppercase tracking-wide">
                    .PDF
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-violet-950">PDF Statement</h4>
                  <p className="text-[11px] text-violet-700/90 mt-0.5 leading-snug">
                    Print-ready official audit report with summary & branded header
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#7257f4] group-hover:translate-x-1 transition-transform">
                  <span>Download PDF</span>
                  <ArrowRight size={13} />
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

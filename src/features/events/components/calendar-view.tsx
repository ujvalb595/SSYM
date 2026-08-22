"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isAfter,
  startOfDay,
  addDays,
  subDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Clock,
  MapPin,
  ArrowRight,
  CalendarDays,
  LayoutGrid,
  List,
  CalendarRange,
  Cake,
} from "lucide-react";
import { CalendarEvent } from "@/lib/google-calendar";
import { fetchEventsAction } from "@/lib/actions/events";
import { EventDialog } from "./event-dialog";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";

interface CalendarViewProps {
  isAdmin: boolean;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  meeting: {
    bg: "bg-violet-50",
    text: "text-[#7257f4]",
    border: "border-violet-200",
    dot: "bg-[#7257f4]",
    label: "Meeting",
  },
  celebration: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Celebration",
  },
  important: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    label: "Important",
  },
  community: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    label: "Community",
  },
  general: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "General",
  },
};

let globalCalendarEventsCache: CalendarEvent[] | null = null;

export function CalendarView({ isAdmin }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">("month");
  const [events, setEvents] = useState<CalendarEvent[]>(() => globalCalendarEventsCache || []);
  const [, setLoading] = useState<boolean>(() => !globalCalendarEventsCache);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Load events dynamically
  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent && !globalCalendarEventsCache) setLoading(true);
      const eventsData = await fetchEventsAction(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1),
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0)
      );
      globalCalendarEventsCache = eventsData;
      setEvents(eventsData);
    } catch (err) {
      console.error("Error dynamically loading calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadData();

    // Auto-refresh when tab gains focus or on periodic 30s timer for live updates
    const handleFocus = () => loadData(true);
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(() => loadData(true), 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [loadData]);

  // Calendar Day Intervals
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Week Days
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (viewMode === "week") {
      setSelectedDate((prev) => subDays(prev, 7));
      setCurrentDate((prev) => subDays(prev, 7));
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (viewMode === "week") {
      setSelectedDate((prev) => addDays(prev, 7));
      setCurrentDate((prev) => addDays(prev, 7));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        searchQuery === "" ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" ||
        event.category === selectedCategory ||
        (selectedCategory === "celebration" && event.isBirthday);

      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory]);

  // Selected Day Events
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((event) => isSameDay(new Date(event.start), selectedDate));
  }, [filteredEvents, selectedDate]);

  // Upcoming Events (Next 30 days)
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return filteredEvents
      .filter((event) => isAfter(new Date(event.start), today) || isSameDay(new Date(event.start), today))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [filteredEvents]);

  // Quick action for creating event
  const handleOpenCreateForDate = (date: Date) => {
    if (!isAdmin) return;
    const start = new Date(date);
    start.setHours(10, 0, 0, 0);
    const end = new Date(date);
    end.setHours(11, 30, 0, 0);

    setSelectedEvent({
      id: "",
      title: "",
      start,
      end,
      description: "",
      location: "",
      category: "general",
    });
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    if (!isAdmin) return;
    const start = new Date(selectedDate);
    start.setHours(new Date().getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1, 30, 0, 0);

    setSelectedEvent({
      id: "",
      title: "",
      start,
      end,
      description: "",
      location: "",
      category: "general",
    });
    setDialogOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const weekHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="card-base p-5 sm:p-7 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="heading-xl">
              Calendar
            </h1>
            <p className="text-subtitle">
              Synchronized organizational schedule, events, and community member birthdays
            </p>
          </div>

          {/* Action buttons */}
          {isAdmin && (
            <div className="flex items-center gap-2.5">
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateNew}
              >
                <Plus size={17} />
                <span>Create Event</span>
              </Button>
            </div>
          )}
        </div>

        {/* View mode switcher & search bar */}
        <div className="flex flex-col gap-3 pt-4 border-t border-stone-100 sm:flex-row sm:items-center sm:justify-between">
          {/* View Mode Pills */}
          <div className="flex items-center gap-1 bg-stone-100/80 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === "month" ? "bg-white text-brand shadow-xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <LayoutGrid size={15} />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === "week" ? "bg-white text-brand shadow-xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <CalendarRange size={15} />
              <span>Week</span>
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === "agenda" ? "bg-white text-brand shadow-xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <List size={15} />
              <span>Agenda</span>
            </button>
          </div>

          {/* Search and Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
              <input
                type="text"
                placeholder="Search events or birthdays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base pl-9 text-xs"
              />
            </div>

            <div className="w-40 sm:w-48">
              <CustomSelect
                name="categoryFilter"
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={[
                  { label: "All Categories", value: "all" },
                  { label: "Meetings", value: "meeting" },
                  { label: "Celebrations & Birthdays", value: "celebration" },
                  { label: "Important Camps", value: "important" },
                  { label: "Community Events", value: "community" },
                  { label: "General", value: "general" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar (Left) + Inspector Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar Views */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-base p-4 sm:p-6 space-y-4">
            {/* Calendar Controls (Nav buttons, Month Header) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToday}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-brand hover:bg-violet-50/60 transition cursor-pointer"
                >
                  Today
                </button>
                <div className="flex items-center bg-stone-100 rounded-xl p-0.5">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous"
                    className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-stone-900 transition cursor-pointer"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next"
                    className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-stone-900 transition cursor-pointer"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
                <h2 className="heading-md ml-1">
                  {viewMode === "month"
                    ? format(currentDate, "MMMM yyyy")
                    : viewMode === "week"
                    ? `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} - ${format(
                        endOfWeek(selectedDate, { weekStartsOn: 1 }),
                        "MMM d, yyyy"
                      )}`
                    : `Schedule for ${format(currentDate, "yyyy")}`}
                </h2>
              </div>

              {/* Day details helper tag */}
              <div className="text-xs font-semibold text-stone-400">
                Selected: <span className="text-stone-700 font-bold">{format(selectedDate, "EEE, MMM d")}</span>
              </div>
            </div>

            {/* MONTH VIEW */}
            {viewMode === "month" && (
              <div className="space-y-2">
                {/* Weekday labels */}
                <div className="grid grid-cols-7 text-center pb-2 border-b border-stone-100">
                  {weekHeaders.map((day) => (
                    <div key={day} className="text-xs sm:text-sm font-semibold text-stone-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 rounded-2xl border border-stone-100 overflow-hidden">
                  {calendarDays.map((day, idx) => {
                    const dayIsCurrentMonth = isSameMonth(day, currentDate);
                    const dayIsToday = isToday(day);
                    const isDaySelected = isSameDay(day, selectedDate);
                    const dayEvents = filteredEvents.filter((event) => isSameDay(new Date(event.start), day));

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        onDoubleClick={() => handleOpenCreateForDate(day)}
                        className={`group relative min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 transition-all cursor-pointer ${
                          dayIsCurrentMonth ? "bg-white" : "bg-stone-50/40 text-stone-300"
                        } ${isDaySelected ? "ring-2 ring-[#7257f4] ring-inset bg-violet-50/20" : "hover:bg-stone-50/80"}`}
                      >
                        {/* Day number */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold ${
                              dayIsToday
                                ? "flex size-6 sm:size-7 items-center justify-center rounded-full bg-gradient-to-r from-[#7257f4] to-[#bd59ec] font-bold text-white shadow-sm shadow-violet-300/40"
                                : dayIsCurrentMonth
                                ? "text-stone-700 px-1"
                                : "text-stone-300 px-1"
                            }`}
                          >
                            {format(day, "d")}
                          </span>

                          {/* Quick add for admin */}
                          {isAdmin && dayIsCurrentMonth && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreateForDate(day);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-brand hover:bg-violet-100 rounded-md transition cursor-pointer"
                              title="Add event on this day"
                            >
                              <Plus size={13} />
                            </button>
                          )}
                        </div>

                        {/* Events list in cell */}
                        <div className="mt-1.5 space-y-1 max-h-[60px] sm:max-h-[70px] overflow-y-auto no-scrollbar">
                          {dayEvents.slice(0, 3).map((evt) => {
                            const catStyle =
                              CATEGORY_STYLES[evt.category || "general"] || CATEGORY_STYLES.general;
                            return (
                              <div
                                key={evt.id || evt.title}
                                onClick={(e) => handleEventClick(e, evt)}
                                className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium transition cursor-pointer truncate ${catStyle.bg} ${catStyle.text} ${catStyle.border} hover:brightness-95`}
                                title={`${evt.title} (${format(new Date(evt.start), "p")})`}
                              >
                                {evt.isBirthday ? (
                                  <Cake size={11} className="shrink-0 text-amber-600" />
                                ) : (
                                  <span className={`size-1.5 shrink-0 rounded-full ${catStyle.dot}`} />
                                )}
                                <span className="truncate">{evt.title}</span>
                              </div>
                            );
                          })}

                          {dayEvents.length > 3 && (
                            <div className="text-[10px] font-bold text-brand pl-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEK VIEW */}
            {viewMode === "week" && (
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, idx) => {
                    const isDayToday = isToday(day);
                    const isDaySelected = isSameDay(day, selectedDate);
                    const dayEvents = filteredEvents.filter((event) => isSameDay(new Date(event.start), day));

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        className={`rounded-2xl border p-2.5 text-center transition cursor-pointer ${
                          isDaySelected
                            ? "border-[#7257f4] bg-violet-50/30 shadow-xs"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <p className="text-caption">
                          {format(day, "EEE")}
                        </p>
                        <p
                          className={`mt-1 text-sm sm:text-base font-bold ${
                            isDayToday
                              ? "mx-auto flex size-7 items-center justify-center rounded-full bg-gradient-to-r from-[#7257f4] to-[#bd59ec] text-white shadow-xs"
                              : "text-[#24203a]"
                          }`}
                        >
                          {format(day, "d")}
                        </p>
                        <div className="mt-2 flex justify-center gap-1">
                          {dayEvents.slice(0, 3).map((e, i) => (
                            <span
                              key={i}
                              className={`size-1.5 rounded-full ${
                                e.isBirthday
                                  ? "bg-amber-500"
                                  : (CATEGORY_STYLES[e.category || "general"] || CATEGORY_STYLES.general).dot
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Day Timeline for Week View */}
                <div className="mt-4 rounded-2xl border border-stone-100 bg-stone-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-caption text-stone-700">
                      Events for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </h3>
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenCreateForDate(selectedDate)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-[#583ccf] cursor-pointer"
                      >
                        <Plus size={14} /> Add for this day
                      </button>
                    )}
                  </div>

                  {selectedDayEvents.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400 font-medium">
                      No events scheduled for this day.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayEvents.map((evt) => {
                        const catStyle =
                          CATEGORY_STYLES[evt.category || "general"] || CATEGORY_STYLES.general;
                        return (
                          <div
                            key={evt.id || evt.title}
                            onClick={(e) => handleEventClick(e, evt)}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-violet-200 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex size-10 items-center justify-center rounded-xl font-bold text-xs ${catStyle.bg} ${catStyle.text}`}
                              >
                                {evt.isBirthday ? <Cake size={18} /> : format(new Date(evt.start), "HH:mm")}
                              </div>
                              <div>
                                <h4 className="heading-sm">{evt.title}</h4>
                                <p className="text-[11px] text-stone-500">
                                  {evt.isBirthday
                                    ? "All Day Annual Birthday Celebration"
                                    : `${format(new Date(evt.start), "h:mm a")} - ${format(
                                        new Date(evt.end),
                                        "h:mm a"
                                      )}`}
                                  {evt.location ? ` • ${evt.location}` : ""}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                            >
                              {evt.isBirthday ? "Birthday" : catStyle.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AGENDA VIEW */}
            {viewMode === "agenda" && (
              <div className="space-y-3">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center text-xs sm:text-sm text-stone-400 font-medium">
                    No scheduled events found matching your search.
                  </div>
                ) : (
                  filteredEvents.map((evt) => {
                    const catStyle =
                      CATEGORY_STYLES[evt.category || "general"] || CATEGORY_STYLES.general;
                    const eventDate = new Date(evt.start);

                    return (
                      <div
                        key={evt.id || evt.title}
                        onClick={(e) => handleEventClick(e, evt)}
                        className="group card-interactive flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-violet-50 font-bold text-brand">
                            <span className="text-[9px] uppercase tracking-wider">
                              {format(eventDate, "MMM")}
                            </span>
                            <span className="text-base leading-none">{format(eventDate, "d")}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="heading-sm group-hover:text-brand transition">
                                {evt.title}
                              </h3>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                              >
                                {evt.isBirthday ? "Birthday" : catStyle.label}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-stone-400">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {evt.isBirthday
                                  ? "All Day"
                                  : `${format(eventDate, "h:mm a")} - ${format(
                                      new Date(evt.end),
                                      "h:mm a"
                                    )}`}
                              </span>
                              {evt.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  {evt.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                          <span className="text-[11px] font-semibold text-stone-400">
                            {format(eventDate, "EEEE")}
                          </span>
                          <ArrowRight size={14} className="text-stone-300 group-hover:text-brand transition" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Day Inspector & Upcoming Sidebar */}
        <div className="space-y-6">
          {/* Selected Day Inspector */}
          <div className="card-base p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="space-y-0.5">
                <span className="text-caption">
                  Day Schedule
                </span>
                <h3 className="heading-md">
                  {format(selectedDate, "EEEE, MMMM d")}
                </h3>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleOpenCreateForDate(selectedDate)}
                  className="btn-icon"
                  title="Add event for this day"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CalendarDays size={28} className="mx-auto text-stone-300" />
                <p className="text-xs text-stone-500 font-medium">No events for this date.</p>
                {isAdmin && (
                  <button
                    onClick={() => handleOpenCreateForDate(selectedDate)}
                    className="text-xs font-bold text-brand hover:underline cursor-pointer"
                  >
                    + Add an event
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-0.5">
                {selectedDayEvents.map((evt) => {
                  const catStyle =
                    CATEGORY_STYLES[evt.category || "general"] || CATEGORY_STYLES.general;
                  return (
                    <div
                      key={evt.id || evt.title}
                      onClick={(e) => handleEventClick(e, evt)}
                      className={`group rounded-2xl border p-3.5 transition hover:shadow-xs cursor-pointer ${catStyle.bg} ${catStyle.border}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-xs sm:text-sm font-bold ${catStyle.text}`}>{evt.title}</h4>
                        <span className={`size-2 shrink-0 rounded-full mt-1 ${catStyle.dot}`} />
                      </div>

                      {evt.description && (
                        <p className="mt-1 text-[11px] text-stone-600 line-clamp-2">{evt.description}</p>
                      )}

                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] font-medium text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {evt.isBirthday
                            ? "All Day"
                            : `${format(new Date(evt.start), "h:mm a")} - ${format(
                                new Date(evt.end),
                                "h:mm a"
                              )}`}
                        </span>
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {evt.location}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Schedule Card */}
          <div className="card-base p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="space-y-0.5">
                <span className="text-caption">
                  Upcoming
                </span>
                <h3 className="heading-md">Next 30 Days</h3>
              </div>
              <span className="badge-brand">
                {upcomingEvents.length} active
              </span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {upcomingEvents.slice(0, 5).map((evt) => (
                <div
                  key={evt.id || evt.title}
                  onClick={(e) => handleEventClick(e, evt)}
                  className="group flex items-center justify-between rounded-2xl p-2.5 transition hover:bg-stone-50 cursor-pointer border border-transparent hover:border-stone-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-50 font-bold text-brand">
                      <span className="text-[9px] uppercase">{format(new Date(evt.start), "MMM")}</span>
                      <span className="text-xs leading-none">{format(new Date(evt.start), "d")}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-800 truncate group-hover:text-brand transition">
                        {evt.title}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {evt.isBirthday
                          ? "Birthday Celebration"
                          : `${format(new Date(evt.start), "h:mm a")}${evt.location ? ` • ${evt.location}` : ""}`}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-stone-300 group-hover:text-brand transition shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail & Create Dialog */}
      <EventDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        event={selectedEvent}
        isAdmin={isAdmin}
        onSuccess={() => loadData(true)}
      />
    </div>
  );
}

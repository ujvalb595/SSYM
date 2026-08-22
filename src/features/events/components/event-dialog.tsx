"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, MapPin, AlignLeft, X, Trash2, Calendar, Tag, Cake, Info } from "lucide-react";
import { CalendarEvent } from "@/lib/google-calendar";
import { createEventAction, updateEventAction, deleteEventAction } from "@/lib/actions/events";
import { CustomSelect } from "@/components/ui/custom-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

const categoryOptions = [
  { label: "General Activity", value: "general" },
  { label: "General Body / Committee Meeting", value: "meeting" },
  { label: "Celebration / Festival / Sports", value: "celebration" },
  { label: "Important / Blood Camp / Urgent", value: "important" },
  { label: "Cultural / Family / Dinner", value: "community" },
];

interface EventDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  event: CalendarEvent | null;
  isAdmin: boolean;
  onSuccess: () => void;
}

export function EventDialog({ open, setOpen, event, isAdmin, onSuccess }: EventDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isBirthday = Boolean(event?.isBirthday || event?.title?.includes("🎂"));

  const formatDateTime = (date: Date) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const title = form.get("title") as string;
    const description = form.get("description") as string;
    const location = form.get("location") as string;
    const category = (form.get("category") as CalendarEvent["category"]) || "general";
    const startStr = form.get("start") as string;
    const endStr = form.get("end") as string;

    if (!title || !startStr || !endStr) {
      setError("Please fill all required fields");
      setSubmitting(false);
      return;
    }

    try {
      const eventData = {
        title,
        description,
        location,
        category,
        start: new Date(startStr),
        end: new Date(endStr),
      };

      if (event?.id) {
        await updateEventAction(event.id, eventData);
      } else {
        await createEventAction(eventData);
      }

      onSuccess();
      setOpen(false);
    } catch (err) {
      setError("Failed to save event to Google Calendar.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!event?.id) return;

    setSubmitting(true);
    try {
      await deleteEventAction(event.id);
      setDeleteConfirmOpen(false);
      onSuccess();
      setOpen(false);
    } catch {
      setError("Failed to delete event from Google Calendar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !mounted) return null;

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-stone-100 bg-white p-5 sm:p-7 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-2xl border ${
                    isBirthday
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-violet-50 text-[#7257f4] border-violet-100"
                  }`}
                >
                  {isBirthday ? <Cake size={20} /> : <Calendar size={19} />}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#24203a]">
                    {isBirthday
                      ? "Member Birthday"
                      : event?.id
                      ? isAdmin
                        ? "Edit Event"
                        : "Event Details"
                      : "Create New Event"}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-medium">
                    {isBirthday
                      ? "Automated Annual Celebration"
                      : isAdmin
                      ? "Synchronized with Google Calendar"
                      : "SSYM Organization Event"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                {error}
              </div>
            )}

            {/* Birthday info banner */}
            {isBirthday && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/70 p-3.5 border border-amber-200/70 text-amber-800 text-xs leading-relaxed">
                <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  This birthday celebration is dynamically generated from community member records. To update or manage member birthdates, visit the <strong>Members</strong> directory.
                </span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Event Title *</label>
                {isAdmin && !isBirthday ? (
                  <input
                    name="title"
                    defaultValue={event?.title || ""}
                    required
                    placeholder="e.g. Community Gathering"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-2.5 px-3.5 text-xs sm:text-sm font-medium outline-none focus:border-[#7257f4] focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                  />
                ) : (
                  <p className="text-sm font-bold text-stone-800 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                    {event?.title}
                  </p>
                )}
              </div>

              {/* Category Dropdown */}
              {isAdmin && !isBirthday && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Event Type / Category</label>
                  <CustomSelect
                    name="category"
                    defaultValue={event?.category || "general"}
                    options={categoryOptions}
                    icon={<Tag size={16} />}
                    placeholder="Select category"
                  />
                </div>
              )}

              {/* Time pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {isBirthday ? "Date" : "Start Time *"}
                  </label>
                  {isAdmin && !isBirthday ? (
                    <input
                      type="datetime-local"
                      name="start"
                      defaultValue={event?.start ? formatDateTime(event.start) : ""}
                      required
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-2 px-3 text-xs sm:text-sm outline-none focus:border-[#7257f4] focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-xs sm:text-sm bg-stone-50 p-2.5 rounded-2xl border border-stone-100 text-stone-700">
                      <Clock size={15} className="text-[#7257f4] shrink-0" />
                      <span>
                        {isBirthday
                          ? event?.start
                            ? new Date(event.start).toLocaleDateString(undefined, {
                                month: "long",
                                day: "numeric",
                              })
                            : ""
                          : event?.start
                          ? new Date(event.start).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {isBirthday ? "Recurrence" : "End Time *"}
                  </label>
                  {isAdmin && !isBirthday ? (
                    <input
                      type="datetime-local"
                      name="end"
                      defaultValue={event?.end ? formatDateTime(event.end) : ""}
                      required
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-2 px-3 text-xs sm:text-sm outline-none focus:border-[#7257f4] focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-xs sm:text-sm bg-stone-50 p-2.5 rounded-2xl border border-stone-100 text-stone-700">
                      <Clock size={15} className="text-[#7257f4] shrink-0" />
                      <span>{isBirthday ? "Every Year (Annual)" : event?.end ? new Date(event.end).toLocaleString() : ""}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              {!isBirthday && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Location / Venue</label>
                  {isAdmin ? (
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        name="location"
                        defaultValue={event?.location || ""}
                        placeholder="e.g. Main Hall or Google Meet"
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-2.5 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-[#7257f4] focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs sm:text-sm bg-stone-50 p-2.5 rounded-2xl border border-stone-100 text-stone-700">
                      <MapPin size={15} className="text-[#7257f4] shrink-0" />
                      <span>{event?.location || "No location specified"}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Description / Notes</label>
                {isAdmin && !isBirthday ? (
                  <div className="relative">
                    <AlignLeft size={16} className="absolute left-3.5 top-3 text-stone-400" />
                    <textarea
                      name="description"
                      defaultValue={event?.description || ""}
                      placeholder="Add additional details about this event..."
                      rows={3}
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-2.5 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-[#7257f4] focus:bg-white focus:ring-4 focus:ring-violet-100 resize-none transition"
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs sm:text-sm bg-stone-50 p-3 rounded-2xl border border-stone-100 text-stone-700">
                    <AlignLeft size={15} className="text-[#7257f4] shrink-0 mt-0.5" />
                    <p className="whitespace-pre-wrap">{event?.description || "No description provided."}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isAdmin && !isBirthday ? (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                  {event?.id ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(true)}
                      disabled={submitting}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={submitting}
                      className="shadow-violet-200"
                    >
                      {event?.id ? "Save Changes" : "Create Event"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex justify-end border-t border-stone-100 pt-3.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Dialog matching App Theme */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Event?"
        description={`Are you sure you want to delete "${event?.title || "this event"}"? It will be permanently removed from Google Calendar and your organization schedule.`}
        confirmText="Delete Event"
        cancelText="Keep Event"
        variant="danger"
        loading={submitting}
      />
    </>
  );
}

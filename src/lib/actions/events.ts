"use server";

import { auth } from "@/auth";
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getGoogleCalendarStatus,
  syncAllMemberBirthdaysToGoogleCalendar,
  CalendarEvent,
} from "@/lib/google-calendar";

export async function fetchEventsAction(start: Date, end: Date) {
  const session = await auth();
  if (!session?.user?.isActive) {
    throw new Error("Unauthorized");
  }

  return getCalendarEvents(start, end);
}

export async function fetchCalendarStatusAction() {
  const session = await auth();
  if (!session?.user?.isActive) {
    throw new Error("Unauthorized");
  }

  return getGoogleCalendarStatus();
}

export async function createEventAction(data: Omit<CalendarEvent, "id">) {
  const session = await auth();
  if (!session?.user?.isActive || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  return createCalendarEvent(data);
}

export async function updateEventAction(id: string, data: Omit<CalendarEvent, "id">) {
  const session = await auth();
  if (!session?.user?.isActive || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  return updateCalendarEvent(id, data);
}

export async function deleteEventAction(id: string) {
  const session = await auth();
  if (!session?.user?.isActive || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  return deleteCalendarEvent(id);
}

export async function syncAllBirthdaysAction() {
  const session = await auth();
  if (!session?.user?.isActive || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  return syncAllMemberBirthdaysToGoogleCalendar();
}

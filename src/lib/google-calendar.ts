import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  category?: "community" | "meeting" | "celebration" | "important" | "general";
  color?: string;
  isBirthday?: boolean;
}

export interface GoogleCalendarStatus {
  isConfigured: boolean;
  calendarId?: string;
  clientEmail?: string;
  error?: string;
}

function getGoogleCredentials() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, "\n") : undefined;

  return { clientEmail, privateKey, calendarId };
}

export function getGoogleCalendarStatus(): GoogleCalendarStatus {
  const { clientEmail, privateKey, calendarId } = getGoogleCredentials();
  const isConfigured = Boolean(clientEmail && privateKey && calendarId);
  return {
    isConfigured,
    calendarId: calendarId ? `${calendarId.slice(0, 4)}...${calendarId.slice(-10)}` : undefined,
    clientEmail: clientEmail ? `${clientEmail.slice(0, 6)}...` : undefined,
  };
}

let cachedCalendarClient: ReturnType<typeof google.calendar> | null = null;
let lastCalendarClientKey = "";

function getGoogleCalendarClient() {
  const { clientEmail, privateKey, calendarId } = getGoogleCredentials();
  if (!clientEmail || !privateKey || !calendarId) {
    return null;
  }

  const key = `${clientEmail}-${calendarId}`;
  if (cachedCalendarClient && lastCalendarClientKey === key) {
    return cachedCalendarClient;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  cachedCalendarClient = google.calendar({ version: "v3", auth });
  lastCalendarClientKey = key;
  return cachedCalendarClient;
}

// In-memory cache for event list queries (TTL 30 seconds)
const calendarEventsCache = new Map<string, { events: CalendarEvent[]; timestamp: number }>();

export function clearCalendarEventsCache() {
  calendarEventsCache.clear();
}

// Fallback demo events to ensure rich UX if credentials are not yet added
function getDemoEvents(currentYear: number, currentMonth: number): CalendarEvent[] {
  return [
    {
      id: "demo-1",
      title: "Monthly SSYM General Body Meeting",
      description: "Discussion on community initiatives, budget review, and upcoming cultural programs.",
      location: "Main Community Hall & Google Meet",
      start: new Date(currentYear, currentMonth, 5, 10, 0),
      end: new Date(currentYear, currentMonth, 5, 12, 30),
      category: "meeting",
    },
    {
      id: "demo-2",
      title: "Youth Sports Tournament & Gathering",
      description: "Annual cricket and volleyball league tournament for all active youth members.",
      location: "Sports Complex Arena",
      start: new Date(currentYear, currentMonth, 12, 8, 30),
      end: new Date(currentYear, currentMonth, 12, 17, 0),
      category: "celebration",
    },
    {
      id: "demo-3",
      title: "Health & Blood Donation Camp",
      description: "Voluntary blood donation drive and general health checkup camp in association with City Hospital.",
      location: "Community Center Ward 4",
      start: new Date(currentYear, currentMonth, 18, 9, 0),
      end: new Date(currentYear, currentMonth, 18, 14, 0),
      category: "important",
    },
    {
      id: "demo-4",
      title: "Cultural Evening & Sangeet Utsav",
      description: "Music, traditional performances, and family dinner for all registered members.",
      location: "Grand Auditorium",
      start: new Date(currentYear, currentMonth, 24, 18, 0),
      end: new Date(currentYear, currentMonth, 24, 22, 0),
      category: "community",
    },
    {
      id: "demo-5",
      title: "Executive Committee Planning Session",
      description: "Review of quarterly donation allocation, member onboarding roadmap, and website upgrades.",
      location: "Conference Room B",
      start: new Date(currentYear, currentMonth, 28, 15, 0),
      end: new Date(currentYear, currentMonth, 28, 17, 0),
      category: "meeting",
    },
  ];
}

export async function getCalendarEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
  const cacheKey = `${timeMin.toISOString()}_${timeMax.toISOString()}`;
  const cached = calendarEventsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 30 * 1000) {
    return cached.events;
  }

  const { calendarId } = getGoogleCredentials();
  const calendar = getGoogleCalendarClient();

  if (!calendar || !calendarId) {
    const currentYear = timeMin.getFullYear();
    const currentMonth = timeMin.getMonth();
    return getDemoEvents(currentYear, currentMonth);
  }

  try {
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 500,
      singleEvents: true,
      orderBy: "startTime",
    });


    const items = response.data.items || [];

    const googleEvents: CalendarEvent[] = items.map((event) => {
      let start: Date;
      let end: Date;

      if (event.start?.dateTime) {
        start = new Date(event.start.dateTime);
      } else if (event.start?.date) {
        // All-day event (YYYY-MM-DD)
        const [y, m, d] = event.start.date.split("-").map(Number);
        start = new Date(y, m - 1, d, 0, 0, 0);
      } else {
        start = new Date();
      }

      if (event.end?.dateTime) {
        end = new Date(event.end.dateTime);
      } else if (event.end?.date) {
        const [y, m, d] = event.end.date.split("-").map(Number);
        end = new Date(y, m - 1, d, 23, 59, 59);
      } else {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }

      const summary = event.summary || "Untitled Event";
      const description = event.description || "";
      const text = `${summary} ${description}`.toLowerCase();

      // Check category stored in extended properties or inferred from text
      let category: CalendarEvent["category"] = "general";
      const storedCategory = event.extendedProperties?.shared?.category as CalendarEvent["category"] | undefined;
      const isBirthday =
        Boolean(event.extendedProperties?.shared?.isBirthday === "true") ||
        summary.includes("🎂") ||
        text.includes("birthday");

      if (storedCategory && ["meeting", "celebration", "important", "community", "general"].includes(storedCategory)) {
        category = storedCategory;
      } else if (isBirthday) {
        category = "celebration";
      } else if (text.includes("meeting") || text.includes("review") || text.includes("sync")) {
        category = "meeting";
      } else if (text.includes("camp") || text.includes("donation") || text.includes("urgent") || text.includes("important")) {
        category = "important";
      } else if (text.includes("celebration") || text.includes("festival") || text.includes("tournament") || text.includes("sports")) {
        category = "celebration";
      } else if (text.includes("community") || text.includes("cultural") || text.includes("dinner")) {
        category = "community";
      }

      return {
        id: event.id as string,
        title: summary,
        description: description,
        location: event.location || "",
        start,
        end,
        category,
        isBirthday,
      };
    });

    // Dynamically fetch all active members and add their birthdays for the viewed timeframe
    const dynamicBirthdayEvents: CalendarEvent[] = [];
    try {
      const members = await prisma.user.findMany({
        where: {
          isActive: true,
          birthDate: { not: null },
        },
        select: {
          id: true,
          name: true,
          birthDate: true,
          mobileNumber: true,
        },
      });

      const startYear = timeMin.getFullYear();
      const endYear = timeMax.getFullYear();

      for (const member of members) {
        if (!member.birthDate) continue;
        const bDate = new Date(member.birthDate);
        if (isNaN(bDate.getTime())) continue;

        const birthMonth = bDate.getMonth();
        const birthDay = bDate.getDate();

        for (let y = startYear; y <= endYear; y++) {
          const birthdayStart = new Date(y, birthMonth, birthDay, 0, 0, 0);
          const birthdayEnd = new Date(y, birthMonth, birthDay, 23, 59, 59);

          if (birthdayStart >= timeMin && birthdayStart <= timeMax) {
            // Check if already in Google Calendar results to prevent duplicates
            const alreadyExists = googleEvents.some(
              (e) =>
                (e.isBirthday || e.title.includes("🎂")) &&
                (e.title.toLowerCase().includes(member.name.toLowerCase()) ||
                  e.description?.includes(member.id))
            );

            if (!alreadyExists) {
              dynamicBirthdayEvents.push({
                id: `member-bday-${member.id}-${y}`,
                title: `🎂 ${member.name}'s Birthday`,
                description: `SSYM Community Member Birthday Celebration${
                  member.mobileNumber ? ` • ${member.mobileNumber}` : ""
                }`,
                location: "",
                start: birthdayStart,
                end: birthdayEnd,
                category: "celebration",
                isBirthday: true,
              });
            }
          }
        }
      }
    } catch (dbErr) {
      console.error("Error dynamically loading member birthdays:", dbErr);
    }

    const allEvents = [...googleEvents, ...dynamicBirthdayEvents];
    allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    calendarEventsCache.set(cacheKey, { events: allEvents, timestamp: Date.now() });

    return allEvents;
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    return getDemoEvents(timeMin.getFullYear(), timeMin.getMonth());
  }
}

export async function createCalendarEvent(data: Omit<CalendarEvent, "id">) {
  clearCalendarEventsCache();
  const { calendarId } = getGoogleCredentials();
  const calendar = getGoogleCalendarClient();

  if (!calendar || !calendarId) {
    console.warn("Google Calendar is not configured in .env. Event saved locally.");
    return {
      id: `local-${Date.now()}`,
      summary: data.title,
      description: data.description,
      location: data.location,
      start: { dateTime: data.start.toISOString() },
      end: { dateTime: data.end.toISOString() },
    };
  }

  try {
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: {
        summary: data.title,
        description: data.description,
        location: data.location,
        start: {
          dateTime: data.start.toISOString(),
        },
        end: {
          dateTime: data.end.toISOString(),
        },
        extendedProperties: {
          shared: {
            category: data.category || "general",
            isBirthday: data.isBirthday ? "true" : "false",
          },
        },
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    throw new Error("Failed to create Google Calendar event. Please check Service Account permissions.");
  }
}

export async function updateCalendarEvent(id: string, data: Omit<CalendarEvent, "id">) {
  clearCalendarEventsCache();
  const { calendarId } = getGoogleCredentials();
  const calendar = getGoogleCalendarClient();

  if (!calendar || !calendarId) {
    console.warn("Google Calendar is not configured in .env. Mock update applied.");
    return { id, summary: data.title };
  }

  try {
    const response = await calendar.events.patch({
      calendarId: calendarId,
      eventId: id,
      requestBody: {
        summary: data.title,
        description: data.description,
        location: data.location,
        start: {
          dateTime: data.start.toISOString(),
        },
        end: {
          dateTime: data.end.toISOString(),
        },
        extendedProperties: {
          shared: {
            category: data.category || "general",
            isBirthday: data.isBirthday ? "true" : "false",
          },
        },
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating Google Calendar event:", error);
    throw new Error("Failed to update Google Calendar event.");
  }
}

export async function deleteCalendarEvent(id: string) {
  clearCalendarEventsCache();
  const { calendarId } = getGoogleCredentials();
  const calendar = getGoogleCalendarClient();

  if (!calendar || !calendarId) {
    console.warn("Google Calendar is not configured in .env. Mock delete applied.");
    return true;
  }

  try {
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: id,
    });
    return true;
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error);
    throw new Error("Failed to delete Google Calendar event.");
  }
}

/**
 * Synchronizes a single member's birthday to Google Calendar as an annual recurring all-day event
 */
export async function syncMemberBirthdayToGoogleCalendar(options: {
  memberName: string;
  birthDate: Date | string;
  mobileNumber?: string;
  memberId?: string;
}) {
  const { calendarId } = getGoogleCredentials();
  const calendar = getGoogleCalendarClient();

  if (!calendar || !calendarId) {
    console.log(`[Google Calendar] Not configured. Skipping birthday sync for ${options.memberName}.`);
    return null;
  }

  try {
    const rawDate = typeof options.birthDate === "string" ? new Date(options.birthDate) : options.birthDate;
    if (isNaN(rawDate.getTime())) {
      console.warn(`[Google Calendar] Invalid birthDate for ${options.memberName}`);
      return null;
    }

    const currentYear = new Date().getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, "0");
    const day = String(rawDate.getDate()).padStart(2, "0");
    const startDateStr = `${currentYear}-${month}-${day}`;

    // Compute end date (next day for Google all-day event)
    const nextDay = new Date(currentYear, rawDate.getMonth(), rawDate.getDate() + 1);
    const endMonth = String(nextDay.getMonth() + 1).padStart(2, "0");
    const endDay = String(nextDay.getDate()).padStart(2, "0");
    const endDateStr = `${nextDay.getFullYear()}-${endMonth}-${endDay}`;

    const summary = `🎂 Birthday: ${options.memberName}`;
    const description = `SSYM Member Birthday Celebration - ${options.memberName}${
      options.mobileNumber ? ` (Mobile: ${options.mobileNumber})` : ""
    }`;

    // Search if an existing birthday event exists for this member
    const existingSearch = await calendar.events.list({
      calendarId: calendarId,
      q: options.memberName,
      maxResults: 10,
    });

    const existingEvent = existingSearch.data.items?.find((item) => {
      const isBirthdayEvent = item.summary?.includes("🎂") || item.summary?.toLowerCase().includes("birthday");
      const matchesMember =
        item.extendedProperties?.shared?.memberId === options.memberId ||
        item.summary?.toLowerCase().includes(options.memberName.toLowerCase());
      return isBirthdayEvent && matchesMember;
    });

    if (existingEvent?.id) {
      // Update existing
      const res = await calendar.events.patch({
        calendarId: calendarId,
        eventId: existingEvent.id,
        requestBody: {
          summary,
          description,
          start: { date: startDateStr },
          end: { date: endDateStr },
          recurrence: ["RRULE:FREQ=YEARLY"],
          extendedProperties: {
            shared: {
              category: "celebration",
              isBirthday: "true",
              memberId: options.memberId || "",
              memberName: options.memberName,
            },
          },
        },
      });
      console.log(`[Google Calendar] Updated birthday event for ${options.memberName}:`, res.data.id);
      return res.data;
    } else {
      // Insert new recurring annual event
      const res = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: {
          summary,
          description,
          start: { date: startDateStr },
          end: { date: endDateStr },
          recurrence: ["RRULE:FREQ=YEARLY"],
          extendedProperties: {
            shared: {
              category: "celebration",
              isBirthday: "true",
              memberId: options.memberId || "",
              memberName: options.memberName,
            },
          },
        },
      });
      console.log(`[Google Calendar] Created new birthday event for ${options.memberName}:`, res.data.id);
      return res.data;
    }
  } catch (error) {
    console.error(`[Google Calendar] Error syncing birthday for ${options.memberName}:`, error);
    return null;
  }
}

/**
 * Synchronizes all members with birth dates in the database to Google Calendar
 */
export async function syncAllMemberBirthdaysToGoogleCalendar() {
  const members = await prisma.user.findMany({
    where: {
      isActive: true,
      birthDate: { not: null },
    },
    select: {
      id: true,
      name: true,
      birthDate: true,
      mobileNumber: true,
    },
  });

  let syncedCount = 0;
  const errors: string[] = [];

  for (const member of members) {
    if (member.birthDate) {
      try {
        const result = await syncMemberBirthdayToGoogleCalendar({
          memberId: member.id,
          memberName: member.name,
          birthDate: member.birthDate,
          mobileNumber: member.mobileNumber,
        });
        if (result) syncedCount++;
      } catch (err: unknown) {
        errors.push(`${member.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  }

  return { total: members.length, synced: syncedCount, errors };
}

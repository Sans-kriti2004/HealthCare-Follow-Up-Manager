import { google } from "googleapis";

export async function createCalendarEvent(input: {
  summary: string;
  description: string;
  start: Date;
  end: Date;
  attendees: string[];
}) {
  const calendar = getCalendarClient();
  if (!calendar) return null;

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start.toISOString() },
      end: { dateTime: input.end.toISOString() },
      attendees: input.attendees.map((email) => ({ email })),
    },
  });

  return response.data.id ?? null;
}

export async function deleteCalendarEvent(eventId?: string | null) {
  const calendar = getCalendarClient();
  if (!calendar || !eventId) return;

  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
    eventId,
  });
}

function getCalendarClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return null;
  }

  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth });
}

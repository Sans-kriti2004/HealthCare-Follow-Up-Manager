import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/calendar";
import { recordAndSendNotice } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/time";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { doctor: true, patient: true },
  });

  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  if (appointment.status !== "HELD" || !appointment.holdExpiresAt || appointment.holdExpiresAt < new Date()) {
    return NextResponse.json({ error: "Hold expired. Please select the slot again." }, { status: 409 });
  }

  let calendarEventId: string | null = null;
  await recordAndSendNotice({
    appointmentId: appointment.id,
    type: "BOOKING_CONFIRMATION",
    channel: "CALENDAR",
    action: async () => {
      calendarEventId = await createCalendarEvent({
        summary: `Appointment with ${appointment.doctor.name}`,
        description: appointment.symptoms ?? "Clinic appointment",
        start: appointment.slotStart,
        end: appointment.slotEnd,
        attendees: [appointment.patient.email, appointment.doctor.email],
      });
    },
  });

  const confirmed = await prisma.appointment.update({
    where: { id: params.id },
    data: { status: "CONFIRMED", holdExpiresAt: null, calendarEventId },
  });

  const when = formatDateTime(appointment.slotStart);
  await Promise.all([
    recordAndSendNotice({
      appointmentId: appointment.id,
      type: "BOOKING_CONFIRMATION",
      channel: "EMAIL",
      to: appointment.patient.email,
      subject: "Appointment confirmed",
      text: `Your appointment with ${appointment.doctor.name} is confirmed for ${when}.`,
    }),
    recordAndSendNotice({
      appointmentId: appointment.id,
      type: "BOOKING_CONFIRMATION",
      channel: "EMAIL",
      to: appointment.doctor.email,
      subject: "New patient appointment",
      text: `${appointment.patient.name} is booked with you for ${when}.`,
    }),
  ]);

  return NextResponse.json(confirmed);
}

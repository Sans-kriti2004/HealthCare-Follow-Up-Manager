import { NextResponse } from "next/server";
import { deleteCalendarEvent } from "@/lib/calendar";
import { recordAndSendNotice } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
    include: { doctor: true, patient: true },
  });

  await recordAndSendNotice({
    appointmentId: appointment.id,
    type: "CANCELLATION",
    channel: "CALENDAR",
    action: () => deleteCalendarEvent(appointment.calendarEventId),
  });

  await recordAndSendNotice({
    appointmentId: appointment.id,
    type: "CANCELLATION",
    channel: "EMAIL",
    to: appointment.patient.email,
    subject: "Appointment cancelled",
    text: `Your appointment with ${appointment.doctor.name} has been cancelled.`,
  });

  return NextResponse.json(appointment);
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteCalendarEvent } from "@/lib/calendar";
import { recordAndSendNotice } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { buildDateTime, endOfDay, startOfDay } from "@/lib/time";

const schema = z.object({
  date: z.string(),
  reason: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const data = schema.parse(await request.json());
  const date = buildDateTime(data.date, "00:00");

  const leave = await prisma.leave.create({
    data: { doctorId: params.id, date, reason: data.reason },
  });

  const affected = await prisma.appointment.findMany({
    where: {
      doctorId: params.id,
      status: { in: ["HELD", "CONFIRMED"] },
      slotStart: { gte: startOfDay(date), lt: endOfDay(date) },
    },
    include: { doctor: true, patient: true },
  });

  await prisma.appointment.updateMany({
    where: { id: { in: affected.map((item) => item.id) } },
    data: { status: "CANCELLED" },
  });

  await Promise.all(
    affected.flatMap((appointment) => [
      recordAndSendNotice({
        appointmentId: appointment.id,
        type: "LEAVE_CONFLICT",
        channel: "EMAIL",
        to: appointment.patient.email,
        subject: "Appointment needs rebooking",
        text: `${appointment.doctor.name} is unavailable on ${data.date}. Please book another slot.`,
      }),
      recordAndSendNotice({
        appointmentId: appointment.id,
        type: "LEAVE_CONFLICT",
        channel: "CALENDAR",
        action: () => deleteCalendarEvent(appointment.calendarEventId),
      }),
    ]),
  );

  return NextResponse.json({ leave, cancelledAppointments: affected.length });
}

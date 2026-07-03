import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAndSendNotice } from "@/lib/notifications";
import { addMinutes, formatDateTime } from "@/lib/time";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Invalid cron secret" }, { status: 401 });
  }

  const now = new Date();
  await prisma.appointment.deleteMany({
    where: { status: "HELD", holdExpiresAt: { lt: now } },
  });

  const upcoming = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      slotStart: { gte: now, lte: addMinutes(now, 60) },
    },
    include: { patient: true, doctor: true },
  });

  await Promise.all(
    upcoming.map((appointment) =>
      recordAndSendNotice({
        appointmentId: appointment.id,
        type: "REMINDER",
        channel: "EMAIL",
        to: appointment.patient.email,
        subject: "Appointment reminder",
        text: `Reminder: appointment with ${appointment.doctor.name} at ${formatDateTime(appointment.slotStart)}.`,
      }),
    ),
  );

  const retrying = await prisma.notificationLog.findMany({
    where: { status: "RETRYING", attempts: { lt: 3 } },
    take: 20,
  });

  return NextResponse.json({
    remindersQueued: upcoming.length,
    retryingLogsFound: retrying.length,
  });
}

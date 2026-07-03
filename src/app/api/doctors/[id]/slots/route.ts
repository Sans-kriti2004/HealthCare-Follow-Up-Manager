import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes, buildDateTime, endOfDay, parseWorkingHours, startOfDay } from "@/lib/time";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const doctor = await prisma.user.findUnique({ where: { id: params.id } });

  if (!doctor || doctor.role !== "DOCTOR") {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const day = buildDateTime(date, "00:00");
  const leave = await prisma.leave.findFirst({
    where: { doctorId: doctor.id, date: { gte: startOfDay(day), lt: endOfDay(day) } },
  });
  if (leave) return NextResponse.json([]);

  const workingHours = parseWorkingHours(doctor.workingHours);
  const duration = doctor.slotDuration ?? 30;
  const start = buildDateTime(date, workingHours.start);
  const end = buildDateTime(date, workingHours.end);
  const existing = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      slotStart: { gte: start, lt: end },
      OR: [
        { status: { in: ["CONFIRMED", "COMPLETED"] } },
        { status: "HELD", holdExpiresAt: { gt: new Date() } },
      ],
    },
    select: { slotStart: true },
  });
  const taken = new Set(existing.map((item) => item.slotStart.toISOString()));
  const slots = [];

  for (let cursor = start; cursor < end; cursor = addMinutes(cursor, duration)) {
    const slotEnd = addMinutes(cursor, duration);
    if (slotEnd <= end && !taken.has(cursor.toISOString())) {
      slots.push({ slotStart: cursor.toISOString(), slotEnd: slotEnd.toISOString() });
    }
  }

  return NextResponse.json(slots);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const userId = searchParams.get("userId");

  const appointments = await prisma.appointment.findMany({
    where:
      role === "doctor"
        ? { doctorId: userId ?? undefined }
        : role === "patient"
          ? { patientId: userId ?? undefined }
          : {},
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, email: true, specialisation: true } },
    },
    orderBy: { slotStart: "desc" },
  });

  return NextResponse.json(appointments);
}

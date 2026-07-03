import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMinutes } from "@/lib/time";

const schema = z.object({
  doctorId: z.string(),
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const patientId = session?.user.id;
  if (!patientId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const data = schema.parse(await request.json());
  const slotStart = new Date(data.slotStart);
  const slotEnd = new Date(data.slotEnd);

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({
        where: {
          doctorId: data.doctorId,
          slotStart,
          status: "HELD",
          holdExpiresAt: { lt: new Date() },
        },
      });

      return tx.appointment.create({
        data: {
          patientId,
          doctorId: data.doctorId,
          slotStart,
          slotEnd,
          status: "HELD",
          holdExpiresAt: addMinutes(new Date(), 5),
        },
      });
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Slot already taken" }, { status: 409 });
    }
    throw error;
  }
}

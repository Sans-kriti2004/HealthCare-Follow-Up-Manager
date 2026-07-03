import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  specialisation: z.string().min(2),
  workingStart: z.string().default("09:00"),
  workingEnd: z.string().default("17:00"),
  slotDuration: z.coerce.number().int().min(10).max(120),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const data = schema.parse(await request.json());
  const doctor = await prisma.user.update({
    where: { id: params.id },
    data: {
      name: data.name,
      specialisation: data.specialisation,
      workingHours: JSON.stringify({ start: data.workingStart, end: data.workingEnd }),
      slotDuration: data.slotDuration,
    },
  });

  return NextResponse.json(doctor);
}

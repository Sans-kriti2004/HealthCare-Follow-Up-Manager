import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).default("doctor123"),
  specialisation: z.string().min(2),
  workingStart: z.string().default("09:00"),
  workingEnd: z.string().default("17:00"),
  slotDuration: z.coerce.number().int().min(10).max(120).default(30),
});

export async function POST(request: Request) {
  const data = schema.parse(await request.json());
  const doctor = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      password: await hash(data.password, 10),
      role: "DOCTOR",
      specialisation: data.specialisation,
      workingHours: JSON.stringify({ start: data.workingStart, end: data.workingEnd }),
      slotDuration: data.slotDuration,
    },
  });

  return NextResponse.json(doctor, { status: 201 });
}

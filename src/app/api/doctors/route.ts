import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const specialisation = searchParams.get("specialisation") ?? undefined;

  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
      ...(specialisation
        ? { specialisation: { contains: specialisation } }
        : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      specialisation: true,
      workingHours: true,
      slotDuration: true,
    },
  });

  return NextResponse.json(doctors);
}

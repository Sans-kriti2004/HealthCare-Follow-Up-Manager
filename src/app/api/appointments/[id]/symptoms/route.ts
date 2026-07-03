import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePreVisitSummary } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

const schema = z.object({ symptoms: z.string().min(5) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { symptoms } = schema.parse(await request.json());
  const summary = await generatePreVisitSummary(symptoms);

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      symptoms,
      preVisitSummary: summary.raw,
      urgencyLevel: summary.urgencyLevel,
    },
  });

  return NextResponse.json(appointment);
}

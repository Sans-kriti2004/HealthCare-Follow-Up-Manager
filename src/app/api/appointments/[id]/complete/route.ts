import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePostVisitSummary } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  doctorNotes: z.string().min(5),
  prescription: z.string().default("[]"),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const data = schema.parse(await request.json());
  const summary = await generatePostVisitSummary(`${data.doctorNotes}\nPrescription: ${data.prescription}`);

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      status: "COMPLETED",
      doctorNotes: data.doctorNotes,
      prescription: data.prescription,
      postVisitSummary: summary.raw,
    },
  });

  return NextResponse.json(appointment);
}

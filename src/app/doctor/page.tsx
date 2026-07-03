import { CompleteVisitForm } from "@/components/CompleteVisitForm";
import { PortalShell } from "@/components/PortalShell";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatDateTime } from "@/lib/time";

function parseSummary(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default async function DoctorPage() {
  const session = await requireRole(["DOCTOR"]);
  const userId = session.user.id;
  const appointments = await prisma.appointment.findMany({
    where: { doctorId: userId },
    include: { patient: true },
    orderBy: { slotStart: "desc" },
  });

  return (
    <PortalShell title="Doctor portal" role="DOCTOR">
      <section className="grid gap-4">
        {appointments.map((appointment) => {
          const summary = parseSummary(appointment.preVisitSummary);
          return (
            <article className="rounded-lg border border-slate-200 bg-white p-5" key={appointment.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{appointment.patient.name}</h2>
                  <p className="text-sm text-slate-600">{formatDateTime(appointment.slotStart)}</p>
                </div>
                <span className="rounded-md bg-slate-100 px-3 py-1 text-sm">{appointment.status}</span>
              </div>
              {summary && (
                <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm">
                  <p><b>Urgency:</b> {appointment.urgencyLevel}</p>
                  <p><b>Chief complaint:</b> {summary.chiefComplaint}</p>
                  <p><b>Questions:</b> {summary.suggestedQuestions?.join(" | ")}</p>
                </div>
              )}
              {appointment.status === "CONFIRMED" && <CompleteVisitForm appointmentId={appointment.id} />}
            </article>
          );
        })}
      </section>
    </PortalShell>
  );
}

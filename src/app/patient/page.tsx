import { BookingPanel } from "@/components/BookingPanel";
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

export default async function PatientPage() {
  const session = await requireRole(["PATIENT"]);
  const userId = session.user.id;
  const appointments = await prisma.appointment.findMany({
    where: { patientId: userId },
    include: { doctor: true },
    orderBy: { slotStart: "desc" },
  });

  return (
    <PortalShell title="Patient portal" role="PATIENT">
      <BookingPanel />
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">My appointments</h2>
        <div className="mt-4 grid gap-3">
          {appointments.map((appointment) => {
            const summary = parseSummary(appointment.postVisitSummary);
            return (
              <article className="rounded-md border border-slate-200 p-4" key={appointment.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{appointment.doctor.name}</p>
                    <p className="text-sm text-slate-600">{formatDateTime(appointment.slotStart)}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-sm">{appointment.status}</span>
                </div>
                {summary && (
                  <div className="mt-3 rounded-md bg-teal-50 p-3 text-sm">
                    <b>Post-visit summary:</b> {summary.summary}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </PortalShell>
  );
}

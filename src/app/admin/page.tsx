import { DoctorCreateForm, LeaveForm } from "@/components/AdminForms";
import { PortalShell } from "@/components/PortalShell";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatDateTime } from "@/lib/time";

export default async function AdminPage() {
  await requireRole(["ADMIN"]);
  const [doctors, appointments, logs] = await Promise.all([
    prisma.user.findMany({ where: { role: "DOCTOR" }, orderBy: { name: "asc" } }),
    prisma.appointment.findMany({
      include: { patient: true, doctor: true },
      orderBy: { slotStart: "desc" },
      take: 20,
    }),
    prisma.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <PortalShell title="Admin portal" role="ADMIN">
      <div className="grid gap-6 lg:grid-cols-2">
        <DoctorCreateForm />
        <LeaveForm doctors={doctors.map((doctor) => ({ id: doctor.id, name: doctor.name }))} />
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">All appointments</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Patient</th>
                <th>Doctor</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr className="border-b" key={appointment.id}>
                  <td className="py-2">{appointment.patient.name}</td>
                  <td>{appointment.doctor.name}</td>
                  <td>{formatDateTime(appointment.slotStart)}</td>
                  <td>{appointment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Notification logs</h2>
        <div className="mt-4 grid gap-2">
          {logs.map((log) => (
            <div className="grid gap-2 rounded-md border border-slate-200 p-3 text-sm sm:grid-cols-5" key={log.id}>
              <span>{log.type}</span>
              <span>{log.channel}</span>
              <span>{log.status}</span>
              <span>{log.attempts} attempt(s)</span>
              <span className="text-red-700">{log.lastError}</span>
            </div>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}

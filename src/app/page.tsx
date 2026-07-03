import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const role = session?.user.role;

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
              MediSlot Care
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">
              Smart clinic visits, from booking to follow-up
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              MediSlot Care helps patients find the right doctor, reserve a safe appointment slot,
              share symptoms before the visit, and receive clear follow-up guidance after consultation.
              Doctors get quick pre-visit context, while admins manage schedules, leave, and notifications
              from one simple portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {role ? (
                <Link className="rounded-md bg-teal-700 px-5 py-3 font-semibold text-white" href={`/${role.toLowerCase()}`}>
                  Open {role.toLowerCase()} portal
                </Link>
              ) : (
                <>
                  <Link className="rounded-md bg-teal-700 px-5 py-3 font-semibold text-white" href="/login">
                    Login
                  </Link>
                  <Link className="rounded-md border border-slate-300 px-5 py-3 font-semibold" href="/register">
                    Register patient
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Quick demo access</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p><b>Admin:</b> admin@clinic.test / password123</p>
              <p><b>Doctor:</b> doctor@clinic.test / password123</p>
              <p><b>Patient:</b> patient@clinic.test / password123</p>
            </div>
            <div className="mt-6 grid gap-3 text-sm">
              <p className="rounded-md bg-teal-50 p-3">Patients can search doctors, hold a slot, and confirm appointments with symptoms.</p>
              <p className="rounded-md bg-amber-50 p-3">Doctors see AI-assisted pre-visit notes and create patient-friendly visit summaries.</p>
              <p className="rounded-md bg-sky-50 p-3">Admins manage doctors, leave conflicts, appointment records, and notification reliability.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

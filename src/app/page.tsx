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
              Clinic workflow assignment
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">
              Healthcare Appointment & Follow-up Manager
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              A compact Next.js app with patient booking, doctor notes, admin doctor management,
              AI summaries, slot holds, leave conflict handling, email logs, and Google Calendar hooks.
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
            <h2 className="text-xl font-semibold">Demo accounts</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p><b>Admin:</b> admin@clinic.test / password123</p>
              <p><b>Doctor:</b> doctor@clinic.test / password123</p>
              <p><b>Patient:</b> patient@clinic.test / password123</p>
            </div>
            <div className="mt-6 grid gap-3 text-sm">
              <p className="rounded-md bg-teal-50 p-3">Unique doctor + slot constraint prevents double booking.</p>
              <p className="rounded-md bg-amber-50 p-3">HELD appointments expire after five minutes.</p>
              <p className="rounded-md bg-sky-50 p-3">NotificationLog records email/calendar success and failure.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

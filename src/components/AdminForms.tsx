"use client";

import { FormEvent, useState } from "react";

export function DoctorCreateForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setMessage(response.ok ? "Doctor profile created." : "Could not create doctor.");
  }

  return (
    <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold">Create doctor</h2>
      <input className="rounded-md border border-slate-300 px-3 py-2" name="name" placeholder="Doctor name" required />
      <input className="rounded-md border border-slate-300 px-3 py-2" name="email" placeholder="Email" type="email" required />
      <input className="rounded-md border border-slate-300 px-3 py-2" name="password" placeholder="Initial password" defaultValue="doctor123" />
      <input className="rounded-md border border-slate-300 px-3 py-2" name="specialisation" placeholder="Specialisation" required />
      <div className="grid grid-cols-3 gap-2">
        <input className="rounded-md border border-slate-300 px-3 py-2" name="workingStart" type="time" defaultValue="09:00" />
        <input className="rounded-md border border-slate-300 px-3 py-2" name="workingEnd" type="time" defaultValue="17:00" />
        <input className="rounded-md border border-slate-300 px-3 py-2" name="slotDuration" type="number" defaultValue="30" />
      </div>
      <button className="rounded-md bg-teal-700 px-4 py-2 font-semibold text-white" type="submit">Save doctor</button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  );
}

export function LeaveForm({ doctors }: { doctors: { id: string; name: string }[] }) {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const doctorId = form.get("doctorId");
    const response = await fetch(`/api/doctors/${doctorId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.get("date"),
        reason: form.get("reason"),
      }),
    });
    const data = await response.json();
    setMessage(response.ok ? `Leave saved. ${data.cancelledAppointments} appointment(s) cancelled.` : "Could not save leave.");
  }

  return (
    <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold">Mark doctor leave</h2>
      <select className="rounded-md border border-slate-300 px-3 py-2" name="doctorId" required>
        {doctors.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
        ))}
      </select>
      <input className="rounded-md border border-slate-300 px-3 py-2" name="date" type="date" required />
      <input className="rounded-md border border-slate-300 px-3 py-2" name="reason" placeholder="Reason" />
      <button className="rounded-md bg-teal-700 px-4 py-2 font-semibold text-white" type="submit">Save leave</button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Doctor = {
  id: string;
  name: string;
  email: string;
  specialisation: string | null;
  slotDuration: number | null;
};

type Slot = {
  slotStart: string;
  slotEnd: string;
};

export function BookingPanel() {
  const [specialisation, setSpecialisation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [message, setMessage] = useState("");

  const loadDoctors = useCallback(async () => {
    const response = await fetch(`/api/doctors?specialisation=${encodeURIComponent(specialisation)}`);
    setDoctors(await response.json());
  }, [specialisation]);

  async function loadSlots(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    const response = await fetch(`/api/doctors/${doctor.id}/slots?date=${date}`);
    setSlots(await response.json());
  }

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDoctor || !selectedSlot) return;

    setMessage("Holding slot...");
    const hold = await fetch("/api/appointments/hold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: selectedDoctor.id,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
      }),
    });

    if (!hold.ok) {
      setMessage("This slot was just taken. Please select another one.");
      return;
    }

    const appointment = await hold.json();
    const form = new FormData(event.currentTarget);
    await fetch(`/api/appointments/${appointment.id}/symptoms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: form.get("symptoms") }),
    });
    await fetch(`/api/appointments/${appointment.id}/confirm`, { method: "POST" });
    setMessage("Appointment confirmed. Email/calendar attempts are visible in admin logs.");
    await loadSlots(selectedDoctor);
  }

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Find doctors</h2>
        <div className="mt-4 flex gap-2">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            onChange={(event) => setSpecialisation(event.target.value)}
            placeholder="Search specialisation"
            value={specialisation}
          />
          <button className="rounded-md bg-teal-700 px-4 py-2 font-semibold text-white" onClick={loadDoctors} type="button">
            Search
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {doctors.map((doctor) => (
            <button
              className="w-full rounded-md border border-slate-200 p-3 text-left hover:border-teal-600"
              key={doctor.id}
              onClick={() => loadSlots(doctor)}
              type="button"
            >
              <b>{doctor.name}</b>
              <span className="block text-sm text-slate-600">{doctor.specialisation}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Book a slot</h2>
        <label className="mt-4 block text-sm font-medium">Date</label>
        <input className="mt-1 rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
        {selectedDoctor && (
          <div className="mt-4">
            <p className="font-medium">{selectedDoctor.name}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => (
                <button
                  className={`rounded-md border px-3 py-2 text-sm ${selectedSlot?.slotStart === slot.slotStart ? "border-teal-700 bg-teal-50" : "border-slate-200"}`}
                  key={slot.slotStart}
                  onClick={() => setSelectedSlot(slot)}
                  type="button"
                >
                  {new Date(slot.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </button>
              ))}
            </div>
          </div>
        )}
        <form className="mt-5" onSubmit={book}>
          <label className="block text-sm font-medium">Symptoms</label>
          <textarea className="mt-1 h-28 w-full rounded-md border border-slate-300 px-3 py-2" name="symptoms" placeholder="Fever, chest pain, headache..." required />
          <button className="mt-3 rounded-md bg-teal-700 px-4 py-2 font-semibold text-white" disabled={!selectedSlot} type="submit">
            Hold and confirm
          </button>
        </form>
        {message && <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm">{message}</p>}
      </section>
    </div>
  );
}

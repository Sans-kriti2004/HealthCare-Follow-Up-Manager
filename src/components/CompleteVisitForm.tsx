"use client";

import { FormEvent, useState } from "react";

export function CompleteVisitForm({ appointmentId }: { appointmentId: string }) {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/appointments/${appointmentId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorNotes: form.get("doctorNotes"),
        prescription: form.get("prescription"),
      }),
    });

    setMessage(response.ok ? "Visit completed and patient summary generated." : "Could not complete visit.");
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={onSubmit}>
      <textarea className="h-24 w-full rounded-md border border-slate-300 px-3 py-2" name="doctorNotes" placeholder="Diagnosis, advice, follow-up notes" required />
      <textarea className="h-20 w-full rounded-md border border-slate-300 px-3 py-2" name="prescription" placeholder='[{"drug":"Paracetamol","dosage":"500mg","frequency":"twice daily","days":3}]' />
      <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
        Complete visit
      </button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  );
}

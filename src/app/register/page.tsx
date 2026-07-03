"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: "PATIENT",
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Could not register");
      return;
    }
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <form className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={onSubmit}>
        <h1 className="text-2xl font-bold">Patient registration</h1>
        <label className="mt-5 block text-sm font-medium">Name</label>
        <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="name" required />
        <label className="mt-4 block text-sm font-medium">Email</label>
        <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="email" type="email" required />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" minLength={6} name="password" type="password" required />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="mt-6 w-full rounded-md bg-teal-700 px-4 py-2 font-semibold text-white" type="submit">
          Register
        </button>
        <Link className="mt-4 block text-center text-sm font-medium text-teal-700" href="/login">
          Back to login
        </Link>
      </form>
    </main>
  );
}

import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export function PortalShell({
  title,
  role,
  children,
}: {
  title: string;
  role: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link className="text-sm font-semibold text-teal-700" href="/">
              Healthcare Manager
            </Link>
            <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium">{role}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </main>
  );
}

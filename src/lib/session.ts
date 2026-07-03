import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

export async function requireRole(allowed: string[]) {
  const session = await getServerSession(authOptions);
  const role = session?.user.role;

  if (!session?.user || !role) {
    redirect("/login");
  }

  if (!allowed.includes(role)) {
    redirect("/");
  }

  return session;
}

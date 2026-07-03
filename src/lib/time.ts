export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function parseWorkingHours(value?: string | null) {
  if (!value) return { start: "09:00", end: "17:00" };
  try {
    const parsed = JSON.parse(value);
    return { start: parsed.start ?? "09:00", end: parsed.end ?? "17:00" };
  } catch {
    return { start: "09:00", end: "17:00" };
  }
}

export function buildDateTime(date: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(`${date}T00:00:00`);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

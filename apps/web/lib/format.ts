const TZ = "America/New_York";
const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });
const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TZ });
const isoDayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // "YYYY-MM-DD"
const shortDayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: TZ });

/** "YYYY-MM-DD" for the given date in US Eastern, offset by `days` (0 = today, same TZ ESPN uses). */
export function etDate(days = 0): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return isoDayFmt.format(d);
}

/** "Oct 29" for a "YYYY-MM-DD" ET date string. */
export function formatEtDate(date: string): string {
  // Midday UTC keeps the date stable across the ET offset either side of midnight.
  return shortDayFmt.format(new Date(`${date}T12:00:00Z`));
}

/** The "YYYY-MM-DD" ET date `days` away from the given one. */
export function shiftEtDate(date: string, days: number): string {
  return isoDayFmt.format(new Date(new Date(`${date}T12:00:00Z`).getTime() + days * 86_400_000));
}

/** "Sat, Oct 10 · 7:30 PM ET" (always US Eastern, same as ESPN) */
export const formatKickoff = (iso: string) => `${dayFmt.format(new Date(iso))} · ${timeFmt.format(new Date(iso))} ET`;

/** "7:30 PM ET" — just the time, for compact layouts that show the date elsewhere. */
export const formatKickoffTime = (iso: string) => `${timeFmt.format(new Date(iso))} ET`;

/** "Starting soon", "45 min from now", "3 hours from now", "Sun, Oct 11 · 7:30 PM ET". */
export function formatStartsIn(iso: string, now = Date.now()) {
  const diffMin = Math.floor((new Date(iso).getTime() - now) / 60_000);
  if (diffMin <= 0) return "Starting soon";
  if (diffMin < 60) return `${diffMin} min from now`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} from now`;
  return formatKickoff(iso);
}

/** Compact variant for narrow screens: "Soon", "in 45m", "in 3h", "Sun 7:30 PM ET". */
export function formatStartsInShort(iso: string, now = Date.now()) {
  const diffMin = Math.floor((new Date(iso).getTime() - now) / 60_000);
  if (diffMin <= 0) return "Soon";
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffMin < 24 * 60) return `in ${Math.floor(diffMin / 60)}h`;
  const d = new Date(iso);
  return `${weekdayFmt.format(d)} ${timeFmt.format(d)} ET`;
}

export const formatViewers = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

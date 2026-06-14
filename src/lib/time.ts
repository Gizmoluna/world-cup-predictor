import { formatInTimeZone } from "date-fns-tz";

// The whole rivalry runs on Melbourne time.
export const MELBOURNE_TZ = "Australia/Melbourne";

export function melbourne(iso: string, fmt = "EEE d MMM, h:mm a"): string {
  return formatInTimeZone(new Date(iso), MELBOURNE_TZ, fmt);
}

export function melbourneTime(iso: string): string {
  return formatInTimeZone(new Date(iso), MELBOURNE_TZ, "h:mm a");
}

export function melbourneDay(iso: string): string {
  return formatInTimeZone(new Date(iso), MELBOURNE_TZ, "EEE d MMM");
}

/** Whole-day key (Melbourne) used for "today's matches" grouping. */
export function melbourneDayKey(iso: string): string {
  return formatInTimeZone(new Date(iso), MELBOURNE_TZ, "yyyy-MM-dd");
}

export function isSameMelbourneDay(a: string, b: string): boolean {
  return melbourneDayKey(a) === melbourneDayKey(b);
}

/** Human countdown like "2h 14m" or "kicked off". Pure given `now`. */
export function countdown(kickoffIso: string, now: Date): string {
  const diff = new Date(kickoffIso).getTime() - now.getTime();
  if (diff <= 0) return "kicked off";
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${m}m`;
  return `${m}m`;
}

export function isLocked(kickoffIso: string, now: Date): boolean {
  return new Date(kickoffIso).getTime() <= now.getTime();
}

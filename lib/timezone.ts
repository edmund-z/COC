import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const SUPPORTED_TIMEZONES = [
  { label: "Buenos Aires (GMT-3)", value: "America/Argentina/Buenos_Aires" },
  { label: "Paris (GMT+1/+2)", value: "Europe/Paris" },
  { label: "Shanghai (GMT+8)", value: "Asia/Shanghai" },
  { label: "Los Angeles (GMT-8/-7)", value: "America/Los_Angeles" },
  { label: "New York (GMT-5/-4)", value: "America/New_York" },
  { label: "Chicago (GMT-6/-5)", value: "America/Chicago" },
];

export function getLocalDate(timezone: string): string {
  const zonedNow = toZonedTime(new Date(), timezone);
  return zonedNow.toISOString().slice(0, 10);
}

export function getLocalHour(timezone: string): number {
  const zonedNow = toZonedTime(new Date(), timezone);
  return zonedNow.getHours();
}

export function getLocalHourMinute(timezone: string): { hour: number; minute: number; dayOfWeek: number } {
  const zonedNow = toZonedTime(new Date(), timezone);
  return {
    hour: zonedNow.getHours(),
    minute: zonedNow.getMinutes(),
    dayOfWeek: zonedNow.getDay(), // 0 = Sunday
  };
}

export function getPreviousDate(date: string): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export { toZonedTime, fromZonedTime };

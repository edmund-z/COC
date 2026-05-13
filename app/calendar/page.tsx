export const dynamic = "force-dynamic";

import { db } from "@/lib/supabase";
import { computeStreak } from "@/lib/streak";
import { getLocalDate } from "@/lib/timezone";
import CalendarClient from "./CalendarClient";
import { Entry } from "@/lib/supabase";

function getWeekRange(dateStr: string): [string, string] {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  const diffToMon = (day + 6) % 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - diffToMon);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return [monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10)];
}

function weekStats(entries: Entry[], start: string, end: string) {
  const week = entries.filter((e) => e.date >= start && e.date <= end);
  return { create: week.filter((e) => e.choice === "create").length, total: week.length };
}

export default async function CalendarPage() {
  const settings = await db.fetchSettings();
  const todayStr = getLocalDate(settings.timezone);
  const [year, month] = todayStr.split("-").map(Number);

  const [entries, allEntries] = await Promise.all([
    db.getEntriesForMonth(year, month),
    db.getAllEntries(),
  ]);

  const streak = computeStreak(allEntries);
  const todayEntry = entries.find((e) => e.date === todayStr) ?? null;

  const [thisWeekStart, thisWeekEnd] = getWeekRange(todayStr);
  const lastWeekDate = new Date(todayStr + "T12:00:00Z");
  lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 7);
  const [lastWeekStart, lastWeekEnd] = getWeekRange(lastWeekDate.toISOString().slice(0, 10));

  return (
    <CalendarClient
      initialEntries={entries}
      initialYear={year}
      initialMonth={month}
      todayStr={todayStr}
      streak={streak}
      todayEntry={todayEntry}
      weekStats={{
        thisWeek: weekStats(allEntries, thisWeekStart, thisWeekEnd),
        lastWeek: weekStats(allEntries, lastWeekStart, lastWeekEnd),
      }}
    />
  );
}

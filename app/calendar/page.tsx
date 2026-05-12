import { db } from "@/lib/supabase";
import { computeStreak } from "@/lib/streak";
import { getLocalDate } from "@/lib/timezone";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const settings = await db.fetchSettings();
  const todayStr = getLocalDate(settings.timezone);
  const [year, month] = todayStr.split("-").map(Number);

  const [entries, allEntries] = await Promise.all([
    db.getEntriesForMonth(year, month),
    db.getAllEntries(),
  ]);

  const streak = computeStreak(allEntries);

  return (
    <CalendarClient
      initialEntries={entries}
      initialYear={year}
      initialMonth={month}
      todayStr={todayStr}
      streak={streak}
    />
  );
}

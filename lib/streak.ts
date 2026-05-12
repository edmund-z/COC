import { Entry } from "./supabase";

export function computeStreak(entries: Entry[]): number {
  if (entries.length === 0) return 0;

  // Sort descending by date
  const sorted = [...entries].sort((a, b) => (a.date > b.date ? -1 : 1));

  const today = new Date();
  const todayStr = toDateString(today);
  const yesterdayStr = toDateString(new Date(today.getTime() - 86400000));

  // Streak must include today or yesterday
  const mostRecent = sorted[0].date;
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) return 0;
  if (sorted[0].choice !== "create") return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].date;
    const curr = sorted[i].date;
    const expected = toDateString(new Date(new Date(prev).getTime() - 86400000));
    if (curr !== expected) break;
    if (sorted[i].choice !== "create") break;
    streak++;
  }
  return streak;
}

export function computeLongestStreak(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const sorted = [...entries]
    .filter((e) => e.choice === "create")
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  let longest = 0;
  let current = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      current = 1;
    } else {
      const prev = sorted[i - 1].date;
      const curr = sorted[i].date;
      const expected = toDateString(new Date(new Date(prev).getTime() + 86400000));
      if (curr === expected) {
        current++;
      } else {
        current = 1;
      }
    }
    if (current > longest) longest = current;
  }
  return longest;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

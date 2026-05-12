export const dynamic = "force-dynamic";

import { db } from "@/lib/supabase";
import { computeLongestStreak } from "@/lib/streak";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const [settings, allEntries] = await Promise.all([
    db.fetchSettings(),
    db.getAllEntries(),
  ]);

  const totalEntries = allEntries.length;
  const createCount = allEntries.filter((e) => e.choice === "create").length;
  const createPct = totalEntries > 0 ? Math.round((createCount / totalEntries) * 100) : 0;
  const longestStreak = computeLongestStreak(allEntries);

  return (
    <SettingsClient
      timezone={settings.timezone}
      totalEntries={totalEntries}
      createPct={createPct}
      longestStreak={longestStreak}
      hasSubscription={settings.push_subscription !== null}
    />
  );
}

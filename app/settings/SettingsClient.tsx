"use client";

import { useState, FormEvent } from "react";
import { SUPPORTED_TIMEZONES } from "@/lib/timezone";

interface Props {
  timezone: string;
  totalEntries: number;
  createPct: number;
  longestStreak: number;
}

export default function SettingsClient({
  timezone: initialTz,
  totalEntries,
  createPct,
  longestStreak,
}: Props) {
  const [timezone, setTimezone] = useState(initialTz);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone }),
    });
    setSaving(false);
    setSaved(true);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Total entries" value={String(totalEntries)} />
        <Stat label="Create %" value={`${createPct}%`} />
        <Stat label="Longest streak" value={`${longestStreak}d`} />
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">Timezone</span>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-base"
          >
            {SUPPORTED_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white rounded px-3 py-2 text-base disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="text-gray-400 text-sm underline self-start"
      >
        Log out
      </button>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

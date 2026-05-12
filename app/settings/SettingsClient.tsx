"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
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

  const [smsStatus, setSmsStatus] = useState<"idle" | "sending" | "sent" | "skipped" | "error">("idle");

  async function handleTestSms() {
    setSmsStatus("sending");
    try {
      const res = await fetch("/api/cron/send-sms", {
        method: "POST",
        headers: { "x-cron-trigger": "manual" },
      });
      const data = await res.json();
      if (data.ok) setSmsStatus("sent");
      else if (data.skipped) setSmsStatus("skipped");
      else setSmsStatus("error");
    } catch {
      setSmsStatus("error");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        <Link href="/calendar" className="text-sm text-gray-500 underline">← Calendar</Link>
      </div>

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

      <div className="flex flex-col gap-2">
        <button
          onClick={handleTestSms}
          disabled={smsStatus === "sending"}
          className="border border-black rounded px-3 py-2 text-base disabled:opacity-50"
        >
          {smsStatus === "idle" && "Send test SMS now"}
          {smsStatus === "sending" && "Sending..."}
          {smsStatus === "sent" && "✓ Text sent — check your phone"}
          {smsStatus === "skipped" && "Skipped — already logged today"}
          {smsStatus === "error" && "Failed — check Twilio console"}
        </button>
      </div>

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

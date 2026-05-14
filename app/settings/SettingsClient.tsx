"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { SUPPORTED_TIMEZONES } from "@/lib/timezone";

const VAPID_PUBLIC_KEY =
  "BAqLWjLJoxGa9-zZeVSc6TZAx6FZSvkGs3iC7gXHHdD54qPxCziElvvkFnrdpIjrwYfba49krVu6A2b1w-vm4IE";

interface Props {
  timezone: string;
  totalEntries: number;
  createPct: number;
  longestStreak: number;
  hasSubscription: boolean;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function SettingsClient({
  timezone: initialTz,
  totalEntries,
  createPct,
  longestStreak,
  hasSubscription: initialHasSub,
}: Props) {
  const [timezone, setTimezone] = useState(initialTz);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifState, setNotifState] = useState<
    "unknown" | "unsupported" | "denied" | "enabled" | "disabled" | "loading"
  >("unknown");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotifState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setNotifState("denied");
      return;
    }
    setNotifState(initialHasSub ? "enabled" : "disabled");
  }, [initialHasSub]);

  async function handleEnableNotifications() {
    setNotifState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotifState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setNotifState("enabled");
    } catch {
      setNotifState("disabled");
    }
  }

  async function handleDisableNotifications() {
    setNotifState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch("/api/push/subscribe", { method: "DELETE" });
      setNotifState("disabled");
    } catch {
      setNotifState("disabled");
    }
  }

  async function handleTestNotification() {
    setNotifState("loading");
    const res = await fetch("/api/cron/send-sms", {
      method: "POST",
      headers: { "x-cron-trigger": "manual" },
    });
    const data = await res.json();
    setNotifState("enabled");
    if (data.skipped?.reason === "no_subscription") {
      alert("Enable notifications first.");
    } else if (data.skipped) {
      alert("Skipped — already logged today.");
    } else {
      alert("Notification sent! Check your phone.");
    }
  }

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        <Link href="/calendar" className="text-sm text-gray-500 underline">
          ← Calendar
        </Link>
      </div>

      <section className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Total entries" value={String(totalEntries)} />
        <Stat label="Create %" value={`${createPct}%`} />
        <Stat label="Longest streak" value={`${longestStreak}d`} />
      </section>

      {/* Notifications */}
      <section className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 font-medium">Daily notifications</p>
        {notifState === "unsupported" && (
          <p className="text-sm text-gray-400">
            Add this app to your Home Screen first, then enable notifications.
          </p>
        )}
        {notifState === "denied" && (
          <p className="text-sm text-red-500">
            Notifications blocked. Go to Settings → Safari → [this site] → allow notifications.
          </p>
        )}
        {(notifState === "disabled" || notifState === "unknown") && (
          <button
            onClick={handleEnableNotifications}
            className="bg-black text-white rounded px-3 py-2 text-base"
          >
            Enable notifications
          </button>
        )}
        {notifState === "loading" && (
          <button disabled className="bg-black text-white rounded px-3 py-2 text-base opacity-50">
            ...
          </button>
        )}
        {notifState === "enabled" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-[#10b981] font-medium">✓ Notifications enabled</p>
            <button
              onClick={handleTestNotification}
              className="border border-black rounded px-3 py-2 text-base"
            >
              Send test notification now
            </button>
            <button
              onClick={handleDisableNotifications}
              className="text-gray-400 text-sm underline self-start"
            >
              Disable notifications
            </button>
          </div>
        )}
      </section>

      {/* Settings form */}
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
          {saving ? "Saving..." : saved ? "Saved!" : "Save settings"}
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

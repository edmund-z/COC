"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Entry } from "@/lib/supabase";

interface WeekStats {
  thisWeek: { create: number; total: number };
  lastWeek: { create: number; total: number };
}

interface Props {
  initialEntries: Entry[];
  initialYear: number;
  initialMonth: number;
  todayStr: string;
  streak: number;
  todayEntry: Entry | null;
  weekStats: WeekStats;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarClient({
  initialEntries,
  initialYear,
  initialMonth,
  todayStr,
  streak,
  todayEntry,
  weekStats,
}: Props) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    router.prefetch("/log");
    router.prefetch("/settings");
  }, [router]);

  const todayYear = parseInt(todayStr.slice(0, 4));
  const todayMonth = parseInt(todayStr.slice(5, 7));
  const isCurrentMonth = year === todayYear && month === todayMonth;
  const showLogToday = isCurrentMonth && !todayEntry;

  async function navigate(dir: -1 | 1) {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setLoading(true);
    setSelectedDate(null);
    setMonth(newMonth);
    setYear(newYear);
    const res = await fetch(`/api/entries?year=${newYear}&month=${newMonth}`);
    const data = await res.json();
    setEntries(data.entries);
    setLoading(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  }

  function handleLogDate(date: string) {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    router.push(date === todayStr ? "/log" : `/log?date=${date}`);
  }

  const entryMap: Record<string, Entry> = {};
  for (const e of entries) entryMap[e.date] = e;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: Array<{ date: string | null; entry: Entry | null }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ date: null, entry: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: dateStr, entry: entryMap[dateStr] ?? null });
  }

  const monthName = new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const selectedEntry = selectedDate ? entryMap[selectedDate] ?? null : null;
  const selectedDisplay = selectedDate
    ? new Date(selectedDate + "T12:00:00Z").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <main className="max-w-md mx-auto px-4 py-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400">Current streak</p>
          <p className="text-3xl font-bold">{streak} day{streak !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/settings" className="text-sm text-gray-500 underline">
          Settings
        </Link>
      </div>

      {/* Weekly stats */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="border border-gray-100 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">This week</p>
          <p className="text-lg font-bold">
            {weekStats.thisWeek.create}
            <span className="text-sm font-normal text-gray-400">/{weekStats.thisWeek.total} create</span>
          </p>
        </div>
        <div className="border border-gray-100 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Last week</p>
          <p className="text-lg font-bold">
            {weekStats.lastWeek.create}
            <span className="text-sm font-normal text-gray-400">/{weekStats.lastWeek.total} create</span>
          </p>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigate(-1)}
          className="text-2xl px-2 py-1 rounded hover:bg-gray-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 className="text-base font-semibold">{monthName}</h2>
        <button
          onClick={() => navigate(1)}
          className="text-2xl px-2 py-1 rounded hover:bg-gray-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {DAY_LABELS.map((d) => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar grid with swipe */}
      <div
        className={`grid grid-cols-7 gap-1 ${loading ? "opacity-40" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} />;

          const isToday = cell.date === todayStr;
          const isFuture = cell.date > todayStr;
          const isSelected = cell.date === selectedDate;

          let bg = "bg-gray-100";
          let textColor = "text-gray-400";
          if (cell.entry?.choice === "create") { bg = "bg-[#10b981]"; textColor = "text-white"; }
          else if (cell.entry?.choice === "consume") { bg = "bg-[#ef4444]"; textColor = "text-white"; }

          const day = parseInt(cell.date.slice(8));

          return (
            <button
              key={cell.date}
              onClick={() => {
                if (isFuture) return;
                setSelectedDate(isSelected ? null : cell.date);
              }}
              className={`aspect-square rounded flex items-center justify-center text-sm font-medium relative ${bg} ${textColor} ${
                isToday ? "ring-2 ring-black ring-offset-1" : ""
              } ${isSelected ? "ring-2 ring-offset-1 " + (cell.entry ? "ring-white" : "ring-black") : ""} ${
                isFuture ? "opacity-30" : ""
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Log today button */}
      {showLogToday && (
        <button
          onClick={() => handleLogDate(todayStr)}
          className="w-full mt-4 bg-black text-white rounded-xl py-3 text-base font-semibold active:scale-95 transition-transform touch-manipulation"
        >
          Log today
        </button>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#10b981]" /> Create
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#ef4444]" /> Consume
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-gray-200" /> No entry
        </span>
      </div>

      {/* Day detail sheet */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-20 bg-black/20 animate-fade-in"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 flex flex-col gap-4 shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-base">{selectedDisplay}</p>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {selectedEntry ? (
              <div className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full inline-block flex-shrink-0"
                  style={{ background: selectedEntry.choice === "create" ? "#10b981" : "#ef4444" }}
                />
                <span className="text-lg font-medium capitalize">{selectedEntry.choice}</span>
                {selectedEntry.why_word && (
                  <span className="text-gray-400 text-base">· {selectedEntry.why_word}</span>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleLogDate(selectedDate)}
                className="w-full bg-black text-white rounded-xl py-3 text-base font-semibold active:scale-95 transition-transform touch-manipulation"
              >
                Log this day
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

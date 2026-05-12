"use client";

import { useState } from "react";
import Link from "next/link";
import { Entry } from "@/lib/supabase";

interface Props {
  initialEntries: Entry[];
  initialYear: number;
  initialMonth: number;
  todayStr: string;
  streak: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarClient({
  initialEntries,
  initialYear,
  initialMonth,
  todayStr,
  streak,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState<{ date: string; why: string } | null>(null);

  async function navigate(dir: -1 | 1) {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setLoading(true);
    setMonth(newMonth);
    setYear(newYear);
    const res = await fetch(`/api/entries?year=${newYear}&month=${newMonth}`);
    const data = await res.json();
    setEntries(data.entries);
    setLoading(false);
  }

  const entryMap: Record<string, Entry> = {};
  for (const e of entries) {
    entryMap[e.date] = e;
  }

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

  return (
    <main className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-gray-500">Current streak</p>
          <p className="text-3xl font-bold">{streak} day{streak !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/settings" className="text-sm text-gray-500 underline">
          Settings
        </Link>
      </div>

      <div className="flex items-center justify-between mt-6 mb-3">
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

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {DAY_LABELS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className={`grid grid-cols-7 gap-1 ${loading ? "opacity-40" : ""}`}>
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} />;

          const isToday = cell.date === todayStr;
          let bg = "bg-gray-100";
          let textColor = "text-gray-400";

          if (cell.entry?.choice === "create") {
            bg = "bg-[#10b981]";
            textColor = "text-white";
          } else if (cell.entry?.choice === "consume") {
            bg = "bg-[#ef4444]";
            textColor = "text-white";
          }

          const day = parseInt(cell.date.slice(8));

          return (
            <button
              key={cell.date}
              onClick={() => {
                if (cell.entry?.why_word && cell.date) {
                  setTooltip(
                    tooltip?.date === cell.date
                      ? null
                      : { date: cell.date, why: cell.entry.why_word }
                  );
                } else {
                  setTooltip(null);
                }
              }}
              className={`aspect-square rounded flex items-center justify-center text-sm font-medium relative ${bg} ${textColor} ${
                isToday ? "ring-2 ring-black ring-offset-1" : ""
              }`}
            >
              {day}
              {tooltip?.date === cell.date && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {tooltip.why}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-6 text-sm text-gray-500">
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
    </main>
  );
}

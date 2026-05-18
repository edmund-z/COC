"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Stage = "choice" | "why" | "confirming" | "done";

interface Props {
  token: string;
  initialError?: string;
}

export default function LogClient({ token, initialError }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(initialError ? "done" : "choice");
  const [choice, setChoice] = useState<"create" | "consume" | null>(null);
  const [why, setWhy] = useState("");
  const [streak, setStreak] = useState<number | null>(null);
  const [error, setError] = useState(initialError ?? "");
  const [pressing, setPressing] = useState<string | null>(null);
  const whyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    router.prefetch("/calendar");
  }, [router]);

  useEffect(() => {
    if (stage === "why") whyRef.current?.focus();
  }, [stage]);

  useEffect(() => {
    if (stage === "confirming") {
      const timer = setTimeout(() => {
        router.replace("/calendar");
        router.refresh();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stage, router]);

  async function submitChoice(c: "create" | "consume", whyWord?: string) {
    const res = await fetch(`/api/log/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice: c, why_word: whyWord ?? null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setStage("done");
    } else {
      setStreak(data.streak);
      setStage("confirming");
    }
  }

  function handleChoicePress(c: "create" | "consume") {
    setPressing(c);
    setTimeout(() => {
      setPressing(null);
      setChoice(c);
      setStage("why");
    }, 100);
  }

  async function handleWhySubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitChoice(choice!, why.trim() || undefined);
  }

  async function handleSkip() {
    await submitChoice(choice!);
  }

  if (stage === "choice") {
    return (
      <main className="fixed inset-0 flex flex-col">
        <button
          onPointerDown={() => handleChoicePress("create")}
          style={{
            background: pressing === "create" ? "#0d9268" : "#10b981",
            transition: "background 100ms",
          }}
          className="flex-1 w-full flex items-center justify-center text-white text-4xl font-bold uppercase tracking-widest select-none touch-manipulation"
        >
          Create
        </button>
        <button
          onPointerDown={() => handleChoicePress("consume")}
          style={{
            background: pressing === "consume" ? "#c53030" : "#ef4444",
            transition: "background 100ms",
          }}
          className="flex-1 w-full flex items-center justify-center text-white text-4xl font-bold uppercase tracking-widest select-none touch-manipulation"
        >
          Consume
        </button>
      </main>
    );
  }

  if (stage === "why") {
    return (
      <main
        className="fixed inset-0 flex flex-col items-center justify-center px-6 gap-6"
        style={{ background: choice === "create" ? "#10b981" : "#ef4444" }}
      >
        <p className="text-white text-2xl font-semibold capitalize">{choice}</p>
        <form onSubmit={handleWhySubmit} className="w-full max-w-xs flex flex-col gap-3">
          <input
            ref={whyRef}
            type="text"
            value={why}
            onChange={(e) => setWhy(e.target.value.replace(/\s.*/, ""))}
            placeholder="one word why (optional)"
            maxLength={30}
            className="border-0 border-b-2 border-white bg-transparent text-white placeholder-white/60 text-xl text-center outline-none py-2"
          />
          <button
            type="submit"
            className="text-white border border-white rounded py-2 text-lg"
          >
            Submit
          </button>
        </form>
        <button onClick={handleSkip} className="text-white/70 underline text-base">
          skip
        </button>
      </main>
    );
  }

  if (stage === "confirming") {
    return (
      <main
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: choice === "create" ? "#10b981" : "#ef4444" }}
      >
        <p className="text-white text-8xl font-light">✓</p>
        <p className="text-white text-3xl font-bold uppercase tracking-widest">
          {choice}
        </p>
        {streak !== null && (
          <p className="text-white/80 text-lg">{streak} day streak</p>
        )}
      </main>
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center px-6 gap-6 bg-white">
      <p className="text-red-500 text-center text-lg">{error}</p>
      <Link href="/calendar" className="text-black underline text-base">
        View calendar
      </Link>
    </main>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Stage = "choice" | "why" | "confirming" | "error";

interface Props {
  date?: string;
  initialError?: string;
}

function vibrate(ms: number) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(ms);
  }
}

export default function LogClient({ date, initialError }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(initialError ? "error" : "choice");
  const [choice, setChoice] = useState<"create" | "consume" | null>(null);
  const [why, setWhy] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const whyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    router.prefetch("/calendar");
  }, [router]);

  useEffect(() => {
    if (stage === "why") whyRef.current?.focus();
  }, [stage]);

  useEffect(() => {
    if (stage === "confirming") {
      vibrate(20);
      const timer = setTimeout(() => {
        router.replace("/calendar");
        router.refresh();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [stage, router]);

  async function submitChoice(c: "create" | "consume", whyWord?: string) {
    setChoice(c);
    setStage("confirming");

    try {
      const res = await fetch("/api/log/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: c, why_word: whyWord ?? null, date }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to log.");
        setStage("error");
      }
    } catch {
      setError("Network error.");
      setStage("error");
    }
  }

  function handleChoicePress(c: "create" | "consume") {
    vibrate(10);
    setChoice(c);
    setStage("why");
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
          className="flex-1 w-full flex items-center justify-center bg-[#10b981] active:bg-[#0d9268] text-white text-4xl font-bold uppercase tracking-widest select-none touch-manipulation transition-colors"
        >
          Create
        </button>
        <button
          onPointerDown={() => handleChoicePress("consume")}
          className="flex-1 w-full flex items-center justify-center bg-[#ef4444] active:bg-[#c53030] text-white text-4xl font-bold uppercase tracking-widest select-none touch-manipulation transition-colors"
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
            className="text-white border border-white rounded py-2 text-lg active:scale-95 transition-transform touch-manipulation"
          >
            Submit
          </button>
        </form>
        <button
          onClick={handleSkip}
          className="text-white/70 underline text-base touch-manipulation"
        >
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
      </main>
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center px-6 gap-6 bg-white">
      <p className="text-red-500 text-center text-lg">{error}</p>
      <Link href="/calendar" className="text-black underline text-base">
        Back to calendar
      </Link>
    </main>
  );
}

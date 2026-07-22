"use client";

import { useState } from "react";
import Link from "next/link";
import { useJourney } from "../JourneyProvider";
import { REGIONS, ENDING_INTRO, ENDING_PROMPT, ENDINGS } from "@/lib/story";

export default function EndingPage() {
  const { loading, regions } = useJourney();
  const clearedCount = regions.filter((r) => r.completed).length;
  const allDone = !loading && clearedCount === regions.length;

  const [choice, setChoice] = useState<"A" | "B" | null>(null);

  if (loading) return <p className="text-sm text-slate-400">불러오는 중…</p>;

  if (!allDone) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <div className="text-4xl">🌫️</div>
        <p className="mt-3 text-slate-300">
          아직 여정이 끝나지 않았어요. ({clearedCount} / {regions.length} 지역 통과)
        </p>
        <Link
          href="/map"
          className="mt-5 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
        >
          지도로 돌아가기
        </Link>
      </div>
    );
  }

  // 선택한 엔딩 보기
  if (choice) {
    const ending = ENDINGS[choice];
    return (
      <div className="animate-fade-in-up mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
          <p className="text-center text-4xl">{choice === "A" ? "🏰" : "🌿"}</p>
          <h1 className="mt-3 text-center font-display text-2xl font-bold">
            {ending.title}
          </h1>

          <div className="mt-6 space-y-3 text-sm leading-relaxed text-slate-300">
            {ending.narrative.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-6 whitespace-pre-line rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-4 text-center text-sm font-medium leading-relaxed text-amber-200">
            {ending.closing}
          </div>

          <div className="mt-7 flex justify-center gap-3">
            <button
              onClick={() => setChoice(null)}
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              ← 다시 선택하기
            </button>
            <Link
              href="/map"
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
            >
              지도로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 진실 공개 + 다섯 물음 + 선택
  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
        <p className="text-center text-5xl">🏆</p>
        <h1 className="mt-3 text-center font-display text-2xl font-bold">
          여정의 끝 — 깊은 숲
        </h1>

        <div className="mt-6 space-y-3 text-sm leading-relaxed text-slate-300">
          {ENDING_INTRO.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* 다섯 지역에서 얻은 물음 */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="mb-2 text-xs font-medium text-slate-400">
            🧭 다섯 지역에서 얻은 물음
          </p>
          <ul className="space-y-1.5">
            {REGIONS.map((r) => (
              <li key={r.index} className="text-sm leading-relaxed text-indigo-200/90">
                • {r.character.question}
              </li>
            ))}
          </ul>
        </div>

        {/* 선택 */}
        <p className="mt-7 text-center text-sm font-medium text-amber-300">
          {ENDING_PROMPT}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["A", "B"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setChoice(k)}
              className="rounded-xl border border-slate-700 bg-slate-950/60 p-5 text-left transition-colors hover:border-amber-500 hover:bg-slate-800/60"
            >
              <div className="text-2xl">{k === "A" ? "🏰" : "🌿"}</div>
              <div className="mt-2 font-bold text-slate-100">
                {ENDINGS[k].choiceLabel}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {k === "A"
                  ? "잃어버린 기억을 왕국에 되돌린다"
                  : "성배를 자연에 남기고 떠난다"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

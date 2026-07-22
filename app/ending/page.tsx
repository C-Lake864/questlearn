"use client";

import Link from "next/link";
import { useJourney } from "../JourneyProvider";
import { CLUE_POOL, WORLD_OUTRO } from "@/lib/story";

export default function EndingPage() {
  const { loading, regions } = useJourney();
  const clearedCount = regions.filter((r) => r.completed).length;
  const allDone = !loading && clearedCount === regions.length;

  if (loading) return <p className="text-sm text-slate-400">불러오는 중…</p>;

  // 아직 다 통과하지 못했으면 안내
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

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl text-center">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <div className="text-5xl">🏆</div>
        <h1 className="mt-4 font-display text-2xl font-bold">여정의 끝</h1>
        <p className="mt-2 text-slate-400">다섯 지역을 모두 해금했습니다.</p>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left">
          <p className="mb-2 text-center text-xs font-medium text-slate-400">
            📜 그대가 모은 성배의 기록
          </p>
          <ul className="space-y-2">
            {CLUE_POOL.map((c, i) => (
              <li key={i} className="text-sm leading-relaxed text-amber-200/90">
                • {c}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-slate-300">{WORLD_OUTRO}</p>

        <Link
          href="/map"
          className="mt-8 inline-block rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          지도로
        </Link>
      </div>
    </div>
  );
}

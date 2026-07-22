"use client";

import Link from "next/link";
import { useJourney } from "../JourneyProvider";

export default function MapPage() {
  const { loading, isLoggedIn, regions, isUnlocked } = useJourney();

  const clearedCount = regions.filter((r) => r.completed).length;

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl">
      <div className="mb-5 text-center">
        <h1 className="font-display text-2xl font-bold">🗺️ 다아라 왕국 지도</h1>
        <p className="mt-1 text-sm text-slate-400">
          다섯 지역을 차례로 해금하세요 · {clearedCount} / {regions.length} 통과
        </p>
      </div>

      {/* 게스트 안내 */}
      {!loading && !isLoggedIn && (
        <div className="mb-5 rounded-xl border border-indigo-800/60 bg-indigo-950/30 px-4 py-3 text-sm text-indigo-200">
          🧭 <span className="font-bold">게스트 모드</span> — 지금 바로 플레이할 수 있어요.
          다만 <span className="font-medium">새로고침하면 진행이 사라져요.</span>{" "}
          <Link href="/login" className="font-medium text-amber-400 hover:underline">
            로그인
          </Link>
          하면 저장됩니다.
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-slate-400">불러오는 중…</p>
      ) : (
        <div className="grid gap-3">
          {regions.map((r) => {
            const unlocked = isUnlocked(r.index);
            const state = r.completed
              ? "done"
              : unlocked
                ? "open"
                : "locked";

            return (
              <div
                key={r.index}
                className={`rounded-2xl border p-5 transition-colors ${
                  state === "locked"
                    ? "border-slate-800 bg-slate-900/30 opacity-60"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg font-bold ${
                        state === "done"
                          ? "border-amber-500 bg-amber-500 text-slate-950"
                          : state === "open"
                            ? "border-amber-400 bg-slate-900 text-amber-300"
                            : "border-slate-700 bg-slate-900 text-slate-600"
                      }`}
                    >
                      {state === "done" ? "✓" : state === "locked" ? "🔒" : r.index}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-lg font-bold">
                        제{r.index}지역 ·{" "}
                        {state === "locked" ? (
                          <span className="text-slate-500">???</span>
                        ) : (
                          r.name
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {state === "done"
                          ? `통과 완료 · 주제: ${r.topic ?? "-"}`
                          : state === "open"
                            ? "도전 가능"
                            : "이전 지역을 통과하면 열립니다"}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {state === "locked" ? (
                      <span className="text-sm text-slate-600">잠김</span>
                    ) : (
                      <Link
                        href={`/region/${r.index}`}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                          state === "done"
                            ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                        }`}
                      >
                        {state === "done" ? "다시 도전" : "도전하기 →"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && clearedCount === regions.length && (
        <div className="mt-6 rounded-2xl border border-amber-700/50 bg-amber-950/30 p-6 text-center">
          <div className="text-3xl">🏆</div>
          <p className="mt-2 font-display text-lg font-bold text-amber-300">
            모든 지역을 해금했습니다!
          </p>
          <Link
            href="/ending"
            className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            여정의 끝 보기 →
          </Link>
        </div>
      )}
    </div>
  );
}

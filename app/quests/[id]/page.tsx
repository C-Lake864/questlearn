"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Quest } from "@/lib/types";

export default function QuestPlayPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 플레이 상태
  const [current, setCurrent] = useState(0); // 현재 단계 인덱스
  const [selected, setSelected] = useState<number | null>(null); // 선택한 답
  const [revealed, setRevealed] = useState(false); // 정답 공개 여부
  const [score, setScore] = useState(0);
  const [rewards, setRewards] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/quests/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "퀘스트를 불러오지 못했습니다.");
        setQuest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p className="text-sm text-slate-400">불러오는 중…</p>;
  if (error || !quest) {
    return (
      <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
        {error ?? "퀘스트를 찾을 수 없습니다."}{" "}
        <Link href="/quests" className="underline">
          목록으로
        </Link>
      </div>
    );
  }

  const stages = quest.stages;
  const stage = stages[current];
  const total = stages.length;

  function choose(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === stage.answerIndex) {
      setScore((s) => s + 1);
      setRewards((r) => [...r, stage.reward]);
    }
  }

  function next() {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setFinished(true);
    }
  }

  function restart() {
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setRewards([]);
    setFinished(false);
  }

  // 완료 화면
  if (finished) {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 shadow-xl">
          <div className="text-5xl">🏆</div>
          <h1 className="mt-4 font-display text-2xl font-bold">퀘스트 완료!</h1>
          <p className="mt-2 text-slate-400">{quest.title}</p>
          <p className="mt-6 text-4xl font-bold text-amber-400">
            {score} <span className="text-xl text-slate-400">/ {total}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">정답 개수</p>

          {rewards.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="mb-2 text-xs font-medium text-slate-400">획득한 보상</p>
              <div className="flex flex-wrap justify-center gap-2">
                {rewards.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-amber-700/50 bg-amber-950/40 px-3 py-1 text-xs text-amber-300"
                  >
                    🎁 {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={restart}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              다시 도전
            </button>
            <Link
              href="/quests"
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
            >
              목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 플레이 화면
  return (
    <div className="animate-fade-in-up">
      {/* 상단: 제목 + 진행도 */}
      <div className="mb-5">
        <Link href="/quests" className="text-xs text-slate-500 hover:text-slate-300">
          ← 목록으로
        </Link>
        <h1 className="mt-1 font-display text-xl font-bold">{quest.title}</h1>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${((current + (revealed ? 1 : 0)) / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">
            {current + 1} / {total}
          </span>
        </div>
      </div>

      {/* 스테이지 카드 */}
      <div key={current} className="animate-fade-in-up rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-950/60 px-3 py-1 text-xs font-medium text-indigo-300">
          <span>STAGE {stage.stage}</span>
        </div>

        {/* 상황 */}
        <p className="mb-4 rounded-xl border-l-4 border-amber-600/60 bg-slate-950/50 py-3 pl-4 pr-3 text-sm italic leading-relaxed text-slate-300">
          {stage.situation}
        </p>

        {/* 문제 */}
        <h2 className="mb-4 text-lg font-bold leading-snug text-white">{stage.question}</h2>

        {/* 선택지 */}
        <div className="grid gap-2.5">
          {stage.choices.map((choice, idx) => {
            const isAnswer = idx === stage.answerIndex;
            const isPicked = idx === selected;

            let cls =
              "border-slate-700 bg-slate-950/60 hover:border-slate-500 hover:bg-slate-800/60";
            if (revealed) {
              if (isAnswer) cls = "border-emerald-600 bg-emerald-950/40";
              else if (isPicked) cls = "border-red-700 bg-red-950/40";
              else cls = "border-slate-800 bg-slate-950/40 opacity-60";
            }

            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                disabled={revealed}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls} ${
                  !revealed ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-600 text-xs font-bold text-slate-300">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 text-slate-100">{choice}</span>
                {revealed && isAnswer && <span className="text-emerald-400">✓</span>}
                {revealed && isPicked && !isAnswer && <span className="text-red-400">✗</span>}
              </button>
            );
          })}
        </div>

        {/* 해설 + 보상 */}
        {revealed && (
          <div className="mt-5 animate-fade-in-up space-y-3">
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                selected === stage.answerIndex
                  ? "bg-emerald-950/40 text-emerald-200"
                  : "bg-red-950/30 text-red-200"
              }`}
            >
              <p className="font-bold">
                {selected === stage.answerIndex ? "정답입니다! 🎉" : "아쉬워요, 오답입니다."}
              </p>
              <p className="mt-1.5 leading-relaxed text-slate-300">{stage.explanation}</p>
            </div>

            {selected === stage.answerIndex && (
              <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300">
                🎁 보상 획득: <span className="font-bold">{stage.reward}</span>
              </div>
            )}

            <p className="text-xs text-slate-500">📌 학습목표: {stage.objective}</p>

            <button
              onClick={next}
              className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              {current + 1 < total ? "다음 단계 →" : "결과 보기 🏆"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Quest } from "@/lib/types";
import {
  WORLD_TITLE,
  WORLD_INTRO,
  WORLD_HINT,
  WORLD_OUTRO,
  regionName as regionNameFor,
  clueFor,
} from "@/lib/story";

type Phase = "intro" | "playing" | "finished";

export default function QuestPlayPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 플레이 상태
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [rewards, setRewards] = useState<string[]>([]);
  const [clues, setClues] = useState<string[]>([]);

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
  const total = stages.length;
  const stage = stages[current];
  const region = stage?.regionName || regionNameFor(stage?.stage ?? current + 1);

  function choose(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === stage.answerIndex) {
      setScore((s) => s + 1);
      setRewards((r) => [...r, stage.reward]);
      setClues((c) => [...c, stage.clue || clueFor(stage.stage)]);
    }
  }

  function next() {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setPhase("finished");
    }
  }

  function restart() {
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setRewards([]);
    setClues([]);
    setPhase("intro");
  }

  // 지도(진행도) — 다섯 지역 노드
  function MapTrail({ activeUpTo }: { activeUpTo: number }) {
    return (
      <div className="flex items-center justify-between gap-1">
        {stages.map((s, i) => {
          const rname = s.regionName || regionNameFor(s.stage);
          const state =
            i < activeUpTo ? "done" : i === activeUpTo ? "current" : "locked";
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                  state === "done"
                    ? "border-amber-500 bg-amber-500 text-slate-950"
                    : state === "current"
                      ? "border-amber-400 bg-slate-900 text-amber-300"
                      : "border-slate-700 bg-slate-900 text-slate-600"
                }`}
              >
                {state === "done" ? "✓" : state === "locked" ? "🔒" : i + 1}
              </div>
              <span
                className={`text-center text-[10px] leading-tight ${
                  state === "locked" ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {state === "locked" ? "???" : rname}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── 인트로: 세계관 도입부 ──
  if (phase === "intro") {
    return (
      <div className="animate-fade-in-up mx-auto max-w-2xl">
        <Link href="/quests" className="text-xs text-slate-500 hover:text-slate-300">
          ← 목록으로
        </Link>
        <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
          <p className="text-center text-4xl">🏰</p>
          <h1 className="mt-3 text-center font-display text-2xl font-bold">
            {WORLD_TITLE}
          </h1>
          <p className="mt-1 text-center text-sm text-amber-400/80">
            학습 주제: {quest.title}
          </p>

          <div className="mt-6 space-y-3 text-sm leading-relaxed text-slate-300">
            {WORLD_INTRO.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <blockquote className="mt-5 rounded-xl border-l-4 border-amber-600/60 bg-slate-950/50 py-3 pl-4 pr-3 text-sm italic text-amber-200/90">
            “{WORLD_HINT}”
          </blockquote>

          <div className="mt-6">
            <p className="mb-2 text-xs text-slate-500">그대의 여정 — 다섯 지역</p>
            <MapTrail activeUpTo={0} />
          </div>

          <button
            onClick={() => setPhase("playing")}
            className="mt-7 w-full rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            🗺️ 모험 시작하기
          </button>
        </div>
      </div>
    );
  }

  // ── 엔딩: 결과 + 모은 단서 ──
  if (phase === "finished") {
    return (
      <div className="animate-fade-in-up mx-auto max-w-2xl text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
          <div className="text-5xl">🏆</div>
          <h1 className="mt-4 font-display text-2xl font-bold">여정의 끝</h1>
          <p className="mt-2 text-slate-400">{quest.title}</p>
          <p className="mt-6 text-4xl font-bold text-amber-400">
            {score} <span className="text-xl text-slate-400">/ {total}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">해금한 지역 수</p>

          {clues.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left">
              <p className="mb-2 text-center text-xs font-medium text-slate-400">
                📜 그대가 모은 성배의 기록
              </p>
              <ul className="space-y-2">
                {clues.map((c, i) => (
                  <li key={i} className="text-sm leading-relaxed text-amber-200/90">
                    • {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 text-sm leading-relaxed text-slate-300">
            {WORLD_OUTRO}
          </p>

          {rewards.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {rewards.map((r, i) => (
                <span
                  key={i}
                  className="rounded-full border border-amber-700/50 bg-amber-950/40 px-3 py-1 text-xs text-amber-300"
                >
                  🎁 {r}
                </span>
              ))}
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

  // ── 플레이: 각 지역 관문 ──
  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/quests" className="text-xs text-slate-500 hover:text-slate-300">
          ← 목록으로
        </Link>
        <h1 className="mt-1 font-display text-lg font-bold">{quest.title}</h1>
      </div>

      {/* 지도 진행도 */}
      <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
        <MapTrail activeUpTo={current} />
      </div>

      {/* 지역 관문 카드 */}
      <div
        key={current}
        className="animate-fade-in-up rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-950/60 px-3 py-1 text-xs font-medium text-indigo-300">
            제{stage.stage}지역 · {region}
          </div>
          <span className="text-xs text-slate-500">
            {current + 1} / {total}
          </span>
        </div>

        {/* 상황 */}
        <p className="mb-4 rounded-xl border-l-4 border-amber-600/60 bg-slate-950/50 py-3 pl-4 pr-3 text-sm italic leading-relaxed text-slate-300">
          {stage.situation}
        </p>

        {/* 문제 */}
        <h2 className="mb-4 text-lg font-bold leading-snug text-white">
          {stage.question}
        </h2>

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
                {revealed && isPicked && !isAnswer && (
                  <span className="text-red-400">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 해설 + 보상 + 단서 */}
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
                {selected === stage.answerIndex
                  ? "고대 장치가 열립니다! 🎉"
                  : "장치가 굳게 닫혀 있습니다…"}
              </p>
              <p className="mt-1.5 leading-relaxed text-slate-300">
                {stage.explanation}
              </p>
            </div>

            {selected === stage.answerIndex && (
              <>
                <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300">
                  🗺️ 지도의 길 하나가 드러났다! 보상:{" "}
                  <span className="font-bold">{stage.reward}</span>
                </div>
                <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/30 px-4 py-2.5 text-sm text-indigo-200">
                  📜 발견한 기록: {stage.clue || clueFor(stage.stage)}
                </div>
              </>
            )}

            <p className="text-xs text-slate-500">📌 학습목표: {stage.objective}</p>

            <button
              onClick={next}
              className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              {current + 1 < total ? "다음 지역으로 →" : "여정의 끝으로 🏆"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

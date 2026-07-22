"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useJourney } from "../../JourneyProvider";
import { regionName, clueFor } from "@/lib/story";
import type { QuestStage } from "@/lib/types";

type Phase = "topic" | "playing" | "result";

export default function RegionPage() {
  const params = useParams<{ n: string }>();
  const n = Number(params.n);
  const router = useRouter();
  const { loading, isLoggedIn, isUnlocked, setCompleted } = useJourney();

  const [phase, setPhase] = useState<Phase>("topic");
  const [title, setTitle] = useState("");
  const [material, setMaterial] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stages, setStages] = useState<QuestStage[]>([]);
  const [questId, setQuestId] = useState<string | null>(null);

  // 플레이 상태
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [passed, setPassed] = useState(false);

  // 잘못된 지역 번호
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    return (
      <p className="text-sm text-slate-400">
        잘못된 지역입니다.{" "}
        <Link href="/map" className="underline">
          지도로
        </Link>
      </p>
    );
  }

  if (loading) return <p className="text-sm text-slate-400">불러오는 중…</p>;

  // 잠긴 지역 접근 차단
  if (!isUnlocked(n)) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <div className="text-4xl">🔒</div>
        <p className="mt-3 text-slate-300">아직 잠긴 지역이에요.</p>
        <p className="mt-1 text-sm text-slate-500">
          이전 지역을 통과하면 열립니다.
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

  const region = regionName(n);

  async function startSession(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !material.trim()) {
      setError("주제와 학습자료 본문을 모두 입력해 주세요.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, material, regionIndex: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성에 실패했습니다.");
      setStages(data.stages);
      setQuestId(data.id ?? null);
      resetPlay();
      setPhase("playing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  function resetPlay() {
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
  }

  function choose(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === stages[current].answerIndex) setCorrectCount((c) => c + 1);
  }

  async function next() {
    if (current + 1 < stages.length) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }
    // 세션 종료 — 채점
    const didPass = correctCount === stages.length;
    setPassed(didPass);
    setPhase("result");
    if (didPass) {
      // 진행 저장(로그인) + 컨텍스트 갱신
      if (isLoggedIn && questId) {
        try {
          await fetch(`/api/quests/${questId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: true }),
          });
        } catch {
          /* 저장 실패해도 진행은 로컬로 반영 */
        }
      }
      setCompleted(n, { topic: title, questId });
    }
  }

  function retry() {
    resetPlay();
    setPassed(false);
    setPhase("playing");
  }

  // ── 주제 입력 ──
  if (phase === "topic") {
    return (
      <div className="animate-fade-in-up mx-auto max-w-2xl">
        <Link href="/map" className="text-xs text-slate-500 hover:text-slate-300">
          ← 지도로
        </Link>
        <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-indigo-950/60 px-3 py-1 text-xs font-medium text-indigo-300">
            제{n}지역 · {region}
          </div>
          <h1 className="mt-2 font-display text-xl font-bold">
            이 지역의 고대 장치를 깨우자
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            학습할 주제와 자료를 입력하면, 이 지역의 퀴즈 5개가 만들어집니다.
            <br />
            <span className="text-amber-400/80">5문제를 모두 맞혀야</span> 지역을
            통과하고 다음 길이 열려요.
          </p>

          <form onSubmit={startSession} className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-200">
              주제 (제목)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 광합성의 원리, 삼국의 성립 …"
              disabled={generating}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 disabled:opacity-60"
            />
            <label className="mb-2 block text-sm font-medium text-slate-200">
              학습자료 본문
            </label>
            <textarea
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="수업에서 다룬 내용을 붙여넣으세요."
              rows={8}
              disabled={generating}
              className="mb-4 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 disabled:opacity-60"
            />

            {error && (
              <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-500/50"
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                  퀴즈 생성 중…
                </>
              ) : (
                <>⚔️ 도전 시작</>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 결과 ──
  if (phase === "result") {
    return (
      <div className="animate-fade-in-up mx-auto max-w-2xl text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
          <div className="text-5xl">{passed ? "🎉" : "😵"}</div>
          <h1 className="mt-3 font-display text-2xl font-bold">
            {passed ? "지역 통과!" : "통과 실패"}
          </h1>
          <p className="mt-2 text-slate-400">
            제{n}지역 · {region}
          </p>
          <p className="mt-5 text-4xl font-bold text-amber-400">
            {correctCount} <span className="text-xl text-slate-400">/ {stages.length}</span>
          </p>

          {passed ? (
            <>
              <div className="mt-6 rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
                🗺️ 지도의 다음 길이 드러났습니다!
              </div>
              <div className="mt-3 rounded-xl border border-indigo-800/50 bg-indigo-950/30 px-4 py-3 text-left text-sm text-indigo-200">
                📜 발견한 기록: {clueFor(n)}
              </div>
              <div className="mt-7 flex justify-center gap-3">
                <button
                  onClick={() => router.push("/map")}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
                >
                  지도로 (다음 지역 열림)
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-slate-400">
                5문제를 모두 맞혀야 통과할 수 있어요. 해설을 떠올리며 다시 도전해보세요!
              </p>
              <div className="mt-7 flex justify-center gap-3">
                <button
                  onClick={retry}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
                >
                  다시 도전
                </button>
                <Link
                  href="/map"
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  지도로
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── 플레이 (퀴즈 5개) ──
  const stage = stages[current];
  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/map" className="text-xs text-slate-500 hover:text-slate-300">
          ← 지도로 (진행 취소)
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-950/60 px-3 py-1 text-xs font-medium text-indigo-300">
            제{n}지역 · {region}
          </div>
          <span className="text-xs text-slate-400">
            문제 {current + 1} / {stages.length} · 정답 {correctCount}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((current + (revealed ? 1 : 0)) / stages.length) * 100}%` }}
          />
        </div>
      </div>

      <div
        key={current}
        className="animate-fade-in-up rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl"
      >
        {stage.situation && (
          <p className="mb-4 rounded-xl border-l-4 border-amber-600/60 bg-slate-950/50 py-3 pl-4 pr-3 text-sm italic leading-relaxed text-slate-300">
            {stage.situation}
          </p>
        )}

        <h2 className="mb-4 text-lg font-bold leading-snug text-white">
          {stage.question}
        </h2>

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
                {selected === stage.answerIndex ? "정답입니다! 🎉" : "오답입니다."}
              </p>
              <p className="mt-1.5 leading-relaxed text-slate-300">
                {stage.explanation}
              </p>
            </div>
            {stage.objective && (
              <p className="text-xs text-slate-500">📌 학습목표: {stage.objective}</p>
            )}
            <button
              onClick={next}
              className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              {current + 1 < stages.length ? "다음 문제 →" : "결과 보기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

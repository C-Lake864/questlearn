"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SAMPLE_TITLE = "광합성의 원리";
const SAMPLE_MATERIAL = `광합성은 식물이 빛 에너지를 이용해 이산화탄소와 물로부터 포도당과 산소를 만드는 과정이다.
광합성은 엽록체에서 일어나며, 엽록소라는 색소가 빛을 흡수한다.
광합성은 크게 명반응과 암반응(캘빈 회로)으로 나뉜다.
명반응은 틸라코이드 막에서 일어나며 빛 에너지를 이용해 ATP와 NADPH를 만들고 산소를 방출한다.
암반응은 스트로마에서 일어나며 ATP와 NADPH를 이용해 이산화탄소를 포도당으로 고정한다.
광합성에 영향을 주는 요인으로는 빛의 세기, 이산화탄소 농도, 온도가 있다.`;

export default function HomePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [material, setMaterial] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setDemo(!!d.demo))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !material.trim()) {
      setError("제목과 학습자료 본문을 모두 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, material }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "퀘스트 생성에 실패했습니다.");
      }
      // 생성된 퀘스트 상세/플레이 화면으로 이동
      router.push(`/quests/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  function loadSample() {
    setTitle(SAMPLE_TITLE);
    setMaterial(SAMPLE_MATERIAL);
  }

  return (
    <div className="animate-fade-in-up">
      {/* 히어로 */}
      <section className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
          학습자료를 <span className="text-amber-400">게임 퀘스트</span>로
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          수업 자료를 붙여넣으면 AI가 상황·문제·선택지·정답·해설·보상이 담긴
          <br className="hidden sm:block" />
          5단계 게임 퀘스트 퀴즈로 바꿔드립니다.
        </p>
      </section>

      {/* 데모 모드 안내 */}
      {demo && (
        <div className="mb-5 rounded-xl border border-indigo-800/60 bg-indigo-950/30 px-4 py-3 text-sm text-indigo-200">
          🧪 <span className="font-bold">데모 모드</span>로 실행 중입니다. AI(Claude API) 키가
          없어 <span className="font-medium">샘플 퀘스트</span>가 자동 생성돼요. 실제 AI 생성은
          환경변수 <code className="rounded bg-slate-800 px-1">ANTHROPIC_API_KEY</code> 를 넣으면
          바로 활성화됩니다.
        </div>
      )}

      {/* 입력 폼 */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl"
      >
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="title" className="text-sm font-medium text-slate-200">
              학습자료 제목
            </label>
            <button
              type="button"
              onClick={loadSample}
              className="text-xs text-amber-400 hover:text-amber-300 hover:underline"
            >
              예시 채우기
            </button>
          </div>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 광합성의 원리, 조선의 건국 과정 …"
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-amber-500 disabled:opacity-60"
          />
        </div>

        <div className="mb-5">
          <label htmlFor="material" className="mb-2 block text-sm font-medium text-slate-200">
            학습자료 본문
          </label>
          <textarea
            id="material"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="수업에서 다룬 내용을 붙여넣으세요. 문단·개념이 명확할수록 좋은 퀴즈가 나옵니다."
            rows={10}
            disabled={loading}
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-amber-500 disabled:opacity-60"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-500/50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              AI가 퀘스트를 만드는 중… (최대 1분)
            </>
          ) : (
            <>⚔️ 게임 퀘스트 생성하기</>
          )}
        </button>
      </form>
    </div>
  );
}

import Link from "next/link";
import { WORLD_TITLE, WORLD_INTRO, WORLD_HINT } from "@/lib/story";

// 첫 화면 = 세계관 소개 (로그인 없이 누구나 볼 수 있음)
export default function LandingPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
        <p className="text-center text-5xl">🏰</p>
        <h1 className="mt-4 text-center font-display text-3xl font-bold leading-tight">
          {WORLD_TITLE}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          학습자료가 모험이 되는 곳 — 다섯 지역을 탐험하며 배우세요.
        </p>

        <div className="mt-7 space-y-3 text-sm leading-relaxed text-slate-300">
          {WORLD_INTRO.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <blockquote className="mt-6 rounded-xl border-l-4 border-amber-600/60 bg-slate-950/50 py-3 pl-4 pr-3 text-sm italic text-amber-200/90">
          “{WORLD_HINT}”
        </blockquote>

        <div className="mt-8">
          <Link
            href="/map"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-4 text-base font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            🗺️ 모험 시작하기
          </Link>
          <p className="mt-3 text-center text-xs text-slate-500">
            로그인 없이 바로 시작할 수 있어요. 로그인하면 진행 상황이 저장됩니다.
          </p>
        </div>
      </section>

      {/* 진행 방식 안내 */}
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "📜", title: "주제 입력", desc: "각 지역에서 학습자료를 입력해요." },
          { icon: "⚔️", title: "퀴즈 5개", desc: "5문제를 모두 맞히면 지역 통과!" },
          { icon: "🗺️", title: "지역 해금", desc: "통과할 때마다 다음 지역이 열려요." },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center"
          >
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-1 text-sm font-bold">{c.title}</div>
            <div className="mt-1 text-xs text-slate-400">{c.desc}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

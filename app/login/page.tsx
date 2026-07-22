"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // 이메일 확인이 꺼져 있으면 바로 세션이 생깁니다.
        if (data.session) {
          window.location.href = "/map";
          return;
        }
        // 이메일 확인이 켜져 있는 경우
        setInfo("가입 완료! 이메일 인증이 필요하면 메일함을 확인한 뒤 로그인하세요.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/map";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
      // 자주 나오는 영어 에러를 한국어로 안내
      if (msg.includes("Invalid login credentials")) {
        setError("이메일 또는 비밀번호가 올바르지 않아요.");
      } else if (msg.includes("already registered")) {
        setError("이미 가입된 이메일이에요. 로그인해 주세요.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-md py-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold">
          {mode === "login" ? "로그인" : "회원가입"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          QuestLearn에 {mode === "login" ? "로그인하고" : "가입하고"} 내 퀘스트를
          관리하세요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl"
      >
        <label className="mb-2 block text-sm font-medium text-slate-200">
          이메일
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
          className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-amber-500 disabled:opacity-60"
        />

        <label className="mb-2 block text-sm font-medium text-slate-200">
          비밀번호
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6자 이상"
          disabled={loading}
          className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-amber-500 disabled:opacity-60"
        />

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-500/50"
        >
          {loading
            ? "처리 중…"
            : mode === "login"
              ? "로그인"
              : "회원가입"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-400">
        {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setInfo(null);
          }}
          className="font-medium text-amber-400 hover:text-amber-300 hover:underline"
        >
          {mode === "login" ? "회원가입" : "로그인"}
        </button>
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { QuestSummary } from "@/lib/types";

export default function QuestListPage() {
  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  async function loadQuests() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quests");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "목록을 불러오지 못했습니다.");
      setQuests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuests();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("이 퀘스트를 삭제할까요? 되돌릴 수 없습니다.")) return;
    const res = await fetch(`/api/quests/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuests((prev) => prev.filter((q) => q.id !== id));
    } else {
      alert("삭제에 실패했습니다.");
    }
  }

  function startEdit(q: QuestSummary) {
    setEditingId(q.id);
    setEditTitle(q.title);
  }

  async function saveEdit(id: string) {
    const title = editTitle.trim();
    if (!title) return;
    const res = await fetch(`/api/quests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, title } : q)));
      setEditingId(null);
    } else {
      alert("수정에 실패했습니다.");
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">📜 내 퀘스트</h1>
        <Link
          href="/"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
        >
          + 새 퀘스트
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-400">불러오는 중…</p>}

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && quests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 py-16 text-center">
          <p className="text-slate-400">아직 만든 퀘스트가 없어요.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            첫 퀘스트 만들러 가기 →
          </Link>
        </div>
      )}

      <div className="grid gap-3">
        {quests.map((q) => (
          <div
            key={q.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-slate-700"
          >
            {editingId === q.id ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(q.id)}
                    className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-bold">{q.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {q.stageCount}단계 · {new Date(q.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/quests/${q.id}`}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                  >
                    ▶ 플레이
                  </Link>
                  <button
                    onClick={() => startEdit(q)}
                    className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
                    title="제목 수정"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm text-slate-300 transition-colors hover:bg-red-950 hover:text-red-300"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

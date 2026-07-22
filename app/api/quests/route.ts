import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateQuest } from "@/lib/anthropic";

// AI 생성은 시간이 걸리므로 라우트 최대 실행시간을 늘려줍니다. (Vercel)
export const maxDuration = 60;

// GET /api/quests — 저장된 퀘스트 목록 조회
export async function GET() {
  const { data, error } = await getSupabase()
    .from("quests")
    .select("id, title, created_at, stages")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 목록에서는 stage 개수만 넘겨 가볍게 만듭니다.
  const summaries = (data ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    created_at: q.created_at,
    stageCount: Array.isArray(q.stages) ? q.stages.length : 0,
  }));

  return NextResponse.json(summaries);
}

// POST /api/quests — 학습자료를 받아 AI로 퀘스트 생성 후 저장
export async function POST(req: NextRequest) {
  let body: { title?: string; material?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = body.title?.trim();
  const material = body.material?.trim();

  if (!title || !material) {
    return NextResponse.json(
      { error: "제목과 학습자료 본문을 모두 입력해 주세요." },
      { status: 400 },
    );
  }

  // 1) Claude로 5단계 퀘스트 생성
  let stages;
  try {
    stages = await generateQuest(title, material);
  } catch (e) {
    console.error("퀘스트 생성 실패:", e);
    return NextResponse.json(
      { error: "AI 퀘스트 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }

  // 2) DB에 저장
  const { data, error } = await getSupabase()
    .from("quests")
    .insert({ title, source_material: material, stages })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

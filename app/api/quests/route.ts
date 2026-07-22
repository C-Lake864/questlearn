import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuest } from "@/lib/anthropic";

// AI 생성은 시간이 걸리므로 라우트 최대 실행시간을 늘려줍니다. (Vercel)
export const maxDuration = 60;

// GET /api/quests — 로그인한 유저 본인의 퀘스트 목록 조회
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // RLS 덕분에 자동으로 본인 것만 조회됩니다.
  const { data, error } = await supabase
    .from("quests")
    .select("id, title, created_at, stages")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summaries = (data ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    created_at: q.created_at,
    stageCount: Array.isArray(q.stages) ? q.stages.length : 0,
  }));

  return NextResponse.json(summaries);
}

// POST /api/quests — 학습자료를 받아 AI로 퀘스트 생성 후 저장 (본인 소유)
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

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

  // 1) Claude(또는 데모 목업)로 5단계 퀘스트 생성
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

  // 2) DB에 저장 (user_id = 로그인한 유저)
  const { data, error } = await supabase
    .from("quests")
    .insert({ title, source_material: material, stages, user_id: user.id })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuest } from "@/lib/anthropic";
import { regionName } from "@/lib/story";

// AI 생성은 시간이 걸리므로 라우트 최대 실행시간을 늘려줍니다. (Vercel)
export const maxDuration = 60;

// POST /api/quests — 한 지역 세션 생성(주제 → 퀴즈 5개)
// - 로그인: DB에 저장하고 {id, stages} 반환
// - 게스트: 저장 없이 {stages}만 반환
export async function POST(req: NextRequest) {
  let body: { title?: string; material?: string; regionIndex?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = body.title?.trim();
  const material = body.material?.trim();
  const regionIndex = Number(body.regionIndex);

  if (!title || !material) {
    return NextResponse.json(
      { error: "주제와 학습자료 본문을 모두 입력해 주세요." },
      { status: 400 },
    );
  }
  if (!Number.isInteger(regionIndex) || regionIndex < 1 || regionIndex > 5) {
    return NextResponse.json({ error: "잘못된 지역입니다." }, { status: 400 });
  }

  // 1) 해당 지역의 퀴즈 5개 생성
  let stages;
  try {
    stages = await generateQuest(title, material, regionName(regionIndex));
  } catch (e) {
    console.error("퀴즈 생성 실패:", e);
    return NextResponse.json(
      { error: "AI 퀴즈 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }

  // 2) 로그인 상태면 저장
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 게스트: 저장하지 않고 퀴즈만 반환
    return NextResponse.json({ stages }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("quests")
    .insert({
      title,
      source_material: material,
      stages,
      user_id: user.id,
      region_index: regionIndex,
      completed: false,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, stages }, { status: 201 });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REGION_NAMES, regionName } from "@/lib/story";
import type { JourneyRegion } from "@/lib/types";

// GET /api/journey — 지도(여정) 진행 상태
// - 로그인: DB에서 지역별 세션/통과 여부를 읽어 채움
// - 게스트: 빈 여정(모두 미완료) 반환 (진행은 클라이언트 메모리에서 관리)
export async function GET() {
  const empty: JourneyRegion[] = REGION_NAMES.map((name, i) => ({
    index: i + 1,
    name,
    completed: false,
    topic: null,
    questId: null,
  }));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isLoggedIn: false, regions: empty });
  }

  const { data, error } = await supabase
    .from("quests")
    .select("id, title, region_index, completed, created_at")
    .not("region_index", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const regions = empty.map((slot) => {
    const rows = (data ?? []).filter((r) => r.region_index === slot.index);
    if (rows.length === 0) return slot;
    // 통과한 세션이 있으면 그것을, 없으면 가장 최근 세션을 대표로
    const done = rows.find((r) => r.completed);
    const rep = done ?? rows[rows.length - 1];
    return {
      index: slot.index,
      name: regionName(slot.index),
      completed: !!done,
      topic: rep.title as string,
      questId: rep.id as string,
    };
  });

  return NextResponse.json({ isLoggedIn: true, regions });
}

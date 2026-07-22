import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/ai";

// GET /api/config — 프론트엔드가 데모 모드 여부를 알 수 있게 해줍니다.
export async function GET() {
  return NextResponse.json({ demo: isDemoMode() });
}

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 서버 측에서만 사용하는 Supabase 클라이언트.
// 모듈 로드 시점이 아니라 "처음 사용할 때" 생성합니다.
// (그래야 환경변수가 없어도 빌드가 깨지지 않습니다.)
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase 환경변수가 없습니다. SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY를 설정하세요.",
    );
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  return client;
}

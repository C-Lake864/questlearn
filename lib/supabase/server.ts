import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 서버(API 라우트/서버 컴포넌트)에서 쓰는 Supabase 클라이언트.
// 요청 쿠키에서 로그인 세션을 읽어와, 그 유저 권한으로 DB에 접근합니다.
// (RLS 정책이 "자기 데이터만" 접근하도록 강제합니다.)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서 호출된 경우 set이 무시될 수 있으나,
            // 미들웨어가 세션 갱신을 처리하므로 괜찮습니다.
          }
        },
      },
    },
  );
}

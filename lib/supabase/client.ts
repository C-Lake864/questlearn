import { createBrowserClient } from "@supabase/ssr";

// 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트.
// 여기 쓰는 anon(publishable) 키는 공개되어도 되는 키입니다. (RLS가 데이터를 보호)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

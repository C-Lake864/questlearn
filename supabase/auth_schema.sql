-- 로그인(유저별 퀘스트) 기능용 마이그레이션
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.

-- 1) 각 퀘스트에 소유자(user_id) 컬럼 추가
--    (기존 데모 행은 user_id가 비어 있어 목록에 안 보이게 됩니다)
alter table public.quests
  add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 2) RLS(행 단위 보안) 켜기
alter table public.quests enable row level security;

-- 3) 정책: 로그인한 유저가 "자기 소유" 퀘스트만 조회/생성/수정/삭제
drop policy if exists "select own quests" on public.quests;
create policy "select own quests" on public.quests
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "insert own quests" on public.quests;
create policy "insert own quests" on public.quests
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own quests" on public.quests;
create policy "update own quests" on public.quests
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own quests" on public.quests;
create policy "delete own quests" on public.quests
  for delete to authenticated using (auth.uid() = user_id);

-- 4) (선택) 예전 데모 데이터(소유자 없는 행) 정리하려면 아래 주석을 해제해 실행
-- delete from public.quests where user_id is null;

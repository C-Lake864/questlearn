-- QuestLearn DB 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_material text not null,
  stages jsonb not null,
  created_at timestamptz not null default now()
);

-- 최신순 조회를 빠르게
create index if not exists quests_created_at_idx
  on public.quests (created_at desc);

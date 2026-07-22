-- 여정(지도) 진행 기능용 마이그레이션
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.

-- 각 세션(퀘스트)이 어느 지역(1~5)에 속하는지 + 통과 여부
alter table public.quests
  add column if not exists region_index int;

alter table public.quests
  add column if not exists completed boolean not null default false;

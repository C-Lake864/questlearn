# ⚔️ QuestLearn — 학습자료를 게임 퀘스트로

학습자료(텍스트)를 붙여넣으면 **AI(Claude)가 5단계 게임 퀘스트 퀴즈**로 변환해주는 교사용 웹 서비스입니다.
각 단계는 상황 설명 · 문제 · 선택지 · 정답 · 해설 · 보상으로 구성됩니다.

> 📄 기획 문서: [PRD.md](./PRD.md)

## ✨ 주요 기능

- **퀘스트 생성 (AI):** 학습자료 → Claude API가 5단계 게임 퀘스트 자동 생성
- **목록 조회:** 저장된 퀘스트를 카드로 조회
- **플레이:** 5단계 퀴즈를 순서대로 풀고 점수·보상 획득
- **수정 / 삭제:** 퀘스트 제목 수정, 삭제

→ 생성(Create) · 조회(Read) · 수정(Update) · 삭제(Delete) **CRUD 전부 구현**

## 🛠 기술 스택

| 구성 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router, TypeScript) |
| 스타일 | Tailwind CSS |
| 백엔드 | Next.js Route Handlers (`app/api`) |
| DB | Supabase (PostgreSQL) |
| AI | Claude API (`@anthropic-ai/sdk`, 모델 `claude-opus-4-8`) |
| 배포 | Vercel |

## 📁 화면 구성

| 경로 | 화면 |
|------|------|
| `/` | 홈 · 학습자료 입력 → 퀘스트 생성 |
| `/quests` | 저장된 퀘스트 목록 (수정/삭제) |
| `/quests/[id]` | 퀘스트 상세 · 플레이 |

## 🔌 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/quests` | 학습자료 → AI 퀘스트 생성 + 저장 |
| GET | `/api/quests` | 퀘스트 목록 조회 |
| GET | `/api/quests/[id]` | 퀘스트 단건 조회 |
| PATCH | `/api/quests/[id]` | 퀘스트 제목 수정 |
| DELETE | `/api/quests/[id]` | 퀘스트 삭제 |

## 🚀 로컬 실행 방법

1. 의존성 설치
   ```bash
   npm install
   ```
2. Supabase 프로젝트를 만들고 [`supabase/schema.sql`](./supabase/schema.sql)을 SQL Editor에서 실행
3. `.env.example`을 복사해 `.env.local`을 만들고 값 채우기
   ```bash
   cp .env.example .env.local
   ```
   - `ANTHROPIC_API_KEY` — https://console.anthropic.com
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase > Settings > API
4. 개발 서버 실행
   ```bash
   npm run dev
   ```
   → http://localhost:3000

## ☁️ 배포 (Vercel)

1. GitHub 저장소에 push
2. [Vercel](https://vercel.com)에서 저장소 import
3. 환경변수 3개(`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) 등록
4. Deploy → 접속 가능한 URL 획득

## 🧩 데이터 구조

`quests` 테이블:

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK |
| `title` | text | 퀘스트 제목 |
| `source_material` | text | 입력한 학습자료 원문 |
| `stages` | jsonb | 5단계 퀘스트 데이터 |
| `created_at` | timestamptz | 생성 시각 |

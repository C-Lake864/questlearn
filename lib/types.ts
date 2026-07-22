// 한 퀴즈(문제)의 구조
export interface QuestStage {
  stage: number; // 세션 내 문제 번호 (1~5)
  situation?: string; // 지역 안에서의 짧은 상황 연출
  question: string; // 문제
  choices: string[]; // 선택지 (4개)
  answerIndex: number; // 정답 선택지 인덱스 (0~3)
  explanation: string; // 정답 해설
  reward?: string; // (선택) 보상
  objective?: string; // 이 문제로 확인하는 핵심 학습목표
  // 하위호환용(예전 데이터)
  regionName?: string;
  clue?: string;
}

// DB에 저장되는 세션(퀘스트) 한 건
export interface Quest {
  id: string;
  title: string;
  source_material: string;
  stages: QuestStage[];
  region_index: number | null;
  completed: boolean;
  created_at: string;
}

// 지도(여정)의 한 지역 상태
export interface JourneyRegion {
  index: number; // 1~5
  name: string; // 지역 이름 (story.ts)
  completed: boolean; // 통과 여부
  topic: string | null; // 이 지역 세션의 주제(있으면)
  questId: string | null; // 로그인 시 DB id
}

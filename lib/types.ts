// 퀘스트 한 단계(스테이지)의 구조
export interface QuestStage {
  stage: number; // 단계 번호 (1~5)
  regionName?: string; // 다아라 왕국의 지역 이름 (세계관 연출)
  situation: string; // 게임적 상황 설명
  question: string; // 문제
  choices: string[]; // 선택지 (4개)
  answerIndex: number; // 정답 선택지 인덱스 (0~3)
  explanation: string; // 정답 해설
  reward: string; // 획득 보상
  clue?: string; // 정답 시 얻는 '기억의 성배' 단서
  objective: string; // 이 문제로 확인하는 핵심 학습목표 한 문장
}

// DB에 저장되는 퀘스트 한 건의 구조
export interface Quest {
  id: string;
  title: string;
  source_material: string;
  stages: QuestStage[];
  created_at: string;
}

// 목록 조회용(본문/스테이지 상세 없이 가벼운 형태)
export interface QuestSummary {
  id: string;
  title: string;
  created_at: string;
  stageCount: number;
}

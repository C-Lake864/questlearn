import Anthropic from "@anthropic-ai/sdk";
import type { QuestStage } from "./types";
import {
  WORLD_TITLE,
  WORLD_HINT,
  REGION_NAMES,
  regionName,
  clueFor,
} from "./story";

// 클라이언트도 "처음 사용할 때" 생성합니다. (빌드 시점에 깨지지 않도록)
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 없습니다.");
  }
  client = new Anthropic({ apiKey });
  return client;
}

// 최신 모델. (참고: claude-opus-4-8 = Opus 4.8)
const MODEL = "claude-opus-4-8";

// Claude가 반환할 JSON의 구조를 명시(구조화 출력).
const QUEST_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    stages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          stage: { type: "integer" },
          regionName: { type: "string" },
          situation: { type: "string" },
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answerIndex: { type: "integer" },
          explanation: { type: "string" },
          reward: { type: "string" },
          clue: { type: "string" },
          objective: { type: "string" },
        },
        required: [
          "stage",
          "regionName",
          "situation",
          "question",
          "choices",
          "answerIndex",
          "explanation",
          "reward",
          "clue",
          "objective",
        ],
      },
    },
  },
  required: ["stages"],
} as const;

const SYSTEM_PROMPT = `당신은 교육 전문가이자 게임 퀘스트 디자이너입니다.
교사가 준 학습자료를 분석해, "${WORLD_TITLE}" 세계관 안에서 진행되는 5단계 게임 퀘스트형 퀴즈로 변환합니다.

[세계관]
- 다아라 왕국 사람들은 한때 모든 것을 기억했으나, '기억의 성배'가 사라진 뒤 그 능력을 잃었다.
- 주인공(학습자)은 낡은 지도를 들고 왕국의 다섯 지역을 차례로 탐험한다. 각 지역에는 고대 장치가 있고, 그 지역의 지식을 이해해야만 장치가 열리며 지도의 다음 길이 드러난다.
- 지역마다 성배에 관한 '기록(단서)'이 발견되는데, 기록끼리 서로 엇갈려 성배의 진실은 열린 결말로 남는다.
- 지도의 문장: "${WORLD_HINT}"

[작업 절차]
1. 분해: 학습자료를 핵심 개념·주요 사실·개념 간 관계로 나눈다.
2. 매핑: 5개 핵심 주제를 다섯 지역(순서: ${REGION_NAMES.join(" → ")})에 하나씩 배정한다.
3. 각 지역의 고대 장치가 그 주제의 지식을 요구하도록 퀴즈를 만든다.

[출력 규칙] 정확히 5단계(stage 1~5), 각 단계는:
- regionName: 그 단계의 지역 이름 (위 순서를 그대로 사용).
- situation: 그 지역에 도착해 고대 장치를 마주하는 상황을, 학습 주제와 자연스럽게 엮어 몰입감 있게 서술(2~3문장).
- question: 학습자료의 핵심을 확인하는 문제.
- choices: 정확히 4개. 그럴듯한 오답 포함.
- answerIndex: 정답 번호(0~3).
- explanation: 학습자료에 근거한 해설.
- reward: 게임적 보상(예: "지도 조각", "고대의 열쇠").
- clue: 이 지역에서 발견된 '기억의 성배'에 관한 기록 한 줄. 지역마다 관점이 달라(도둑설/왕가 은닉설/저주설/의식설/부재설 등) 서로 엇갈리게 만든다.
- objective: 이 문제로 확인하는 핵심 학습목표 한 문장.

모든 내용은 한국어. 문제는 학습자료의 내용을 정확히 반영하고, 자료에 없는 사실을 지어내지 않는다(단, 세계관 연출용 서사는 허용).`;

export interface GeneratedQuest {
  stages: QuestStage[];
}

// API 키가 없으면 데모(목업) 모드로 동작합니다.
export function isDemoMode(): boolean {
  return !process.env.ANTHROPIC_API_KEY;
}

// 데모 모드용 목업 생성기. 세계관(다아라 왕국) 연출을 포함합니다.
function generateMockQuest(title: string, material: string): QuestStage[] {
  const sentences = material
    .split(/\n|(?<=[.。!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);

  const rewards = [
    "지도 조각 1",
    "고대의 열쇠",
    "빛바랜 왕가의 인장",
    "메아리의 수정",
    "기억의 잔 조각",
  ];

  const stages: QuestStage[] = [];
  for (let i = 0; i < 5; i++) {
    const region = regionName(i + 1);
    const key =
      sentences[i % Math.max(sentences.length, 1)] ||
      `${title}의 핵심 개념 ${i + 1}`;
    const answerIndex = i % 4;
    const choices = [
      "이 학습자료와 관계없는 설명이다",
      "부분적으로만 맞고 핵심을 벗어난 설명이다",
      "반대로 서술되어 틀린 설명이다",
      "출처가 불분명한 추측성 설명이다",
    ];
    choices[answerIndex] = key.length > 60 ? key.slice(0, 60) + "…" : key;

    stages.push({
      stage: i + 1,
      regionName: region,
      situation: `‘${region}’에 도착했다. 이곳의 고대 장치가 낮게 울리며 깨어난다. 장치는 「${title}」에 관한 지식을 요구한다 — 흩어진 기록을 살펴 올바른 답을 찾아야 다음 길이 드러난다.`,
      question: `【${title}】 다음 중 학습자료의 핵심 내용과 일치하는 것은?`,
      choices,
      answerIndex,
      explanation: `학습자료에 따르면 "${key}" 가 핵심입니다. 나머지 선택지는 자료와 어긋나거나 근거가 없습니다. (데모 모드 자동 생성)`,
      reward: rewards[i],
      clue: clueFor(i + 1),
      objective: `${title}의 핵심 내용 ${i + 1}을(를) 정확히 이해했는지 확인한다.`,
    });
  }
  return stages;
}

// 학습자료(제목+본문)를 받아 5단계 퀘스트를 생성합니다.
export async function generateQuest(
  title: string,
  material: string,
): Promise<QuestStage[]> {
  if (isDemoMode()) {
    return generateMockQuest(title, material);
  }

  const userPrompt = `다음 학습자료를 "${WORLD_TITLE}" 세계관의 5단계 게임 퀘스트 퀴즈로 변환해 주세요.

[학습자료 제목]
${title}

[학습자료 본문]
${material}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    output_config: {
      format: {
        type: "json_schema",
        schema: QUEST_SCHEMA,
      },
    },
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI 응답에서 결과를 찾지 못했습니다.");
  }

  const parsed = JSON.parse(textBlock.text) as GeneratedQuest;

  if (!parsed.stages || parsed.stages.length === 0) {
    throw new Error("AI가 퀘스트 단계를 생성하지 못했습니다.");
  }

  return parsed.stages;
}

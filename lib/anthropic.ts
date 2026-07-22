import Anthropic from "@anthropic-ai/sdk";
import type { QuestStage } from "./types";

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
// 구조화 출력은 additionalProperties:false 와 required 를 요구합니다.
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
          situation: { type: "string" },
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answerIndex: { type: "integer" },
          explanation: { type: "string" },
          reward: { type: "string" },
          objective: { type: "string" },
        },
        required: [
          "stage",
          "situation",
          "question",
          "choices",
          "answerIndex",
          "explanation",
          "reward",
          "objective",
        ],
      },
    },
  },
  required: ["stages"],
} as const;

const SYSTEM_PROMPT = `당신은 교육 전문가이자 게임 퀘스트 디자이너입니다.
교사가 준 학습자료를 분석해, 학습자가 몰입할 수 있는 "5단계 게임 퀘스트형 퀴즈"로 변환합니다.

작업 절차:
1. 분해: 학습자료를 핵심 개념, 주요 사실, 개념 간 관계, 반드시 이해해야 할 내용으로 나눕니다.
2. 패턴: 반복되거나 중요하게 강조되는 개념, 문제로 만들기 적합한 내용을 찾습니다.
3. 추상화: 각 문제에서 확인할 핵심 학습목표를 한 문장으로 정리합니다.
4. 알고리즘: 핵심 개념 추출 → 학습목표 선정 → 게임 상황 설정 → 퀴즈 생성 → 정답과 해설 작성.

출력 규칙:
- 정확히 5단계(stage 1~5)를 만듭니다. 난이도는 뒤로 갈수록 조금씩 올립니다.
- 각 단계는 다음을 포함합니다:
  - situation: 게임적 배경/상황 설명(모험, 던전, 미션 등 몰입감 있게).
  - question: 학습자료의 핵심을 확인하는 문제.
  - choices: 선택지 정확히 4개. 그럴듯한 오답을 포함합니다.
  - answerIndex: 정답 선택지의 번호(0부터 시작, 0~3).
  - explanation: 왜 그것이 정답인지 학습자료에 근거해 설명.
  - reward: 게임적 보상(예: "지혜의 룬 +10", "고대의 열쇠 획득").
  - objective: 이 문제로 확인하는 핵심 학습목표 한 문장.
- 모든 내용은 한국어로 작성합니다.
- 문제는 반드시 학습자료의 내용을 정확히 반영해야 하며, 자료에 없는 사실을 지어내지 않습니다.`;

export interface GeneratedQuest {
  stages: QuestStage[];
}

// API 키가 없으면 데모(목업) 모드로 동작합니다.
export function isDemoMode(): boolean {
  return !process.env.ANTHROPIC_API_KEY;
}

// 데모 모드용 목업 생성기.
// API 없이도 학습자료 본문을 활용해 5단계 퀘스트를 만들어 전체 흐름을 시연합니다.
function generateMockQuest(title: string, material: string): QuestStage[] {
  // 본문을 문장 단위로 쪼개 핵심 문장 후보를 만듭니다.
  const sentences = material
    .split(/\n|(?<=[.。!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);

  const rewards = [
    "지혜의 룬 +10",
    "고대의 열쇠 획득",
    "빛나는 학자의 인장",
    "용기의 물약",
    "진리의 성배",
  ];
  const scenes = [
    "지식의 관문 앞에 섰습니다. 첫 번째 시험이 시작됩니다.",
    "안개 낀 도서관 깊은 곳, 낡은 두루마리가 문제를 던집니다.",
    "현자의 탑 중간층. 수호자가 길을 막고 질문합니다.",
    "고대 유적의 봉인 앞. 올바른 답만이 문을 엽니다.",
    "마지막 관문. 이곳을 통과하면 퀘스트가 완성됩니다.",
  ];

  const stages: QuestStage[] = [];
  for (let i = 0; i < 5; i++) {
    const key = sentences[i % Math.max(sentences.length, 1)] ||
      `${title}의 핵심 개념 ${i + 1}`;
    // 정답 위치를 단계마다 다르게 배치
    const answerIndex = i % 4;
    const choices = [
      "이 학습자료와 관계없는 설명이다",
      "부분적으로만 맞고 핵심을 벗어난 설명이다",
      "반대로 서술되어 틀린 설명이다",
      "출처가 불분명한 추측성 설명이다",
    ];
    // 정답 자리에 실제 학습자료 문장을 넣습니다.
    choices[answerIndex] = key.length > 60 ? key.slice(0, 60) + "…" : key;

    stages.push({
      stage: i + 1,
      situation: scenes[i],
      question: `【${title}】 다음 중 학습자료의 핵심 내용과 일치하는 것은?`,
      choices,
      answerIndex,
      explanation: `학습자료에 따르면 "${key}" 가 핵심입니다. 나머지 선택지는 자료와 어긋나거나 근거가 없습니다. (데모 모드에서 자동 생성된 문제입니다.)`,
      reward: rewards[i],
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
  // API 키가 없으면 데모(목업) 모드로 동작합니다.
  if (isDemoMode()) {
    return generateMockQuest(title, material);
  }

  const userPrompt = `다음 학습자료를 5단계 게임 퀘스트 퀴즈로 변환해 주세요.

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

  // 구조화 출력의 결과는 text 블록에 JSON 문자열로 담겨 옵니다.
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

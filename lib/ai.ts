import type { QuestStage } from "./types";
import { WORLD_TITLE } from "./story";

// Google Gemini API로 퀴즈를 생성합니다. (무료 티어)
// 키가 없으면 데모(목업) 모드로 동작합니다.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export function isDemoMode(): boolean {
  return !process.env.GEMINI_API_KEY;
}

// Gemini 구조화 출력용 스키마 (Gemini는 타입을 대문자로 표기)
const QUEST_SCHEMA = {
  type: "OBJECT",
  properties: {
    stages: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          stage: { type: "INTEGER" },
          situation: { type: "STRING" },
          question: { type: "STRING" },
          choices: { type: "ARRAY", items: { type: "STRING" } },
          answerIndex: { type: "INTEGER" },
          explanation: { type: "STRING" },
          objective: { type: "STRING" },
        },
        required: [
          "stage",
          "situation",
          "question",
          "choices",
          "answerIndex",
          "explanation",
          "objective",
        ],
      },
    },
  },
  required: ["stages"],
};

function systemPrompt(regionName: string): string {
  return `당신은 교육 전문가이자 게임 퀘스트 디자이너입니다.
"${WORLD_TITLE}" 세계관의 한 지역 '${regionName}'에서, 교사가 준 학습자료로 5개의 퀴즈로 이루어진 도전을 만듭니다.

[상황]
- 주인공은 다아라 왕국의 '${regionName}'에 도착했다. 이곳의 고대 장치는 이 학습 주제의 지식을 요구한다.
- 5개의 문제를 모두 맞혀야 장치가 열리고, 지도의 다음 길이 드러난다.

[출력 규칙] 정확히 5개(stage 1~5), 각 문제는:
- situation: '${regionName}' 안에서 문제를 마주하는 짧은 상황 연출 한두 문장(학습 주제와 자연스럽게 엮음).
- question: 학습자료의 핵심을 확인하는 문제.
- choices: 정확히 4개. 그럴듯한 오답 포함.
- answerIndex: 정답 번호(0~3).
- explanation: 학습자료에 근거한 해설.
- objective: 이 문제로 확인하는 핵심 학습목표 한 문장.
난이도는 뒤로 갈수록 조금씩 올린다. 모든 내용은 한국어. 학습자료에 없는 사실을 지어내지 않는다(세계관 연출 서사는 허용).`;
}

export interface GeneratedQuest {
  stages: QuestStage[];
}

// 데모 모드용 목업 생성기: 한 지역의 퀴즈 5개.
function generateMockQuest(
  title: string,
  material: string,
  regionName: string,
): QuestStage[] {
  const sentences = material
    .split(/\n|(?<=[.。!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);

  const stages: QuestStage[] = [];
  for (let i = 0; i < 5; i++) {
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
      situation:
        i === 0
          ? `‘${regionName}’의 고대 장치가 깨어난다. 「${title}」의 지식을 시험하는 다섯 개의 물음이 시작된다.`
          : `장치의 ${i + 1}번째 문양이 빛난다.`,
      question: `【${title}】 다음 중 학습자료의 핵심 내용과 일치하는 것은?`,
      choices,
      answerIndex,
      explanation: `학습자료에 따르면 "${key}" 가 핵심입니다. 나머지 선택지는 자료와 어긋나거나 근거가 없습니다. (데모 모드 자동 생성)`,
      objective: `${title}의 핵심 내용 ${i + 1}을(를) 정확히 이해했는지 확인한다.`,
    });
  }
  return stages;
}

// 학습자료(제목+본문)와 지역 이름을 받아 퀴즈 5개를 생성합니다.
// 키가 없거나, Gemini가 한도 초과(429)/오류를 내면 데모(목업) 퀴즈로 자동 대체합니다.
export async function generateQuest(
  title: string,
  material: string,
  regionName: string,
): Promise<QuestStage[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateMockQuest(title, material, regionName);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const userPrompt = `지역: ${regionName}

[학습자료 제목]
${title}

[학습자료 본문]
${material}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(regionName) }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: QUEST_SCHEMA,
          temperature: 0.8,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("빈 응답");

    const parsed = JSON.parse(text) as GeneratedQuest;
    if (!parsed.stages || parsed.stages.length === 0) {
      throw new Error("stages 없음");
    }
    return parsed.stages;
  } catch (e) {
    // 한도 초과·오류 시 데모 퀴즈로 자동 대체 (서비스가 끊기지 않도록)
    console.warn("Gemini 생성 실패 → 데모 퀴즈로 대체:", e);
    return generateMockQuest(title, material, regionName);
  }
}

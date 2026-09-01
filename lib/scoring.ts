import lifestyleQuestionsData from "../data/lifestyle-questions.json";
import mbtiQuestionsData from "../data/mbti-questions.json";
import {
  AXES,
  type Answer,
  type AxisScores,
  type BinaryQuestion,
  type MbtiBinaryQuestion,
  type MbtiIndicator,
  type MbtiPole,
  type OptionId,
  type ScoringResult,
} from "./types";

const lifestyleQuestions = lifestyleQuestionsData as BinaryQuestion[];
const mbtiQuestions = mbtiQuestionsData as MbtiBinaryQuestion[];

/** 각 MBTI 지표를 이루는 두 극 — [0]이 poleWeight 양수가 향하는 "첫 번째 극". */
const INDICATOR_POLES: Record<MbtiIndicator, [MbtiPole, MbtiPole]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildOptionMap(answers: Answer[]): Map<string, OptionId> {
  return new Map(answers.map((a) => [a.questionId, a.optionId]));
}

/**
 * 여러 (실제값, 그 문항에서 나올 수 있던 최소/최대값) 삼중항을 0~100
 * 스케일로 정규화한다 — 기존 "평균"(모든 문항이 동일 비중, 5점 척도)을
 * "정규화된 가중합"으로 일반화한 것으로, 문항마다 다른 가중치·다축
 * 매핑을 지원하기 위함이다. 응답이 하나도 없으면(또는 판별력 있는 문항이
 * 하나도 없으면) 중립값 50을 반환한다 — 기존 averageScale과 동일한 기본값.
 */
function normalizeWeightedSum(
  contributions: { chosen: number; min: number; max: number }[],
): number {
  if (contributions.length === 0) return 50;
  const actual = contributions.reduce((sum, c) => sum + c.chosen, 0);
  const possMin = contributions.reduce((sum, c) => sum + c.min, 0);
  const possMax = contributions.reduce((sum, c) => sum + c.max, 0);
  if (possMax === possMin) return 50; // 판별력 없는 문항들만 있었던 경우
  return ((actual - possMin) / (possMax - possMin)) * 100;
}

/** 라이프스타일 문항 응답으로 5축 점수(0~100)를 계산한다. */
function calculateLifestyleScores(optionMap: Map<string, OptionId>): AxisScores {
  const scores = {} as AxisScores;
  for (const axis of AXES) {
    const contributions = lifestyleQuestions
      .filter((q) => optionMap.has(q.id))
      .map((q) => {
        const [optA, optB] = q.options;
        const wA = optA.axisWeights[axis] ?? 0;
        const wB = optB.axisWeights[axis] ?? 0;
        return { wA, wB, chosenOption: optionMap.get(q.id)! };
      })
      .filter(({ wA, wB }) => wA !== wB) // 이 축에 판별력 없는 문항은 제외
      .map(({ wA, wB, chosenOption }) => ({
        chosen: chosenOption === "A" ? wA : wB,
        min: Math.min(wA, wB),
        max: Math.max(wA, wB),
      }));
    scores[axis] = normalizeWeightedSum(contributions);
  }
  return scores;
}

/**
 * 특정 지표(indicator)에서 특정 극(targetPole)으로 얼마나 기울어 있는지를
 * 0~100 스케일로 계산한다. poleWeight는 INDICATOR_POLES[indicator][0]으로
 * 향하는 부호라, targetPole이 그 반대 극이면 부호를 뒤집어서 정렬한다.
 */
function mbtiPoleStrength(
  indicator: MbtiIndicator,
  targetPole: MbtiPole,
  optionMap: Map<string, OptionId>,
): number {
  const firstPole = INDICATOR_POLES[indicator][0];
  const sign = targetPole === firstPole ? 1 : -1;
  const contributions = mbtiQuestions
    .filter((q) => q.indicator === indicator)
    .filter((q) => optionMap.has(q.id))
    .map((q) => {
      const [optA, optB] = q.options;
      const wA = optA.poleWeight * sign;
      const wB = optB.poleWeight * sign;
      const chosen = optionMap.get(q.id) === "A" ? wA : wB;
      return { chosen, min: Math.min(wA, wB), max: Math.max(wA, wB) };
    });
  return normalizeWeightedSum(contributions);
}

/** 4개 지표 각각 우세한 극을 골라 "ENFP" 같은 4글자 타입을 만든다. */
function calculateMbtiType(optionMap: Map<string, OptionId>): string {
  return (Object.keys(INDICATOR_POLES) as MbtiIndicator[])
    .map((indicator) => {
      const [poleA, poleB] = INDICATOR_POLES[indicator];
      const poleAStrength = mbtiPoleStrength(indicator, poleA, optionMap);
      return poleAStrength >= 50 ? poleA : poleB;
    })
    .join("");
}

/**
 * 라이프스타일 15문항 + MBTI 8문항, 총 23문항 응답을 받아 5축 점수(0~100)와
 * MBTI 4글자 타입을 계산하는 순수 함수. 단일 진단 흐름이라 항상 23개 전체가
 * 넘어오는 걸 전제하지만, 응답이 없는 문항/축은 중립 50으로 처리하는 내부
 * 로직 자체는 그대로라 부분 응답이 들어와도 죽지 않는다.
 */
export function calculateScores(answers: Answer[]): ScoringResult {
  const optionMap = buildOptionMap(answers);
  const lifestyle = calculateLifestyleScores(optionMap);

  const eiE = mbtiPoleStrength("EI", "E", optionMap);
  const snN = mbtiPoleStrength("SN", "N", optionMap);
  const tfF = mbtiPoleStrength("TF", "F", optionMap);
  const jpJ = mbtiPoleStrength("JP", "J", optionMap);

  const axisScores: AxisScores = {
    sociability: lifestyle.sociability * 0.7 + eiE * 0.3,
    openness: lifestyle.openness * 0.7 + snN * 0.3,
    minimalism: clamp(
      lifestyle.minimalism * 0.7 - tfF * 0.3 + jpJ * 0.2,
      0,
      100,
    ),
    activity: lifestyle.activity,
    nature: lifestyle.nature,
  };

  return {
    axisScores,
    mbtiType: calculateMbtiType(optionMap),
  };
}

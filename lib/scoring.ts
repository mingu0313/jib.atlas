import lifestyleQuestionsData from "../data/lifestyle-questions.json";
import mbtiQuestionsData from "../data/mbti-questions.json";
import {
  AXES,
  type Answer,
  type AxisScores,
  type MbtiIndicator,
  type MbtiPole,
  type MbtiQuestion,
  type Question,
  type ScoringResult,
} from "./types";

const lifestyleQuestions = lifestyleQuestionsData as Question[];
const mbtiQuestions = mbtiQuestionsData as MbtiQuestion[];

/** 각 MBTI 지표를 이루는 두 극. */
const INDICATOR_POLES: Record<MbtiIndicator, [MbtiPole, MbtiPole]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

/** 1~5 응답값을 0~100 스케일로 변환한다. */
function toScale(value: number): number {
  return ((value - 1) / 4) * 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 여러 (questionId, value) 쌍의 평균을 0~100 스케일로 계산한다.
 * reverse가 true인 항목은 (6 - value)로 뒤집은 후 반영한다.
 * 응답이 하나도 없으면 중립값인 50을 반환한다.
 */
function averageScale(
  entries: { value: number; reverse: boolean }[],
): number {
  if (entries.length === 0) return 50;
  const sum = entries.reduce((acc, { value, reverse }) => {
    const raw = reverse ? 6 - value : value;
    return acc + toScale(raw);
  }, 0);
  return sum / entries.length;
}

function buildAnswerMap(answers: Answer[]): Map<string, number> {
  return new Map(answers.map((a) => [a.questionId, a.value]));
}

/** 라이프스타일 문항 응답으로 5축 점수(0~100)를 계산한다. */
function calculateLifestyleScores(answerMap: Map<string, number>): AxisScores {
  const scores = {} as AxisScores;
  for (const axis of AXES) {
    const entries = lifestyleQuestions
      .filter((q) => q.axis === axis)
      .filter((q) => answerMap.has(q.id))
      .map((q) => ({ value: answerMap.get(q.id)!, reverse: q.reverseScored }));
    scores[axis] = averageScale(entries);
  }
  return scores;
}

/**
 * 특정 지표(indicator)에서 특정 극(targetPole)으로 얼마나 기울어 있는지를
 * 0~100 스케일로 계산한다. targetPole과 문항의 direction이 다르면
 * (6 - value)로 뒤집어서 targetPole 방향으로 정렬한다.
 */
function mbtiPoleStrength(
  indicator: MbtiIndicator,
  targetPole: MbtiPole,
  answerMap: Map<string, number>,
): number {
  const entries = mbtiQuestions
    .filter((q) => q.indicator === indicator)
    .filter((q) => answerMap.has(q.id))
    .map((q) => ({
      value: answerMap.get(q.id)!,
      reverse: q.direction !== targetPole,
    }));
  return averageScale(entries);
}

/** 4개 지표 각각 우세한 극을 골라 "ENFP" 같은 4글자 타입을 만든다. */
function calculateMbtiType(answerMap: Map<string, number>): string {
  return (Object.keys(INDICATOR_POLES) as MbtiIndicator[])
    .map((indicator) => {
      const [poleA, poleB] = INDICATOR_POLES[indicator];
      const poleAStrength = mbtiPoleStrength(indicator, poleA, answerMap);
      return poleAStrength >= 50 ? poleA : poleB;
    })
    .join("");
}

/**
 * 라이프스타일 15문항 + MBTI 8문항에 대한 응답을 받아
 * 5축 점수(0~100)와 MBTI 4글자 타입을 계산하는 순수 함수.
 */
export function calculateScores(answers: Answer[]): ScoringResult {
  const answerMap = buildAnswerMap(answers);
  const lifestyle = calculateLifestyleScores(answerMap);

  const eiE = mbtiPoleStrength("EI", "E", answerMap);
  const snN = mbtiPoleStrength("SN", "N", answerMap);
  const tfF = mbtiPoleStrength("TF", "F", answerMap);
  const jpJ = mbtiPoleStrength("JP", "J", answerMap);

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
    mbtiType: calculateMbtiType(answerMap),
  };
}

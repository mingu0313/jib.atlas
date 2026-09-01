import lifestyleQuestionsData from "../data/lifestyle-questions.json";
import mbtiQuestionsData from "../data/mbti-questions.json";
import {
  AXES,
  type Answer,
  type Axis,
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
 * 라이프스타일(빠른 진단) 15문항 + MBTI(정밀 모드) 8문항에 대한 응답을 받아
 * 5축 점수(0~100)와 MBTI 4글자 타입을 계산하는 순수 함수.
 *
 * 라이프스타일 15개만 담긴 배열을 넘겨도 완전히 유효한 결과를 낸다 — MBTI
 * 관련 항목은 응답이 없으면 중립 50으로 블렌드에 들어간다(옛 리커트 시절과
 * 동일한 기본값 동작). 정밀 모드로 나머지 8개를 마저 답한 뒤 23개 전체로
 * 이 함수를 다시 호출하면 그게 곧 "재계산"이다 — 별도의 델타/병합 로직
 * 없이 같은 순수 함수를 다시 부르기만 하면 된다.
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

/**
 * 블렌드 구성요소별 가중치(절댓값) — calculateScores의 블렌드 공식과 정확히
 * 같은 값을 그대로 재사용한다. calculatePrecision이 "지금까지 응답한 만큼
 * 이 축 점수가 얼마나 확정됐는지"를 이 가중치 기준으로 계산한다.
 */
const AXIS_BLEND_WEIGHTS: Record<Axis, { lifestyle: number; mbti?: number[] }> = {
  sociability: { lifestyle: 0.7, mbti: [0.3] },
  openness: { lifestyle: 0.7, mbti: [0.3] },
  minimalism: { lifestyle: 0.7, mbti: [0.3, 0.2] },
  activity: { lifestyle: 1.0 },
  nature: { lifestyle: 1.0 },
};

/**
 * 지금까지 응답한 문항만으로 axisScores가 최종값 대비 얼마나 "확정"됐는지를
 * 0~100 스케일로 계산한다 — 연출용 숫자가 아니라 calculateScores와 같은
 * 블렌드 가중치에서 그대로 유도한 실측값이다. 라이프스타일 15개만 답하면
 * activity/nature는 100%(애초에 MBTI 블렌드가 없음), sociability/openness는
 * 70%, minimalism은 70/120≈58.3%가 되고 5축 평균은 약 80% — MBTI 8개를
 * 마저 답하면 전부 100%가 된다.
 */
export function calculatePrecision(answers: Answer[]): number {
  const answeredIds = new Set(answers.map((a) => a.questionId));
  const lifestyleAnswered = lifestyleQuestions.filter((q) => answeredIds.has(q.id)).length;
  const lifestyleFraction = lifestyleQuestions.length === 0 ? 1 : lifestyleAnswered / lifestyleQuestions.length;

  const mbtiFractionByIndicator = (indicator: MbtiIndicator) => {
    const questions = mbtiQuestions.filter((q) => q.indicator === indicator);
    if (questions.length === 0) return 1;
    const answered = questions.filter((q) => answeredIds.has(q.id)).length;
    return answered / questions.length;
  };
  // MBTI 블렌드 가중치는 인덱스 순서대로 EI/SN/TF/JP에 대응한다 —
  // AXIS_BLEND_WEIGHTS[axis].mbti의 각 항목이 어떤 지표인지는
  // calculateScores의 실제 블렌드식(eiE→sociability, snN→openness,
  // tfF/jpJ→minimalism)과 짝을 맞춰 아래에서 축마다 명시적으로 고른다.
  const mbtiFractionsByAxis: Record<Axis, number[]> = {
    sociability: [mbtiFractionByIndicator("EI")],
    openness: [mbtiFractionByIndicator("SN")],
    minimalism: [mbtiFractionByIndicator("TF"), mbtiFractionByIndicator("JP")],
    activity: [],
    nature: [],
  };

  const axisPrecisions = AXES.map((axis) => {
    const { lifestyle, mbti = [] } = AXIS_BLEND_WEIGHTS[axis];
    const mbtiFractions = mbtiFractionsByAxis[axis];
    const totalWeight = lifestyle + mbti.reduce((sum, w) => sum + w, 0);
    const resolvedWeight =
      lifestyle * lifestyleFraction + mbti.reduce((sum, w, i) => sum + w * mbtiFractions[i], 0);
    return (resolvedWeight / totalWeight) * 100;
  });

  return axisPrecisions.reduce((sum, p) => sum + p, 0) / axisPrecisions.length;
}

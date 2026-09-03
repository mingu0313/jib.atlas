import { AXES, type Axis, type AxisScores, type TraitBand } from "./types";

/**
 * 점수 기준 상위 축 n개를 뽑는다. "가장 높은 값"이 아니라 "중립(50)에서 가장
 * 멀리 떨어진, 즉 가장 또렷한(distinctive)" 축을 기준으로 고른다.
 *
 * 왜: 5축은 전부 양극형이라(예: sociability가 낮다=내향적이라는 것도 그 자체로
 * 뚜렷한 특징) 단순히 raw score가 높은 순으로 뽑으면, 유독 낮은 축(가장 튀는
 * 특징)이 다른 밋밋한 중간값 축들에 밀려 한 번도 안 뽑히는 문제가 있었다.
 * 예: [sociability=10, minimalism=55, activity=60, openness=52, nature=48]인
 * 유저는 사실 "극단적으로 내향적"이 가장 또렷한 특징인데, raw-score 정렬로는
 * activity/minimalism/openness만 뽑히고 sociability=10은 영영 안 뽑힌다.
 *
 * 동점(거리가 같음)이면 AXES에 나열된 순서를 따른다(Array.sort는 안정 정렬).
 */
export function pickTopAxesByExtremity(
  axisScores: AxisScores,
  count: number,
): Axis[] {
  return [...AXES]
    .sort(
      (a, b) => Math.abs(axisScores[b] - 50) - Math.abs(axisScores[a] - 50),
    )
    .slice(0, count);
}

/** 중립(50)을 기준으로 한 단순 2극 밴드. Feature.band와 짝을 맞추는 데 쓴다. */
export function simpleBand(score: number): "high" | "low" {
  return score >= 50 ? "high" : "low";
}

const HIGH_THRESHOLD = 70;
const LOW_THRESHOLD = 30;

/** 70점 이상 high, 30점 이하 low, 그 사이는 mid인 3구간 밴드.
 * trait-descriptions.json류(high/mid/low 3종 문구를 가진 데이터)를 고를 때 쓴다.
 * (원래 lib/explain.ts 안의 getBand였다 — lib/interiorMatching.ts에서도 같은
 * 기준이 필요해서 여기로 옮겼다.) */
export function getTraitBand(score: number): TraitBand {
  if (score >= HIGH_THRESHOLD) return "high";
  if (score <= LOW_THRESHOLD) return "low";
  return "mid";
}

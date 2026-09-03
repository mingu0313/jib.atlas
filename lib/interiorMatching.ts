import interiorReasonPhrasesData from "../data/interior-reason-phrases.json";
import interiorStyleDescriptionsData from "../data/interior-style-descriptions.json";
import interiorStylesData from "../data/interior-styles.json";
import { getTraitBand } from "./axisUtils";
import { conjunctionParticle, subjectParticle, toConnectiveForm } from "./koreanGrammar";
import { AXES, type Axis, type AxisScores, type TraitDescriptions } from "./types";

/**
 * STEP 8 — 결과 페이지 "AI 인테리어 추천". house-type 매칭(lib/matching.ts)과
 * 같은 유클리드 거리 방식을 인테리어 스타일 프로필에도 그대로 적용한다.
 * (STEP 문서는 "코사인 유사도"를 언급했지만, house-type 매칭은 STEP 4에서
 * 코사인을 의도적으로 버리고 유클리드 거리로 바꾼 상태라 — 크기를 무시하는
 * 코사인은 "축소된 비율의 프로필"을 실제로 동떨어진 성향과 거의 동일하게
 * 취급하는 문제가 있었다 — 여기서도 유클리드를 그대로 재사용한다.)
 */

/** 향후 실제 쇼핑 연동을 위한 자리 — 지금은 항상 빈 배열. IsoFurnitureDef의
 * brand?/priceKrw?/purchaseUrl?처럼 "비워두되 채워지면 로직 변경 없이 동작"
 * 시키려는 목적. */
export interface InteriorStyleProfile {
  id: string;
  name: string;
  badgeLabel: string;
  /** 유저 점수와 무관한, 스타일 자체를 소개하는 고정 한 줄. 카드 설명의
   * 첫 문장으로 쓰고, 왜 이 사람과 맞는지는 generateInteriorExplanation()의
   * 동적 문장이 이어받는다. */
  styleBlurb: string;
  scoreProfile: AxisScores;
  photoPath: string;
  productLinks: never[];
}

export interface InteriorStyleMatch {
  profile: InteriorStyleProfile;
  /** 유저 스코어와 프로필 scoreProfile 간 유사도 (0~100%). */
  similarity: number;
  /** 이 프로필이 채택되는 데 가장 크게 기여한 축 1~2개, 기여도 내림차순. */
  contributingAxes: Axis[];
}

const interiorStyles = interiorStylesData as InteriorStyleProfile[];
const interiorStyleDescriptions = interiorStyleDescriptionsData as TraitDescriptions;
const interiorReasonPhrases = interiorReasonPhrasesData as TraitDescriptions;

/** 이미 채택된 카드와 이 정도 이상 유사하면(%) "너무 몰린" 걸로 보고 다음 순위로 대체한다. */
const DIVERSITY_THRESHOLD = 85;

/** 상위 1~2개를 고를 때 두 번째 축까지 넣을지 가르는 최소 기여도(0~1). */
const MIN_SECOND_AXIS_CONTRIBUTION = 0.3;

// lib/matching.ts와 동일한 유클리드 거리 → 유사도(%) 변환.
function euclideanDistance(a: AxisScores, b: AxisScores): number {
  return Math.sqrt(AXES.reduce((sum, axis) => sum + (a[axis] - b[axis]) ** 2, 0));
}

const MAX_DISTANCE = Math.sqrt(AXES.length * 100 ** 2);

function distanceToSimilarity(distance: number): number {
  return Math.max(0, Math.min(100, 100 - (distance / MAX_DISTANCE) * 100));
}

/**
 * 이 축이 프로필 채택에 얼마나 기여했는지: 프로필이 이 축에서 얼마나 또렷한
 * 입장을 취하는지(extremity, 중립 50에서 먼 정도) × 유저 점수가 그 입장에
 * 얼마나 가까운지(closeness)를 곱한다. 두 값 다 0~1로 정규화.
 */
function axisContribution(userScores: AxisScores, profile: AxisScores, axis: Axis): number {
  const extremity = Math.abs(profile[axis] - 50) / 50;
  const closeness = 1 - Math.abs(userScores[axis] - profile[axis]) / 100;
  return extremity * closeness;
}

/** 기여도 내림차순 상위 1~2개 축. 2번째 축은 기여도가 최소 기준을 넘을 때만 포함한다. */
function pickContributingAxes(userScores: AxisScores, profile: AxisScores): Axis[] {
  const ranked = [...AXES].sort(
    (a, b) => axisContribution(userScores, profile, b) - axisContribution(userScores, profile, a),
  );
  const [first, second] = ranked;
  if (axisContribution(userScores, profile, second) >= MIN_SECOND_AXIS_CONTRIBUTION) {
    return [first, second];
  }
  return [first];
}

/**
 * 유저의 5축 스코어와 가장 잘 맞는 인테리어 스타일 프로필 상위 4개를 고른다.
 * 그냥 유사도 순으로 4개를 뽑으면 비슷한 프로필끼리 몰릴 수 있어서, 이미
 * 채택된 카드와 너무 비슷한(DIVERSITY_THRESHOLD 이상) 후보는 건너뛰고 다음
 * 순위로 대체한다 — 단, 그렇게 걸러내다 count를 못 채우면(전부 서로
 * 비슷하면) 다양성 기준을 포기하고 유사도 순으로 채워 항상 count개를 보장한다.
 * 순수 함수: 입력→출력만, 부작용 없음.
 */
export function matchInteriorStyles(
  userAxisScores: AxisScores,
  count = 4,
  profiles: InteriorStyleProfile[] = interiorStyles,
): InteriorStyleMatch[] {
  const ranked = profiles
    .map((profile) => ({
      profile,
      similarity: distanceToSimilarity(euclideanDistance(userAxisScores, profile.scoreProfile)),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const selected: typeof ranked = [];
  for (const candidate of ranked) {
    if (selected.length >= count) break;
    const tooSimilarToSelected = selected.some(
      (s) =>
        distanceToSimilarity(euclideanDistance(candidate.profile.scoreProfile, s.profile.scoreProfile)) >=
        DIVERSITY_THRESHOLD,
    );
    if (!tooSimilarToSelected) selected.push(candidate);
  }
  if (selected.length < count) {
    for (const candidate of ranked) {
      if (selected.length >= count) break;
      if (!selected.includes(candidate)) selected.push(candidate);
    }
  }

  return selected.map(({ profile, similarity }) => ({
    profile,
    similarity,
    contributingAxes: pickContributingAxes(userAxisScores, profile.scoreProfile),
  }));
}

const AXIS_BADGE: Record<Axis, Record<"high" | "low", string>> = {
  sociability: { high: "사교적 공간", low: "혼자만의 공간" },
  minimalism: { high: "미니멀 지향", low: "맥시멀 지향" },
  activity: { high: "활동적 공간", low: "휴식 중심" },
  openness: { high: "개방감 강조", low: "아늑한 구조" },
  nature: { high: "자연 친화", low: "실용 마감" },
};

/**
 * 카드 우상단 캡슐 뱃지 문구. 1순위는 항상 "BEST MATCH"로 고정하고,
 * 나머지는 가장 크게 기여한 축+극(band)을 라벨로 보여준다. 유저 점수가
 * 그 축에서 mid(30~70)면 축 라벨이 애매해지니 프로필 고유 뱃지로 대체한다.
 */
export function badgeLabelFor(userAxisScores: AxisScores, match: InteriorStyleMatch, rank: number): string {
  if (rank === 0) return "BEST MATCH";
  const [topAxis] = match.contributingAxes;
  const band = getTraitBand(userAxisScores[topAxis]);
  if (band === "mid") return match.profile.badgeLabel;
  return AXIS_BADGE[topAxis][band];
}

/**
 * "이 프로필이 왜 이 사람에게 맞는지" 설명 문구를 조립하는 순수 함수(템플릿
 * 조합 방식 — LLM 호출 없음). contributingAxes 1~2개를 캐주얼한 이유 문구
 * (data/interior-reason-phrases.json)와 인테리어 특징 문구
 * (data/interior-style-descriptions.json)로 엮어 한 문장을 만든다.
 *
 * 원래 lib/explain.ts와 같은 소스(trait-descriptions.json)의 길고 격식체인
 * 문장을 그대로 이어붙였더니 "설명이 뭐라하는지 모르겠다"는 피드백을 받아서
 * (성향 문구 두 개를 관형절로 겹쳐 쓰면 한 문장이 너무 길고 무거워진다),
 * "당신은 ~하는 사람이니까, ~한 공간이 찰떡이에요!"처럼 짧고 캐주얼한
 * 전용 문구로 다시 만들었다.
 */
export function generateInteriorExplanation(userAxisScores: AxisScores, match: InteriorStyleMatch): string {
  const axes = match.contributingAxes;
  const bands = axes.map((axis) => getTraitBand(userAxisScores[axis]));
  const reasons = axes.map((axis, i) => interiorReasonPhrases[axis][bands[i]]);
  const features = axes.map((axis, i) => interiorStyleDescriptions[axis][bands[i]]);

  const reasonPhrase = reasons.length === 2 ? `${toConnectiveForm(reasons[0])} ${reasons[1]}` : reasons[0];

  const featurePhrase =
    features.length === 2
      ? `${features[0]}${conjunctionParticle(features[0])} ${features[1]}${subjectParticle(features[1])}`
      : `${features[0]}${subjectParticle(features[0])}`;

  return `당신은 ${reasonPhrase} 사람이니까, ${featurePhrase} 있는 이 공간이 찰떡이에요!`;
}

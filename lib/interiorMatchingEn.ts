import interiorReasonPhrasesEnData from "../data/interior-reason-phrases.en.json";
import interiorStyleDescriptionsEnData from "../data/interior-style-descriptions.en.json";
import interiorStylesEnData from "../data/interior-styles.en.json";
import { getTraitBand } from "./axisUtils";
import type { Axis, AxisScores, TraitDescriptions } from "./types";
import type { InteriorStyleMatch, InteriorStyleProfile } from "./interiorMatching";

/**
 * lib/interiorMatching.ts의 영문판(STEP 11 다국어 확장). matchInteriorStyles
 * 자체는 이미 profiles 파라미터를 받는 언어 무관 순수 함수라 그대로 재사용
 * 하고(app/en/result/interiors/page.tsx에서 interiorStylesEn을 넘겨 호출),
 * 여기선 한국어 전용 조사(koreanGrammar.ts) 없이 badgeLabelFor/
 * generateInteriorExplanation의 영문 버전만 새로 짠다 — lib/explainEn.ts와
 * 같은 이유(영어는 콤마+and로 충분해서 훨씬 단순하다).
 */

export const interiorStylesEn = interiorStylesEnData as InteriorStyleProfile[];
const interiorStyleDescriptionsEn = interiorStyleDescriptionsEnData as TraitDescriptions;
const interiorReasonPhrasesEn = interiorReasonPhrasesEnData as TraitDescriptions;

const AXIS_BADGE_EN: Record<Axis, Record<"high" | "low", string>> = {
  sociability: { high: "Social Space", low: "Solo Retreat" },
  minimalism: { high: "Minimalist", low: "Maximalist" },
  activity: { high: "Active Space", low: "Restful" },
  openness: { high: "Open & Airy", low: "Cozy & Divided" },
  nature: { high: "Nature-Forward", low: "Practical Finish" },
};

/** lib/interiorMatching.ts의 badgeLabelFor와 동일한 로직, 영문 라벨만 다르다. */
export function badgeLabelForEn(userAxisScores: AxisScores, match: InteriorStyleMatch, rank: number): string {
  if (rank === 0) return "BEST MATCH";
  const [topAxis] = match.contributingAxes;
  const band = getTraitBand(userAxisScores[topAxis]);
  if (band === "mid") return match.profile.badgeLabel;
  return AXIS_BADGE_EN[topAxis][band];
}

/** lib/interiorMatching.ts의 EXPLANATION_TEMPLATES와 같은 4가지 순환 문장 틀 —
 * 영어는 조사 변화가 없어 "and"로만 이어 붙이면 된다. featurePhrase는 항상
 * "a space with ..." 형태로 끝나도록 데이터(interior-style-descriptions.en.json)
 * 쪽 문구를 맞춰뒀다. */
const EXPLANATION_TEMPLATES_EN: Array<(reasonPhrase: string, featurePhrase: string) => string> = [
  (reasonPhrase, featurePhrase) => `You're someone ${reasonPhrase}, so a space with ${featurePhrase} is a perfect match!`,
  (reasonPhrase, featurePhrase) => `A space with ${featurePhrase} — perfect for someone ${reasonPhrase} like you.`,
  (reasonPhrase, featurePhrase) => `For someone ${reasonPhrase}, we'd recommend a space with ${featurePhrase}.`,
  (reasonPhrase, featurePhrase) => `If a space with ${featurePhrase} sounds like you, someone ${reasonPhrase} will love it.`,
];

export function generateInteriorExplanationEn(userAxisScores: AxisScores, match: InteriorStyleMatch, rank = 0): string {
  const axes = match.contributingAxes;
  const bands = axes.map((axis) => getTraitBand(userAxisScores[axis]));
  const reasons = axes.map((axis, i) => interiorReasonPhrasesEn[axis][bands[i]]);
  const features = axes.map((axis, i) => interiorStyleDescriptionsEn[axis][bands[i]]);

  const reasonPhrase = reasons.length === 2 ? `${reasons[0]} and ${reasons[1]}` : reasons[0];
  const featurePhrase = features.length === 2 ? `${features[0]} and ${features[1]}` : features[0];

  const template = EXPLANATION_TEMPLATES_EN[rank % EXPLANATION_TEMPLATES_EN.length];
  return template(reasonPhrase, featurePhrase);
}

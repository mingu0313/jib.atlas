import traitDescriptionsEnData from "../data/trait-descriptions.en.json";
import { pickTopAxesByExtremity, simpleBand } from "./axisUtils";
import {
  type AxisScores,
  type HouseTemplate,
  type TraitBand,
  type TraitDescriptions,
} from "./types";

const traitDescriptionsEn = traitDescriptionsEnData as TraitDescriptions;

const HIGH_THRESHOLD = 70;
const LOW_THRESHOLD = 30;

function getBand(score: number): TraitBand {
  if (score >= HIGH_THRESHOLD) return "high";
  if (score <= LOW_THRESHOLD) return "low";
  return "mid";
}

/**
 * lib/explain.ts의 영문판. 한국어판은 조사(이/가)·어미(-는→-고) 변환이 필요한
 * 한국어 전용 문법이라 그대로 재사용할 수 없어서(STEP 11), 접속만 다른 훨씬
 * 단순한 영어 문법(콤마 + and)으로 새로 짠다. 로직(상위 축 3개 선정, 밴드에
 * 맞는 feature 필터링)은 한국어판과 동일하게 맞췄다.
 */
export function generateExplanationEn(
  userAxisScores: AxisScores,
  matchedTemplate: HouseTemplate,
): string {
  const topAxes = pickTopAxesByExtremity(userAxisScores, 3);
  const descriptions = topAxes.map(
    (axis) => traitDescriptionsEn[axis][getBand(userAxisScores[axis])],
  );

  const traitList =
    descriptions.length <= 2
      ? descriptions.join(" and ")
      : `${descriptions.slice(0, -1).join(", ")}, and ${descriptions[descriptions.length - 1]}`;
  const traitSentence = `You're someone who ${traitList}.`;
  const matchSentence = `That's why the ${matchedTemplate.name} suits you.`;

  const relevantFeatures = matchedTemplate.features.filter(
    (f) =>
      topAxes.includes(f.linkedTrait) &&
      f.band === simpleBand(userAxisScores[f.linkedTrait]),
  );
  const featuresToShow =
    relevantFeatures.length > 0 ? relevantFeatures : matchedTemplate.features;
  const featureLines = featuresToShow.map((f) => `- ${f.text}`);

  return [traitSentence, matchSentence, ...featureLines].join("\n");
}

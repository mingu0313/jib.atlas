import traitDescriptionsData from "../data/trait-descriptions.json";
import { getTraitBand, pickTopAxesByExtremity, simpleBand } from "./axisUtils";
import { subjectParticle, toConnectiveForm } from "./koreanGrammar";
import { type AxisScores, type HouseTemplate, type TraitDescriptions } from "./types";

const traitDescriptions = traitDescriptionsData as TraitDescriptions;

/**
 * 유저의 5축 스코어와 매칭된 집 구조 템플릿을 받아
 * "왜 이 구조가 어울리는지" 설명 텍스트를 조립하는 순수 함수.
 */
export function generateExplanation(
  userAxisScores: AxisScores,
  matchedTemplate: HouseTemplate,
): string {
  const topAxes = pickTopAxesByExtremity(userAxisScores, 3);
  const descriptions = topAxes.map(
    (axis) => traitDescriptions[axis][getTraitBand(userAxisScores[axis])],
  );

  const traitPhrases = descriptions.map((desc, i) =>
    i === descriptions.length - 1 ? desc : toConnectiveForm(desc),
  );
  const traitSentence = `당신은 ${traitPhrases.join(" ")} 타입이에요.`;

  const particle = subjectParticle(matchedTemplate.name);
  const matchSentence = `그래서 ${matchedTemplate.name}${particle} 어울려요.`;

  // 축(axis)뿐 아니라 극(band)까지 맞아야 한다 — 예를 들어 유저의 상위 축이
  // "minimalism(low, 즉 맥시멀 성향)"이면 미니멀을 어필하는 feature가 아니라
  // 맥시멀을 어필하는 feature를 보여줘야 한다.
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

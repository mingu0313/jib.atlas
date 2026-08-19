import traitDescriptionsData from "../data/trait-descriptions.json";
import {
  AXES,
  type Axis,
  type AxisScores,
  type HouseTemplate,
  type TraitBand,
  type TraitDescriptions,
} from "./types";

const traitDescriptions = traitDescriptionsData as TraitDescriptions;

const HIGH_THRESHOLD = 70;
const LOW_THRESHOLD = 30;

function getBand(score: number): TraitBand {
  if (score >= HIGH_THRESHOLD) return "high";
  if (score <= LOW_THRESHOLD) return "low";
  return "mid";
}

/** 점수 기준 상위 축 n개를 뽑는다 (동점이면 AXES에 나열된 순서를 따른다). */
function pickTopAxes(axisScores: AxisScores, count: number): Axis[] {
  return [...AXES]
    .sort((a, b) => axisScores[b] - axisScores[a])
    .slice(0, count);
}

/**
 * trait-descriptions.json의 문구는 전부 관형사형 어미 "-는"으로 끝난다
 * (예: "사람들과 어울리는 시간을 즐기는"). 이 어미는 동사 어간에 붙는 어미라
 * 마지막 글자 "는"을 "고"로 바꾸면 그대로 연결형("-고")이 된다
 * (예: "즐기는" → "즐기고"). 나열 중 마지막 문구가 아닐 때 이 변환을 쓴다.
 */
function toConnectiveForm(description: string): string {
  return `${description.slice(0, -1)}고`;
}

const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;

/** 이름의 마지막 글자 받침 유무에 따라 주격 조사 "이"/"가"를 고른다. */
function subjectParticle(name: string): "이" | "가" {
  const lastChar = name.charCodeAt(name.length - 1);
  if (lastChar < HANGUL_SYLLABLE_START || lastChar > HANGUL_SYLLABLE_END) {
    return "가";
  }
  const hasBatchim = (lastChar - HANGUL_SYLLABLE_START) % 28 !== 0;
  return hasBatchim ? "이" : "가";
}

/**
 * 유저의 5축 스코어와 매칭된 집 구조 템플릿을 받아
 * "왜 이 구조가 어울리는지" 설명 텍스트를 조립하는 순수 함수.
 */
export function generateExplanation(
  userAxisScores: AxisScores,
  matchedTemplate: HouseTemplate,
): string {
  const topAxes = pickTopAxes(userAxisScores, 3);
  const descriptions = topAxes.map(
    (axis) => traitDescriptions[axis][getBand(userAxisScores[axis])],
  );

  const traitPhrases = descriptions.map((desc, i) =>
    i === descriptions.length - 1 ? desc : toConnectiveForm(desc),
  );
  const traitSentence = `당신은 ${traitPhrases.join(" ")} 타입이에요.`;

  const particle = subjectParticle(matchedTemplate.name);
  const matchSentence = `그래서 ${matchedTemplate.name}${particle} 어울려요.`;

  const relevantFeatures = matchedTemplate.features.filter((f) =>
    topAxes.includes(f.linkedTrait),
  );
  const featuresToShow =
    relevantFeatures.length > 0 ? relevantFeatures : matchedTemplate.features;
  const featureLines = featuresToShow.map((f) => `- ${f.text}`);

  return [traitSentence, matchSentence, ...featureLines].join("\n");
}

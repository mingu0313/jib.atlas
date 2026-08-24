import traitDescriptionsData from "../data/trait-descriptions.json";
import traitDescriptionsEnData from "../data/trait-descriptions.en.json";
import { pickTopAxesByExtremity, simpleBand } from "./axisUtils";
import { type Axis, type AxisScores, type TraitDescriptions } from "./types";

const traitDescriptions = traitDescriptionsData as TraitDescriptions;
const traitDescriptionsEn = traitDescriptionsEnData as TraitDescriptions;

/**
 * 결과 페이지의 "캐릭터 네이밍" — 5축 스코어에서 가장 두드러진(중립에서 가장
 * 먼) 축 2개를 뽑아 수식어(2순위 축) + 정체성 명사(1순위 축)를 조합한 짧은
 * 별명을 만든다. 순수 함수. trait-descriptions.json과 톤은 맞추되 문장이
 * 아닌 짧은 라벨을 생성한다.
 *
 * "오픈마인드 시티러버"처럼 실제로 안 쓰는 영단어 조어를 한국어 어미에
 * 그대로 붙인 이름들이 "처음 들어온 사람은 무슨 소린지 모르겠다"는
 * 피드백을 받아서, 실제로 쓰이는 단어(인싸/아싸, 미니멀리스트/맥시멀리스트
 * 같은 이미 자리잡은 말)나 순우리말 조합(활동파/여유파 같은 "-파" 계열)
 * 으로 다시 골랐다. description은 왜 이 이름이 붙었는지 한 줄로 풀어주는
 * 문장 — trait-descriptions.json의 1순위 축 설명을 그대로 재사용한다.
 */

type Band = "high" | "low";

/** 정체성 명사 — 1순위 축을 대표하는 캐릭터 유형. */
const IDENTITY: Record<Axis, Record<Band, string>> = {
  sociability: { high: "인싸", low: "아싸" },
  minimalism: { high: "미니멀리스트", low: "맥시멀리스트" },
  activity: { high: "활동파", low: "여유파" },
  openness: { high: "모험파", low: "안정파" },
  nature: { high: "자연파", low: "도시파" },
};

/** 수식어 — 2순위 축의 색을 입히는 접두어. */
const MODIFIER: Record<Axis, Record<Band, string>> = {
  sociability: { high: "사교적인", low: "조용한" },
  minimalism: { high: "미니멀한", low: "맥시멀한" },
  activity: { high: "활동적인", low: "여유로운" },
  openness: { high: "개방적인", low: "안정적인" },
  nature: { high: "자연친화적인", low: "실용적인" },
};

export interface Persona {
  /** "자연친화적인 인싸" 형태의 짧은 캐릭터 이름. */
  name: string;
  /** 이름을 만드는 데 쓰인 상위 축 2개 (1순위, 2순위 순서). */
  topAxes: [Axis, Axis];
  /** 이름 아래 보여줄 한 줄 설명 — 1순위 축 기준. */
  description: string;
}

export function generatePersona(axisScores: AxisScores): Persona {
  const [primary, secondary] = pickTopAxesByExtremity(axisScores, 2) as [
    Axis,
    Axis,
  ];
  const primaryBand = simpleBand(axisScores[primary]);
  const identity = IDENTITY[primary][primaryBand];
  const modifier = MODIFIER[secondary][simpleBand(axisScores[secondary])];
  return {
    name: `${modifier} ${identity}`,
    topAxes: [primary, secondary],
    description: `${traitDescriptions[primary][primaryBand]} 타입이에요.`,
  };
}

export type RarityTier = "레어" | "언커먼" | "커먼";

/** 매칭 유사도(%)를 기준으로 한 재미용 희귀도 등급. */
export function getRarityTier(similarity: number): RarityTier {
  if (similarity >= 85) return "레어";
  if (similarity >= 70) return "언커먼";
  return "커먼";
}

// ── 영문(en) 버전 — /en 라우트 전용. 기존 한국어 함수/타입은 그대로 두고
// 별도로 추가한다(house_posts.rarity_tier 등 이미 저장된 한국어 값과 섞이지
// 않도록, 리네이밍이나 매개변수화 대신 새 함수로 분리). STEP 11 참고. ──

const IDENTITY_EN: Record<Axis, Record<Band, string>> = {
  sociability: { high: "Socializer", low: "Recluse" },
  minimalism: { high: "Minimalist", low: "Collector" },
  activity: { high: "Mover", low: "Retreater" },
  openness: { high: "Explorer", low: "Homebody" },
  nature: { high: "Gardener", low: "City Lover" },
};

const MODIFIER_EN: Record<Axis, Record<Band, string>> = {
  sociability: { high: "Social", low: "Quiet" },
  minimalism: { high: "Minimal", low: "Maximal" },
  activity: { high: "Active", low: "Easygoing" },
  openness: { high: "Open-Minded", low: "Grounded" },
  nature: { high: "Green", low: "Practical" },
};

export function generatePersonaEn(axisScores: AxisScores): Persona {
  const [primary, secondary] = pickTopAxesByExtremity(axisScores, 2) as [
    Axis,
    Axis,
  ];
  const primaryBand = simpleBand(axisScores[primary]);
  const identity = IDENTITY_EN[primary][primaryBand];
  const modifier = MODIFIER_EN[secondary][simpleBand(axisScores[secondary])];
  return {
    name: `The ${modifier} ${identity}`,
    topAxes: [primary, secondary],
    description: `You're someone who ${traitDescriptionsEn[primary][primaryBand]}.`,
  };
}

export type RarityTierEn = "Rare" | "Uncommon" | "Common";

export function getRarityTierEn(similarity: number): RarityTierEn {
  if (similarity >= 85) return "Rare";
  if (similarity >= 70) return "Uncommon";
  return "Common";
}

import { pickTopAxesByExtremity, simpleBand } from "./axisUtils";
import { type Axis, type AxisScores } from "./types";

/**
 * 결과 페이지의 "캐릭터 네이밍" — 5축 스코어에서 가장 두드러진(중립에서 가장
 * 먼) 축 2개를 뽑아 수식어(2순위 축) + 정체성 명사(1순위 축)를 조합한 짧은
 * 별명을 만든다. 순수 함수. trait-descriptions.json과 톤은 맞추되 문장이
 * 아닌 짧은 라벨을 생성한다.
 */

type Band = "high" | "low";

/** 정체성 명사 — 1순위 축을 대표하는 캐릭터 유형. */
const IDENTITY: Record<Axis, Record<Band, string>> = {
  sociability: { high: "소셜라이저", low: "은둔가" },
  minimalism: { high: "미니멀리스트", low: "컬렉터" },
  activity: { high: "무브메이커", low: "리트리터" },
  openness: { high: "탐험가", low: "안정러" },
  nature: { high: "가드너", low: "시티러버" },
};

/** 수식어 — 2순위 축의 색을 입히는 접두어. */
const MODIFIER: Record<Axis, Record<Band, string>> = {
  sociability: { high: "소셜한", low: "고요한" },
  minimalism: { high: "미니멀한", low: "맥시멀한" },
  activity: { high: "액티브한", low: "느긋한" },
  openness: { high: "오픈마인드", low: "안정 지향" },
  nature: { high: "그린한", low: "실용적인" },
};

export interface Persona {
  /** "그린한 미니멀리스트" 형태의 짧은 캐릭터 이름. */
  name: string;
  /** 이름을 만드는 데 쓰인 상위 축 2개 (1순위, 2순위 순서). */
  topAxes: [Axis, Axis];
}

export function generatePersona(axisScores: AxisScores): Persona {
  const [primary, secondary] = pickTopAxesByExtremity(axisScores, 2) as [
    Axis,
    Axis,
  ];
  const identity = IDENTITY[primary][simpleBand(axisScores[primary])];
  const modifier = MODIFIER[secondary][simpleBand(axisScores[secondary])];
  return { name: `${modifier} ${identity}`, topAxes: [primary, secondary] };
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
  const identity = IDENTITY_EN[primary][simpleBand(axisScores[primary])];
  const modifier = MODIFIER_EN[secondary][simpleBand(axisScores[secondary])];
  return { name: `The ${modifier} ${identity}`, topAxes: [primary, secondary] };
}

export type RarityTierEn = "Rare" | "Uncommon" | "Common";

export function getRarityTierEn(similarity: number): RarityTierEn {
  if (similarity >= 85) return "Rare";
  if (similarity >= 70) return "Uncommon";
  return "Common";
}

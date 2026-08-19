/**
 * 5개 라이프스타일 축.
 * - sociability: 사교성
 * - minimalism: 미니멀↔맥시멀 (점수가 높을수록 미니멀)
 * - activity: 활동성
 * - openness: 개방성
 * - nature: 자연친화
 */
export type Axis =
  | "sociability"
  | "minimalism"
  | "activity"
  | "openness"
  | "nature";

/** 라이프스타일 진단 문항 (5점 리커트 척도로 응답) */
export interface Question {
  id: string;
  axis: Axis;
  text: string;
  /** true면 (6 - 응답값)으로 뒤집은 후 축 점수를 계산한다. */
  reverseScored: boolean;
}

/** MBTI 4개 지표. */
export type MbtiIndicator = "EI" | "SN" | "TF" | "JP";

/** 각 지표에서 문항이 가리킬 수 있는 극. */
export type MbtiPole = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

/** MBTI 보조 진단 문항 (5점 리커트 척도로 응답) */
export interface MbtiQuestion {
  id: string;
  indicator: MbtiIndicator;
  text: string;
  /** 5점(매우 그렇다) 응답 시 가리키는 극. */
  direction: MbtiPole;
}

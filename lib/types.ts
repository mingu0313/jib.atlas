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

/** 문항 하나에 대한 응답. Question.id 또는 MbtiQuestion.id를 참조한다. */
export interface Answer {
  questionId: string;
  /** 5점 리커트 척도 응답값 (1~5) */
  value: number;
}

/** 5축 각각의 0~100 스케일 점수. */
export type AxisScores = Record<Axis, number>;

/** 순회/집계 시 기준이 되는 5축 목록 (고정 순서). */
export const AXES: Axis[] = [
  "sociability",
  "minimalism",
  "activity",
  "openness",
  "nature",
];

/** calculateScores()의 반환값. */
export interface ScoringResult {
  axisScores: AxisScores;
  /** 우세 방향 조합으로 만든 MBTI 4글자 타입 (예: "ENFP") */
  mbtiType: string;
}

/** 집 구조 템플릿에 등장할 수 있는 방 종류. */
export type RoomType =
  | "entrance"
  | "livingRoom"
  | "kitchen"
  | "diningRoom"
  | "bedroom"
  | "masterBedroom"
  | "kidsRoom"
  | "bathroom"
  | "balcony"
  | "terrace"
  | "garden"
  | "study"
  | "gym"
  | "workshop"
  | "storage";

export type RoomSize = "S" | "M" | "L";

/** 평면도 렌더링용 대략적 위치/크기. viewBox "0 0 400 300" 기준 SVG 좌표계. */
export interface RoomPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Room {
  type: RoomType;
  size: RoomSize;
  position: RoomPosition;
}

/** 집 구조의 특징 하나. 어떤 축(axis)과 연결되는지 태깅한다. */
export interface Feature {
  text: string;
  linkedTrait: Axis;
}

/** 집 구조 템플릿. */
export interface HouseTemplate {
  id: string;
  name: string;
  /** 이 템플릿이 어떤 성향에 잘 맞는지, 5축 각각 0~100 점수. */
  scoreProfile: AxisScores;
  rooms: Room[];
  features: Feature[];
}

/** matchHouseTemplate()이 반환하는 개별 매칭 결과. */
export interface TemplateMatch {
  template: HouseTemplate;
  /** 유저 스코어와 템플릿 scoreProfile 간 유사도 (0~100%). */
  similarity: number;
}

/** 축 점수 구간. 70점 이상 high, 30점 이하 low, 그 사이 mid. */
export type TraitBand = "high" | "mid" | "low";

/** 축 x 구간별 사람이 읽기 자연스러운 설명 문구. 모든 문구는 관형사형 어미 "-는"으로 끝난다. */
export type TraitDescriptions = Record<Axis, Record<TraitBand, string>>;

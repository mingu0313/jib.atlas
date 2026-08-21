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

/** 축의 한글 표시명. */
export const AXIS_LABELS: Record<Axis, string> = {
  sociability: "사교성",
  minimalism: "미니멀",
  activity: "활동성",
  openness: "개방성",
  nature: "자연친화",
};

/** 방 종류의 한글 표시명. */
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  entrance: "현관",
  livingRoom: "거실",
  kitchen: "주방",
  diningRoom: "다이닝룸",
  bedroom: "침실",
  masterBedroom: "안방",
  kidsRoom: "아이방",
  bathroom: "욕실",
  balcony: "발코니",
  terrace: "테라스",
  garden: "정원",
  study: "서재",
  gym: "홈짐",
  workshop: "작업실",
  storage: "수납",
};

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

/**
 * 집 구조의 특징 하나. 어떤 축(axis)과 연결되는지, 그 축의 어느 극(band)을
 * 어필하는 특징인지 태깅한다. 5축은 전부 양극형(예: minimalism은 높을수록
 * 미니멀·낮을수록 맥시멀)이라 linkedTrait만으로는 "미니멀해서 좋다"와
 * "맥시멀해서 좋다"를 구분할 수 없다 — band가 그 극을 명시한다.
 */
export interface Feature {
  text: string;
  linkedTrait: Axis;
  /** 이 특징이 해당 축의 high(예: 미니멀) 쪽을 어필하는지 low(예: 맥시멀) 쪽을 어필하는지. */
  band: "high" | "low";
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

/** 2D 에디터 팔레트에 등장하는 가구 카탈로그 항목. */
export interface FurnitureCatalogItem {
  id: string;
  label: string;
  /** 평면도와 같은 좌표계(viewBox "0 0 400 300") 기준 크기. */
  width: number;
  height: number;
  color: string;
}

/** 캔버스에 배치된 가구 하나. x/y는 중심점 기준 좌표. */
export interface PlacedFurniture {
  id: string;
  catalogId: string;
  x: number;
  y: number;
  /** 회전 각도(도). */
  rotation: number;
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

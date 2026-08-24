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

/**
 * 아이소메트릭 룸 에디터 팔레트에 등장하는 가구 정의. col/row 격자 단위
 * 크기(w×d)와 높이(h), 이소메트릭 3면(top/left/right) 색을 갖는다.
 * (components/EditorCanvas.tsx의 ixy/up 투영에 그대로 쓰인다.)
 */
export interface IsoFurnitureDef {
  id: string;
  label: string;
  /** 캔버스 위 가구 이름표(모노 8px)에 쓰는 영문 라벨. */
  en: string;
  w: number;
  d: number;
  h: number;
  top: string;
  left: string;
  right: string;
}

/** 캔버스에 배치된 가구 하나. col/row는 좌상단 타일 기준(격자 스냅). */
export interface PlacedFurniture {
  id: string;
  defId: string;
  col: number;
  row: number;
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

/**
 * 집 아틀라스 — 실제 내 집 사진을 올려 공유하는 공개 갤러리
 * (supabase/migrations/0002_house_atlas.sql 참고).
 */
export interface HousePost {
  id: string;
  user_id: string;
  title: string;
  caption: string;
  /** 작성 시점 진단 결과 스냅샷 — 진단 없이 올렸으면 전부 null. */
  template_id: string | null;
  template_name: string | null;
  persona_name: string | null;
  rarity_tier: string | null;
  /** 채워져 있으면 실사진 대신 이 가구 배치를 아이소메트릭 SVG로 렌더링하는
   * "방 미리보기" 게시물(0004_house_atlas_room_posts.sql). /editor에서
   * 한 번의 클릭으로 올린다 — 사진 업로드 없이 아틀라스에 콘텐츠를 채우는 경로. */
  room_items: PlacedFurniture[] | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

/** house-photos 버킷에 올라간 사진 하나. storage_path는 "{user_id}/{uuid}.jpg" 형태. */
export interface HousePhoto {
  id: string;
  post_id: string;
  storage_path: string;
  sort_order: number;
}

export interface HouseComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

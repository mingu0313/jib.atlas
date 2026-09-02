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

/**
 * 이지선다 문항의 옵션 하나. A/B 두 옵션은 서로 독립적으로 축 가중치를
 * 갖는다(한쪽을 반전시킨 게 아님) — "의외성" 문항처럼 A/B가 서로 다른
 * 축 조합을 건드려야 하는 경우(예: A는 minimalism만, B는 activity만)를
 * 표현하려면 단일 벡터+반전으로는 불가능하기 때문. 대부분의 "직접" 문항은
 * 그냥 대칭 가중치(A: {sociability:2}, B: {sociability:-2})를 쓰면 된다.
 */
export interface AxisWeightedOption {
  id: OptionId;
  /** 밸런스게임형 문구. */
  label?: string;
  /** 이미지 선택형 사진 경로. */
  imagePath?: string;
  /** 이 옵션을 고르면 각 축에 더해지는 부호 있는 가중치. */
  axisWeights: Partial<Record<Axis, number>>;
}

/** 라이프스타일 진단 문항 — 두 옵션 중 하나를 고르는 이지선다. */
export interface BinaryQuestion {
  id: string;
  format: "balance" | "image";
  /** 표시용 카테고리 라벨. 의외성 문항은 축 이름 대신 자체 라벨을 쓴다. */
  category: string;
  prompt: string;
  options: [AxisWeightedOption, AxisWeightedOption];
  /**
   * 퀴즈 화면 왼쪽에 뜨는 분위기용 사진(문항 본문과 무관, 카테고리 톤만
   * 맞춘 것). format이 "image"인 문항은 옵션 사진 두 장이 이미 화면의
   * 시각 정보라 이 필드를 안 쓴다(비워둠).
   */
  photo?: string;
}

/** MBTI 4개 지표. */
export type MbtiIndicator = "EI" | "SN" | "TF" | "JP";

/** 각 지표에서 문항이 가리킬 수 있는 극. */
export type MbtiPole = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

/** 이지선다 옵션 id. */
export type OptionId = "A" | "B";

/** MBTI 보조 진단 문항의 옵션 하나. poleWeight는 이 지표의 "첫 번째 극"
 * (INDICATOR_POLES의 [0], 즉 E/S/T/J)으로 향하는 부호 있는 강도 —
 * 음수면 반대 극(I/N/F/P)으로 향한다. */
export interface MbtiBinaryOption {
  id: OptionId;
  label?: string;
  poleWeight: number;
}

/** MBTI 보조 진단 문항 — 전부 밸런스게임형(추상적 성향 문항이라 이미지
 * 대조가 억지스러워서 이미지 선택형은 안 씀). */
export interface MbtiBinaryQuestion {
  id: string;
  indicator: MbtiIndicator;
  prompt: string;
  options: [MbtiBinaryOption, MbtiBinaryOption];
}

/** 문항 하나에 대한 응답. BinaryQuestion.id 또는 MbtiBinaryQuestion.id를 참조한다. */
export interface Answer {
  questionId: string;
  optionId: OptionId;
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

/** 축의 영문 표시명 — /en 라우트용(STEP 11). */
export const AXIS_LABELS_EN: Record<Axis, string> = {
  sociability: "Sociability",
  minimalism: "Minimalism",
  activity: "Activity",
  openness: "Openness",
  nature: "Nature",
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

/** 방 종류의 영문 표시명 — /en 라우트용(STEP 11). */
export const ROOM_TYPE_LABELS_EN: Record<RoomType, string> = {
  entrance: "Entrance",
  livingRoom: "Living Room",
  kitchen: "Kitchen",
  diningRoom: "Dining Room",
  bedroom: "Bedroom",
  masterBedroom: "Primary Bedroom",
  kidsRoom: "Kids' Room",
  bathroom: "Bathroom",
  balcony: "Balcony",
  terrace: "Terrace",
  garden: "Garden",
  study: "Study",
  gym: "Home Gym",
  workshop: "Workshop",
  storage: "Storage",
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
/**
 * 룸 에디터 팔레트의 가구 카테고리(STEP 15) — 업로드된 스펙 문서
 * (STEP9furniturespec.md) 3.3 그대로. 팔레트 UI(app/editor/page.tsx)가
 * 카테고리 탭으로 묶어 보여줄 때 쓴다.
 */
export type FurnitureCategory =
  | "storage" // 수납 가구
  | "storage-item" // 수납 용품
  | "bed" // 침대/매트리스
  | "textile" // 텍스타일/러그
  | "sofa" // 소파/암체어
  | "plant" // 화분/식물
  | "dining" // 식탁/테이블/의자
  | "desk"; // 책상/사무용의자

export const CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  storage: "수납 가구",
  "storage-item": "수납 용품",
  bed: "침대/매트리스",
  textile: "텍스타일/러그",
  sofa: "소파/암체어",
  plant: "화분/식물",
  dining: "식탁/테이블/의자",
  desk: "책상/사무용의자",
};

export interface IsoFurnitureDef {
  id: string;
  label: string;
  /** 캔버스 위 가구 이름표(모노 8px)에 쓰는 영문 라벨. */
  en: string;
  /** 배치 격자 위 폭(칸). GLTF 가구(STEP 15)도 이 칸 안에 맞춰 스케일된다
   * (lib/furniturePalette.ts의 fitScale) — 모델 원본 실측 크기와 무관하게
   * 배치·충돌 판정은 항상 이 값 기준으로 결정적이다. */
  w: number;
  d: number;
  h: number;
  top: string;
  left: string;
  right: string;
  /**
   * STEP 13(하우스 타입별 3D 방 구조)에서 추가 — 이 가구를 놓을 수 있는
   * 방 종류. 없으면(undefined) 모든 방에 놓을 수 있다고 본다. 이 필드를
   * 실제로 검사하던 격자 기반 룸 에디터(`/editor`, lib/roomLayout3d.ts의
   * roomContaining())는 삭제됐다 — `/studio`(lib/roomBuilderStore.ts의
   * canPlaceFurniture)는 자유 좌표 배치라 이 필드를 아직 안 본다. 데이터엔
   * 남아있지만 지금은 어디서도 안 읽는 값이다.
   */
  allowedRoomTypes?: RoomType[];
  /**
   * STEP 12(룸 에디터 3D 전환)에서 마련해둔 실제 제품 연결 자리 — 전부
   * 선택 필드라 지금처럼 비워둬도 SVG·3D(components/studio/RoomStudioScene3D.tsx)
   * 양쪽 다 그대로 동작한다. 실제 브랜드 제품 데이터/3D 모델이 생기면
   * furniture-catalog.json에 이 필드들만 채우면 된다(로직 변경 불필요).
   */
  brand?: string;
  productName?: string;
  priceKrw?: number;
  purchaseUrl?: string;
  /**
   * GLTF/GLB 모델 경로 — STEP 15부터 Kenney Furniture Kit(CC0, 로컬
   * `/public/models/furniture/*.glb`) 경로로 채워진다. 없으면 3D 뷰는
   * components/furniture3d.tsx의 프로시저럴 형태(STEP 14)로 대체 렌더링한다
   * (박스가 아니라 이미 실제 가구 실루엣이라 대체 경로도 어색하지 않다).
   */
  modelUrl?: string;
  /** 팔레트 카테고리 탭 분류(STEP 15). 없으면 미분류로 취급. */
  category?: FurnitureCategory;
  /**
   * GLTF 리컬러 시 lib/furniturePalette.ts의 DEFAULT_MATERIAL_PALETTE를
   * 덮어쓸 항목별 예외(STEP 15). 대부분은 기본 매핑으로 충분해서 비워둔다.
   */
  materialOverride?: Record<string, import("./furniturePalette").PaletteKey>;
  /**
   * "floor"면 러그처럼 바닥에 까는 오브젝트 — 다른 layer의 가구와 겹칠 수
   * 있다(lib/roomBuilderStore.ts의 canPlaceFurniture가 layer가 다르면 겹침을
   * 허용한다). 없으면 "object"(기존 동작과 동일, 전부 서로 겹칠 수 없음).
   */
  layer?: "floor" | "object";
}

/** 캔버스에 배치된 가구 하나. col/row는 좌상단 타일 기준(격자 스냅).
 * rotated가 true면 실제 footprint는 def.w/d를 맞바꾼(d×w) 것 — STEP 13에서
 * 추가. 작은 방(예: 3타일 폭 주방)에 가로로는 안 들어가는 가구를 세로로
 * 돌려서라도 넣을 수 있게 한다. */
export interface PlacedFurniture {
  id: string;
  defId: string;
  col: number;
  row: number;
  rotated?: boolean;
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
 * studio_room에 저장되는 형태 — lib/roomBuilderStore.ts의 라이브 상태
 * (RoomBuilderState)에서 방을 다시 그리는 데 필요한 부분만 뽑은 스냅샷.
 * 이 파일(lib/types.ts)은 다른 어디에도 의존하지 않는 기반 타입 모음이고
 * (반대로 roomBuilderStore.ts가 이 파일의 IsoFurnitureDef를 가져다 쓴다),
 * 저장된 JSON 스냅샷은 라이브 스토어 타입을 그대로 import하지 않고 여기
 * 따로 적는다 — 나중에 스토어 내부 타입이 바뀌어도 이미 DB에 저장된
 * 게시물의 스냅샷 형태는 그대로 유지해야 하니, 오히려 분리해두는 쪽이 맞다.
 */
export interface StudioRoomSnapshot {
  roomShape: string;
  roomPolygon: { x: number; z: number }[];
  wallHeightCm: number;
  wallColorHex: string;
  floorStyleId: string;
  openings: {
    id: string;
    kind: "door" | "window";
    presetId: string;
    wallIndex: number;
    offsetCm: number;
    widthCm: number;
    heightCm: number;
    sillHeightCm?: number;
  }[];
  furniture: { id: string; defId: string; cx: number; cz: number; rotated: boolean }[];
}

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
  /** 채워져 있으면 /studio(폴리곤 룸빌더)에서 만든 방을 공유한 게시물
   * (0006_house_atlas_studio_room.sql). room_items(옛 /editor, col/row
   * 격자)와 달리 이 경우엔 항상 house_photos에 캡처 이미지도 같이 올라가
   * 있어서, SVG 특별 렌더링 없이 일반 사진 게시물처럼 보여주면 된다
   * (구분은 뱃지만 다르게 — app/atlas/page.tsx). */
  studio_room: StudioRoomSnapshot | null;
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

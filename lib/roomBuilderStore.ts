import { create } from "zustand";
import { buildPolygon, DEFAULT_WALL_HEIGHT_CM, MAX_WALL_HEIGHT_CM, MIN_WALL_HEIGHT_CM, readDimensions, type RoomUnit } from "./roomDimensions";

/** 평면 좌표(cm). x=가로, z=깊이 — y는 3D 높이축이라 평면 좌표엔 안 쓴다. */
export type Point = { x: number; z: number };

export type RoomShapeId = "square" | "rectangle" | "lshape";

export interface RoomShapePreset {
  id: RoomShapeId;
  label: string;
  /** 카드 서브텍스트 */
  helper: string;
  /** 시계방향, 첫 점은 원점(0,0). cm 단위. */
  defaultPolygon: Point[];
}

/**
 * STEP 11(정밀 룸빌더 1단계 — 방 모양·크기) — 프리셋 3종.
 *
 * 좌표는 처음부터 cm 단위로 저장한다 — STEP 12(치수 조정: ft/cm 토글, 내부는
 * cm 기준 통일)가 이 값을 그대로 스케일 조정할 수 있게, 기본값도 그때 쓸
 * 150~1500cm 범위 안으로 잡았다.
 *
 * L자형은 바운딩박스 500×450cm에서 우상단 200×200cm 모서리를 잘라낸
 * 6점 폴리곤이다 — 거실+주방이 분리된 구조를 흉내낸다. 점 순서를
 * (0,0)→(300,0)→(300,200)→(500,200)→(500,450)→(0,450)로 잡아둔 건, STEP 12에서
 * 변마다 이름(mainWidth/mainDepth/notchWidth/notchDepth)을 매길 때 각 변이
 * 어느 인접 점 쌍인지 바로 알아볼 수 있게 하기 위해서다.
 */
export const ROOM_SHAPE_PRESETS: RoomShapePreset[] = [
  {
    id: "square",
    label: "정사각형",
    helper: "군더더기 없는 원룸형",
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 400, z: 0 },
      { x: 400, z: 400 },
      { x: 0, z: 400 },
    ],
  },
  {
    id: "rectangle",
    label: "직사각형",
    helper: "가장 무난한 기본형",
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 500, z: 0 },
      { x: 500, z: 350 },
      { x: 0, z: 350 },
    ],
  },
  {
    id: "lshape",
    label: "L자형",
    helper: "거실+주방 분리형",
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 300, z: 0 },
      { x: 300, z: 200 },
      { x: 500, z: 200 },
      { x: 500, z: 450 },
      { x: 0, z: 450 },
    ],
  },
];

function presetById(id: RoomShapeId): RoomShapePreset {
  const preset = ROOM_SHAPE_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`room shape preset not found: ${id}`);
  return preset;
}

interface RoomBuilderState {
  /** 선택된 프리셋 id. `/studio`는 특정 하우스 타입에 안 묶이는 독립
   * 경로라, 가장 무난한 "rectangle"을 기본값으로 시작한다. */
  roomShape: RoomShapeId;
  /** 현재 방 폴리곤(cm) — 항상 이 단위로만 저장한다(STEP 12). ft는 표시·
   * 입력 시에만 변환하고, 이 값 자체를 ft로 바꿔 들고 있지 않는다. */
  roomPolygon: Point[];
  /** 치수 입력창에 보여줄 단위. roomPolygon(cm)엔 영향 없음 — 화면 표시·
   * 입력 파싱에만 쓰인다(lib/roomDimensions.ts). */
  unit: RoomUnit;
  /** 천장 높이(cm) — 어떤 프리셋을 골라도 공통으로 갖는 값이라 폴리곤과
   * 별도 필드로 둔다. STEP 13의 문/창문 높이 제약에 쓰일 예정. */
  wallHeightCm: number;
  /** 프리셋 카드 선택 — 폴리곤을 그 프리셋의 기본값으로 즉시 교체한다. */
  selectShape: (id: RoomShapeId) => void;
  /** 치수 입력 필드 하나(예: "width")를 cm 값으로 갱신 — 현재 폴리곤에서
   * 나머지 치수를 그대로 읽어와 이 필드만 바꾼 뒤 폴리곤을 다시 만든다.
   * 범위를 벗어난 값은 buildPolygon이 알아서 clamp한다. */
  setDimension: (fieldId: string, cm: number) => void;
  setWallHeight: (cm: number) => void;
  setUnit: (unit: RoomUnit) => void;
}

export const useRoomBuilderStore = create<RoomBuilderState>((set, get) => ({
  roomShape: "rectangle",
  roomPolygon: presetById("rectangle").defaultPolygon,
  unit: "cm",
  wallHeightCm: DEFAULT_WALL_HEIGHT_CM,
  selectShape: (id) => set({ roomShape: id, roomPolygon: presetById(id).defaultPolygon }),
  setDimension: (fieldId, cm) => {
    const { roomShape, roomPolygon } = get();
    const dims = { ...readDimensions(roomShape, roomPolygon), [fieldId]: cm };
    set({ roomPolygon: buildPolygon(roomShape, dims) });
  },
  setWallHeight: (cm) => set({ wallHeightCm: Math.min(MAX_WALL_HEIGHT_CM, Math.max(MIN_WALL_HEIGHT_CM, cm)) }),
  setUnit: (unit) => set({ unit }),
}));

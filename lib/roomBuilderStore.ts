import { create } from "zustand";

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
  /** 현재 방 폴리곤(cm). STEP 12부터 치수 조정이 이 값을 직접 수정하게
   * 되지만, 지금은 프리셋의 defaultPolygon을 그대로 쓴다. */
  roomPolygon: Point[];
  /** 프리셋 카드 선택 — 폴리곤을 그 프리셋의 기본값으로 즉시 교체한다. */
  selectShape: (id: RoomShapeId) => void;
}

export const useRoomBuilderStore = create<RoomBuilderState>((set) => ({
  roomShape: "rectangle",
  roomPolygon: presetById("rectangle").defaultPolygon,
  selectShape: (id) => set({ roomShape: id, roomPolygon: presetById(id).defaultPolygon }),
}));

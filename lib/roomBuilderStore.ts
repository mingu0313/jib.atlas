import { create } from "zustand";
import furnitureCatalogData from "../data/furniture-catalog.json";
import { HEIGHT_SCALE, TILE_M } from "./editor3d";
import { buildPolygon, DEFAULT_WALL_HEIGHT_CM, MAX_WALL_HEIGHT_CM, MIN_WALL_HEIGHT_CM, readDimensions, type RoomUnit } from "./roomDimensions";
import type { RoomViewMode } from "./cameraPresets";
import { clampOpeningOffset, getWallSegments, isFootprintInsideRoom, overlapsOtherOpening, rectsOverlap, type Rect } from "./roomGeometry";
import { DEFAULT_FLOOR_STYLE_ID, DEFAULT_WALL_COLOR_HEX, DOOR_PRESETS, WINDOW_PRESETS } from "./roomStyle";
import type { IsoFurnitureDef } from "./types";

/** 평면 좌표(cm). x=가로, z=깊이 — y는 3D 높이축이라 평면 좌표엔 안 쓴다. */
export type Point = { x: number; z: number };

export type RoomShapeId = "square" | "rectangle" | "clippedCorner" | "lshape" | "tshape" | "ushape" | "angled";

export interface RoomShapePreset {
  id: RoomShapeId;
  label: string;
  /** 카드 서브텍스트 */
  helper: string;
  /** 시계방향, 첫 점은 원점(0,0). cm 단위. */
  defaultPolygon: Point[];
}

/**
 * STEP 11(정밀 룸빌더 1단계 — 방 모양·크기) — 프리셋 7종. IKEA류 룸플래너의
 * "모양 및 크기 설정하기" 화면(사각형/잘라내기/L자형/T자형/U자형/경사진)을
 * 참고해 기존 3종(정사각형/직사각형/L자형)에 4종을 더했다.
 *
 * 좌표는 처음부터 cm 단위로 저장한다. 모든 프리셋이 시계방향(SVG 기준
 * z가 아래로 증가)이고 첫 점은 항상 원점(0,0) — lib/roomDimensions.ts의
 * getDraggableEdges가 "원점에 안 닿는 변의 고정 좌표 = 그 변이 담당하는
 * 치수 필드 값"이라는 트릭을 쓰기 때문에, 이 관례를 새 프리셋에서도
 * 반드시 지켜야 한다(원점에 닿는 변 2개만 드래그 불가로 남긴다).
 *
 * 잘라내기·경사진 2종은 대각선 변이 있어(볼록 다각형) 나머지 5종(전부
 * 직교/오목 다각형 가능)과 바닥·가구충돌 판정 방식이 다르다 —
 * lib/roomGeometry.ts의 CONVEX_DIAGONAL_SHAPES 참고.
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
    id: "clippedCorner",
    label: "잘라내기",
    helper: "모서리 하나를 비스듬히 자른 형태",
    // (0,0)→(W-C,0)→(W,C)→(W,D)→(0,D). 우상단 모서리를 대각선으로 자른다.
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 400, z: 0 },
      { x: 500, z: 100 },
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
  {
    id: "tshape",
    label: "T자형",
    helper: "넓은 거실 + 좁은 복도형 돌출부",
    // 위쪽 넓은 바 + 아래로 뻗은 좁은 스템. (0,0)→(W,0)→(W,B)→
    // ((W+SW)/2,B)→((W+SW)/2,B+SD)→((W-SW)/2,B+SD)→((W-SW)/2,B)→(0,B).
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 500, z: 0 },
      { x: 500, z: 250 },
      { x: 375, z: 250 },
      { x: 375, z: 450 },
      { x: 125, z: 450 },
      { x: 125, z: 250 },
      { x: 0, z: 250 },
    ],
  },
  {
    id: "ushape",
    label: "U자형",
    helper: "가운데가 뚫린 안뜰형",
    // 위쪽 가운데를 노치로 파낸 형태. (0,0)→((W-NW)/2,0)→((W-NW)/2,ND)→
    // ((W+NW)/2,ND)→((W+NW)/2,0)→(W,0)→(W,D)→(0,D).
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 150, z: 0 },
      { x: 150, z: 150 },
      { x: 350, z: 150 },
      { x: 350, z: 0 },
      { x: 500, z: 0 },
      { x: 500, z: 400 },
      { x: 0, z: 400 },
    ],
  },
  {
    id: "angled",
    label: "경사진",
    helper: "한쪽 벽이 비스듬한 다락방형",
    // 윗변 전체가 대각선(왼쪽이 낮고 오른쪽이 깊은 한쪽 벽 전체 경사).
    // (0,0)→(W,S)→(W,D)→(0,D).
    defaultPolygon: [
      { x: 0, z: 0 },
      { x: 500, z: 120 },
      { x: 500, z: 350 },
      { x: 0, z: 350 },
    ],
  },
];

function presetById(id: RoomShapeId): RoomShapePreset {
  const preset = ROOM_SHAPE_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`room shape preset not found: ${id}`);
  return preset;
}

export type OpeningKind = "door" | "window";

/**
 * 벽에 배치된 문/창문 하나. 원 스펙은 doors[]/windows[]로 배열을 나누라고
 * 했지만, 실제로는 "어느 벽(wallIndex)의 어디(offsetCm)에 폭(widthCm)짜리
 * 무엇(kind)이 있는가"가 완전히 같은 모양이라 kind로 구분되는 단일 배열
 * (openings)로 합쳤다 — door/window 각각 별도의 추가·이동·삭제 로직을
 * 중복해서 만들지 않기 위해서다.
 */
export interface PlacedOpening {
  id: string;
  kind: OpeningKind;
  /** 배치할 때 고른 프리셋 id(lib/roomStyle.ts DOOR_PRESETS/WINDOW_PRESETS) —
   * width/height는 이미 이 프리셋 값을 복사해둔 거라 굳이 안 써도 되지만,
   * STEP 14 예산 계산이 "이게 정확히 어느 프리셋이었는지"로 단가를 찾을 때
   * widthCm 역매칭 없이 바로 조회하려고 남겨둔다. */
  presetId: string;
  wallIndex: number;
  /** 벽 시작점(getWallSegments 기준)부터 opening 중심까지 거리(cm). */
  offsetCm: number;
  widthCm: number;
  heightCm: number;
  /** 창문만 — 바닥에서 창턱까지 높이(cm). 문은 항상 바닥부터 시작(0). */
  sillHeightCm?: number;
}

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];
const furnitureDefById = new Map(furnitureCatalog.map((d) => [d.id, d]));

/**
 * IsoFurnitureDef.w/d/h(격자·추상 단위) → cm. `/editor` 3D 뷰가 쓰는 것과
 * 같은 배율(lib/editor3d.ts의 TILE_M=칸당 0.7m, HEIGHT_SCALE)을 그대로
 * 써서, 같은 가구가 `/editor`·`/studio` 어디서 봐도 같은 실제 크기로
 * 보인다 — 이 스튜디오만을 위한 새 축척을 따로 만들지 않았다.
 */
export function furnitureFootprintCm(def: IsoFurnitureDef, rotated: boolean): { widthCm: number; depthCm: number; heightCm: number } {
  const w = def.w * TILE_M * 100;
  const d = def.d * TILE_M * 100;
  return { widthCm: rotated ? d : w, depthCm: rotated ? w : d, heightCm: def.h * HEIGHT_SCALE * 100 };
}

/** 배치된 가구 하나 — 격자(col/row)가 아니라 방 폴리곤과 같은 cm 좌표계
 * 위 자유 위치(footprint 중심)다. `/editor`(useEditorStore.items)와 달리
 * 특정 방 "타입"에도 안 묶인다 — `/studio`는 방이 하나뿐이라 어디에
 * 뭘 놓든 자유. */
export interface PlacedStudioFurniture {
  id: string;
  defId: string;
  cx: number;
  cz: number;
  rotated: boolean;
}

/**
 * (cx,cz)에 def(rotated 방향)를 놓을 수 있는지 — 방 폴리곤을 완전히
 * 벗어나거나(isFootprintInsideRoom — 도형에 따라 알맞은 방식으로 판정),
 * 같은 layer의 다른 가구와 겹치면 false. "floor" layer(러그 등)는 다른
 * layer와는 겹칠 수 있다 — lib/editorStore.ts의 canPlace와 같은 규칙.
 * excludeId는 드래그 중인 자기 자신을 겹침 검사에서 뺀다.
 */
export function canPlaceFurniture(
  cx: number,
  cz: number,
  def: IsoFurnitureDef,
  rotated: boolean,
  roomShape: RoomShapeId,
  roomPolygon: Point[],
  placed: PlacedStudioFurniture[],
  excludeId?: string,
): boolean {
  const { widthCm, depthCm } = furnitureFootprintCm(def, rotated);
  const footprint: Rect = { x0: cx - widthCm / 2, z0: cz - depthCm / 2, x1: cx + widthCm / 2, z1: cz + depthCm / 2 };
  if (!isFootprintInsideRoom(roomShape, roomPolygon, footprint)) return false;
  const layer = def.layer ?? "object";
  return placed.every((item) => {
    if (item.id === excludeId) return true;
    const itemDef = furnitureDefById.get(item.defId);
    if (!itemDef) return true;
    if ((itemDef.layer ?? "object") !== layer) return true;
    const dims = furnitureFootprintCm(itemDef, item.rotated);
    const other: Rect = {
      x0: item.cx - dims.widthCm / 2,
      z0: item.cz - dims.depthCm / 2,
      x1: item.cx + dims.widthCm / 2,
      z1: item.cz + dims.depthCm / 2,
    };
    return !rectsOverlap(footprint, other);
  });
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

  /** 벽에 배치된 문/창문 전부. */
  openings: PlacedOpening[];
  /** 팔레트에서 고른, 다음 벽 클릭 때 배치될 프리셋 — /editor의
   * selectedDefId와 같은 "선택 → 클릭으로 배치" 관례를 따른다. 같은
   * 프리셋을 다시 누르면 선택 해제. */
  pendingOpening: { kind: OpeningKind; presetId: string } | null;
  /** 마지막 배치 시도가 실패(벽이 너무 짧음/다른 opening과 겹침)했는지 —
   * 힌트 문구 전환에 쓴다. */
  openingWarn: boolean;
  selectOpeningPreset: (kind: OpeningKind, presetId: string) => void;
  /** 벽(wallIndex) 위 offsetCm 근처에 pendingOpening을 배치 시도. */
  placeOpeningOnWall: (wallIndex: number, offsetCm: number) => void;
  /** 같은 벽 안에서 opening을 offsetCm으로 옮긴다 — 다른 opening과
   * 겹치게 되면 조용히 무시(마지막 유효 위치 유지). */
  moveOpening: (id: string, offsetCm: number) => void;
  removeOpening: (id: string) => void;

  /** 벽 색상(hex) — 프리셋 스와치도 자유 컬러피커도 결국 이 값 하나를
   * 바꾼다. 특정 하우스 타입에 안 묶인 중립 기본값(웜 화이트)에서 시작. */
  wallColorHex: string;
  setWallColor: (hex: string) => void;
  /** 바닥 스타일 프리셋 id. */
  floorStyleId: string;
  setFloorStyle: (id: string) => void;

  /** 진단으로 매칭된 하우스 타입(있으면) — /result에서 넘어왔을 때만
   * 채워진다. null이면 `/studio`를 진단 없이 바로 시작한 것(STEP 15). */
  matchedTemplate: { id: string; name: string } | null;
  /** 매칭 결과 기준 기본값(lib/studioDefaults.ts가 계산)을 한 번에 적용 —
   * 모양·색·바닥을 개별로 여러 번 set 호출하지 않고 한 트랜잭션으로. */
  applyTemplateDefaults: (
    template: { id: string; name: string },
    roomShape: RoomShapeId,
    wallColorHex: string,
    floorStyleId: string,
  ) => void;
  /** "처음부터 다시 시작" — 매칭 기준을 버리고 완전 중립 기본값으로. */
  clearMatchedTemplate: () => void;

  /** 배치된 가구 전부. */
  furniture: PlacedStudioFurniture[];
  /** 팔레트에서 고른, 다음 바닥 클릭 때 배치될 가구 defId — /editor의
   * selectedDefId와 같은 "선택 → 클릭으로 배치" 관례. */
  selectedFurnitureDefId: string | null;
  /** 지금 선택된 가구를 90도 돌려서 놓을지 — 팔레트에서 다른 가구를
   * 고르면 false로 리셋된다(/editor의 rotated와 동일). */
  furnitureRotated: boolean;
  /** 마지막 배치 시도가 실패(방을 벗어나거나 다른 가구와 겹침)했는지. */
  furnitureWarn: boolean;
  selectFurnitureDef: (defId: string) => void;
  toggleFurnitureRotate: () => void;
  placeFurnitureAt: (cx: number, cz: number) => void;
  /** 가구를 (cx,cz)로 옮긴다 — 놓을 수 없는 자리면 조용히 무시(마지막
   * 유효 위치 유지). */
  moveFurniture: (id: string, cx: number, cz: number) => void;
  removeFurniture: (id: string) => void;

  /** 이미 놓인 opening/furniture 하나를 "선택"한 상태 — 새로 배치할 때
   * 쓰는 pendingOpening/selectedFurnitureDefId(팔레트에서 고른 "다음에
   * 놓을 것")와는 완전히 별개다. 선택된 아이템은 평면도 위에 인라인
   * 삭제·회전 버튼을 띄우는 용도로만 쓴다(더블클릭 삭제만 있던 걸
   * 대체 — 클릭해서 선택하는 쪽이 더 잘 눈에 띄고 모바일에서도 된다). */
  selectedOpeningId: string | null;
  selectedFurnitureId: string | null;
  /** 같은 id를 다시 selectXxx하면 선택 해제(토글) — 다른 팔레트 선택
   * 관례들과 통일. */
  selectOpening: (id: string | null) => void;
  selectFurnitureItem: (id: string | null) => void;
  /** 선택된 가구를 같은 자리(cx,cz)에서 90도 돌린다 — 돌린 결과가 방을
   * 벗어나거나 다른 가구와 겹치면 조용히 무시(moveFurniture와 같은 관례).
   * "놓기 전"에만 되던 회전(furnitureRotated)과 달리, 이미 놓인 가구를
   * 지우고 다시 놓지 않아도 방향을 바꿀 수 있게 해준다. */
  rotateFurniture: (id: string) => void;

  /** STEP 16 — 3D 프리뷰의 카메라 뷰 모드. "aerial"(기본, 자유 오빗) /
   * "top"(진짜 위→아래, 사실상 평면도 역할) / "side"(선택한 벽 정면).
   * 위치·화각 계산은 lib/cameraPresets.ts computeCameraPose가 한다 —
   * 여긴 "지금 뭘 보기로 했는지"만 들고 있는다. */
  viewMode: RoomViewMode;
  setViewMode: (mode: RoomViewMode) => void;
  /** 사이드뷰가 바라볼 벽 — getWallSegments(roomPolygon) 인덱스를
   * 문자열로 저장(String(wallIndex)). 방에 안정적인 "벽 id"가 따로 없어서
   * (모양을 바꾸면 폴리곤 자체가 재생성됨) 인덱스를 그대로 쓴다 —
   * lib/cameraPresets.ts resolveSideWallIndex가 범위를 벗어난 값을
   * 안전하게 clamp해준다. */
  sideViewWallId: string | null;
  setSideViewWallId: (id: string | null) => void;
  /** 측정 오버레이(각 변 길이 라벨) 표시 여부. */
  measurementVisible: boolean;
  toggleMeasurement: () => void;
}

export const useRoomBuilderStore = create<RoomBuilderState>((set, get) => ({
  roomShape: "rectangle",
  roomPolygon: presetById("rectangle").defaultPolygon,
  unit: "cm",
  wallHeightCm: DEFAULT_WALL_HEIGHT_CM,
  // 모양을 바꾸면 방 자체가 달라지는 거라, 이전 모양 기준으로 놓았던
  // 가구가 새 폴리곤을 벗어나 있을 수 있다 — /editor(syncTemplate)가
  // 템플릿이 바뀌면 배치를 리셋하는 것과 같은 이유로 같이 비운다.
  selectShape: (id) =>
    set({
      roomShape: id,
      roomPolygon: presetById(id).defaultPolygon,
      furniture: [],
      selectedOpeningId: null,
      selectedFurnitureId: null,
    }),
  setDimension: (fieldId, cm) => {
    const { roomShape, roomPolygon } = get();
    const dims = { ...readDimensions(roomShape, roomPolygon), [fieldId]: cm };
    set({ roomPolygon: buildPolygon(roomShape, dims) });
  },
  setWallHeight: (cm) => set({ wallHeightCm: Math.min(MAX_WALL_HEIGHT_CM, Math.max(MIN_WALL_HEIGHT_CM, cm)) }),
  setUnit: (unit) => set({ unit }),

  openings: [],
  pendingOpening: null,
  openingWarn: false,
  selectOpeningPreset: (kind, presetId) =>
    set((state) => ({
      pendingOpening:
        state.pendingOpening?.kind === kind && state.pendingOpening.presetId === presetId
          ? null
          : { kind, presetId },
      openingWarn: false,
      selectedOpeningId: null, // 새로 놓을 걸 고르는 중이면 기존 선택(삭제 툴바)은 의미 없음
    })),
  placeOpeningOnWall: (wallIndex, offsetCm) => {
    const { pendingOpening, roomPolygon, openings } = get();
    if (!pendingOpening) return;
    const preset =
      pendingOpening.kind === "door"
        ? DOOR_PRESETS.find((p) => p.id === pendingOpening.presetId)
        : WINDOW_PRESETS.find((p) => p.id === pendingOpening.presetId);
    const wall = getWallSegments(roomPolygon)[wallIndex];
    if (!preset || !wall || wall.length < preset.widthCm) {
      set({ openingWarn: true });
      return;
    }
    const clamped = clampOpeningOffset(offsetCm, preset.widthCm, wall.length);
    if (overlapsOtherOpening(openings, wallIndex, clamped, preset.widthCm)) {
      set({ openingWarn: true });
      return;
    }
    const opening: PlacedOpening = {
      id: crypto.randomUUID(),
      kind: pendingOpening.kind,
      presetId: pendingOpening.presetId,
      wallIndex,
      offsetCm: clamped,
      widthCm: preset.widthCm,
      heightCm: preset.heightCm,
      ...(pendingOpening.kind === "window" ? { sillHeightCm: (preset as (typeof WINDOW_PRESETS)[number]).sillHeightCm } : {}),
    };
    set({ openings: [...openings, opening], openingWarn: false });
  },
  moveOpening: (id, offsetCm) =>
    set((state) => {
      const target = state.openings.find((o) => o.id === id);
      const wall = target ? getWallSegments(state.roomPolygon)[target.wallIndex] : undefined;
      if (!target || !wall) return state;
      const clamped = clampOpeningOffset(offsetCm, target.widthCm, wall.length);
      if (overlapsOtherOpening(state.openings, target.wallIndex, clamped, target.widthCm, id)) return state;
      return { openings: state.openings.map((o) => (o.id === id ? { ...o, offsetCm: clamped } : o)) };
    }),
  removeOpening: (id) =>
    set((state) => ({
      openings: state.openings.filter((o) => o.id !== id),
      selectedOpeningId: state.selectedOpeningId === id ? null : state.selectedOpeningId,
    })),

  wallColorHex: DEFAULT_WALL_COLOR_HEX,
  setWallColor: (hex) => set({ wallColorHex: hex }),
  floorStyleId: DEFAULT_FLOOR_STYLE_ID,
  setFloorStyle: (id) => set({ floorStyleId: id }),

  matchedTemplate: null,
  applyTemplateDefaults: (template, roomShape, wallColorHex, floorStyleId) =>
    set({
      matchedTemplate: template,
      roomShape,
      roomPolygon: presetById(roomShape).defaultPolygon,
      wallColorHex,
      floorStyleId,
      furniture: [],
      selectedOpeningId: null,
      selectedFurnitureId: null,
    }),
  clearMatchedTemplate: () =>
    set({
      matchedTemplate: null,
      roomShape: "rectangle",
      roomPolygon: presetById("rectangle").defaultPolygon,
      wallColorHex: DEFAULT_WALL_COLOR_HEX,
      floorStyleId: DEFAULT_FLOOR_STYLE_ID,
      furniture: [],
      selectedOpeningId: null,
      selectedFurnitureId: null,
    }),

  furniture: [],
  selectedFurnitureDefId: null,
  furnitureRotated: false,
  furnitureWarn: false,
  selectFurnitureDef: (defId) =>
    set((state) => ({
      selectedFurnitureDefId: state.selectedFurnitureDefId === defId ? null : defId,
      furnitureRotated: false,
      furnitureWarn: false,
      selectedFurnitureId: null, // 새로 놓을 걸 고르는 중이면 기존 선택(삭제·회전 툴바)은 의미 없음
    })),
  toggleFurnitureRotate: () => set((state) => ({ furnitureRotated: !state.furnitureRotated })),
  placeFurnitureAt: (cx, cz) => {
    const { selectedFurnitureDefId, furnitureRotated, roomShape, roomPolygon, furniture } = get();
    if (!selectedFurnitureDefId) return;
    const def = furnitureDefById.get(selectedFurnitureDefId);
    if (!def) return;
    if (!canPlaceFurniture(cx, cz, def, furnitureRotated, roomShape, roomPolygon, furniture)) {
      set({ furnitureWarn: true });
      return;
    }
    set({
      furniture: [...furniture, { id: crypto.randomUUID(), defId: selectedFurnitureDefId, cx, cz, rotated: furnitureRotated }],
      furnitureWarn: false,
    });
  },
  moveFurniture: (id, cx, cz) =>
    set((state) => {
      const target = state.furniture.find((f) => f.id === id);
      const def = target ? furnitureDefById.get(target.defId) : undefined;
      if (!target || !def) return state;
      if (!canPlaceFurniture(cx, cz, def, target.rotated, state.roomShape, state.roomPolygon, state.furniture, id)) return state;
      return { furniture: state.furniture.map((f) => (f.id === id ? { ...f, cx, cz } : f)) };
    }),
  removeFurniture: (id) =>
    set((state) => ({
      furniture: state.furniture.filter((f) => f.id !== id),
      selectedFurnitureId: state.selectedFurnitureId === id ? null : state.selectedFurnitureId,
    })),

  selectedOpeningId: null,
  selectedFurnitureId: null,
  selectOpening: (id) => set((state) => ({ selectedOpeningId: state.selectedOpeningId === id ? null : id })),
  selectFurnitureItem: (id) => set((state) => ({ selectedFurnitureId: state.selectedFurnitureId === id ? null : id })),
  rotateFurniture: (id) =>
    set((state) => {
      const target = state.furniture.find((f) => f.id === id);
      const def = target ? furnitureDefById.get(target.defId) : undefined;
      if (!target || !def) return state;
      const nextRotated = !target.rotated;
      if (!canPlaceFurniture(target.cx, target.cz, def, nextRotated, state.roomShape, state.roomPolygon, state.furniture, id)) {
        return state;
      }
      return { furniture: state.furniture.map((f) => (f.id === id ? { ...f, rotated: nextRotated } : f)) };
    }),

  viewMode: "aerial",
  setViewMode: (mode) => set({ viewMode: mode }),
  sideViewWallId: null,
  setSideViewWallId: (id) => set({ sideViewWallId: id }),
  measurementVisible: false,
  toggleMeasurement: () => set((state) => ({ measurementVisible: !state.measurementVisible })),
}));

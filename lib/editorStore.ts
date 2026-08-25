import { create } from "zustand";
import furnitureCatalogData from "../data/furniture-catalog.json";
import { RD, RW } from "./iso";
import { buildRoomLayout, roomContaining, type RoomTileRect } from "./roomLayout3d";
import type { IsoFurnitureDef, PlacedFurniture, Room } from "./types";

export { RD, RW };

const catalog = furnitureCatalogData as IsoFurnitureDef[];
const defById = new Map(catalog.map((d) => [d.id, d]));

/**
 * DESIGN-HANDOFF-V2.md "5. 룸 에디터 > 기본 배치" 그대로(`sofa(1,1) ctable(4,2)
 * plant(9,0) wardrobe(0,6) desk(7,6) lounge(5,5)`) — lib/iso.ts의 고정
 * RW×RD 격자를 가정한 예시 배치다. STEP 13부터 실제 룸 에디터(EditorScene3D)는
 * 하우스 타입마다 다른 방 구조를 쓰느라 이 고정 배치를 못 쓰지만(아래
 * buildDefaultPlacement 참고), 랜딩 히어로 미니 창(HeroEditorWindow.tsx)·
 * 공유 카드(ShareCard.tsx)·랜딩 에디터 프리뷰(EditorPreview.tsx)는 특정
 * 진단 결과와 무관한 "예시 화면"이라 여전히 이 고정 배치+RW/RD를 그대로 쓴다.
 */
export const DEFAULT_PLACED_DEFS: { defId: string; col: number; row: number }[] = [
  { defId: "sofa", col: 1, row: 1 },
  { defId: "ctable", col: 4, row: 2 },
  { defId: "plant", col: 9, row: 0 },
  { defId: "wardrobe", col: 0, row: 6 },
  { defId: "desk", col: 7, row: 6 },
  { defId: "lounge", col: 5, row: 5 },
];

function withIds(defs: { defId: string; col: number; row: number }[]): PlacedFurniture[] {
  return defs.map((d) => ({ id: crypto.randomUUID(), ...d }));
}

/** rotated면 def.w/d를 맞바꾼 실제 footprint([너비,깊이])를 준다. */
function footprint(def: IsoFurnitureDef, rotated: boolean): [number, number] {
  return rotated ? [def.d, def.w] : [def.w, def.d];
}

/**
 * col,row에 def(rotated면 d×w, 아니면 w×d)를 놓을 수 있는지 — roomRects가
 * 나타내는 방 구조를 완전히 벗어나거나(방과 방 사이 틈 포함),
 * def.allowedRoomTypes에 없는 방 타입이거나, 같은 layer의 가구와 겹치면
 * false. 작은 방(예: 3타일 폭 주방)엔 가로로 안 들어가는 가구를 세로로
 * 돌려서 놓을 수 있게 rotated를 지원한다(STEP 13).
 *
 * layer(STEP 15): 러그 같은 "floor" 오브젝트는 바닥에 까는 물건이라 다른
 * 가구와 겹칠 수 있어야 한다 — layer가 다르면(하나는 floor, 하나는
 * object) 겹침 검사를 건너뛴다. 둘 다 명시 안 하면(기존 9개 가구처럼)
 * 전부 "object"로 취급돼 기존 동작(전부 서로 겹칠 수 없음)과 동일하다.
 */
export function canPlace(
  col: number,
  row: number,
  def: IsoFurnitureDef,
  placed: { defId: string; col: number; row: number; rotated?: boolean }[],
  roomRects: RoomTileRect[],
  rotated = false,
): boolean {
  if (col < 0 || row < 0) return false;
  const [w, d] = footprint(def, rotated);
  if (!roomContaining(roomRects, col, row, w, d, def.allowedRoomTypes)) return false;
  const layer = def.layer ?? "object";
  return placed.every((item) => {
    const itemDef = defById.get(item.defId);
    if (!itemDef) return true;
    if ((itemDef.layer ?? "object") !== layer) return true;
    const [iw, id] = footprint(itemDef, !!item.rotated);
    const overlaps = col < item.col + iw && col + w > item.col && row < item.row + id && row + d > item.row;
    return !overlaps;
  });
}

/**
 * STEP 13 — HouseTemplate.rooms를 보고 방 타입에 맞는 기본 가구를 하나씩
 * 자동으로 채워 넣는다(hardcoded col/row였던 DEFAULT_PLACED_DEFS의 자리를
 * 대신한다). 방 타입별로 시도할 가구를 순서대로 두고, 각 방 안을 좌상단부터
 * 훑으며 canPlace를 만족하는 첫 자리에 놓는다 — 방이 너무 작아 하나도 안
 * 들어가면 그냥 건너뛴다(에러 아님).
 */
const DEFAULT_FURNITURE_BY_ROOM_TYPE: Partial<Record<Room["type"], string[]>> = {
  livingRoom: ["sofa", "ctable"],
  kitchen: ["counter"],
  diningRoom: ["ctable"],
  bedroom: ["bed", "wardrobe"],
  masterBedroom: ["bed", "wardrobe"],
  kidsRoom: ["bed"],
  study: ["desk"],
  terrace: ["plant"],
  balcony: ["plant"],
  garden: ["plant"],
};

type PlacedDraft = { defId: string; col: number; row: number; rotated?: boolean };

/** room 안을 좌상단부터 훑으며 이 방향(rotated 여부)으로 def가 들어갈 첫
 * 자리를 찾는다. 못 찾으면 null. */
function scanRoomFor(
  room: RoomTileRect,
  def: IsoFurnitureDef,
  rotated: boolean,
  placed: PlacedDraft[],
  rects: RoomTileRect[],
): PlacedDraft | null {
  const [w, d] = footprint(def, rotated);
  for (let row = room.rowStart; row + d <= room.rowEnd; row++) {
    for (let col = room.colStart; col + w <= room.colEnd; col++) {
      if (canPlace(col, row, def, placed, rects, rotated)) {
        return { defId: def.id, col, row, ...(rotated ? { rotated: true } : {}) };
      }
    }
  }
  return null;
}

const SLEEP_ROOM_TYPES: Room["type"][] = ["bedroom", "masterBedroom", "kidsRoom"];

export function buildDefaultPlacement(rooms: Room[]): PlacedDraft[] {
  const { rects } = buildRoomLayout(rooms);
  const placed: PlacedDraft[] = [];

  for (const room of rects) {
    const defIds = DEFAULT_FURNITURE_BY_ROOM_TYPE[room.type];
    if (!defIds) continue;
    for (const defId of defIds) {
      const def = defById.get(defId);
      if (!def) continue;
      // 가로(원래 방향)로 먼저 시도하고, 안 들어가면 세로로 돌려서 다시
      // 시도한다 — 폭이 좁고 깊은 방(예: 좁은 주방)에도 카운터가 들어가게.
      const spot = scanRoomFor(room, def, false, placed, rects) ?? scanRoomFor(room, def, true, placed, rects);
      if (spot) placed.push(spot);
    }
  }

  // 원룸형 템플릿(bedroom/masterBedroom/kidsRoom이 아예 없음, t11/t22/t23/
  // t28/t29 등)은 위 루프가 침대를 하나도 안 놓는다 — bed.allowedRoomTypes에
  // livingRoom이 포함돼 있으니(lib/types.ts) 거실에 대신 놓아준다. 진단
  // 결과에 "잠잘 곳"이 아예 안 보이면 이상하다.
  const hasSleepRoom = rects.some((r) => SLEEP_ROOM_TYPES.includes(r.type));
  if (!hasSleepRoom) {
    const livingRoom = rects.find((r) => r.type === "livingRoom");
    const bedDef = defById.get("bed");
    if (livingRoom && bedDef) {
      const spot =
        scanRoomFor(livingRoom, bedDef, false, placed, rects) ??
        scanRoomFor(livingRoom, bedDef, true, placed, rects);
      if (spot) placed.push(spot);
    }
  }

  return placed;
}

type Status = "idle" | "loading" | "ready";

interface EditorState {
  /** 서버에서 배치를 불러왔는지 여부. "idle" 상태에서 syncTemplate 등을
   * 호출하면 아직 안 불러온 배치를 "다른 템플릿"으로 오판해 지워버릴 수 있다. */
  status: Status;
  /** 이 배치가 어떤 집 구조 템플릿에 대한 것인지. */
  templateId: string | null;
  items: PlacedFurniture[];
  /** 팔레트에서 선택돼 배치를 기다리는 가구 정의 id. 드래그 앤 드롭이 아니라
   * "선택 → 타일 클릭"이라 선택된 가구 하나만 상태로 갖는다. */
  selectedDefId: string | null;
  /** 지금 선택된 가구를 90도 돌려서 놓을지(STEP 13) — 폭 좁은 방에 가로로
   * 안 들어가는 가구를 세로로 돌려 넣을 때 쓴다. 팔레트에서 다른 가구를
   * 고르면 false로 리셋된다. */
  rotated: boolean;
  /** 마지막 타일 클릭이 배치 불가한 자리였는지 — 힌트 문구 전환에 쓴다. */
  warn: boolean;
  /** 로그인한 유저의 배치를 서버(Supabase)에서 불러온다. 로그인 안 했으면
   * 401을 받고 빈 상태로 "ready"가 된다. */
  loadFromServer: () => Promise<void>;
  /** 팔레트 행 클릭 — 이미 선택된 걸 다시 누르면 선택 해제. */
  selectDef: (defId: string) => void;
  /** "회전" 버튼 — 지금 선택된 가구를 놓을 방향을 90도 돌린다. */
  toggleRotate: () => void;
  /** 바닥 타일 클릭 — 선택된 가구를 그 타일에 좌상단 기준으로 배치 시도.
   * roomRects는 호출하는 쪽(EditorScene3D)이 현재 템플릿의 rooms로부터
   * 미리 계산해 넘긴다 — 스토어는 room 레이아웃 자체를 들고 있지 않는다. */
  placeAt: (col: number, row: number, roomRects: RoomTileRect[]) => void;
  /** 배치된 가구 클릭 — 치운다. */
  removeItem: (id: string) => void;
  /** 기본 배치로 복귀 — 현재 템플릿의 rooms를 다시 넘겨받아야 한다. */
  reset: (rooms: Room[]) => void;
  /**
   * 매칭된 템플릿이 이전에 저장된 배치의 템플릿과 다르면(재진단으로 다른
   * 집 유형이 나온 경우) 기본 배치로 새로 시작한다. 같은 템플릿이면, 혹시
   * 옛 방 구조 기준으로 저장된 항목이 지금 방 구조를 벗어나 있는지만 걸러낸다.
   */
  syncTemplate: (templateId: string, rooms: Room[]) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** 변경 후 400ms 안에 또 바뀌면 이전 저장 예약을 취소하고 다시 미룬다
 * (연속 배치/제거 때마다 매번 요청을 날리지 않도록). */
function scheduleSave(get: () => EditorState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const { templateId, items } = get();
    if (!templateId) return;
    fetch("/api/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, items }),
    }).catch(() => {
      // 저장 실패는 조용히 무시한다 — 다음 변경 때 다시 저장을 시도한다.
    });
  }, 400);
}

/**
 * 인테리어 에디터에 배치한 가구 상태. Supabase(로그인한 유저별 테이블)에
 * 저장해서 다른 브라우저/기기에서도 로그인만 하면 이어서 꾸밀 수 있다.
 */
export const useEditorStore = create<EditorState>((set, get) => ({
  status: "idle",
  templateId: null,
  items: [],
  selectedDefId: null,
  rotated: false,
  warn: false,
  loadFromServer: async () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    try {
      const res = await fetch("/api/layout");
      if (res.ok) {
        const data = await res.json();
        set({ templateId: data.templateId, items: data.items, status: "ready" });
        return;
      }
    } catch {
      // 네트워크 오류 등 — 빈 상태로 시작한다.
    }
    set({ status: "ready" });
  },
  selectDef: (defId) =>
    set((state) => ({
      selectedDefId: state.selectedDefId === defId ? null : defId,
      rotated: false,
      warn: false,
    })),
  toggleRotate: () => set((state) => ({ rotated: !state.rotated })),
  placeAt: (col, row, roomRects) => {
    const { selectedDefId, items, rotated } = get();
    if (!selectedDefId) return;
    const def = defById.get(selectedDefId);
    if (!def) return;
    if (!canPlace(col, row, def, items, roomRects, rotated)) {
      set({ warn: true });
      return;
    }
    set({
      items: [...items, { id: crypto.randomUUID(), defId: selectedDefId, col, row, ...(rotated ? { rotated: true } : {}) }],
      warn: false,
    });
    scheduleSave(get);
  },
  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    scheduleSave(get);
  },
  reset: (rooms) => {
    set({ items: withIds(buildDefaultPlacement(rooms)), selectedDefId: null, rotated: false, warn: false });
    scheduleSave(get);
  },
  syncTemplate: (templateId, rooms) => {
    const { templateId: currentId, items } = get();
    if (currentId !== templateId) {
      set({
        templateId,
        items: withIds(buildDefaultPlacement(rooms)),
        selectedDefId: null,
        rotated: false,
        warn: false,
      });
      scheduleSave(get);
      return;
    }
    // 같은 템플릿이라도 저장된 배치가 예전 방 구조(STEP 13 이전, 고정
    // RW×RD 한 칸짜리 방) 기준일 수 있다 — 지금 방 구조를 벗어난 항목은
    // 조용히 걸러낸다(에러 아님, 그냥 다시 안 보이게).
    const { rects } = buildRoomLayout(rooms);
    const valid = items.filter((item) => {
      const def = defById.get(item.defId);
      if (!def) return false;
      const [w, d] = footprint(def, !!item.rotated);
      return !!roomContaining(rects, item.col, item.row, w, d, def.allowedRoomTypes);
    });
    if (valid.length !== items.length) {
      set({ items: valid });
      scheduleSave(get);
    }
  },
}));

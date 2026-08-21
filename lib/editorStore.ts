import { create } from "zustand";
import furnitureCatalogData from "../data/furniture-catalog.json";
import type { IsoFurnitureDef, PlacedFurniture } from "./types";

const catalog = furnitureCatalogData as IsoFurnitureDef[];
const defById = new Map(catalog.map((d) => [d.id, d]));

/** app/result/jib-atlas.design/jib.atlas.dc.html "4. 에디터"의 방 크기. */
export const RW = 10;
export const RD = 8;

/** 프로토타입의 기본 배치(`sofa(1,1) ctable(4,2) plant(9,0) wardrobe(0,6)
 * desk(7,6) lounge(5,5)`) 그대로 — 진단 직후 빈 방 대신 예시 배치로 시작한다. */
const DEFAULT_PLACED_DEFS: { defId: string; col: number; row: number }[] = [
  { defId: "sofa", col: 1, row: 1 },
  { defId: "ctable", col: 4, row: 2 },
  { defId: "plant", col: 9, row: 0 },
  { defId: "wardrobe", col: 0, row: 6 },
  { defId: "desk", col: 7, row: 6 },
  { defId: "lounge", col: 5, row: 5 },
];

function withIds(defs: typeof DEFAULT_PLACED_DEFS): PlacedFurniture[] {
  return defs.map((d) => ({ id: crypto.randomUUID(), ...d }));
}

/**
 * col,row에 def(w×d)를 놓을 수 있는지 — 방을 벗어나거나 이미 놓인 가구와
 * 겹치면 false. EditorCanvas.tsx가 타일 하이라이트 미리보기에도 그대로 쓴다.
 */
export function canPlace(
  col: number,
  row: number,
  def: IsoFurnitureDef,
  placed: PlacedFurniture[],
): boolean {
  if (col < 0 || row < 0 || col + def.w > RW || row + def.d > RD) return false;
  return placed.every((item) => {
    const d = defById.get(item.defId);
    if (!d) return true;
    const overlaps =
      col < item.col + d.w &&
      col + def.w > item.col &&
      row < item.row + d.d &&
      row + def.d > item.row;
    return !overlaps;
  });
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
  /** 마지막 타일 클릭이 배치 불가한 자리였는지 — 힌트 문구 전환에 쓴다. */
  warn: boolean;
  /** 로그인한 유저의 배치를 서버(Supabase)에서 불러온다. 로그인 안 했으면
   * 401을 받고 빈 상태로 "ready"가 된다. */
  loadFromServer: () => Promise<void>;
  /** 팔레트 행 클릭 — 이미 선택된 걸 다시 누르면 선택 해제. */
  selectDef: (defId: string) => void;
  /** 바닥 타일 클릭 — 선택된 가구를 그 타일에 좌상단 기준으로 배치 시도. */
  placeAt: (col: number, row: number) => void;
  /** 배치된 가구 클릭 — 치운다. */
  removeItem: (id: string) => void;
  /** 기본 배치로 복귀. */
  reset: () => void;
  /**
   * 매칭된 템플릿이 이전에 저장된 배치의 템플릿과 다르면(재진단으로 다른
   * 집 유형이 나온 경우) 기본 배치로 새로 시작한다.
   */
  syncTemplate: (templateId: string) => void;
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
      warn: false,
    })),
  placeAt: (col, row) => {
    const { selectedDefId, items } = get();
    if (!selectedDefId) return;
    const def = defById.get(selectedDefId);
    if (!def) return;
    if (!canPlace(col, row, def, items)) {
      set({ warn: true });
      return;
    }
    set({
      items: [...items, { id: crypto.randomUUID(), defId: selectedDefId, col, row }],
      warn: false,
    });
    scheduleSave(get);
  },
  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    scheduleSave(get);
  },
  reset: () => {
    set({ items: withIds(DEFAULT_PLACED_DEFS), selectedDefId: null, warn: false });
    scheduleSave(get);
  },
  syncTemplate: (templateId) => {
    if (get().templateId !== templateId) {
      set({ templateId, items: withIds(DEFAULT_PLACED_DEFS), selectedDefId: null, warn: false });
      scheduleSave(get);
    }
  },
}));

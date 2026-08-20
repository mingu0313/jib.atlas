import { create } from "zustand";
import type { PlacedFurniture } from "./types";

type Status = "idle" | "loading" | "ready";

interface EditorState {
  /** 서버에서 배치를 불러왔는지 여부. "idle" 상태에서 syncTemplate 등을
   * 호출하면 아직 안 불러온 배치를 "다른 템플릿"으로 오판해 지워버릴 수 있다. */
  status: Status;
  /** 이 배치가 어떤 집 구조 템플릿을 기준으로 만들어졌는지. */
  templateId: string | null;
  items: PlacedFurniture[];
  selectedId: string | null;
  /** 로그인한 유저의 배치를 서버(Supabase)에서 불러온다. 로그인 안 했으면
   * 401을 받고 빈 상태로 "ready"가 된다. */
  loadFromServer: () => Promise<void>;
  addItem: (catalogId: string, x: number, y: number) => void;
  moveItem: (id: string, x: number, y: number) => void;
  rotateItem: (id: string, deltaDeg: number) => void;
  removeItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  clear: () => void;
  /**
   * 매칭된 템플릿이 이전에 저장된 배치의 템플릿과 다르면(재진단으로 다른
   * 집 구조가 나온 경우) 방 구조가 안 맞으니 배치를 비우고 새로 시작한다.
   */
  syncTemplate: (templateId: string) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** 변경 후 400ms 안에 또 바뀌면 이전 저장 예약을 취소하고 다시 미룬다
 * (회전 버튼 연타 등으로 매번 요청을 날리지 않도록). */
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
  selectedId: null,
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
  addItem: (catalogId, x, y) => {
    set((state) => {
      const id = crypto.randomUUID();
      return {
        items: [...state.items, { id, catalogId, x, y, rotation: 0 }],
        selectedId: id,
      };
    });
    scheduleSave(get);
  },
  moveItem: (id, x, y) => {
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, x, y } : item)),
    }));
    scheduleSave(get);
  },
  rotateItem: (id, deltaDeg) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, rotation: (item.rotation + deltaDeg + 360) % 360 }
          : item,
      ),
    }));
    scheduleSave(get);
  },
  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
    scheduleSave(get);
  },
  selectItem: (id) => set({ selectedId: id }),
  clear: () => {
    set({ items: [], selectedId: null });
    scheduleSave(get);
  },
  syncTemplate: (templateId) => {
    if (get().templateId !== templateId) {
      set({ templateId, items: [], selectedId: null });
      scheduleSave(get);
    }
  },
}));

import { create } from "zustand";
import type { PlacedFurniture } from "./types";

let nextId = 1;

interface EditorState {
  items: PlacedFurniture[];
  selectedId: string | null;
  addItem: (catalogId: string, x: number, y: number) => void;
  moveItem: (id: string, x: number, y: number) => void;
  rotateItem: (id: string, deltaDeg: number) => void;
  removeItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  clear: () => void;
}

/**
 * 인테리어 에디터에 배치한 가구 상태. STEP 8에서는 저장/불러오기 없이
 * 세션 동안(페이지 새로고침 전까지)만 유지한다 — 영속화는 다음 스텝에서.
 */
export const useEditorStore = create<EditorState>()((set) => ({
  items: [],
  selectedId: null,
  addItem: (catalogId, x, y) =>
    set((state) => {
      const id = `f${nextId++}`;
      return {
        items: [...state.items, { id, catalogId, x, y, rotation: 0 }],
        selectedId: id,
      };
    }),
  moveItem: (id, x, y) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, x, y } : item,
      ),
    })),
  rotateItem: (id, deltaDeg) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, rotation: (item.rotation + deltaDeg + 360) % 360 }
          : item,
      ),
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  selectItem: (id) => set({ selectedId: id }),
  clear: () => set({ items: [], selectedId: null }),
}));

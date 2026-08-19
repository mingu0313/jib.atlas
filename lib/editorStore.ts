import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlacedFurniture } from "./types";

interface EditorState {
  /** 이 배치가 어떤 집 구조 템플릿을 기준으로 만들어졌는지. */
  templateId: string | null;
  items: PlacedFurniture[];
  selectedId: string | null;
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

/**
 * 인테리어 에디터에 배치한 가구 상태. localStorage에 저장해서
 * 새로고침하거나 나중에 다시 들어와도 배치가 그대로 유지된다.
 */
export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      templateId: null,
      items: [],
      selectedId: null,
      addItem: (catalogId, x, y) =>
        set((state) => {
          const id = crypto.randomUUID();
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
      syncTemplate: (templateId) => {
        if (get().templateId !== templateId) {
          set({ templateId, items: [], selectedId: null });
        }
      },
    }),
    { name: "jib-atlas-editor-layout" },
  ),
);

/**
 * localStorage에서 배치를 다 불러왔는지 여부. persist는 마운트 후 비동기로
 * 복원되기 때문에, 이 값을 기다리지 않고 syncTemplate() 등을 호출하면
 * 아직 불러오지 않은 이전 배치를 "다른 템플릿"으로 오판해 지워버릴 수 있다.
 */
export function useEditorHasHydrated() {
  // 서버(prerender) 환경에는 persist API 자체가 없을 수 있어 초기값은 항상 false로
  // 시작하고, 실제 확인/구독은 클라이언트에서만 도는 useEffect 안에서 한다.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(useEditorStore.persist?.hasHydrated() ?? true);
    return useEditorStore.persist?.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

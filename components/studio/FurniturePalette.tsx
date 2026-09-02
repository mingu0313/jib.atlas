"use client";

import { useState } from "react";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { furnitureFootprintCm, useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { CATEGORY_LABELS } from "@/lib/types";
import type { FurnitureCategory, IsoFurnitureDef } from "@/lib/types";

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];

/** app/editor/page.tsx의 카테고리 탭 순서와 동일 — 두 팔레트가 같은
 * 카탈로그를 보여주니 탭 순서도 맞춰둔다. */
const CATEGORY_ORDER: FurnitureCategory[] = [
  "storage",
  "storage-item",
  "bed",
  "textile",
  "sofa",
  "plant",
  "dining",
  "desk",
];

/** 카탈로그 썸네일 — 색 블록 하나 대신 def.w:def.d 비율 그대로의 상단뷰
 * 사각형을 그려서, 실제로 가로로 넓은 가구인지 정사각형에 가까운지 한눈에
 * 보이게 한다(예: 소파는 가로로 김, 협탁은 정사각형에 가까움). */
function FurnitureThumbnail({ def }: { def: IsoFurnitureDef }) {
  const isWide = def.w >= def.d;
  return (
    <div className="flex h-11 w-full shrink-0 items-center justify-center" aria-hidden>
      <div
        className="rounded-[4px] border"
        style={{
          background: def.top,
          borderColor: "rgba(18,18,15,0.28)",
          aspectRatio: `${def.w} / ${def.d}`,
          width: isWide ? "100%" : "auto",
          height: isWide ? "auto" : "100%",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />
    </div>
  );
}

/**
 * 가구 팔레트 — /editor 팔레트(선택 → 타일 클릭)와 같은 관례를
 * store.selectedFurnitureDefId로 따른다. 실제 배치는 RoomFurnitureCanvas의
 * 바닥 클릭이 한다. 카드마다 실제 비율 썸네일 + 실치수(cm)를 보여줘서,
 * 놓기 전에 "이게 방에 맞는 크기인지" 감을 잡을 수 있게 한다.
 */
export function FurniturePalette() {
  const [activeCategory, setActiveCategory] = useState<FurnitureCategory>(CATEGORY_ORDER[0]);
  const selectedFurnitureDefId = useRoomBuilderStore((s) => s.selectedFurnitureDefId);
  const selectFurnitureDef = useRoomBuilderStore((s) => s.selectFurnitureDef);
  const furnitureRotated = useRoomBuilderStore((s) => s.furnitureRotated);
  const toggleFurnitureRotate = useRoomBuilderStore((s) => s.toggleFurnitureRotate);
  const furnitureWarn = useRoomBuilderStore((s) => s.furnitureWarn);

  const selectedDef = selectedFurnitureDefId ? furnitureCatalog.find((d) => d.id === selectedFurnitureDefId) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="pill-mask flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_ORDER.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors"
              style={{
                borderColor: active ? "var(--color-olive)" : "var(--color-hair)",
                background: active ? "var(--color-sage)" : "var(--color-panel)",
                color: active ? "var(--color-sage-ink)" : "var(--color-fg)",
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {furnitureCatalog
          .filter((def) => def.category === activeCategory)
          .map((def) => {
            const selected = selectedFurnitureDefId === def.id;
            const { widthCm, depthCm } = furnitureFootprintCm(def, false);
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => selectFurnitureDef(def.id)}
                className="flex flex-col items-start gap-2 rounded-[14px] border px-3 py-3 text-left transition-all duration-150 hover:border-olive"
                style={{
                  borderColor: selected ? "var(--color-olive)" : "var(--color-hair)",
                  background: selected ? "var(--color-sage)" : "transparent",
                }}
              >
                <FurnitureThumbnail def={def} />
                <span className="text-[12px] leading-tight text-fg">{def.label}</span>
                <span className="label-mono text-[10px] text-faint">
                  {Math.round(widthCm)}×{Math.round(depthCm)}cm
                </span>
              </button>
            );
          })}
      </div>

      {selectedDef && (
        <button
          type="button"
          onClick={toggleFurnitureRotate}
          className="w-fit rounded-full border border-hair px-4 py-2 text-[11px] text-[#5f5f57] transition hover:border-olive hover:text-fg"
        >
          ↻ 놓을 방향{furnitureRotated ? " — 90도 돌림" : ""}
        </button>
      )}

      <p className="text-[12px] leading-[1.8] text-muted">
        {selectedDef
          ? furnitureWarn
            ? "그 자리엔 놓을 수 없어요 — 방을 벗어나거나 다른 가구와 겹쳐요."
            : `${selectedDef.label} 선택됨 — 평면도를 클릭하면 놓여요.`
          : "가구를 고르면 평면도를 클릭해 놓을 수 있어요."}{" "}
        놓인 가구는 드래그로 옮기고, 클릭하면 회전·삭제 버튼이 떠요(키보드 R·Delete도 돼요).
      </p>
    </div>
  );
}

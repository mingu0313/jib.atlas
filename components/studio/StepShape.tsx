"use client";

import { RoomPolygonPreview } from "@/components/studio/RoomPolygonPreview";
import { StepNav } from "@/components/studio/StepNav";
import { ROOM_SHAPE_PRESETS, useRoomBuilderStore } from "@/lib/roomBuilderStore";

/** STEP 11 — 1단계: 방 모양 프리셋 7종 카드 선택. 선택 결과의 큰 미리보기는
 * 오른쪽 상시 패널(StudioPreviewPanel, app/studio/page.tsx)이 대신 보여준다. */
export function StepShape({ onNext }: { onNext: () => void }) {
  const roomShape = useRoomBuilderStore((s) => s.roomShape);
  const selectShape = useRoomBuilderStore((s) => s.selectShape);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-kr text-[clamp(26px,3.4vw,40px)] leading-[1.15]">
          방 모양을 선택하세요<span className="heading-dot">.</span>
        </h1>
        <p className="max-w-lg text-[14px] leading-[1.8] text-muted">
          자유 편집은 아직이지만, 치수는 다음 단계에서 원하는 대로 바꿀 수 있어요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {ROOM_SHAPE_PRESETS.map((preset) => {
          const selected = roomShape === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectShape(preset.id)}
              className="flex flex-col gap-3 rounded-[18px] border p-4 text-left transition-all duration-150 hover:shadow-sm sm:gap-4 sm:rounded-[22px] sm:p-6"
              style={{
                borderColor: selected ? "var(--color-olive)" : "var(--color-hair)",
                background: selected ? "var(--color-sage)" : "var(--color-panel)",
              }}
            >
              <RoomPolygonPreview polygon={preset.defaultPolygon} className="h-[76px] w-full sm:h-[92px]" strokeWidth={8} />
              <div className="flex flex-col gap-1">
                <span className="font-kr text-lg" style={{ color: selected ? "var(--color-sage-ink)" : "var(--color-fg)" }}>
                  {preset.label}
                </span>
                <span className="text-[12px]" style={{ color: selected ? "var(--color-sage-ink)" : "var(--color-muted)" }}>
                  {preset.helper}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <StepNav onNext={onNext} nextLabel="다음: 치수 조정하기 →" />
    </div>
  );
}

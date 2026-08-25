"use client";

import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { DOOR_PRESETS, WINDOW_PRESETS } from "@/lib/roomStyle";

/**
 * 문/창문 프리셋 팔레트 — /editor 가구 팔레트(selectDef → 타일 클릭)와 같은
 * "선택 → 클릭으로 배치" 관례. 고른 프리셋은 store.pendingOpening에
 * 담기고, RoomPlanCanvas의 벽 클릭이 실제 배치를 한다.
 */
export function OpeningPalette() {
  const pendingOpening = useRoomBuilderStore((s) => s.pendingOpening);
  const selectOpeningPreset = useRoomBuilderStore((s) => s.selectOpeningPreset);
  const openingWarn = useRoomBuilderStore((s) => s.openingWarn);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <span className="label-mono text-[10px] text-faint">Door</span>
        <div className="flex flex-wrap gap-2">
          {DOOR_PRESETS.map((preset) => {
            const selected = pendingOpening?.kind === "door" && pendingOpening.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectOpeningPreset("door", preset.id)}
                className="rounded-full border px-4 py-2.5 text-[12px] font-semibold transition-colors"
                style={{
                  borderColor: selected ? "var(--color-olive)" : "var(--color-hair)",
                  background: selected ? "var(--color-sage)" : "var(--color-panel)",
                  color: selected ? "var(--color-sage-ink)" : "var(--color-fg)",
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="label-mono text-[10px] text-faint">Window</span>
        <div className="flex flex-wrap gap-2">
          {WINDOW_PRESETS.map((preset) => {
            const selected = pendingOpening?.kind === "window" && pendingOpening.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectOpeningPreset("window", preset.id)}
                className="rounded-full border px-4 py-2.5 text-[12px] font-semibold transition-colors"
                style={{
                  borderColor: selected ? "var(--color-olive)" : "var(--color-hair)",
                  background: selected ? "var(--color-sage)" : "var(--color-panel)",
                  color: selected ? "var(--color-sage-ink)" : "var(--color-fg)",
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[12px] leading-[1.8] text-muted">
        {pendingOpening
          ? openingWarn
            ? "그 자리엔 놓을 수 없어요 — 벽이 너무 짧거나 다른 문/창문과 겹쳐요."
            : "평면도의 벽을 클릭하면 그 자리에 놓여요."
          : "먼저 위에서 문이나 창문을 골라주세요."}{" "}
        놓인 문/창문은 드래그로 옮기고, 클릭하면 삭제 버튼이 떠요(키보드 Delete도 돼요).
      </p>
    </div>
  );
}

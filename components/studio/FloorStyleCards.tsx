"use client";

import type { CSSProperties } from "react";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { FLOOR_STYLE_PRESETS, type FloorStylePreset } from "@/lib/roomStyle";

/** 실제 텍스처 사진 대신 base/accent 색만으로 재질 느낌을 낸다 — 원목은
 * 판재 줄무늬, 타일은 격자선, 카펫은 촘촘한 점 패턴. */
function thumbnailStyle(preset: FloorStylePreset): CSSProperties {
  if (preset.pattern === "wood") {
    return {
      backgroundColor: preset.base,
      backgroundImage: `repeating-linear-gradient(90deg, ${preset.accent} 0, ${preset.accent} 2px, transparent 2px, transparent 16px)`,
    };
  }
  if (preset.pattern === "tile") {
    return {
      backgroundColor: preset.base,
      backgroundImage: `linear-gradient(${preset.accent} 1px, transparent 1px), linear-gradient(90deg, ${preset.accent} 1px, transparent 1px)`,
      backgroundSize: "20px 20px",
    };
  }
  return {
    backgroundColor: preset.base,
    backgroundImage: `radial-gradient(${preset.accent} 1.4px, transparent 1.6px)`,
    backgroundSize: "8px 8px",
  };
}

export function FloorStyleCards() {
  const floorStyleId = useRoomBuilderStore((s) => s.floorStyleId);
  const setFloorStyle = useRoomBuilderStore((s) => s.setFloorStyle);

  return (
    <div className="flex flex-col gap-3">
      <span className="label-mono text-[10px] text-faint">Floor Style</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FLOOR_STYLE_PRESETS.map((preset) => {
          const selected = floorStyleId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setFloorStyle(preset.id)}
              className="flex flex-col gap-2 rounded-[16px] border p-2 text-left transition-colors"
              style={{ borderColor: selected ? "var(--color-olive)" : "var(--color-hair)" }}
            >
              <span className="block h-14 w-full rounded-[10px]" style={thumbnailStyle(preset)} aria-hidden />
              <span className="text-[12px] text-fg">{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { WALL_COLOR_PRESETS } from "@/lib/roomStyle";

/** 벽 색상 — 브랜드 팔레트 스와치 6개 + 자유 컬러피커. 둘 다 결국
 * store.wallColorHex 하나를 바꾼다.
 *
 * lang(기본 "ko") — /en/studio 다국어 확장(STEP 16). WallColorPreset.labelEn
 * (lib/roomStyle.ts)으로 갈아끼운다. */
export function WallColorPicker({ lang = "ko" }: { lang?: "ko" | "en" }) {
  const wallColorHex = useRoomBuilderStore((s) => s.wallColorHex);
  const setWallColor = useRoomBuilderStore((s) => s.setWallColor);
  const isEn = lang === "en";

  return (
    <div className="flex flex-col gap-3">
      <span className="label-mono text-[10px] text-faint">Wall Color</span>
      <div className="flex flex-wrap items-center gap-3">
        {WALL_COLOR_PRESETS.map((preset) => {
          const selected = wallColorHex.toLowerCase() === preset.hex.toLowerCase();
          const label = isEn ? preset.labelEn : preset.label;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setWallColor(preset.hex)}
              title={label}
              aria-label={label}
              className="h-9 w-9 rounded-full transition-transform"
              style={{
                background: preset.hex,
                outline: selected ? "2px solid var(--color-olive)" : "1px solid var(--color-hair)",
                outlineOffset: 2,
                transform: selected ? "scale(1.08)" : "scale(1)",
              }}
            />
          );
        })}
        <label className="flex items-center gap-2 rounded-full border border-hair px-3 py-1.5">
          <input
            type="color"
            value={wallColorHex}
            onChange={(e) => setWallColor(e.target.value)}
            className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
            aria-label={isEn ? "Pick a custom color" : "자유 색상 선택"}
          />
          <span className="text-[11px] text-muted">{isEn ? "Custom" : "직접 고르기"}</span>
        </label>
      </div>
    </div>
  );
}

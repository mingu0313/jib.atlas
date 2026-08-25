"use client";

import { useEffect, useRef, useState } from "react";
import { formatLength, parseLengthInput, type RoomUnit } from "@/lib/roomDimensions";

/**
 * 치수 입력 필드 하나. 타이핑하는 즉시(clamp 없이) store에 커밋해 프리뷰가
 * 실시간으로 따라오게 하고(STEP 12 요구사항 4), 실제 clamp는
 * roomDimensions.buildPolygon이 해준다 — 포커스가 빠지면 그 clamp된
 * 진짜 값으로 입력창을 다시 맞춘다("150" 타이핑 중 "1"만 쳤을 때 즉시
 * 150으로 스냅되어 "15", "150"을 이어 칠 수 없게 되는 걸 막기 위해, 포커스
 * 중엔 store 값이 아니라 사용자가 친 문자열을 그대로 보여준다).
 */
export function DimensionInput({
  label,
  valueCm,
  min,
  max,
  unit,
  onCommit,
}: {
  label: string;
  valueCm: number;
  min: number;
  max: number;
  unit: RoomUnit;
  onCommit: (cm: number) => void;
}) {
  const [raw, setRaw] = useState(() => formatLength(valueCm, unit));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(formatLength(valueCm, unit));
  }, [valueCm, unit]);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] text-[#5f5f57]">{label}</span>
      <div className="flex items-center gap-2 rounded-[12px] border border-hair bg-panel px-3 py-2.5 focus-within:border-olive">
        <input
          type="number"
          inputMode="decimal"
          step={unit === "cm" ? 1 : 0.1}
          value={raw}
          onFocus={() => {
            focused.current = true;
          }}
          onChange={(e) => {
            setRaw(e.target.value);
            const cm = parseLengthInput(e.target.value, unit);
            if (cm !== null) onCommit(cm);
          }}
          onBlur={() => {
            focused.current = false;
            setRaw(formatLength(valueCm, unit));
          }}
          className="w-full bg-transparent text-[14px] text-fg outline-none"
        />
        <span className="label-mono text-[10px] text-faint">{unit}</span>
      </div>
      <span className="text-[10px] text-faint">
        {formatLength(min, unit)}–{formatLength(max, unit)}
        {unit}
      </span>
    </label>
  );
}

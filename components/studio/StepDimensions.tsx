"use client";

import { DimensionInput } from "@/components/studio/DimensionInput";
import { RoomDimensionCanvas } from "@/components/studio/RoomDimensionCanvas";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { getDimensionFields, MAX_WALL_HEIGHT_CM, MIN_WALL_HEIGHT_CM, readDimensions, type RoomUnit } from "@/lib/roomDimensions";

const UNIT_OPTIONS: { id: RoomUnit; label: string }[] = [
  { id: "cm", label: "센티미터" },
  { id: "ft", label: "피트" },
];

/**
 * STEP 12 — 2단계: 치수 조정. 단위(ft/cm) 토글은 표시·입력에만 영향을 주고
 * 실제 저장은 항상 cm(roomPolygon)이다 — 토글해도 값이 반올림 오차로
 * 계속 깎여나가지 않는다(lib/roomDimensions.ts 주석 참고).
 */
export function StepDimensions({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const roomShape = useRoomBuilderStore((s) => s.roomShape);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const unit = useRoomBuilderStore((s) => s.unit);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);
  const setUnit = useRoomBuilderStore((s) => s.setUnit);
  const setDimension = useRoomBuilderStore((s) => s.setDimension);
  const setWallHeight = useRoomBuilderStore((s) => s.setWallHeight);

  const fields = getDimensionFields(roomShape);
  const dims = readDimensions(roomShape, roomPolygon);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-kr text-[clamp(26px,3.4vw,40px)] leading-[1.15]">
          치수를 정해보세요<span className="heading-dot">.</span>
        </h1>
        <p className="max-w-lg text-[14px] leading-[1.8] text-muted">
          숫자를 직접 입력해도 되고, 아래 평면도의 벽을 드래그해서 바꿔도 돼요. 150cm~1500cm 사이에서만
          조정돼요.
        </p>
      </div>

      {/* 단위 토글 */}
      <div className="flex w-fit gap-2 rounded-full border border-hair p-1">
        {UNIT_OPTIONS.map((opt) => {
          const active = unit === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setUnit(opt.id)}
              className="rounded-full px-5 py-2 text-[12px] font-semibold transition-colors"
              style={{
                background: active ? "var(--color-olive)" : "transparent",
                color: active ? "var(--color-cream)" : "var(--color-muted)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {fields.map((field) => (
          <DimensionInput
            key={field.id}
            label={field.label}
            valueCm={dims[field.id]}
            min={field.min}
            max={field.max}
            unit={unit}
            onCommit={(cm) => setDimension(field.id, cm)}
          />
        ))}
        <DimensionInput
          label="천장 높이"
          valueCm={wallHeightCm}
          min={MIN_WALL_HEIGHT_CM}
          max={MAX_WALL_HEIGHT_CM}
          unit={unit}
          onCommit={setWallHeight}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-[28px] bg-panel px-6 py-10 sm:px-10">
        <span className="label-mono text-[10px] text-faint">Preview — 테두리를 드래그해서 치수를 바꿀 수 있어요</span>
        <RoomDimensionCanvas className="mx-auto h-[320px] w-full max-w-[480px]" />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-hair px-8 py-4 text-[13px] font-semibold text-[#5f5f57] transition hover:border-olive hover:text-fg"
        >
          ← 이전
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-olive px-8 py-4 text-[13px] font-semibold text-cream transition hover:bg-fg"
        >
          다음: 문/창문·마감재 →
        </button>
      </div>
    </div>
  );
}

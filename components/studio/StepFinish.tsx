"use client";

import dynamic from "next/dynamic";
import { FloorStyleCards } from "@/components/studio/FloorStyleCards";
import { OpeningPalette } from "@/components/studio/OpeningPalette";
import { RoomPlanCanvas } from "@/components/studio/RoomPlanCanvas";
import { WallColorPicker } from "@/components/studio/WallColorPicker";

// three.js Canvas는 WebGL이라 SSR 불가 — /editor(EditorScene3D)와 같은 이유로
// 클라이언트 전용 동적 로드.
const RoomStudioScene3D = dynamic(
  () => import("@/components/studio/RoomStudioScene3D").then((m) => m.RoomStudioScene3D),
  { ssr: false, loading: () => <div className="flex h-[420px] items-center justify-center text-sm text-muted">3D 미리보기 불러오는 중…</div> },
);

/** STEP 13 — 3단계: 문/창문 배치 + 벽 색상·바닥 스타일. 왼쪽은 인터랙티브
 * 2D 평면도(문/창문 배치는 여기서만 — 클릭/드래그가 3D보다 훨씬 정확하고
 * 쉽다), 오른쪽은 그 결과를 실시간 반영하는 3D 미리보기. */
export function StepFinish({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-kr text-[clamp(26px,3.4vw,40px)] leading-[1.15]">
          문과 창문을 놓고, 마감재를 골라보세요<span className="heading-dot">.</span>
        </h1>
        <p className="max-w-lg text-[14px] leading-[1.8] text-muted">
          왼쪽 평면도에서 문/창문을 배치·이동하면 오른쪽 3D 뷰가 바로 따라와요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <OpeningPalette />
        <div className="flex flex-col gap-4 rounded-[28px] bg-panel px-6 py-8 sm:px-8">
          <span className="label-mono text-[10px] text-faint">Plan — 클릭으로 배치, 드래그로 이동</span>
          <RoomPlanCanvas className="mx-auto h-[300px] w-full max-w-[520px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <WallColorPicker />
        <FloorStyleCards />
      </div>

      <div className="flex flex-col gap-4">
        <span className="label-mono text-[10px] text-faint">3D Preview</span>
        <RoomStudioScene3D />
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
          다음: 예산 보기 →
        </button>
      </div>
    </div>
  );
}

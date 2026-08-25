"use client";

import { FloorStyleCards } from "@/components/studio/FloorStyleCards";
import { OpeningPalette } from "@/components/studio/OpeningPalette";
import { StepNav } from "@/components/studio/StepNav";
import { WallColorPicker } from "@/components/studio/WallColorPicker";

/** STEP 13 — 3단계: 문/창문 배치 + 벽 색상·바닥 스타일. 평면도(문/창문
 * 클릭 배치)와 3D 미리보기는 오른쪽 상시 패널(StudioPreviewPanel,
 * app/studio/page.tsx)이 맡는다 — 여기는 컨트롤(팔레트·색상·바닥)만. */
export function StepFinish({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-kr text-[clamp(26px,3.4vw,40px)] leading-[1.15]">
          문과 창문을 놓고, 마감재를 골라보세요<span className="heading-dot">.</span>
        </h1>
        <p className="max-w-lg text-[14px] leading-[1.8] text-muted">
          오른쪽 평면도에서 문/창문을 배치·이동하면 3D 뷰도 바로 따라와요. 놓인 항목을 클릭하면 삭제 버튼이 떠요.
        </p>
      </div>

      <OpeningPalette />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <WallColorPicker />
        <FloorStyleCards />
      </div>

      <StepNav onBack={onBack} onNext={onNext} nextLabel="다음: 가구 배치 →" />
    </div>
  );
}

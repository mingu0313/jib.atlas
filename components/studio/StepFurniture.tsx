"use client";

import { FurniturePalette } from "@/components/studio/FurniturePalette";
import { StepNav } from "@/components/studio/StepNav";

/**
 * 가구 배치 단계 — `/editor`(격자+박스가구)를 대체하는 마지막 조각.
 * 평면도(자유 위치 배치·드래그 이동)와 3D 뷰는 오른쪽 상시 패널
 * (StudioPreviewPanel, app/studio/page.tsx)이 맡는다 — 여기는 카탈로그
 * 팔레트만.
 */
export function StepFurniture({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-kr text-[clamp(26px,3.4vw,40px)] leading-[1.15]">
          가구를 놓아보세요<span className="heading-dot">.</span>
        </h1>
        <p className="max-w-lg text-[14px] leading-[1.8] text-muted">
          원하는 자리에 자유롭게 놓을 수 있어요. 아래에서 가구를 고르면 오른쪽 평면도가 바로 반응해요. 놓인 가구는
          클릭하면 회전·삭제 버튼이 떠요.
        </p>
      </div>

      <FurniturePalette />

      <StepNav onBack={onBack} onNext={onNext} nextLabel="다음: 예산 보기 →" />
    </div>
  );
}

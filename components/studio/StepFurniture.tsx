"use client";

import { FurniturePalette } from "@/components/studio/FurniturePalette";
import { SaveRoomImageButton } from "@/components/studio/SaveRoomImageButton";
import { StepNav } from "@/components/studio/StepNav";

/**
 * 가구 배치 단계 — `/editor`(격자+박스가구)를 대체하는, 지금 스테퍼의
 * 마지막 단계(예산 단계 삭제로 이제 4단계가 끝). 평면도(자유 위치 배치·
 * 드래그 이동)와 3D 뷰는 오른쪽 상시 패널(StudioPreviewPanel,
 * app/studio/page.tsx)이 맡는다 — 여기는 카탈로그 팔레트만.
 *
 * 마지막 단계라 팔레트 아래에 "완성했어요" 카드(STEP 17)를 둔다 — 아직
 * 별도의 "완료 화면"을 새로 만들진 않고, 이 4단계 자체가 사실상 끝이라
 * 여기 붙였다. 집지도 공유(별도 작업)는 이 카드가 자리를 잡아두면 나중에
 * 바로 옆에 버튼만 추가하면 된다.
 */
export function StepFurniture({ onBack }: { onBack: () => void }) {
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

      <div className="flex flex-col items-start gap-4 rounded-[22px] border border-hair px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="label-mono text-[10px] text-olive-mid">Finished</span>
          <p className="text-[14px] text-fg">방을 다 꾸미셨나요? 지금 3D 룸 뷰를 이미지로 남겨보세요.</p>
        </div>
        <SaveRoomImageButton />
      </div>

      <StepNav onBack={onBack} />
    </div>
  );
}

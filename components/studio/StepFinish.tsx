"use client";

import { FloorStyleCards } from "@/components/studio/FloorStyleCards";
import { OpeningPalette } from "@/components/studio/OpeningPalette";
import { StepNav } from "@/components/studio/StepNav";
import { WallColorPicker } from "@/components/studio/WallColorPicker";

/** STEP 13 — 3단계: 문/창문 배치 + 벽 색상·바닥 스타일. 평면도(문/창문
 * 클릭 배치)와 3D 미리보기는 오른쪽 상시 패널(StudioPreviewPanel,
 * app/studio/page.tsx)이 맡는다 — 여기는 컨트롤(팔레트·색상·바닥)만.
 *
 * lang(기본 "ko") — /en/studio 다국어 확장(STEP 16). 자식 컴포넌트에도
 * 그대로 흘려보낸다. */
export function StepFinish({ onBack, onNext, lang = "ko" }: { onBack: () => void; onNext: () => void; lang?: "ko" | "en" }) {
  const isEn = lang === "en";
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        {/* StepShape.tsx와 같은 이유로 h2 — 페이지 h1은 app/studio/page.tsx. */}
        <h2 className="font-kr text-[clamp(26px,3.4vw,40px)] leading-[1.15]">
          {isEn ? (
            <>Place doors and windows, and pick finishes<span className="heading-dot">.</span></>
          ) : (
            <>문과 창문을 놓고, 마감재를 골라보세요<span className="heading-dot">.</span></>
          )}
        </h2>
        <p className="max-w-lg text-[14px] leading-[1.8] text-muted">
          {isEn
            ? "Place or move doors/windows on the floor plan to the right and the 3D view follows instantly. Click a placed item for a delete button."
            : "오른쪽 평면도에서 문/창문을 배치·이동하면 3D 뷰도 바로 따라와요. 놓인 항목을 클릭하면 삭제 버튼이 떠요."}
        </p>
      </div>

      <OpeningPalette lang={lang} />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <WallColorPicker lang={lang} />
        <FloorStyleCards lang={lang} />
      </div>

      <StepNav onBack={onBack} onNext={onNext} nextLabel={isEn ? "Next: Add furniture →" : "다음: 가구 배치 →"} lang={lang} />
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { FurniturePalette } from "@/components/studio/FurniturePalette";
import { RoomFurnitureCanvas } from "@/components/studio/RoomFurnitureCanvas";

// three.js Canvas는 WebGL이라 SSR 불가 — StepFinish.tsx와 같은 이유로
// 클라이언트 전용 동적 로드.
const RoomStudioScene3D = dynamic(
  () => import("@/components/studio/RoomStudioScene3D").then((m) => m.RoomStudioScene3D),
  { ssr: false, loading: () => <div className="flex h-[420px] items-center justify-center text-sm text-muted">3D 미리보기 불러오는 중…</div> },
);

/**
 * 가구 배치 단계 — `/editor`(격자+박스가구)를 대체하는 마지막 조각.
 * 왼쪽은 카탈로그 팔레트, 가운데는 인터랙티브 2D 평면도(자유 위치 배치·
 * 드래그 이동), 아래는 그 결과를 실시간 반영하는 3D 뷰. 문/창문 단계
 * (StepFinish)와 같은 3분할 레이아웃을 그대로 따른다.
 */
export function StepFurniture({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-kr text-[clamp(26px,3.4vw,40px)] leading-[1.15]">
          가구를 놓아보세요<span className="heading-dot">.</span>
        </h1>
        <p className="max-w-lg text-[14px] leading-[1.8] text-muted">
          원하는 자리에 자유롭게 놓을 수 있어요. 왼쪽에서 가구를 고르면 아래 평면도가 바로 반응해요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <FurniturePalette />
        <div className="flex flex-col gap-4 rounded-[28px] bg-panel px-6 py-8 sm:px-8">
          <span className="label-mono text-[10px] text-faint">Plan — 클릭으로 배치, 드래그로 이동</span>
          <RoomFurnitureCanvas className="mx-auto h-[300px] w-full max-w-[520px]" />
        </div>
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

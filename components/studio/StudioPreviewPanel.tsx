"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { RoomDimensionCanvas } from "@/components/studio/RoomDimensionCanvas";
import { RoomFurnitureCanvas } from "@/components/studio/RoomFurnitureCanvas";
import { RoomPlanCanvas } from "@/components/studio/RoomPlanCanvas";
import { RoomPolygonPreview } from "@/components/studio/RoomPolygonPreview";
import { RoomViewToolbar } from "@/components/studio/RoomViewToolbar";
import { getFloorAreaM2 } from "@/lib/roomGeometry";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";

// three.js Canvas는 WebGL이라 SSR 불가 — 예전엔 StepFinish/StepFurniture
// 두 곳에서 각자 이렇게 동적 로드했는데, 이제 이 패널 하나로 합쳤다(아래
// PreviewMode 주석 참고 — 그게 이 통합의 핵심 이유다).
const RoomStudioScene3D = dynamic(
  () => import("@/components/studio/RoomStudioScene3D").then((m) => m.RoomStudioScene3D),
  { ssr: false, loading: () => <div className="flex h-[420px] items-center justify-center text-sm text-muted">3D 미리보기 불러오는 중…</div> },
);

const CANVAS_HEIGHT = "h-[420px]";

type PreviewMode = "2d" | "3d";

/**
 * `/studio` 5단계 전체에서 딱 하나만 마운트되는 상시 프리뷰 패널
 * (app/studio/page.tsx가 단계 콘텐츠 옆에 고정으로 둔다). 예전엔 3단계
 * (StepFinish)·4단계(StepFurniture) 각자가 자기 3D 씬을 갖고 있어서 단계를
 * 넘길 때마다 <Canvas>가 통째로 리마운트되고 OrbitControls 카메라 각도가
 * 매번 초기화됐다 — 여기선 3D를 항상 마운트해두고 2D/3D 탭 전환도
 * display:none으로만 하기 때문에(진짜 언마운트 안 함) 카메라 상태가 단계를
 * 넘나들고 탭을 오가도 그대로 유지된다.
 *
 * 2D 쪽은 단계마다 보여줄 캔버스 자체가 다르므로(모양 프리뷰 → 치수 드래그
 * → 문/창문 배치 → 가구 배치) step에 따라 조건부로 갈아끼운다 — 이쪽은
 * 언마운트돼도 카메라처럼 잃을 상태가 없어서 괜찮다. 5단계(예산)도
 * 4단계와 같은 RoomFurnitureCanvas를 그대로 쓴다 — 예산을 보며 가구를
 * 마지막으로 미세 조정하면 StepBudget의 예산 합계가 store 구독으로 바로
 * 재계산된다.
 */
export function StudioPreviewPanel({ step }: { step: number }) {
  const [mode, setMode] = useState<PreviewMode>("2d");

  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);
  const selectOpening = useRoomBuilderStore((s) => s.selectOpening);
  const selectFurnitureItem = useRoomBuilderStore((s) => s.selectFurnitureItem);
  const selectedOpeningId = useRoomBuilderStore((s) => s.selectedOpeningId);
  const selectedFurnitureId = useRoomBuilderStore((s) => s.selectedFurnitureId);
  const removeOpening = useRoomBuilderStore((s) => s.removeOpening);
  const removeFurniture = useRoomBuilderStore((s) => s.removeFurniture);
  const rotateFurniture = useRoomBuilderStore((s) => s.rotateFurniture);

  // 단계를 넘기면 이전 단계에서 선택돼 있던 문/창문·가구 선택을 지운다 —
  // 안 지우면 예컨대 3단계에서 문을 선택한 채로 4단계로 넘어갔을 때, 화면엔
  // 아무 선택 표시도 안 보이는데 Delete 키를 누르면 안 보이는 그 문이
  // 지워지는 놀람 버그가 생긴다.
  useEffect(() => {
    selectOpening(null);
    selectFurnitureItem(null);
  }, [step, selectOpening, selectFurnitureItem]);

  // 선택된 opening/furniture를 Delete·Backspace로 삭제, R로 회전(가구만).
  // 입력창(치수 입력 등)에 포커스가 있을 때는 무시 — 안 그러면 숫자를
  // 지우려고 Backspace를 눌렀는데 방금 선택한 가구가 같이 지워진다.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedOpeningId) removeOpening(selectedOpeningId);
        else if (selectedFurnitureId) removeFurniture(selectedFurnitureId);
      } else if ((e.key === "r" || e.key === "R") && selectedFurnitureId) {
        rotateFurniture(selectedFurnitureId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedOpeningId, selectedFurnitureId, removeOpening, removeFurniture, rotateFurniture]);

  const areaM2 = getFloorAreaM2(roomPolygon);
  const spanWidthCm = Math.max(...roomPolygon.map((p) => p.x));
  const spanDepthCm = Math.max(...roomPolygon.map((p) => p.z));

  let plan2D: React.ReactNode;
  if (step === 1) plan2D = <RoomPolygonPreview polygon={roomPolygon} className={`mx-auto ${CANVAS_HEIGHT} w-full`} strokeWidth={4} />;
  else if (step === 2) plan2D = <RoomDimensionCanvas className={`mx-auto ${CANVAS_HEIGHT} w-full`} />;
  else if (step === 3) plan2D = <RoomPlanCanvas className={`mx-auto ${CANVAS_HEIGHT} w-full`} />;
  else plan2D = <RoomFurnitureCanvas className={`mx-auto ${CANVAS_HEIGHT} w-full`} />;

  return (
    <div className="flex flex-col gap-4 rounded-[28px] bg-panel px-6 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit gap-1 rounded-full border border-hair p-1">
          {(["2d", "3d"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors"
                style={{
                  background: active ? "var(--color-olive)" : "transparent",
                  color: active ? "var(--color-cream)" : "var(--color-muted)",
                }}
              >
                {m === "2d" ? "평면도" : "3D 보기"}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12px] text-muted">
          <span>
            <strong className="text-fg">{areaM2.toFixed(1)}</strong>㎡
          </span>
          <span>
            {Math.round(spanWidthCm)}×{Math.round(spanDepthCm)}cm
          </span>
          <span>천장 {Math.round(wallHeightCm)}cm</span>
        </div>
      </div>

      {/* 3D는 항상 마운트해두고 표시만 토글 — 리마운트되면 카메라 각도가 사라진다.
          하단 뷰 전환 툴바(STEP 16)도 같은 relative 박스 안에서 캔버스 위에
          떠 있어야 하니 3D 표시 토글과 한 wrapper로 묶는다. visible={false}일
          땐 RoomStudioScene3D가 렌더 루프 자체를 멈춘다(안 보이는 WebGL 씬이
          계속 프레임을 그리며 배터리·GPU를 쓰는 걸 막는 모바일 최적화). */}
      <div className="relative" style={{ display: mode === "3d" ? "block" : "none" }}>
        <RoomStudioScene3D visible={mode === "3d"} />
        <RoomViewToolbar />
      </div>
      <div style={{ display: mode === "2d" ? "block" : "none" }}>{plan2D}</div>
    </div>
  );
}

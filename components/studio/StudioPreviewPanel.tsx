"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { RoomDimensionCanvas } from "@/components/studio/RoomDimensionCanvas";
import { RoomFurnitureCanvas } from "@/components/studio/RoomFurnitureCanvas";
import { RoomPlanCanvas } from "@/components/studio/RoomPlanCanvas";
import { RoomPolygonPreview } from "@/components/studio/RoomPolygonPreview";
import { RoomViewToolbar } from "@/components/studio/RoomViewToolbar";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { getFloorAreaM2 } from "@/lib/roomGeometry";
import { FINE_ANGLE_MAX_DEG, FINE_ANGLE_STEP_DEG, POSITION_NUDGE_STEP_CM, useRoomBuilderStore } from "@/lib/roomBuilderStore";
import type { IsoFurnitureDef } from "@/lib/types";

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];
const furnitureDefById = new Map(furnitureCatalog.map((d) => [d.id, d]));

// three.js Canvas는 WebGL이라 SSR 불가 — 예전엔 StepFinish/StepFurniture
// 두 곳에서 각자 이렇게 동적 로드했는데, 이제 이 패널 하나로 합쳤다(아래
// PreviewMode 주석 참고 — 그게 이 통합의 핵심 이유다).
const RoomStudioScene3D = dynamic(
  () => import("@/components/studio/RoomStudioScene3D").then((m) => m.RoomStudioScene3D),
  { ssr: false, loading: () => <div className="flex h-[420px] items-center justify-center text-sm text-muted">3D 미리보기 불러오는 중…</div> },
);

const CANVAS_HEIGHT = "h-[420px]";

/**
 * `/studio` 4단계 전체에서 딱 하나만 마운트되는 상시 프리뷰 패널
 * (app/studio/page.tsx가 단계 콘텐츠 옆에 고정으로 둔다). 예전엔 3단계
 * (StepFinish)·4단계(StepFurniture) 각자가 자기 3D 씬을 갖고 있어서 단계를
 * 넘길 때마다 <Canvas>가 통째로 리마운트되고 OrbitControls 카메라 각도가
 * 매번 초기화됐다 — 여기선 3D를 항상 마운트해두고 2D/3D 탭 전환도
 * display:none으로만 하기 때문에(진짜 언마운트 안 함) 카메라 상태가 단계를
 * 넘나들고 탭을 오가도 그대로 유지된다.
 *
 * 2D 쪽은 단계마다 보여줄 캔버스 자체가 다르므로(모양 프리뷰 → 치수 드래그
 * → 문/창문 배치 → 가구 배치) step에 따라 조건부로 갈아끼운다 — 이쪽은
 * 언마운트돼도 카메라처럼 잃을 상태가 없어서 괜찮다.
 *
 * 2D/3D 탭 상태(previewMode)는 STEP 17부터 로컬 state가 아니라
 * store(lib/roomBuilderStore.ts)에 있다 — "이미지로 저장하기" 버튼이
 * 형제 컴포넌트(StepFurniture)에서 저장 직전 3D 탭으로 강제 전환해야
 * 해서, 이 패널 밖에서도 건드릴 수 있어야 한다.
 */
export function StudioPreviewPanel({ step }: { step: number }) {
  const mode = useRoomBuilderStore((s) => s.previewMode);
  const setMode = useRoomBuilderStore((s) => s.setPreviewMode);

  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);
  const selectOpening = useRoomBuilderStore((s) => s.selectOpening);
  const selectFurnitureItem = useRoomBuilderStore((s) => s.selectFurnitureItem);
  const selectedOpeningId = useRoomBuilderStore((s) => s.selectedOpeningId);
  const selectedFurnitureId = useRoomBuilderStore((s) => s.selectedFurnitureId);
  const removeOpening = useRoomBuilderStore((s) => s.removeOpening);
  const removeFurniture = useRoomBuilderStore((s) => s.removeFurniture);
  const rotateFurniture = useRoomBuilderStore((s) => s.rotateFurniture);
  const nudgeFurnitureAngle = useRoomBuilderStore((s) => s.nudgeFurnitureAngle);
  const nudgeFurniturePosition = useRoomBuilderStore((s) => s.nudgeFurniturePosition);

  // 단계를 넘기면 이전 단계에서 선택돼 있던 문/창문·가구 선택을 지운다 —
  // 안 지우면 예컨대 3단계에서 문을 선택한 채로 4단계로 넘어갔을 때, 화면엔
  // 아무 선택 표시도 안 보이는데 Delete 키를 누르면 안 보이는 그 문이
  // 지워지는 놀람 버그가 생긴다.
  useEffect(() => {
    selectOpening(null);
    selectFurnitureItem(null);
  }, [step, selectOpening, selectFurnitureItem]);

  // 선택된 opening/furniture를 Delete·Backspace로 삭제, R로 90도 회전
  // (가구만). STEP 21 — 화살표 키로 위치 미세이동(Shift면 4배 큰 스텝),
  // [·]로 미세 각도 조절(±FINE_ANGLE_STEP_DEG)도 여기 추가했다 — 2D/3D
  // 어느 모드를 보고 있어도(이 핸들러는 모드와 무관하게 항상 붙어 있다)
  // 똑같이 동작해서 "3D 화면에서도 미세조절"을 만족한다. 입력창(치수
  // 입력 등)에 포커스가 있을 때는 무시 — 안 그러면 숫자를 지우려고
  // Backspace를 눌렀는데 방금 선택한 가구가 같이 지워진다.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedOpeningId) removeOpening(selectedOpeningId);
        else if (selectedFurnitureId) removeFurniture(selectedFurnitureId);
        return;
      }
      if (!selectedFurnitureId) return;
      if (e.key === "r" || e.key === "R") {
        rotateFurniture(selectedFurnitureId);
      } else if (e.key === "[") {
        nudgeFurnitureAngle(selectedFurnitureId, -FINE_ANGLE_STEP_DEG);
      } else if (e.key === "]") {
        nudgeFurnitureAngle(selectedFurnitureId, FINE_ANGLE_STEP_DEG);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault(); // 화살표 키의 기본 동작(페이지 스크롤)을 막는다.
        const step = e.shiftKey ? POSITION_NUDGE_STEP_CM * 4 : POSITION_NUDGE_STEP_CM;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dz = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        if (dx || dz) nudgeFurniturePosition(selectedFurnitureId, dx, dz);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedOpeningId,
    selectedFurnitureId,
    removeOpening,
    removeFurniture,
    rotateFurniture,
    nudgeFurnitureAngle,
    nudgeFurniturePosition,
  ]);

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

      {/* 2D/3D 공통 relative 래퍼 — FurnitureFineTunePanel(STEP 21)이 선택된
          가구가 있으면 어느 모드든 위에 떠 있어야 해서(요청: "3D 화면에서도
          미세조절"), 이제 3D 전용이던 relative 박스를 2D·3D 둘 다 감싸는
          바깥 하나로 옮겼다. */}
      <div className="relative">
        {/* 3D는 항상 마운트해두고 표시만 토글 — 리마운트되면 카메라 각도가 사라진다.
            하단 뷰 전환 툴바(STEP 16)도 이 안에서 캔버스 위에 떠 있어야 하니
            같은 wrapper 안에 둔다. visible={false}일 땐 RoomStudioScene3D가
            렌더 루프 자체를 멈춘다(안 보이는 WebGL 씬이 계속 프레임을 그리며
            배터리·GPU를 쓰는 걸 막는 모바일 최적화). */}
        <div style={{ display: mode === "3d" ? "block" : "none" }}>
          <RoomStudioScene3D visible={mode === "3d"} />
          <RoomViewToolbar />
        </div>
        <div style={{ display: mode === "2d" ? "block" : "none" }}>{plan2D}</div>
        <FurnitureFineTunePanel />
      </div>
    </div>
  );
}

/**
 * STEP 21 — 선택된 가구가 있을 때 프리뷰 위(2D든 3D든)에 떠서 위치·각도를
 * 미세조절하는 오버레이. 기존엔 회전이 90도 스냅 하나뿐이고 이동은 2D
 * 평면도 드래그로만 됐는데("코너 소파를 방 어느 귀퉁이에도 맞추고 싶다",
 * "3D 화면에서도 조절하고 싶다") — 여기 버튼은 store의
 * nudgeFurnitureAngle/nudgeFurniturePosition을 그대로 호출해서 2D 캔버스
 * 드래그·키보드([·]/화살표, StudioPreviewPanel 최상단 핸들러)와 같은
 * 값을 공유한다. 3D를 보는 중에도 이 패널이 뜨는 이유가 바로 이거다 —
 * 3D 캔버스 자체에 레이캐스팅 드래그를 넣는 대신(범위가 커서 STEP 16이
 * 미뤄둔 부분), 뷰와 무관하게 항상 같은 위치에 뜨는 이 컨트롤로 "3D
 * 화면에서도 미세조절"을 만족시킨다.
 */
function FurnitureFineTunePanel() {
  const selectedFurnitureId = useRoomBuilderStore((s) => s.selectedFurnitureId);
  const furniture = useRoomBuilderStore((s) => s.furniture);
  const nudgeFurnitureAngle = useRoomBuilderStore((s) => s.nudgeFurnitureAngle);
  const nudgeFurniturePosition = useRoomBuilderStore((s) => s.nudgeFurniturePosition);
  const removeFurniture = useRoomBuilderStore((s) => s.removeFurniture);

  const item = selectedFurnitureId ? furniture.find((f) => f.id === selectedFurnitureId) : undefined;
  if (!item) return null;
  const def = furnitureDefById.get(item.defId);
  const fineAngleDeg = item.fineAngleDeg ?? 0;

  const nudgeBtnClass =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-hair text-[11px] leading-none transition hover:border-olive hover:text-olive";

  return (
    <div
      className="absolute top-3 right-3 z-20 flex flex-col gap-2 rounded-[14px] px-3 py-2.5 backdrop-blur-[16px]"
      style={{ background: "rgba(247,246,242,0.92)", border: "1px solid var(--color-hair)" }}
      title="키보드 Delete/Backspace로도 뺄 수 있어요, [ ]로 회전, 화살표로 이동돼요(Shift로 크게)"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label-mono text-[9px] text-faint">{def?.label ?? "가구"} 미세조절</span>
        {/* 키보드 Delete/Backspace(StudioPreviewPanel 최상단 핸들러)와 같은
            동작 — 터치 기기에선 키보드가 없어 이 패널에서 뺄 방법이 아예
            없었다("기구를 다시 뺄 수 있는 기능"). */}
        <button
          type="button"
          aria-label="가구 빼기"
          title="가구 빼기"
          onClick={() => removeFurniture(item.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-hair text-[11px] leading-none text-muted transition hover:border-[#b5453a] hover:text-[#b5453a]"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button type="button" aria-label="왼쪽으로 미세 회전" onClick={() => nudgeFurnitureAngle(item.id, -FINE_ANGLE_STEP_DEG)} className={nudgeBtnClass}>
          ↺
        </button>
        <input
          type="range"
          min={-FINE_ANGLE_MAX_DEG}
          max={FINE_ANGLE_MAX_DEG}
          step={1}
          value={fineAngleDeg}
          onChange={(e) => nudgeFurnitureAngle(item.id, Number(e.target.value) - fineAngleDeg)}
          className="w-16 accent-[var(--color-olive)]"
          aria-label="미세 회전 각도"
        />
        <button type="button" aria-label="오른쪽으로 미세 회전" onClick={() => nudgeFurnitureAngle(item.id, FINE_ANGLE_STEP_DEG)} className={nudgeBtnClass}>
          ↻
        </button>
        <span className="label-mono w-7 shrink-0 text-right text-[10px] text-muted">
          {fineAngleDeg > 0 ? "+" : ""}
          {fineAngleDeg}°
        </span>
      </div>

      {/* 위치 미세이동 — 세로 3x3 그리드 대신 한 줄로 눕혀서 자리를 덜 차지한다. */}
      <div className="flex items-center gap-1.5">
        <button type="button" aria-label="왼쪽으로 이동" onClick={() => nudgeFurniturePosition(item.id, -POSITION_NUDGE_STEP_CM, 0)} className={nudgeBtnClass}>
          ◀
        </button>
        <button type="button" aria-label="위로 이동" onClick={() => nudgeFurniturePosition(item.id, 0, -POSITION_NUDGE_STEP_CM)} className={nudgeBtnClass}>
          ▲
        </button>
        <button type="button" aria-label="아래로 이동" onClick={() => nudgeFurniturePosition(item.id, 0, POSITION_NUDGE_STEP_CM)} className={nudgeBtnClass}>
          ▼
        </button>
        <button type="button" aria-label="오른쪽으로 이동" onClick={() => nudgeFurniturePosition(item.id, POSITION_NUDGE_STEP_CM, 0)} className={nudgeBtnClass}>
          ▶
        </button>
        <span className="label-mono text-[9px] text-faint">이동</span>
      </div>
    </div>
  );
}

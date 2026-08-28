"use client";

import { useEffect, useRef, useState } from "react";
import { formatLength } from "@/lib/roomDimensions";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { getWallSegments } from "@/lib/roomGeometry";
import { DEFAULT_WALL_COLOR_HEX, WALL_COLOR_PRESETS } from "@/lib/roomStyle";
import type { RoomViewMode } from "@/lib/cameraPresets";

/** 이 툴바 전용 강조색 — app/globals.css 브랜드 토큰(올리브/세이지)이
 * 아니라 스펙이 지정한 "copper" 포인트. WALL_COLOR_PRESETS의 카퍼
 * 스와치와 같은 값이라 팔레트를 열었을 때도 톤이 튄다는 느낌이 없다. */
const ACCENT = "#B5673E";

function AerialIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M10 2 17 6 10 10 3 6Z" />
      <path d="M3 6 3 13 10 17 10 10" />
      <path d="M17 6 17 13 10 17" />
    </svg>
  );
}

function TopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <path d="M3 9 H9 V3" />
    </svg>
  );
}

function SideIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <rect x="3" y="3" width="14" height="14" rx="1" />
      <rect x="11" y="9" width="3" height="8" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="9" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1 5 5 9 1" />
    </svg>
  );
}

function RulerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="16" height="5" rx="1" />
      <path d="M5 8 V11 M8 8 V10 M11 8 V11 M14 8 V10" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M10 3a7 7 0 1 0 0 14c1 0 1.6-.5 1.6-1.3 0-.4-.2-.7-.2-1.1 0-.7.6-1.1 1.3-1.1H14a3 3 0 0 0 3-3 7 7 0 0 0-7-7Z" />
      <circle cx="6.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M5 15 15 5" />
    </svg>
  );
}

const VIEW_TABS: { mode: RoomViewMode; label: string; icon: React.ReactNode }[] = [
  { mode: "aerial", label: "항공뷰", icon: <AerialIcon /> },
  { mode: "top", label: "상단뷰", icon: <TopIcon /> },
  { mode: "side", label: "사이드뷰", icon: <SideIcon /> },
];

/**
 * STEP 16 — 3D 프리뷰 하단에 떠 있는 뷰 전환 캡슐 툴바. 항공/상단/사이드
 * 탭은 store.viewMode를 바꾸고, 실제 카메라 이동은 RoomStudioScene3D의
 * CameraRig가 lib/cameraPresets.ts 계산 결과로 부드럽게 처리한다 — 이
 * 컴포넌트는 순수 DOM UI(탭·드롭다운·플로팅 팔레트)만 맡는다.
 *
 * 사이드뷰 드롭다운·색상 팔레트는 컴포넌트 로컬 state로만 열고 닫는다 —
 * "지금 팝오버가 열려 있는지"는 다른 화면·새로고침에 걸쳐 기억할 필요가
 * 없는 순간적인 UI 상태라 store에는 안 둔다(store엔 스펙이 명시한
 * viewMode/sideViewWallId/measurementVisible 세 필드만 추가했다).
 */
export function RoomViewToolbar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wallListOpen, setWallListOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const viewMode = useRoomBuilderStore((s) => s.viewMode);
  const setViewMode = useRoomBuilderStore((s) => s.setViewMode);
  const sideViewWallId = useRoomBuilderStore((s) => s.sideViewWallId);
  const setSideViewWallId = useRoomBuilderStore((s) => s.setSideViewWallId);
  const measurementVisible = useRoomBuilderStore((s) => s.measurementVisible);
  const toggleMeasurement = useRoomBuilderStore((s) => s.toggleMeasurement);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const unit = useRoomBuilderStore((s) => s.unit);
  const wallColorHex = useRoomBuilderStore((s) => s.wallColorHex);
  const setWallColor = useRoomBuilderStore((s) => s.setWallColor);

  const walls = getWallSegments(roomPolygon);

  // 팝오버 바깥을 클릭·터치하면 둘 다 닫는다.
  useEffect(() => {
    if (!wallListOpen && !paletteOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setWallListOpen(false);
        setPaletteOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [wallListOpen, paletteOpen]);

  function selectTab(mode: RoomViewMode) {
    setViewMode(mode);
    setPaletteOpen(false);
    if (mode !== "side") setWallListOpen(false);
    if (mode === "side" && sideViewWallId === null && walls.length > 0) {
      setSideViewWallId("0");
    }
  }

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-hair px-2 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        style={{ background: "var(--color-panel)" }}
      >
        {VIEW_TABS.map((tab) => {
          const active = viewMode === tab.mode;
          return (
            <div key={tab.mode} className="relative">
              <button
                type="button"
                onClick={() => selectTab(tab.mode)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors"
                style={{
                  background: active ? ACCENT : "transparent",
                  color: active ? "#FFF" : "var(--color-muted)",
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.mode === "side" && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="벽 선택"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPaletteOpen(false);
                      setWallListOpen((o) => !o);
                    }}
                    className="-mr-1 ml-0.5 rounded-full p-0.5"
                  >
                    <ChevronIcon />
                  </span>
                )}
              </button>

              {tab.mode === "side" && wallListOpen && (
                <div
                  className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded-2xl border border-hair p-1 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
                  style={{ background: "var(--color-panel)" }}
                >
                  {walls.map((wall, i) => {
                    const selected = viewMode === "side" && (sideViewWallId ?? "0") === String(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSideViewWallId(String(i));
                          setViewMode("side");
                          setWallListOpen(false);
                        }}
                        className="block w-full whitespace-nowrap rounded-xl px-3 py-2 text-left text-[12px] transition-colors"
                        style={{
                          background: selected ? "var(--color-sage)" : "transparent",
                          color: selected ? "var(--color-sage-ink)" : "var(--color-fg)",
                        }}
                      >
                        벽 {i + 1} · {formatLength(wall.length, unit)}
                        {unit}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <span className="mx-1 h-6 w-px" style={{ background: "var(--color-hair)" }} />

        <button
          type="button"
          onClick={toggleMeasurement}
          aria-pressed={measurementVisible}
          aria-label="측정 오버레이 토글"
          title="측정 오버레이"
          className="flex items-center justify-center rounded-full p-2.5 transition-colors"
          style={{
            background: measurementVisible ? ACCENT : "transparent",
            color: measurementVisible ? "#FFF" : "var(--color-muted)",
          }}
        >
          <RulerIcon />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setWallListOpen(false);
              setPaletteOpen((o) => !o);
            }}
            aria-pressed={paletteOpen}
            aria-label="벽 색상 팔레트"
            title="벽 색상"
            className="flex items-center justify-center rounded-full p-2.5 transition-colors"
            style={{
              background: paletteOpen ? ACCENT : "transparent",
              color: paletteOpen ? "#FFF" : "var(--color-muted)",
            }}
          >
            <PaletteIcon />
          </button>

          {paletteOpen && (
            <div
              className="absolute bottom-full right-0 mb-2 grid w-max grid-cols-6 gap-2 rounded-2xl border border-hair p-3 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
              style={{ background: "var(--color-panel)" }}
            >
              <button
                type="button"
                onClick={() => setWallColor(DEFAULT_WALL_COLOR_HEX)}
                title="색상 초기화"
                aria-label="색상 초기화"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-hair text-faint"
              >
                <ResetIcon />
              </button>
              {WALL_COLOR_PRESETS.map((preset) => {
                const selected = wallColorHex.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setWallColor(preset.hex)}
                    title={preset.label}
                    aria-label={preset.label}
                    className="h-8 w-8 rounded-full transition-transform"
                    style={{
                      background: preset.hex,
                      outline: selected ? `2px solid ${ACCENT}` : "1px solid var(--color-hair)",
                      outlineOffset: 2,
                      transform: selected ? "scale(1.1)" : "scale(1)",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

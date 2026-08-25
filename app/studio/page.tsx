"use client";

import Link from "next/link";
import { RoomPolygonPreview } from "@/components/studio/RoomPolygonPreview";
import { ROOM_SHAPE_PRESETS, useRoomBuilderStore } from "@/lib/roomBuilderStore";

/**
 * `/studio` — 진단과 무관한 독립 룸빌더 진입 경로(STEP 15). IKEA 홈디자인
 * 플래너를 참고한 4단계 위저드로 간다: ① 모양·크기 → ② 치수 → ③ 문/창문·
 * 마감재 → ④ 예산. 지금은 ①(STEP 11)만 구현 — 나머지는 자리만 잡아두고
 * "곧 추가돼요"로 비활성 처리한다.
 *
 * 기존 `/editor`(진단 매칭 → 고정 격자 3D 방, lib/editorStore.ts)는 그대로
 * 두고 완전히 별도로 만든 새 store(lib/roomBuilderStore.ts)를 쓴다 — 집
 * 아틀라스 공유(house_posts.room_items)가 기존 격자 구조에 의존하고 있어서,
 * 이 정밀 빌더가 그 위에 얹히면 안 된다.
 *
 * 상단바는 랜딩의 FloatingNav 대신 /editor와 같은 자체 툴바 패턴을 쓴다 —
 * FloatingNav는 실제로 `/`·`/en` 랜딩 두 곳에서만 쓰이고, 도구성 페이지는
 * 각자 로고+단계 라벨+뒤로가기로 된 얇은 바를 쓰는 게 이 저장소 관례다.
 */

const STEPS = [
  { id: "shape", label: "모양·크기" },
  { id: "dimensions", label: "치수" },
  { id: "finish", label: "문/창문·마감재" },
  { id: "budget", label: "예산" },
] as const;

export default function StudioPage() {
  const roomShape = useRoomBuilderStore((s) => s.roomShape);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const selectShape = useRoomBuilderStore((s) => s.selectShape);

  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      {/* 상단바 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair px-6 py-5 sm:px-8">
        <div className="flex items-center gap-[18px] sm:gap-[22px]">
          <Link href="/" className="font-display text-[22px] text-fg">
            jib<span className="text-olive-mid">.</span>atlas
          </Link>
          <span className="h-[18px] w-px bg-hair" />
          <span className="label-mono text-[10px] text-olive-mid">Room Studio — 1. 모양·크기</span>
        </div>
        <Link
          href="/"
          className="rounded-full border border-hair px-[22px] py-[11px] text-[12px] text-[#5f5f57] transition hover:border-olive hover:text-fg"
        >
          홈으로
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[880px] flex-1 flex-col gap-12 px-6 py-12 sm:px-10 sm:py-16">
        {/* 4단계 인디케이터 */}
        <ol className="flex flex-wrap items-center gap-3">
          {STEPS.map((step, i) => {
            const active = i === 0;
            return (
              <li key={step.id} className="flex items-center gap-3">
                <span
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold"
                  style={{
                    borderColor: active ? "var(--color-olive)" : "var(--color-hair)",
                    background: active ? "var(--color-sage)" : "transparent",
                    color: active ? "var(--color-sage-ink)" : "var(--color-faint)",
                  }}
                >
                  <span className="label-mono text-[10px]">{i + 1}</span>
                  {step.label}
                </span>
                {i < STEPS.length - 1 && <span className="h-px w-6 bg-hair" aria-hidden />}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-3">
          <h1 className="font-kr text-[clamp(26px,3.4vw,40px)] leading-[1.15]">
            방 모양을 선택하세요<span className="heading-dot">.</span>
          </h1>
          <p className="max-w-lg text-[14px] leading-[1.8] text-muted">
            자유 편집은 아직이지만, 치수는 다음 단계에서 원하는 대로 바꿀 수 있어요.
          </p>
        </div>

        {/* 프리셋 카드 3장 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {ROOM_SHAPE_PRESETS.map((preset) => {
            const selected = roomShape === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectShape(preset.id)}
                className="flex flex-col gap-4 rounded-[22px] border p-6 text-left transition-colors"
                style={{
                  borderColor: selected ? "var(--color-olive)" : "var(--color-hair)",
                  background: selected ? "var(--color-sage)" : "var(--color-panel)",
                }}
              >
                <RoomPolygonPreview polygon={preset.defaultPolygon} className="h-[100px] w-full" strokeWidth={8} />
                <div className="flex flex-col gap-1">
                  <span className="font-kr text-lg" style={{ color: selected ? "var(--color-sage-ink)" : "var(--color-fg)" }}>
                    {preset.label}
                  </span>
                  <span className="text-[12px]" style={{ color: selected ? "var(--color-sage-ink)" : "var(--color-muted)" }}>
                    {preset.helper}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 선택한 모양 큰 미리보기 */}
        <div className="flex flex-col gap-4 rounded-[28px] bg-panel px-6 py-10 sm:px-10">
          <span className="label-mono text-[10px] text-faint">Preview</span>
          <RoomPolygonPreview polygon={roomPolygon} className="mx-auto h-[280px] w-full max-w-[440px]" strokeWidth={3} />
        </div>

        <div className="flex flex-col items-end gap-2 self-end">
          <button
            type="button"
            disabled
            title="치수 조정은 다음 단계에서 이어집니다"
            className="rounded-full bg-olive px-8 py-4 text-[13px] font-semibold text-cream opacity-40"
          >
            다음: 치수 조정하기 →
          </button>
          <span className="text-[11px] text-faint">치수·문/창문·예산 단계는 곧 추가돼요.</span>
        </div>
      </div>
    </main>
  );
}

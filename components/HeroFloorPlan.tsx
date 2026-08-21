"use client";

import { useEffect, useRef } from "react";

/**
 * 랜딩 히어로 우측 70% — "인테리어 사진" 대신 건축 도면 스타일의 헤어라인
 * 평면도 라인 드로잉. 스크롤에 따라 벽 → 문 스윙/치수선 → 방 라벨 순서로
 * 서서히 "조립"되는 절제된 연출 하나만 넣는다(호버 애니메이션·파티클 없음).
 *
 * 구현: SVG 각 요소에 pathLength=100을 줘서 stroke-dasharray를 항상
 * "100"으로 통일하고, 스크롤 위치로 계산한 0~1 진행도를 --progress
 * CSS 커스텀 프로퍼티 하나로 래퍼에 얹는다. 이후 그리기는 전부 CSS
 * calc()/clamp()가 하므로 스크롤마다 리렌더가 없다(rAF로 스로틀된
 * ref.current.style.setProperty 한 줄만 매 프레임 실행).
 */

// 각 그룹이 전체 진행도(0~1) 중 어느 구간에서 그려질지 — 겹치게 둬서
// 순서는 지키되 뚝뚝 끊기지 않고 이어지는 느낌을 준다.
const RANGES = {
  envelope: [0, 0.38],
  walls: [0.28, 0.62],
  doors: [0.5, 0.72],
  dimension: [0.55, 0.8],
  labels: [0.72, 1],
  compass: [0.8, 1],
} as const;

function drawStyle([start, end]: readonly [number, number]): React.CSSProperties {
  return {
    strokeDasharray: 100,
    strokeDashoffset: `calc(100 - clamp(0, calc((var(--progress) - ${start}) / ${end - start} * 100), 100))`,
  };
}

function fadeStyle([start, end]: readonly [number, number]): React.CSSProperties {
  return {
    opacity: `clamp(0, calc((var(--progress) - ${start}) / ${end - start}), 1)`,
  };
}

export function HeroFloorPlan({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    // 스크롤 480px 안에서 0→1로 다 그려지고, 최소 0.12는 항상 보이게 해서
    // 스크롤 전 첫 화면에서도 "빈 도면"으로 보이지 않게 한다.
    function update() {
      raf = 0;
      const progress = Math.min(1, Math.max(0.12, window.scrollY / 480));
      wrapRef.current?.style.setProperty("--progress", String(progress));
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} style={{ "--progress": 0.12 } as React.CSSProperties}>
      <svg viewBox="0 0 620 520" className="h-full w-full" style={{ overflow: "visible" }}>
        {/* 외곽 — 세대 경계 */}
        <rect
          x={60}
          y={50}
          width={480}
          height={380}
          pathLength={100}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={0.75}
          style={drawStyle(RANGES.envelope)}
        />

        {/* 내벽 */}
        <g stroke="var(--foreground)" strokeWidth={0.75} fill="none">
          <path pathLength={100} d="M300,50 V220" style={drawStyle(RANGES.walls)} />
          <path pathLength={100} d="M300,270 V430" style={drawStyle(RANGES.walls)} />
          <path pathLength={100} d="M300,220 H430" style={drawStyle(RANGES.walls)} />
          <path pathLength={100} d="M430,220 V430" style={drawStyle(RANGES.walls)} />
        </g>

        {/* 문 스윙 — 거실/침실 사이, 현관 */}
        <g stroke="var(--muted)" strokeWidth={0.6} fill="none">
          <path
            pathLength={100}
            d="M300,220 L336,220 A36,36 0 0 1 300,256"
            style={drawStyle(RANGES.doors)}
          />
          <path
            pathLength={100}
            d="M60,150 L60,186 A36,36 0 0 0 96,150"
            style={drawStyle(RANGES.doors)}
          />
        </g>

        {/* 치수선 */}
        <g stroke="var(--muted)" strokeWidth={0.5}>
          <path pathLength={100} d="M60,460 H540" style={drawStyle(RANGES.dimension)} />
          <path pathLength={100} d="M60,454 V466" style={drawStyle(RANGES.dimension)} />
          <path pathLength={100} d="M540,454 V466" style={drawStyle(RANGES.dimension)} />
        </g>
        <text
          x={300}
          y={480}
          textAnchor="middle"
          fill="var(--muted)"
          fontFamily="var(--font-mono)"
          fontSize={10}
          letterSpacing="0.15em"
          style={fadeStyle(RANGES.dimension)}
        >
          8400
        </text>

        {/* 방 라벨 */}
        <g
          fill="var(--muted)"
          fontFamily="var(--font-mono)"
          fontSize={10}
          letterSpacing="0.2em"
          textAnchor="middle"
          style={fadeStyle(RANGES.labels)}
        >
          <text x={180} y={240}>
            LIVING
          </text>
          <text x={415} y={135}>
            BED
          </text>
          <text x={365} y={330}>
            BATH
          </text>
          <text x={480} y={330}>
            KITCHEN
          </text>
        </g>

        {/* 방위 표시 */}
        <g style={fadeStyle(RANGES.compass)}>
          <path
            d="M566,90 V58 M566,58 L559,68 M566,58 L573,68"
            fill="none"
            stroke="var(--muted)"
            strokeWidth={0.6}
          />
          <text
            x={566}
            y={104}
            textAnchor="middle"
            fill="var(--muted)"
            fontFamily="var(--font-mono)"
            fontSize={9}
            letterSpacing="0.1em"
          >
            N
          </text>
        </g>
      </svg>
    </div>
  );
}

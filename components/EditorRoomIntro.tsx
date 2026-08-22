"use client";

import { useEffect, useRef } from "react";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { RD, RW } from "@/lib/editorStore";
import type { IsoFurnitureDef } from "@/lib/types";

/**
 * /editor 상단 — 스크롤할수록 방이 "조립"되는 인트로 섹션. 랜딩 히어로의
 * components/HeroFloorPlan.tsx와 같은 기법(rAF로 스로틀한 scrollY →
 * --progress CSS 변수 하나만 얹고, 그리기는 전부 CSS calc()/clamp()가 함 —
 * 스크롤마다 리렌더 없음)을 그대로 쓰되, 그릴 내용은 이 페이지의 실제
 * 캔버스(components/EditorCanvas.tsx)와 똑같은 좌표계(TW/TH/OX/OY/WH,
 * RW×RD 그리드, viewBox "180 10 640 470")와 기본 배치를 쓴다 — "스크롤로
 * 조립되는 미리보기"가 그대로 아래의 진짜 캔버스로 이어지게 하려는 의도.
 *
 * 실제 배치 상태(useEditorStore)는 전혀 건드리지 않는 순수 장식이라,
 * IsoRoomArt.tsx와 같은 방식으로 기본 배치 데이터를 독립적으로 복사해
 * 갖는다 — 여길 고쳐도 실제 에디터 로직엔 영향 없다.
 */

const catalog = furnitureCatalogData as IsoFurnitureDef[];
const defById = new Map(catalog.map((d) => [d.id, d]));

const TW = 64,
  TH = 32,
  OX = 468,
  OY = 140,
  WH = 108;

type Pt = [number, number];

function ixy(col: number, row: number): Pt {
  return [((col - row) * TW) / 2 + OX, ((col + row) * TH) / 2 + OY];
}
function up([x, y]: Pt, h: number): Pt {
  return [x, y - h];
}
function pts(ps: Pt[]): string {
  return ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

const TILES = Array.from({ length: RD }, (_, row) =>
  Array.from({ length: RW }, (_, col) => ({
    col,
    row,
    points: pts([ixy(col, row), ixy(col + 1, row), ixy(col + 1, row + 1), ixy(col, row + 1)]),
  })),
).flat();

const WALL_COL0 = pts([ixy(0, 0), ixy(0, RD), up(ixy(0, RD), WH), up(ixy(0, 0), WH)]);
const WALL_ROW0 = pts([ixy(0, 0), ixy(RW, 0), up(ixy(RW, 0), WH), up(ixy(0, 0), WH)]);

/** 진단 직후 기본 배치 — lib/editorStore.ts의 DEFAULT_PLACED_DEFS와 동일한 6개. */
const DEFAULT_PLACED_DEFS = [
  { defId: "sofa", col: 1, row: 1 },
  { defId: "ctable", col: 4, row: 2 },
  { defId: "plant", col: 9, row: 0 },
  { defId: "wardrobe", col: 0, row: 6 },
  { defId: "desk", col: 7, row: 6 },
  { defId: "lounge", col: 5, row: 5 },
];

const DEFAULT_ITEMS = DEFAULT_PLACED_DEFS.map((it) => {
  const def = defById.get(it.defId);
  if (!def) return null;
  const a = ixy(it.col, it.row);
  const b = ixy(it.col + def.w, it.row);
  const c = ixy(it.col + def.w, it.row + def.d);
  const e = ixy(it.col, it.row + def.d);
  return {
    diag: it.col + it.row,
    top: pts([up(a, def.h), up(b, def.h), up(c, def.h), up(e, def.h)]),
    right: pts([b, c, up(c, def.h), up(b, def.h)]),
    left: pts([c, e, up(e, def.h), up(c, def.h)]),
    topFill: def.top,
    leftFill: def.left,
    rightFill: def.right,
    en: def.en,
    lx: (a[0] + c[0]) / 2,
    ly: (a[1] + c[1]) / 2 - def.h - 6,
  };
})
  .filter((v): v is NonNullable<typeof v> => v !== null)
  // 페인터스 알고리즘과 같은 순서(col+row 오름차순)로 그려야 겹칠 때도 자연스럽다.
  .sort((x, y) => x.diag - y.diag);

const MAX_TILE_DIAG = RW - 1 + (RD - 1);
const MAX_ITEM_DIAG = Math.max(...DEFAULT_ITEMS.map((i) => i.diag));

/** progress가 [start,end] 구간을 지나는 동안 아래→제자리로 떠오르며 페이드인. */
function revealStyle(start: number, end: number): React.CSSProperties {
  const t = `clamp(0, calc((var(--progress) - ${start}) / ${end - start}), 1)`;
  return {
    opacity: t,
    transform: `translateY(calc((1 - ${t}) * 10px))`,
  };
}

// 타일은 대각선(col+row) 순서로 바닥을 쓸어나가듯 나타나고, 가구는 그 뒤를
// 이어 같은 순서로 떠오른다 — 바닥 → 가구 순서의 "조립" 느낌을 준다.
function tileStyle(diag: number): React.CSSProperties {
  const start = 0.06 + (diag / MAX_TILE_DIAG) * 0.4;
  return revealStyle(start, start + 0.16);
}
function itemStyle(diag: number): React.CSSProperties {
  const start = 0.55 + (diag / MAX_ITEM_DIAG) * 0.34;
  return revealStyle(start, start + 0.2);
}

export function EditorRoomIntro({
  typeNum,
  templateName,
}: {
  typeNum: string;
  templateName: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    // HeroFloorPlan과 같은 절대 scrollY 기준이지만 범위를 훨씬 짧게(220px) 잡는다
    // — 이 섹션은 min-h-[100vh]라 히어로보다 훨씬 커서, 히어로와 같은 480px
    // 범위를 쓰면 조립이 끝나기도 전에(진행도가 다 차기도 전에) 위쪽에 있는
    // 가구가 이미 그만큼 스크롤돼 화면 밖으로 나가버리는 문제가 있었다. 220px면
    // 조립이 다 끝나는 시점에도 패널 전체가 아직 화면 안에 있다.
    function update() {
      raf = 0;
      const progress = Math.min(1, Math.max(0.02, window.scrollY / 220));
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
    <section
      ref={wrapRef}
      style={{ "--progress": 0.02 } as React.CSSProperties}
      className="grid grid-cols-1 border-b border-border lg:min-h-[calc(100vh_-_63px)] lg:grid-cols-[30fr_70fr]"
    >
      <div className="flex flex-col justify-center gap-7 border-b border-border px-6 py-16 sm:px-10 lg:border-r lg:border-b-0 lg:px-12 lg:py-0">
        <span className="font-mono text-[10px] tracking-[0.4em] text-teal-600 uppercase">
          room editor — {typeNum} {templateName}
        </span>
        <h2 className="font-serif text-[clamp(28px,3vw,40px)] leading-[1.25] font-semibold">
          <span className="block font-light text-muted">타일이 하나씩 놓이며</span>
          <span className="block text-coral-500">방이 완성됩니다</span>
        </h2>
        <p className="max-w-[320px] text-[13px] leading-[1.8] text-muted">
          {templateName}의 기본 배치를 스크롤로 먼저 살펴보고, 아래 캔버스에서
          직접 가구를 옮기고 골라보세요.
        </p>
        <div className="flex items-center gap-3.5">
          <span className="h-px w-14 bg-teal-600/40" />
          <span className="font-mono text-[9px] tracking-[0.4em] text-muted uppercase">
            scroll
          </span>
        </div>
      </div>

      <div className="relative min-h-[420px] overflow-hidden bg-surface lg:min-h-0">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(rgba(58,172,142,0.22) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <svg
          viewBox="180 10 640 470"
          className="absolute inset-0 h-full w-full"
          style={{ overflow: "visible" }}
        >
          <polygon points={WALL_COL0} fill="#0d2620" style={revealStyle(0, 0.22)} />
          <polygon points={WALL_ROW0} fill="#0a1f1a" style={revealStyle(0.04, 0.26)} />
          {TILES.map((tile) => (
            <polygon
              key={`${tile.col}-${tile.row}`}
              points={tile.points}
              fill={(tile.col + tile.row) % 2 ? "#0c211c" : "#0e2620"}
              stroke="rgba(58,172,142,0.14)"
              strokeWidth={0.75}
              style={tileStyle(tile.col + tile.row)}
            />
          ))}
          {DEFAULT_ITEMS.map((box, i) => (
            <g key={i} style={itemStyle(box.diag)}>
              <polygon points={box.left} fill={box.leftFill} />
              <polygon points={box.right} fill={box.rightFill} />
              <polygon
                points={box.top}
                fill={box.topFill}
                stroke="rgba(58,172,142,0.18)"
                strokeWidth={1}
              />
              <text
                x={box.lx}
                y={box.ly}
                textAnchor="middle"
                fill="rgba(224,237,232,0.55)"
                fontFamily="var(--font-mono)"
                fontSize={8}
                letterSpacing="0.25em"
              >
                {box.en}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

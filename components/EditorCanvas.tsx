"use client";

import { canPlace, RD, RW, useEditorStore } from "@/lib/editorStore";
import type { IsoFurnitureDef } from "@/lib/types";

/**
 * 인테리어 에디터 캔버스 — 아이소메트릭 2.5D 타일 렌더링.
 * app/result/jib-atlas.design/jib.atlas.dc.html "4. 에디터 > 아이소메트릭
 * 렌더링" 스펙의 수식을 그대로 쓴다: TW=64,TH=32,OX=468,OY=140,WH=108,
 * RW=10,RD=8 / ixy(col,row)=[(col-row)*TW/2+OX,(col+row)*TH/2+OY] /
 * up([x,y],h)=[x,y-h]. 드래그 앤 드롭이 아니라 "팔레트에서 가구 선택 →
 * 타일 클릭 → 배치"라 상태는 lib/editorStore.ts가 갖고, 이 컴포넌트는
 * 순수 렌더링 + 클릭 위임만 한다.
 *
 * components/FloorPlan.tsx(탑다운, viewBox "0 0 400 300")와는 좌표계가
 * 완전히 다른 별개 컴포넌트다 — FloorPlan은 /result의 평면도 미리보기에
 * 계속 쓰인다. 이 파일이 예전엔 react-konva `<Stage>` 기반 자유배치+회전
 * 시스템이었는데, 지금은 순수 SVG 기반 타일 스냅 시스템으로 전면 교체됐다.
 */

const TW = 64;
const TH = 32;
const OX = 468;
const OY = 140;
const WH = 108;

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

/** 바닥 타일 80개(RW×RD) — 좌표는 고정이라 모듈 스코프에서 한 번만 계산한다. */
const TILES = Array.from({ length: RD }, (_, row) =>
  Array.from({ length: RW }, (_, col) => ({
    col,
    row,
    points: pts([ixy(col, row), ixy(col + 1, row), ixy(col + 1, row + 1), ixy(col, row + 1)]),
  })),
).flat();

// 벽 2면: col=0 변, row=0 변.
const WALL_COL0 = pts([ixy(0, 0), ixy(0, RD), up(ixy(0, RD), WH), up(ixy(0, 0), WH)]);
const WALL_ROW0 = pts([ixy(0, 0), ixy(RW, 0), up(ixy(RW, 0), WH), up(ixy(0, 0), WH)]);

export function EditorCanvas({ catalog }: { catalog: IsoFurnitureDef[] }) {
  const items = useEditorStore((s) => s.items);
  const selectedDefId = useEditorStore((s) => s.selectedDefId);
  const placeAt = useEditorStore((s) => s.placeAt);
  const removeItem = useEditorStore((s) => s.removeItem);

  const defById = new Map(catalog.map((d) => [d.id, d]));
  const selectedDef = selectedDefId ? (defById.get(selectedDefId) ?? null) : null;

  // 그리기 순서: col+row 오름차순(페인터스 알고리즘) — 안 지키면 뒤쪽 가구가
  // 앞쪽 가구를 덮어써서 겹침 순서가 어긋난다.
  const drawnItems = [...items]
    .sort((a, b) => a.col + a.row - (b.col + b.row))
    .map((item) => {
      const def = defById.get(item.defId);
      if (!def) return null;
      const a = ixy(item.col, item.row);
      const b = ixy(item.col + def.w, item.row);
      const c = ixy(item.col + def.w, item.row + def.d);
      const e = ixy(item.col, item.row + def.d);
      return {
        id: item.id,
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
    .filter((box): box is NonNullable<typeof box> => box !== null);

  return (
    <svg viewBox="180 10 640 470" className="relative w-full max-w-[860px]" style={{ overflow: "visible" }}>
      <polygon points={WALL_COL0} fill="#0d2620" />
      <polygon points={WALL_ROW0} fill="#0a1f1a" />

      {TILES.map((tile) => {
        const fill = selectedDef
          ? canPlace(tile.col, tile.row, selectedDef, items)
            ? "rgba(58,172,142,0.16)"
            : "rgba(9,26,22,0.9)"
          : (tile.col + tile.row) % 2
            ? "#0c211c"
            : "#0e2620";
        return (
          <polygon
            key={`${tile.col}-${tile.row}`}
            points={tile.points}
            fill={fill}
            stroke="rgba(58,172,142,0.14)"
            strokeWidth={0.75}
            className="cursor-pointer"
            onClick={() => placeAt(tile.col, tile.row)}
          />
        );
      })}

      {drawnItems.map((box) => (
        <g
          key={box.id}
          className="cursor-pointer"
          onClick={(e) => {
            // 아래 타일 클릭(배치)과 겹치지 않도록 — SVG는 형제 엘리먼트라
            // 버블링으로 충돌하진 않지만, 명시적으로 막아 의도를 분명히 한다.
            e.stopPropagation();
            removeItem(box.id);
          }}
        >
          <polygon points={box.left} fill={box.leftFill} />
          <polygon points={box.right} fill={box.rightFill} />
          <polygon points={box.top} fill={box.topFill} stroke="rgba(58,172,142,0.18)" strokeWidth={1} />
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
  );
}

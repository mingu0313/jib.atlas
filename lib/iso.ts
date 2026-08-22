import furnitureCatalogData from "@/data/furniture-catalog.json";
import type { IsoFurnitureDef } from "./types";

/**
 * DESIGN-HANDOFF-V2.md "5. 룸 에디터 > 아이소메트릭 렌더링" 공식 그대로.
 * components/EditorCanvas.tsx(실제 캔버스) / components/landing/HeroEditorWindow.tsx
 * (랜딩 히어로 미니 창) / components/ShareCard.tsx(공유 카드)가 전부 이 상수·
 * 헬퍼를 공유한다 — 좌표계가 어긋나면 세 군데가 따로 노는 아이소메트릭 룸이
 * 돼버린다.
 */
export const TW = 64;
export const TH = 32;
export const OX = 468;
export const OY = 140;
export const WH = 108;
export const RW = 10;
export const RD = 8;

export type Pt = [number, number];

export function ixy(col: number, row: number): Pt {
  return [((col - row) * TW) / 2 + OX, ((col + row) * TH) / 2 + OY];
}

export function up([x, y]: Pt, h: number): Pt {
  return [x, y - h];
}

export function pts(ps: Pt[]): string {
  return ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

export interface IsoTile {
  col: number;
  row: number;
  points: string;
}

/** 바닥 타일 80개(RW×RD) — 좌표는 고정이라 모듈 스코프에서 한 번만 계산한다. */
export const TILES: IsoTile[] = Array.from({ length: RD }, (_, row) =>
  Array.from({ length: RW }, (_, col) => ({
    col,
    row,
    points: pts([ixy(col, row), ixy(col + 1, row), ixy(col + 1, row + 1), ixy(col, row + 1)]),
  })),
).flat();

// 벽 2면: col=0 변, row=0 변.
export const WALL_COL0 = pts([ixy(0, 0), ixy(0, RD), up(ixy(0, RD), WH), up(ixy(0, 0), WH)]);
export const WALL_ROW0 = pts([ixy(0, 0), ixy(RW, 0), up(ixy(RW, 0), WH), up(ixy(0, 0), WH)]);

export interface IsoBox {
  key: string;
  shadow: string;
  top: string;
  right: string;
  left: string;
  topFill: string;
  leftFill: string;
  rightFill: string;
  en: string;
  lx: number;
  ly: number;
}

const defById = new Map((furnitureCatalogData as IsoFurnitureDef[]).map((d) => [d.id, d]));

/**
 * 가구 박스들을 그릴 목록으로 만든다 — col+row 오름차순(페인터스 알고리즘)으로
 * 정렬하고, 각 박스는 **접촉 그림자를 3면(top/right/left)보다 먼저** 계산한다
 * (렌더링 순서도 이 배열 순서를 그대로 따라야 그림자가 박스 아래에 깔린다).
 */
export function buildIsoBoxes(
  items: { key: string; defId: string; col: number; row: number }[],
): IsoBox[] {
  return [...items]
    .sort((a, b) => a.col + a.row - (b.col + b.row))
    .map((item): IsoBox | null => {
      const def = defById.get(item.defId);
      if (!def) return null;
      const a = ixy(item.col, item.row);
      const b = ixy(item.col + def.w, item.row);
      const c = ixy(item.col + def.w, item.row + def.d);
      const d = ixy(item.col, item.row + def.d);
      return {
        key: item.key,
        shadow: pts([a, b, c, d].map(([x, y]): Pt => [x + TW * 0.055, y + TH * 0.16])),
        top: pts([up(a, def.h), up(b, def.h), up(c, def.h), up(d, def.h)]),
        right: pts([b, c, up(c, def.h), up(b, def.h)]),
        left: pts([c, d, up(d, def.h), up(c, def.h)]),
        topFill: def.top,
        leftFill: def.left,
        rightFill: def.right,
        en: def.en,
        lx: (a[0] + c[0]) / 2,
        ly: (a[1] + c[1]) / 2 - def.h - 6,
      };
    })
    .filter((box): box is IsoBox => box !== null);
}

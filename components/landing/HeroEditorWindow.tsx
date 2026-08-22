/**
 * 히어로 사진 우상단에 뜨는 "룸 에디터 미니 창" — DESIGN-HANDOFF-V2.md
 * "1. 랜딩 > Hero": width 330px, rotate(-1.4deg), data-px="-0.17",
 * 신호등 3점 + 모노 ROOM EDITOR 헤더 + 아이소메트릭 SVG.
 *
 * 실제 /editor(components/EditorCanvas.tsx)와 좌표계 상수는 다르다 —
 * 이 창은 330px 폭 안에 들어가야 하는 순수 장식용 축소 렌더링이라 훨씬
 * 작은 tw/th/ox/oy/rw/rd/wh를 쓴다. 가구 3면 색은 data/furniture-catalog.json
 * 의 실제 팔레트(저채도 올리브·오크·토프)에서 두 종만 가져와 톤을 맞췄다.
 */

type Box = { col: number; row: number; w: number; d: number; h: number; top: string; left: string; right: string };

const TW = 34, TH = 17, OX = 96, OY = 30, RW = 5, RD = 4, WH = 52;

const BOXES: Box[] = [
  { col: 1, row: 0, w: 2, d: 1, h: 21, top: "#767e5c", left: "#646b4c", right: "#545a3f" }, // sofa
  { col: 4, row: 0, w: 1, d: 1, h: 32, top: "#6d8055", left: "#5c6d47", right: "#4d5c3b" }, // plant
  { col: 1, row: 2, w: 2, d: 1, h: 14, top: "#b39c7c", left: "#9b8567", right: "#836f55" }, // table
];

function ixy(col: number, row: number): [number, number] {
  return [((col - row) * TW) / 2 + OX, ((col + row) * TH) / 2 + OY];
}
function up([x, y]: [number, number], h: number): [number, number] {
  return [x, y - h];
}
function pts(ps: [number, number][]): string {
  return ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

const TILES = Array.from({ length: RD }, (_, row) =>
  Array.from({ length: RW }, (_, col) => ({
    key: `${col}-${row}`,
    points: pts([ixy(col, row), ixy(col + 1, row), ixy(col + 1, row + 1), ixy(col, row + 1)]),
    fill: (col + row) % 2 ? "#ebe8de" : "#e5e1d6",
  })),
).flat();

const WALL_COL0 = pts([ixy(0, 0), ixy(0, RD), up(ixy(0, RD), WH), up(ixy(0, 0), WH)]);
const WALL_ROW0 = pts([ixy(0, 0), ixy(RW, 0), up(ixy(RW, 0), WH), up(ixy(0, 0), WH)]);

const DRAWN = [...BOXES]
  .sort((a, b) => a.col + a.row - (b.col + b.row))
  .map((b) => {
    const a = ixy(b.col, b.row);
    const c1 = ixy(b.col + b.w, b.row);
    const c2 = ixy(b.col + b.w, b.row + b.d);
    const c3 = ixy(b.col, b.row + b.d);
    // 접촉 그림자 — 3면보다 먼저 그린다.
    const shadow = pts([
      [a[0] + TW * 0.055, a[1] + TH * 0.16],
      [c1[0] + TW * 0.055, c1[1] + TH * 0.16],
      [c2[0] + TW * 0.055, c2[1] + TH * 0.16],
      [c3[0] + TW * 0.055, c3[1] + TH * 0.16],
    ]);
    return {
      shadow,
      top: pts([up(a, b.h), up(c1, b.h), up(c2, b.h), up(c3, b.h)]),
      right: pts([c1, c2, up(c2, b.h), up(c1, b.h)]),
      left: pts([c2, c3, up(c3, b.h), up(c2, b.h)]),
      topFill: b.top,
      leftFill: b.left,
      rightFill: b.right,
    };
  });

export function HeroEditorWindow() {
  return (
    <div
      data-px="-0.17"
      data-px-extra="rotate(-1.4deg)"
      className="absolute top-6 right-6 w-[260px] overflow-hidden rounded-2xl bg-card shadow-[0_30px_70px_-30px_rgba(18,18,15,0.45)] sm:w-[330px]"
    >
      <div className="flex items-center gap-2 border-b border-hair px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-[#dd8f6f]" />
        <span className="h-2 w-2 rounded-full bg-[#e3c26e]" />
        <span className="h-2 w-2 rounded-full bg-[#8aa572]" />
        <span className="label-mono ml-2 text-[9px] text-faint">Room Editor</span>
      </div>
      <div className="flex justify-center bg-panel px-3 py-5">
        <svg viewBox="10 -6 172 104" className="w-full" style={{ overflow: "visible" }}>
          {TILES.map((t) => (
            <polygon key={t.key} points={t.points} fill={t.fill} stroke="rgba(18,18,15,0.08)" strokeWidth={0.5} />
          ))}
          <polygon points={WALL_ROW0} fill="#d3ccb9" />
          <polygon points={WALL_COL0} fill="#ddd7c7" />
          {DRAWN.map((b, i) => (
            <g key={i}>
              <polygon points={b.shadow} fill="rgba(18,18,15,0.08)" />
              <polygon points={b.left} fill={b.leftFill} />
              <polygon points={b.right} fill={b.rightFill} />
              <polygon points={b.top} fill={b.topFill} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

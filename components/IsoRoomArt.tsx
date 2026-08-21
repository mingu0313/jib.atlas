/**
 * 랜딩 페이지 전용 장식용 아이소메트릭 미니룸 일러스트.
 *
 * 이건 실제 인테리어 에디터(components/EditorCanvas.tsx)와는 완전히 별개의,
 * 순수 장식 SVG다. EditorCanvas도 지금은 같은 계열의 아이소메트릭 투영
 * (ixy/up 공식)을 쓰지만, 상수(TW/TH/OX/OY/WH/RW/RD)도 배치 데이터도 서로
 * 다른 완전히 독립된 코드다 — 여길 고친다고 실제 에디터가 바뀌지 않는다.
 * 이 컴포넌트는 마케팅용 랜딩 페이지에만 쓰는 그림이다.
 *
 * design_handoff_jib_atlas/jib.atlas.dc.html의 hero room() 함수(작은
 * 소파+화분+테이블+라운지체어 배치, tw:44 th:22 ox:130 oy:70 rw:5 rd:4
 * wh:74)를 그대로 옮겼다.
 */

type Box = {
  col: number;
  row: number;
  w: number;
  d: number;
  h: number;
  top: string;
  left: string;
  right: string;
};

// design_handoff의 FDEFS(sofa/plant/ctable/lounge) 색 그대로, h는 th/32 배율(22/32) 적용.
const BOXES: Box[] = [
  { col: 1, row: 0, w: 3, d: 1, h: 30.25, top: "#1e3830", left: "#162a24", right: "#0e1c18" }, // sofa
  { col: 4, row: 0, w: 1, d: 1, h: 46.75, top: "#1c3418", left: "#14240f", right: "#0c160a" }, // plant
  { col: 1, row: 2, w: 3, d: 2, h: 19.25, top: "#3a2a18", left: "#261c10", right: "#16100a" }, // ctable
  { col: 3, row: 2, w: 2, d: 2, h: 27.5, top: "#2a2820", left: "#1c1c14", right: "#12120c" }, // lounge
];

const TW = 44,
  TH = 22,
  OX = 130,
  OY = 70,
  RW = 5,
  RD = 4,
  WH = 74;

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
    points: pts([ixy(col, row), ixy(col + 1, row), ixy(col + 1, row + 1), ixy(col, row + 1)]),
    fill: (col + row) % 2 ? "rgba(35,40,58,0.07)" : "rgba(35,40,58,0.12)",
  })),
).flat();

const WALL_LEFT = pts([ixy(0, 0), ixy(0, RD), up(ixy(0, RD), WH), up(ixy(0, 0), WH)]);
const WALL_RIGHT = pts([ixy(0, 0), ixy(RW, 0), up(ixy(RW, 0), WH), up(ixy(0, 0), WH)]);

const DRAWN_BOXES = [...BOXES]
  .sort((a, b) => a.col + a.row - (b.col + b.row))
  .map((b) => {
    const a = ixy(b.col, b.row);
    const bb = ixy(b.col + b.w, b.row);
    const c = ixy(b.col + b.w, b.row + b.d);
    const d = ixy(b.col, b.row + b.d);
    return {
      top: pts([up(a, b.h), up(bb, b.h), up(c, b.h), up(d, b.h)]),
      right: pts([bb, c, up(c, b.h), up(bb, b.h)]),
      left: pts([c, d, up(d, b.h), up(c, b.h)]),
      topFill: b.top,
      leftFill: b.left,
      rightFill: b.right,
    };
  });

export function IsoRoomArt({
  className,
  tone = "light",
}: {
  className?: string;
  /** light: 밝은(--muted 계열) 배경 위. onPrimary: --primary(잉크) 배경 위 — 타일 테두리만 밝은 톤으로. */
  tone?: "light" | "onPrimary";
}) {
  const tileStroke = tone === "light" ? "rgba(35,40,58,0.10)" : "rgba(244,242,237,0.10)";

  return (
    <svg viewBox="20 -24 240 214" className={className} style={{ overflow: "visible" }}>
      {TILES.map((t, i) => (
        <polygon key={i} points={t.points} fill={t.fill} stroke={tileStroke} strokeWidth={0.5} />
      ))}
      <polygon points={WALL_LEFT} fill="rgba(35,40,58,0.16)" />
      <polygon points={WALL_RIGHT} fill="rgba(35,40,58,0.10)" />
      {DRAWN_BOXES.map((b, i) => (
        <g key={i}>
          <polygon points={b.left} fill={b.leftFill} />
          <polygon points={b.right} fill={b.rightFill} />
          <polygon points={b.top} fill={b.topFill} />
        </g>
      ))}
    </svg>
  );
}

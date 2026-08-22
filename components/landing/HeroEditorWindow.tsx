import { DEFAULT_PLACED_DEFS } from "@/lib/editorStore";
import { buildIsoBoxes, TILES, WALL_COL0, WALL_ROW0 } from "@/lib/iso";

/**
 * 히어로 사진 우상단에 뜨는 "룸 에디터 미니 창" — DESIGN-HANDOFF-V2.md
 * "1. 랜딩 > Hero": width 330px, rotate(-1.4deg), data-px="-0.17",
 * 신호등 3점 + 모노 ROOM EDITOR 헤더 + 아이소메트릭 SVG.
 *
 * 실제 /editor(components/EditorCanvas.tsx)와 완전히 같은 lib/iso.ts 좌표계·
 * 기본 배치(lib/editorStore.ts의 DEFAULT_PLACED_DEFS)를 재사용하고, viewBox만
 * 좁혀 전체 10×8 방의 왼쪽 위 일부만 창 안에 보이게 크롭한다 — 두 군데가
 * 서로 다른 방을 그리지 않도록.
 */

const BOXES = buildIsoBoxes(
  DEFAULT_PLACED_DEFS.map((d) => ({ key: `${d.defId}-${d.col}-${d.row}`, ...d })),
);

export function HeroEditorWindow() {
  return (
    <div
      data-px="-0.17"
      data-px-extra="rotate(-1.4deg)"
      className="absolute top-[26px] right-[4%] w-[220px] overflow-hidden rounded-[22px] bg-[#f3f1ea] shadow-[0_34px_70px_-30px_rgba(18,18,15,0.42)] sm:w-[280px] lg:w-[330px]"
    >
      <div className="flex items-center gap-2 border-b border-hair px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-[#d3cfc2]" />
        <span className="h-2 w-2 rounded-full bg-[#d3cfc2]" />
        <span className="h-2 w-2 rounded-full bg-[#d3cfc2]" />
        <span className="label-mono ml-2 text-[8px] text-faint">Room Editor</span>
      </div>
      <svg viewBox="170 10 460 340" className="block w-full" style={{ overflow: "hidden" }}>
        <polygon points={WALL_ROW0} fill="#d3ccb9" />
        <polygon points={WALL_COL0} fill="#ddd7c7" />
        {TILES.map((t) => (
          <polygon
            key={`${t.col}-${t.row}`}
            points={t.points}
            fill={(t.col + t.row) % 2 ? "#ebe8de" : "#e5e1d6"}
            stroke="rgba(18,18,15,0.05)"
            strokeWidth={0.6}
          />
        ))}
        {BOXES.map((box) => (
          <g key={box.key}>
            <polygon points={box.shadow} fill="rgba(18,18,15,0.08)" />
            <polygon points={box.left} fill={box.leftFill} />
            <polygon points={box.right} fill={box.rightFill} />
            <polygon points={box.top} fill={box.topFill} />
          </g>
        ))}
      </svg>
    </div>
  );
}

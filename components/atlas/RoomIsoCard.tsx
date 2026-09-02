import { buildIsoBoxes, TILES, WALL_COL0, WALL_ROW0 } from "@/lib/iso";
import type { PlacedFurniture } from "@/lib/types";

/**
 * 가구 배치를 아이소메트릭 SVG로 그린 미리보기 — 실사진 없이 /editor에서
 * 바로 지도에 올린 "방 미리보기" 게시물의 커버(app/atlas/page.tsx,
 * app/atlas/[id]/page.tsx). lib/iso.ts 좌표계를 쓴다. 순수 SVG라 서버
 * 컴포넌트에서 그대로 써도 된다.
 */
export function RoomIsoCard({ items, className }: { items: PlacedFurniture[]; className?: string }) {
  const boxes = buildIsoBoxes(items.map((item) => ({ key: item.id, defId: item.defId, col: item.col, row: item.row })));

  return (
    <svg viewBox="180 10 500 380" className={className} style={{ overflow: "visible" }}>
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
      {boxes.map((box) => (
        <g key={box.key}>
          <polygon points={box.shadow} fill="rgba(18,18,15,0.07)" />
          <polygon points={box.left} fill={box.leftFill} />
          <polygon points={box.right} fill={box.rightFill} />
          <polygon points={box.top} fill={box.topFill} />
        </g>
      ))}
    </svg>
  );
}

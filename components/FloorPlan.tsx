import { ROOM_TYPE_LABELS, type Room } from "@/lib/types";

const ROOM_FILL: Record<Room["size"], string> = {
  S: "#e5e7eb",
  M: "#d1d5db",
  L: "#9ca3af",
};

/**
 * 템플릿의 rooms 데이터를 간단한 평면도 SVG로 그린다.
 * 실제 이미지 에셋이 없는 지금 단계의 임시 placeholder다.
 */
export function FloorPlan({ rooms }: { rooms: Room[] }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className="h-full w-full"
      role="img"
      aria-label="집 구조 평면도"
    >
      <rect x={0} y={0} width={400} height={300} fill="#f9fafb" />
      {rooms.map((room, i) => {
        const { x, y, width, height } = room.position;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={ROOM_FILL[room.size]}
              stroke="#4b5563"
              strokeWidth={1.5}
              rx={4}
            />
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fill="#1f2937"
            >
              {ROOM_TYPE_LABELS[room.type]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

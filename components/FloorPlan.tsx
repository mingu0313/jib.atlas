import { ROOM_TYPE_LABELS, type Room, type RoomType } from "@/lib/types";

/** 실내가 아니라 바깥/반옥외 공간 — 점선 테두리로 구분한다. */
const OUTDOOR_TYPES = new Set<RoomType>(["balcony", "terrace", "garden"]);

/** 방이 작을수록 라벨 폰트도 줄여서 좁은 방에서 글자가 넘치지 않게 한다. */
function labelFontSize(width: number, height: number) {
  return Math.max(8, Math.min(13, width / 7, height / 4));
}

/**
 * 템플릿의 rooms 데이터를 평면도 SVG로 그린다. 실제 이미지 에셋 없이
 * jib.atlas 디자인 토큰(app/globals.css의 올리브+세이지 팔레트)만으로
 * 표현한 평면도 — 방 유형별 실내/실외 구분, 크기(S/M/L) 배지, 도면 느낌의
 * 격자 배경을 더했다.
 *
 * (v3 팔레트 시절 색 토큰(teal·coral·surface·border·foreground 계열)을
 * 그대로 쓰고 있었는데, v4로 넘어오며 이 토큰들이 전부 없어져서 방
 * 배경·테두리·라벨 색이 안 먹는 채로 남아있던 걸 지금 올리브+세이지
 * 토큰으로 고쳤다.)
 *
 * viewBox는 "0 0 400 300" 그대로 유지 — data/house-templates*.json의
 * Room.position이 이 좌표계 기준으로 저장돼 있다(lib/types.ts의
 * RoomPosition 설명 참고). 여길 바꾸면 모든 템플릿의 방 위치가 어긋난다.
 * (예전엔 components/EditorCanvas.tsx도 이 좌표계를 2배 스케일해서 썼지만,
 * 지금 EditorCanvas는 완전히 다른 아이소메트릭 좌표계라 더는 얽혀있지 않다.)
 */
export function FloorPlan({
  rooms,
  roomLabels = ROOM_TYPE_LABELS,
  ariaLabel = "집 구조 평면도",
}: {
  rooms: Room[];
  /** /en 라우트에서 ROOM_TYPE_LABELS_EN을 넘긴다. 기본은 한국어. STEP 11. */
  roomLabels?: Record<RoomType, string>;
  ariaLabel?: string;
}) {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label={ariaLabel}>
      <defs>
        <pattern
          id="floor-plan-grid"
          width={20}
          height={20}
          patternUnits="userSpaceOnUse"
        >
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--color-hair)" strokeWidth={1} />
        </pattern>
      </defs>

      <rect x={0} y={0} width={400} height={300} fill="var(--color-panel)" />
      <rect x={0} y={0} width={400} height={300} fill="url(#floor-plan-grid)" />

      {rooms.map((room, i) => {
        const { x, y, width, height } = room.position;
        const outdoor = OUTDOOR_TYPES.has(room.type);
        const accent = outdoor ? "var(--color-olive-mid)" : "var(--color-olive)";

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={6}
              fill={outdoor ? "var(--color-photo-bg)" : "var(--color-sage)"}
              stroke={outdoor ? "var(--color-olive-mid)" : "var(--color-hair-strong)"}
              strokeWidth={1.5}
              strokeDasharray={outdoor ? "4 3" : undefined}
            />
            <circle cx={x + 11} cy={y + 11} r={7} fill={accent} />
            <text
              x={x + 11}
              y={y + 11}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={8}
              fontWeight={700}
              fill="var(--color-cream)"
            >
              {room.size}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={labelFontSize(width, height)}
              fontWeight={600}
              fill="var(--color-fg)"
            >
              {roomLabels[room.type]}
            </text>
          </g>
        );
      })}

      {/* 세대 외곽선 */}
      <rect
        x={2}
        y={2}
        width={396}
        height={296}
        rx={10}
        fill="none"
        stroke="var(--color-hair-strong)"
        strokeWidth={3}
      />
    </svg>
  );
}

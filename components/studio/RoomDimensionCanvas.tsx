"use client";

import type { Point } from "@/lib/roomBuilderStore";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { formatLength, getDraggableEdges, readDimensions } from "@/lib/roomDimensions";
import { getWallSegments } from "@/lib/roomGeometry";

/**
 * 이 프레임의 기준 크기(cm) — RoomPolygonPreview·다른 캔버스들과 달리
 * "지금 폴리곤 바운딩박스에 맞춰 매번 다시 줌"하지 않는다. 그렇게 하면
 * 방을 키워도 뷰가 같이 줌아웃해서 화면상 크기가 거의 안 변해 보이는
 * 문제가 있었다(치수를 드래그하는데 "실시간으로 커지는" 느낌이 없다는
 * 피드백). 대신 이 고정 기준(전형적인 방 크기 300~800cm를 넉넉히 덮는
 * 900cm) 프레임 안에서 폴리곤을 그리니까, 드래그로 커지고 작아지는 게
 * 화면에 그대로 보인다 — 900cm를 넘어서는 드물게 큰 방(최대 1500cm)만
 * 그때 가서 프레임도 같이 늘어난다(Math.max로 아래로는 다시 안 줄어듦
 * 없이 매 렌더 새로 계산 — 그 정도 대형 방을 다시 줄이면 프레임도 같이
 * 줄어들지만, 흔치 않은 경우라 감내한다).
 */
const REFERENCE_SPAN_CM = 900;

/** 클릭/포인터 클라이언트 좌표(px)를 이 svg의 viewBox 좌표계(cm)로 —
 * RoomPlanCanvas·RoomFurnitureCanvas와 동일한 변환. */
function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, z: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, z: p.y };
}

/**
 * STEP 12 후속 — 평면도의 벽을 직접 드래그해서 치수를 바꾸는 인터랙티브
 * 캔버스. lib/roomDimensions.ts의 getDraggableEdges가 "이 변을 드래그하면
 * 어느 필드가 바뀌는지"를 알려주면, pointer capture로 드래그를 잡아
 * 포인터 좌표를 그대로(또는 L자형 notchWidth처럼 역산해서) setDimension에
 * 넘긴다 — DimensionInput(숫자 입력)과 같은 store 액션을 쓰니 두 방식이
 * 항상 같은 값에 수렴한다.
 *
 * 드래그 가능한 변엔 리사이즈 커서(ew/ns-resize)를 주고, 원점에 닿아
 * 드래그가 안 되는 두 변은 평범한 커서 그대로 둔다. 각 변 바깥쪽엔
 * 현재 길이를 라벨로 띄운다.
 */
export function RoomDimensionCanvas({ className }: { className?: string }) {
  const roomShape = useRoomBuilderStore((s) => s.roomShape);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const unit = useRoomBuilderStore((s) => s.unit);
  const setDimension = useRoomBuilderStore((s) => s.setDimension);

  const dims = readDimensions(roomShape, roomPolygon);
  const walls = getWallSegments(roomPolygon);
  const draggableByEdge = new Map(getDraggableEdges(roomShape, dims).map((e) => [e.edgeIndex, e]));
  const floorPoints = roomPolygon.map((p) => `${p.x},${p.z}`).join(" ");

  // 폴리곤은 항상 원점(0,0)에 고정해 그려서(buildPolygon 관례) 바운딩박스
  // 최솟값은 늘 0 — 최댓값만 보면 된다.
  const xs = roomPolygon.map((p) => p.x);
  const zs = roomPolygon.map((p) => p.z);
  const actualSpan = Math.max(Math.max(...xs), Math.max(...zs), 1);
  const refSpan = Math.max(REFERENCE_SPAN_CM, actualSpan);
  const pad = refSpan * 0.16;
  const viewBox = `${-pad} ${-pad} ${refSpan + pad * 2} ${refSpan + pad * 2}`;

  // 라벨·핸들·선 두께는 refSpan(고정 기준) 기준 — 실제 방 크기(actualSpan)에
  // 비례시키면 방이 작아질수록 벽도 얇아져 보이는 이상한 효과가 생긴다.
  const labelOffset = refSpan * 0.09;
  const handleR = refSpan * 0.013;
  const wallStroke = refSpan * 0.014;

  return (
    <svg viewBox={viewBox} className={className}>
      <polygon points={floorPoints} fill="var(--color-sage)" opacity={0.55} />

      {walls.map((wall) => {
        const edge = draggableByEdge.get(wall.index);
        return (
          <line
            key={wall.index}
            x1={wall.start.x}
            y1={wall.start.z}
            x2={wall.end.x}
            y2={wall.end.z}
            stroke="rgba(18,18,15,0.85)"
            strokeWidth={wallStroke}
            strokeLinecap="square"
            onPointerDown={
              edge
                ? (e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }
                : undefined
            }
            onPointerMove={
              edge
                ? (e) => {
                    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                    const svg = e.currentTarget.ownerSVGElement;
                    if (!svg) return;
                    const p = toSvgPoint(svg, e.clientX, e.clientY);
                    const pointerCoord = edge.axis === "x" ? p.x : p.z;
                    setDimension(edge.fieldId, edge.toFieldValue(pointerCoord));
                  }
                : undefined
            }
            style={{ cursor: edge ? (edge.axis === "x" ? "ew-resize" : "ns-resize") : "default" }}
          />
        );
      })}

      {/* 치수 라벨 — 각 변 바깥쪽에 현재 길이(cm/ft) 표시. */}
      {walls.map((wall) => {
        const dx = wall.end.x - wall.start.x;
        const dz = wall.end.z - wall.start.z;
        const len = Math.max(wall.length, 1);
        // 바깥쪽 방향(outward normal). 우리 폴리곤은 항상 시계방향(화면
        // z축이 아래로 증가하는 SVG 기준)이라 방 내부가 진행 방향의
        // 오른쪽에 있다 — (dx,dz)를 오른쪽으로 90도 돌린 (dz,-dx)가 왼쪽
        // 바깥, 즉 우리가 원하는 "바깥쪽"과는 반대라 (dz,-dx)를 그대로
        // 쓰면 실제로 바깥이 맞다(정사각형 윗변 (1,0)→(0,-1)로 검산됨).
        const nx = dz / len;
        const nz = -dx / len;
        const midX = (wall.start.x + wall.end.x) / 2 + nx * labelOffset;
        const midZ = (wall.start.z + wall.end.z) / 2 + nz * labelOffset;
        return (
          <text
            key={`label-${wall.index}`}
            x={midX}
            y={midZ}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={refSpan * 0.034}
            fill="var(--color-fg)"
            style={{ fontFamily: "var(--font-mono)", pointerEvents: "none" }}
          >
            {formatLength(wall.length, unit)}
            {unit}
          </text>
        );
      })}

      {/* 꼭짓점 핸들 — 장식용(실제 드래그는 변 자체에서 반응한다). */}
      {roomPolygon.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.z}
          r={handleR}
          fill="var(--color-cream)"
          stroke="rgba(18,18,15,0.85)"
          strokeWidth={wallStroke * 0.5}
          pointerEvents="none"
        />
      ))}
    </svg>
  );
}

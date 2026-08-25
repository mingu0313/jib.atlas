"use client";

import type { Point } from "@/lib/roomBuilderStore";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { formatLength, getDraggableEdges, readDimensions } from "@/lib/roomDimensions";
import { getPolygonViewBox, getWallSegments } from "@/lib/roomGeometry";

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
  const viewBox = getPolygonViewBox(roomPolygon, 0.22); // 라벨이 바깥에 붙으니 기본보다 넉넉한 여백
  const floorPoints = roomPolygon.map((p) => `${p.x},${p.z}`).join(" ");

  const xs = roomPolygon.map((p) => p.x);
  const zs = roomPolygon.map((p) => p.z);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 1);
  const labelOffset = span * 0.09;
  const handleR = span * 0.013;
  const wallStroke = span * 0.014;

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
            fontSize={span * 0.034}
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

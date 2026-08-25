"use client";

import type { Point } from "@/lib/roomBuilderStore";
import { getPolygonViewBox, getWallSegments, projectOffset } from "@/lib/roomGeometry";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { clampOpeningOffset } from "@/lib/roomGeometry";
import type { PlacedOpening } from "@/lib/roomBuilderStore";
import { FLOOR_STYLE_PRESETS } from "@/lib/roomStyle";

const WALL_THICKNESS_CM = 10;

/** 클릭/포인터 클라이언트 좌표(px)를 이 svg의 viewBox 좌표계(cm)로 바꾼다.
 * viewBox·CSS 크기·패딩이 뭐든 항상 정확한 이유는 브라우저가 관리하는
 * 스크린↔유저공간 변환 행렬(getScreenCTM)을 그대로 역산하기 때문. */
function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, z: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, z: p.y };
}

function OpeningMarker({ opening, wallLength }: { opening: PlacedOpening; wallLength: number }) {
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const moveOpening = useRoomBuilderStore((s) => s.moveOpening);
  const removeOpening = useRoomBuilderStore((s) => s.removeOpening);

  const wall = getWallSegments(roomPolygon)[opening.wallIndex];
  if (!wall) return null;
  const len = Math.max(wall.length, 1);
  const dirX = (wall.end.x - wall.start.x) / len;
  const dirZ = (wall.end.z - wall.start.z) / len;
  // 치수 조정으로 벽이 짧아진 뒤일 수 있어 표시 위치만 방어적으로 다시 clamp —
  // 실제 저장값(offsetCm)은 드래그해야 바뀐다(STEP 12 되돌아가기 대비).
  const displayOffset = clampOpeningOffset(opening.offsetCm, opening.widthCm, wallLength);
  const half = opening.widthCm / 2;
  const cx = wall.start.x + dirX * displayOffset;
  const cz = wall.start.z + dirZ * displayOffset;
  const p1 = { x: cx - dirX * half, z: cz - dirZ * half };
  const p2 = { x: cx + dirX * half, z: cz + dirZ * half };

  return (
    <line
      x1={p1.x}
      y1={p1.z}
      x2={p2.x}
      y2={p2.z}
      stroke={opening.kind === "door" ? "#8B5E34" : "#5F8FB4"}
      strokeWidth={WALL_THICKNESS_CM * 1.2}
      strokeLinecap="round"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const svg = e.currentTarget.ownerSVGElement;
        if (!svg) return;
        const point = toSvgPoint(svg, e.clientX, e.clientY);
        moveOpening(opening.id, projectOffset(wall.start, wall.end, point));
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        removeOpening(opening.id);
      }}
      style={{ cursor: "grab" }}
    >
      <title>더블클릭하면 삭제돼요</title>
    </line>
  );
}

/**
 * STEP 13 — 3단계(문/창문·마감재)에서 쓰는 인터랙티브 평면도. steps 1·2가
 * 쓰는 정적 RoomPolygonPreview와 달리 벽 클릭으로 문/창문을 배치하고,
 * 배치된 항목을 드래그로 벽을 따라 옮길 수 있다.
 *
 * 배치: 팔레트에서 프리셋을 고르면(store.pendingOpening) 벽(line)에
 * onClick이 걸리고, 클릭 지점을 그 벽 위로 투영한 offset으로 store에
 * placeOpeningOnWall을 호출한다. 이동: 배치된 항목의 line에
 * pointer capture로 드래그를 건다 — capture 덕분에 손가락/마우스가
 * 빠르게 움직여 요소 밖으로 나가도 pointermove를 계속 받는다.
 */
export function RoomPlanCanvas({ className }: { className?: string }) {
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallColorHex = useRoomBuilderStore((s) => s.wallColorHex);
  const floorStyleId = useRoomBuilderStore((s) => s.floorStyleId);
  const openings = useRoomBuilderStore((s) => s.openings);
  const pendingOpening = useRoomBuilderStore((s) => s.pendingOpening);
  const placeOpeningOnWall = useRoomBuilderStore((s) => s.placeOpeningOnWall);

  const floorPreset = FLOOR_STYLE_PRESETS.find((p) => p.id === floorStyleId) ?? FLOOR_STYLE_PRESETS[0];
  const walls = getWallSegments(roomPolygon);
  const viewBox = getPolygonViewBox(roomPolygon);
  const floorPoints = roomPolygon.map((p) => `${p.x},${p.z}`).join(" ");

  return (
    <svg viewBox={viewBox} className={className}>
      <polygon points={floorPoints} fill={floorPreset.base} />
      {walls.map((wall) => (
        <line
          key={wall.index}
          x1={wall.start.x}
          y1={wall.start.z}
          x2={wall.end.x}
          y2={wall.end.z}
          stroke={wallColorHex}
          strokeWidth={WALL_THICKNESS_CM}
          onClick={(e) => {
            if (!pendingOpening) return;
            const svg = e.currentTarget.ownerSVGElement;
            if (!svg) return;
            const point = toSvgPoint(svg, e.clientX, e.clientY);
            placeOpeningOnWall(wall.index, projectOffset(wall.start, wall.end, point));
          }}
          style={{ cursor: pendingOpening ? "copy" : "default" }}
        />
      ))}
      {openings.map((opening) => {
        const wall = walls[opening.wallIndex];
        if (!wall) return null;
        return <OpeningMarker key={opening.id} opening={opening} wallLength={wall.length} />;
      })}
    </svg>
  );
}

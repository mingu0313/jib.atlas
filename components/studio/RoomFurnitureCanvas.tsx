"use client";

import furnitureCatalogData from "@/data/furniture-catalog.json";
import { furnitureFootprintCm, useRoomBuilderStore, type PlacedStudioFurniture, type Point } from "@/lib/roomBuilderStore";
import { getPolygonViewBox, getWallSegments } from "@/lib/roomGeometry";
import { FLOOR_STYLE_PRESETS } from "@/lib/roomStyle";
import type { IsoFurnitureDef } from "@/lib/types";

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];
const furnitureDefById = new Map(furnitureCatalog.map((d) => [d.id, d]));

const WALL_THICKNESS_CM = 10;

/** 클릭/포인터 클라이언트 좌표(px)를 이 svg의 viewBox 좌표계(cm)로 —
 * RoomPlanCanvas와 동일한 변환(components/studio/RoomPlanCanvas.tsx 참고). */
function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, z: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, z: p.y };
}

function FurnitureMarker({ item }: { item: PlacedStudioFurniture }) {
  const moveFurniture = useRoomBuilderStore((s) => s.moveFurniture);
  const removeFurniture = useRoomBuilderStore((s) => s.removeFurniture);
  const def = furnitureDefById.get(item.defId);
  if (!def) return null;
  const { widthCm, depthCm } = furnitureFootprintCm(def, item.rotated);

  return (
    <g
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const svg = e.currentTarget.ownerSVGElement;
        if (!svg) return;
        const p = toSvgPoint(svg, e.clientX, e.clientY);
        moveFurniture(item.id, p.x, p.z);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        removeFurniture(item.id);
      }}
      style={{ cursor: "grab" }}
    >
      <rect
        x={item.cx - widthCm / 2}
        y={item.cz - depthCm / 2}
        width={widthCm}
        height={depthCm}
        rx={6}
        fill={def.top}
        stroke="rgba(18,18,15,0.35)"
        strokeWidth={2}
      />
      <title>{`${def.label} — 드래그로 이동, 더블클릭으로 삭제`}</title>
    </g>
  );
}

/**
 * STEP(가구 배치) — /studio 4단계에서 쓰는 인터랙티브 평면도. RoomPlanCanvas
 * (3단계, 문/창문)와 같은 SVG 좌표 변환·pointer capture 드래그 패턴을
 * 쓰지만, 배치 대상이 벽 위 offset이 아니라 바닥 위 자유 좌표(cx,cz)라는
 * 점이 다르다. 문/창문은 여기선 위치 참고용으로만 그리고(읽기 전용,
 * pointerEvents:none) 이동/삭제는 3단계 캔버스에서만 한다.
 */
export function RoomFurnitureCanvas({ className }: { className?: string }) {
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallColorHex = useRoomBuilderStore((s) => s.wallColorHex);
  const floorStyleId = useRoomBuilderStore((s) => s.floorStyleId);
  const openings = useRoomBuilderStore((s) => s.openings);
  const furniture = useRoomBuilderStore((s) => s.furniture);
  const selectedFurnitureDefId = useRoomBuilderStore((s) => s.selectedFurnitureDefId);
  const placeFurnitureAt = useRoomBuilderStore((s) => s.placeFurnitureAt);

  const floorPreset = FLOOR_STYLE_PRESETS.find((p) => p.id === floorStyleId) ?? FLOOR_STYLE_PRESETS[0];
  const walls = getWallSegments(roomPolygon);
  const viewBox = getPolygonViewBox(roomPolygon);
  const floorPoints = roomPolygon.map((p) => `${p.x},${p.z}`).join(" ");

  return (
    <svg viewBox={viewBox} className={className}>
      <polygon
        points={floorPoints}
        fill={floorPreset.base}
        onClick={(e) => {
          if (!selectedFurnitureDefId) return;
          const svg = e.currentTarget.ownerSVGElement;
          if (!svg) return;
          const p = toSvgPoint(svg, e.clientX, e.clientY);
          placeFurnitureAt(p.x, p.z);
        }}
        style={{ cursor: selectedFurnitureDefId ? "copy" : "default" }}
      />
      {walls.map((wall) => (
        <line
          key={wall.index}
          x1={wall.start.x}
          y1={wall.start.z}
          x2={wall.end.x}
          y2={wall.end.z}
          stroke={wallColorHex}
          strokeWidth={WALL_THICKNESS_CM}
          pointerEvents="none"
        />
      ))}
      {openings.map((opening) => {
        const wall = walls[opening.wallIndex];
        if (!wall) return null;
        const len = Math.max(wall.length, 1);
        const dirX = (wall.end.x - wall.start.x) / len;
        const dirZ = (wall.end.z - wall.start.z) / len;
        const half = opening.widthCm / 2;
        const cx = wall.start.x + dirX * opening.offsetCm;
        const cz = wall.start.z + dirZ * opening.offsetCm;
        return (
          <line
            key={opening.id}
            x1={cx - dirX * half}
            y1={cz - dirZ * half}
            x2={cx + dirX * half}
            y2={cz + dirZ * half}
            stroke={opening.kind === "door" ? "#8B5E34" : "#5F8FB4"}
            strokeWidth={WALL_THICKNESS_CM * 1.2}
            strokeLinecap="round"
            pointerEvents="none"
          />
        );
      })}
      {furniture.map((item) => (
        <FurnitureMarker key={item.id} item={item} />
      ))}
    </svg>
  );
}

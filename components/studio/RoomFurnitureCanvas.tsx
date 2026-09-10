"use client";

import { useRef } from "react";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { PALETTE } from "@/lib/furniturePalette";
import { furnitureFootprintCm, useRoomBuilderStore, type PlacedStudioFurniture, type Point } from "@/lib/roomBuilderStore";
import { getPolygonViewBox, getWallSegments } from "@/lib/roomGeometry";
import { FLOOR_STYLE_PRESETS } from "@/lib/roomStyle";
import type { IsoFurnitureDef } from "@/lib/types";

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];
const furnitureDefById = new Map(furnitureCatalog.map((d) => [d.id, d]));

const WALL_THICKNESS_CM = 10;
/** RoomPlanCanvas와 같은 기준 — 이 거리(px) 미만 이동이면 드래그가 아니라
 * 클릭(선택)으로 본다. */
const CLICK_THRESHOLD_PX = 6;
const TOOLBAR_BTN_R = WALL_THICKNESS_CM * 1.8;
const TOOLBAR_GAP_CM = WALL_THICKNESS_CM * 2.2;

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

/**
 * STEP 21 — 평면도 위 가구 아이콘. 전부 사각형이면 "무슨 가구를 놓았는지
 * 구분이 안 된다"는 피드백으로, def.planShape에 따라 다른 도형을 그린다.
 * - "circle": 바운딩 박스에 꽉 차는 타원 하나로 원·타원 가구(원형
 *   테이블·러그·스툴·화분) 전부 표현한다(w=d면 원, w≠d면 타원).
 * - "lshape": 정사각 바운딩 박스를 절반씩 나눈 L자 — 코너 소파/코너
 *   책상의 실제 3D 모델 외곽선과 정확히 같진 않지만, 사각형보다는
 *   "방향성 있는 코너형 가구"라는 걸 훨씬 잘 전달한다. 기본 방향은 위쪽·
 *   왼쪽 변을 따라 두 팔이 붙고 오른쪽 아래가 트인 모양으로 고정해두고,
 *   회전(rotated 90도 스냅 + fineAngleDeg 미세 각도)은 바깥 <g transform>
 *   하나로 처리한다 — 그래서 도형 정의 자체엔 회전 로직이 안 들어간다.
 * - 그 외(기본값 "rect")는 기존과 동일한 둥근 사각형.
 */
function FurnitureIcon({
  shape,
  x0,
  z0,
  widthCm,
  depthCm,
  cx,
  cz,
  angleDeg,
  fill,
  stroke,
  strokeWidth,
}: {
  shape: "rect" | "circle" | "lshape";
  x0: number;
  z0: number;
  widthCm: number;
  depthCm: number;
  cx: number;
  cz: number;
  angleDeg: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}) {
  let inner: React.ReactNode;
  if (shape === "circle") {
    inner = <ellipse cx={cx} cy={cz} rx={widthCm / 2} ry={depthCm / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  } else if (shape === "lshape") {
    const armW = widthCm / 2;
    const armD = depthCm / 2;
    const points = [
      [x0, z0],
      [x0 + widthCm, z0],
      [x0 + widthCm, z0 + armD],
      [x0 + armW, z0 + armD],
      [x0 + armW, z0 + depthCm],
      [x0, z0 + depthCm],
    ]
      .map((p) => p.join(","))
      .join(" ");
    inner = <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  } else {
    inner = <rect x={x0} y={z0} width={widthCm} height={depthCm} rx={6} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }
  return angleDeg ? <g transform={`rotate(${angleDeg} ${cx} ${cz})`}>{inner}</g> : inner;
}

/** 선택된 가구 위에 뜨는 회전·삭제 버튼 두 개짜리 인라인 툴바 — 가구
 * bounding box 위쪽 가장자리 바로 위, 가로로 나란히. */
function FurnitureToolbar({
  cx,
  topZ,
  onRotate,
  onDelete,
}: {
  cx: number;
  topZ: number;
  onRotate: () => void;
  onDelete: () => void;
}) {
  const btnY = topZ - TOOLBAR_GAP_CM;
  const gap = TOOLBAR_BTN_R * 2.4;
  return (
    <g onPointerDown={(e) => e.stopPropagation()} style={{ cursor: "pointer" }}>
      <g
        transform={`translate(${cx - gap / 2} ${btnY})`}
        onClick={(e) => {
          e.stopPropagation();
          onRotate();
        }}
      >
        <circle r={TOOLBAR_BTN_R} fill="var(--color-fg)" opacity={0.9} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={TOOLBAR_BTN_R * 1.2} fill="var(--color-cream)" style={{ pointerEvents: "none" }}>
          ↻
        </text>
        <title>회전(R)</title>
      </g>
      <g
        transform={`translate(${cx + gap / 2} ${btnY})`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <circle r={TOOLBAR_BTN_R} fill="var(--color-fg)" opacity={0.9} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={TOOLBAR_BTN_R * 1.3} fill="var(--color-cream)" style={{ pointerEvents: "none" }}>
          ×
        </text>
        <title>삭제(Delete)</title>
      </g>
    </g>
  );
}

function FurnitureMarker({ item }: { item: PlacedStudioFurniture }) {
  const moveFurniture = useRoomBuilderStore((s) => s.moveFurniture);
  const removeFurniture = useRoomBuilderStore((s) => s.removeFurniture);
  const rotateFurniture = useRoomBuilderStore((s) => s.rotateFurniture);
  const selectedFurnitureId = useRoomBuilderStore((s) => s.selectedFurnitureId);
  const selectFurnitureItem = useRoomBuilderStore((s) => s.selectFurnitureItem);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const def = furnitureDefById.get(item.defId);
  if (!def) return null;
  const { widthCm, depthCm } = furnitureFootprintCm(def, item.rotated);
  const topZ = item.cz - depthCm / 2;
  const isSelected = selectedFurnitureId === item.id;

  return (
    <g
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        downPos.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const svg = e.currentTarget.ownerSVGElement;
        if (!svg) return;
        const p = toSvgPoint(svg, e.clientX, e.clientY);
        moveFurniture(item.id, p.x, p.z);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        const start = downPos.current;
        downPos.current = null;
        if (!start) return;
        const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        if (moved < CLICK_THRESHOLD_PX) selectFurnitureItem(item.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        removeFurniture(item.id);
      }}
      style={{ cursor: "grab" }}
    >
      <FurnitureIcon
        shape={def.planShape ?? "rect"}
        x0={item.cx - widthCm / 2}
        z0={item.cz - depthCm / 2}
        widthCm={widthCm}
        depthCm={depthCm}
        cx={item.cx}
        cz={item.cz}
        angleDeg={item.fineAngleDeg ?? 0}
        fill={item.colorKey ? PALETTE[item.colorKey] : def.top}
        stroke={isSelected ? "var(--color-olive)" : "rgba(18,18,15,0.35)"}
        strokeWidth={isSelected ? 3.5 : 2}
      />
      <title>{`${def.label} — 클릭하면 선택돼요(회전·삭제 버튼이 떠요), 드래그로 이동, 더블클릭으로 바로 삭제`}</title>
      {isSelected && (
        <FurnitureToolbar
          cx={item.cx}
          topZ={topZ}
          onRotate={() => rotateFurniture(item.id)}
          onDelete={() => removeFurniture(item.id)}
        />
      )}
    </g>
  );
}

/**
 * STEP(가구 배치) — /studio 4·5단계에서 쓰는 인터랙티브 평면도. RoomPlanCanvas
 * (3단계, 문/창문)와 같은 SVG 좌표 변환·pointer capture 드래그·클릭 선택
 * 패턴을 쓰지만, 배치 대상이 벽 위 offset이 아니라 바닥 위 자유 좌표
 * (cx,cz)라는 점이 다르다. 문/창문은 여기선 위치 참고용으로만 그리고(읽기
 * 전용, pointerEvents:none) 이동/삭제는 3단계 캔버스에서만 한다.
 */
export function RoomFurnitureCanvas({ className }: { className?: string }) {
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallColorHex = useRoomBuilderStore((s) => s.wallColorHex);
  const floorStyleId = useRoomBuilderStore((s) => s.floorStyleId);
  const openings = useRoomBuilderStore((s) => s.openings);
  const furniture = useRoomBuilderStore((s) => s.furniture);
  const selectedFurnitureDefId = useRoomBuilderStore((s) => s.selectedFurnitureDefId);
  const placeFurnitureAt = useRoomBuilderStore((s) => s.placeFurnitureAt);
  const selectFurnitureItem = useRoomBuilderStore((s) => s.selectFurnitureItem);

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
          if (!selectedFurnitureDefId) {
            selectFurnitureItem(null);
            return;
          }
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

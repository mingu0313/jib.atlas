"use client";

import { useRef } from "react";
import type { Point } from "@/lib/roomBuilderStore";
import { getPolygonViewBox, getWallSegments, projectOffset } from "@/lib/roomGeometry";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { clampOpeningOffset } from "@/lib/roomGeometry";
import type { PlacedOpening } from "@/lib/roomBuilderStore";
import { FLOOR_STYLE_PRESETS } from "@/lib/roomStyle";

const WALL_THICKNESS_CM = 10;
/** 클릭으로 볼 — 이 거리(px) 미만으로 움직였으면 드래그가 아니라 클릭(선택)
 * 으로 본다. 마우스든 터치든 손이 완전히 안 떨리긴 어려우니 약간의 여유. */
const CLICK_THRESHOLD_PX = 6;
const TOOLBAR_BTN_R = WALL_THICKNESS_CM * 1.8;
const TOOLBAR_OFFSET_CM = WALL_THICKNESS_CM * 4.5;

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

/** 선택된 opening 위에 뜨는 삭제 버튼 하나짜리 인라인 툴바 — 벽 바깥쪽으로
 * 살짝 띄워서 벽 자체를 가리지 않는다(오프셋 방향은 RoomDimensionCanvas의
 * 치수 라벨과 같은 outward-normal 트릭: 우리 폴리곤은 항상 시계방향이라
 * 진행 방향 (dirX,dirZ)를 오른쪽으로 90도 돌린 (dirZ,-dirX)가 바깥쪽이다). */
function OpeningToolbar({ cx, cz, dirX, dirZ, onDelete }: { cx: number; cz: number; dirX: number; dirZ: number; onDelete: () => void }) {
  const nx = dirZ;
  const nz = -dirX;
  const bx = cx + nx * TOOLBAR_OFFSET_CM;
  const bz = cz + nz * TOOLBAR_OFFSET_CM;
  return (
    <g
      transform={`translate(${bx} ${bz})`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      style={{ cursor: "pointer" }}
    >
      <circle r={TOOLBAR_BTN_R} fill="var(--color-fg)" opacity={0.9} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={TOOLBAR_BTN_R * 1.3}
        fill="var(--color-cream)"
        style={{ pointerEvents: "none" }}
      >
        ×
      </text>
      <title>삭제</title>
    </g>
  );
}

function OpeningMarker({ opening, wallLength }: { opening: PlacedOpening; wallLength: number }) {
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const moveOpening = useRoomBuilderStore((s) => s.moveOpening);
  const removeOpening = useRoomBuilderStore((s) => s.removeOpening);
  const selectedOpeningId = useRoomBuilderStore((s) => s.selectedOpeningId);
  const selectOpening = useRoomBuilderStore((s) => s.selectOpening);
  const downPos = useRef<{ x: number; y: number } | null>(null);

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
  const isSelected = selectedOpeningId === opening.id;

  return (
    <>
      <line
        x1={p1.x}
        y1={p1.z}
        x2={p2.x}
        y2={p2.z}
        stroke={opening.kind === "door" ? "#8B5E34" : "#5F8FB4"}
        strokeWidth={WALL_THICKNESS_CM * (isSelected ? 1.5 : 1.2)}
        strokeLinecap="round"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          downPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const svg = e.currentTarget.ownerSVGElement;
          if (!svg) return;
          const point = toSvgPoint(svg, e.clientX, e.clientY);
          moveOpening(opening.id, projectOffset(wall.start, wall.end, point));
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          const start = downPos.current;
          downPos.current = null;
          if (!start) return;
          const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
          if (moved < CLICK_THRESHOLD_PX) selectOpening(opening.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          removeOpening(opening.id);
        }}
        style={{ cursor: "grab" }}
      >
        <title>클릭하면 선택돼요(삭제 버튼이 떠요) — 더블클릭하면 바로 삭제돼요</title>
      </line>
      {isSelected && (
        <OpeningToolbar cx={cx} cz={cz} dirX={dirX} dirZ={dirZ} onDelete={() => removeOpening(opening.id)} />
      )}
    </>
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
 *
 * 선택: 놓인 항목을 드래그 없이(pointerdown→pointerup 사이 이동량이
 * 작으면) 클릭하면 store.selectedOpeningId로 선택되고 삭제 버튼이 뜬다 —
 * 더블클릭만 있던 예전 방식은 발견하기 어려워서(특히 모바일) 기본 흐름을
 * 클릭 선택으로 바꾸고, 더블클릭은 단축키로 남겨뒀다.
 */
export function RoomPlanCanvas({ className }: { className?: string }) {
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallColorHex = useRoomBuilderStore((s) => s.wallColorHex);
  const floorStyleId = useRoomBuilderStore((s) => s.floorStyleId);
  const openings = useRoomBuilderStore((s) => s.openings);
  const pendingOpening = useRoomBuilderStore((s) => s.pendingOpening);
  const placeOpeningOnWall = useRoomBuilderStore((s) => s.placeOpeningOnWall);
  const selectOpening = useRoomBuilderStore((s) => s.selectOpening);

  const floorPreset = FLOOR_STYLE_PRESETS.find((p) => p.id === floorStyleId) ?? FLOOR_STYLE_PRESETS[0];
  const walls = getWallSegments(roomPolygon);
  const viewBox = getPolygonViewBox(roomPolygon);
  const floorPoints = roomPolygon.map((p) => `${p.x},${p.z}`).join(" ");

  return (
    <svg viewBox={viewBox} className={className}>
      <polygon points={floorPoints} fill={floorPreset.base} onClick={() => selectOpening(null)} />
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
            if (!pendingOpening) {
              selectOpening(null);
              return;
            }
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

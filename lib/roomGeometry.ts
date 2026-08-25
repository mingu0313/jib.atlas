import type { OpeningKind, Point, RoomShapeId } from "./roomBuilderStore";

export interface WallSegment {
  index: number;
  start: Point;
  end: Point;
  length: number;
}

/** roomPolygon의 변(i번째 점 → i+1번째 점)을 벽 하나로 본다. 마지막 점은
 * 첫 점으로 되돌아가 폐곡선을 이룬다. */
export function getWallSegments(polygon: Point[]): WallSegment[] {
  return polygon.map((start, i) => {
    const end = polygon[(i + 1) % polygon.length];
    const length = Math.hypot(end.x - start.x, end.z - start.z);
    return { index: i, start, end, length };
  });
}

/** point를 (start→end) 선분 위로 투영해 start로부터의 거리(cm)를 준다.
 * 선분 밖으로 나가면 양 끝으로 clamp한다 — SVG 클릭/드래그 좌표를 벽을
 * 따라가는 offset으로 바꾸는 데 쓴다. */
export function projectOffset(start: Point, end: Point, point: Point): number {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lenSq = dx * dx + dz * dz || 1;
  const t = ((point.x - start.x) * dx + (point.z - start.z) * dz) / lenSq;
  const clampedT = Math.min(1, Math.max(0, t));
  return clampedT * Math.sqrt(lenSq);
}

/** offset(문/창문 중심의 벽 시작점 기준 거리)을 이 벽 안에 완전히 들어오게
 * clamp한다. 벽보다 큰 문/창문이면(잘못 골랐거나 치수 조정으로 벽이
 * 줄어든 경우) 가운데로 고정 — 시각적으로 살짝 넘칠 순 있어도 offset
 * 자체가 음수/터무니없는 값이 되진 않는다. */
export function clampOpeningOffset(offsetCm: number, widthCm: number, wallLength: number): number {
  const half = widthCm / 2;
  if (wallLength <= widthCm) return wallLength / 2;
  return Math.min(wallLength - half, Math.max(half, offsetCm));
}

const OPENING_GAP_CM = 10;

/**
 * 같은 벽(wallIndex) 위의 다른 문/창문과 간격이 OPENING_GAP_CM 미만으로
 * 겹치면 true. excludeId는 드래그 중인 항목 자기 자신을 검사에서 뺀다.
 */
export function overlapsOtherOpening(
  openings: { id: string; wallIndex: number; offsetCm: number; widthCm: number }[],
  wallIndex: number,
  offsetCm: number,
  widthCm: number,
  excludeId?: string,
): boolean {
  const half = widthCm / 2;
  const lo = offsetCm - half - OPENING_GAP_CM;
  const hi = offsetCm + half + OPENING_GAP_CM;
  return openings.some((op) => {
    if (op.id === excludeId || op.wallIndex !== wallIndex) return false;
    const oHalf = op.widthCm / 2;
    return op.offsetCm + oHalf > lo && op.offsetCm - oHalf < hi;
  });
}

/** RoomPolygonPreview·RoomPlanCanvas가 공유하는 SVG viewBox 계산 — 폴리곤
 * 바운딩박스에 12% 여백을 둔다. */
export function getPolygonViewBox(polygon: Point[], paddingRatio = 0.12): string {
  const xs = polygon.map((p) => p.x);
  const zs = polygon.map((p) => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const span = Math.max(maxX - minX, maxZ - minZ, 1);
  const pad = span * paddingRatio;
  return `${minX - pad} ${minZ - pad} ${maxX - minX + pad * 2} ${maxZ - minZ + pad * 2}`;
}

/**
 * 대각선 변이 있는(볼록 다각형) 프리셋 — 나머지 5종(정사각형/직사각형/
 * L자형/T자형/U자형)은 전부 직교 변만 있어서 getFloorRects의 축정렬
 * 사각형 분해가 통하지만, 이 둘은 안 통해서(대각선 부분이 사각형으로
 * 안 쪼개짐) 바닥·가구충돌 판정을 point-in-convex-polygon 방식으로
 * 따로 한다(isRectInsideConvexPolygon).
 */
export const CONVEX_DIAGONAL_SHAPES: readonly RoomShapeId[] = ["clippedCorner", "angled"];

/**
 * roomPolygon을 축정렬 사각형들의 합집합으로 쪼갠다 — 3D 바닥 렌더링·
 * 가구 충돌 판정에 쓴다. CONVEX_DIAGONAL_SHAPES(잘라내기/경사진)는 이
 * 방식이 안 통해서 호출하면 안 된다(isFootprintInsideRoom이 알아서
 * 그쪽엔 isRectInsideConvexPolygon을 쓰게 분기한다).
 *
 * 점 순서는 전부 lib/roomBuilderStore.ts ROOM_SHAPE_PRESETS 주석의 규약을
 * 그대로 따른다: 정사각형/직사각형은 폴리곤 자체가 이미 사각형이라
 * 바운딩박스 하나. L자형은 왼쪽 전체 기둥 + 오른쪽 아래쪽 기둥 두 개.
 * T자형은 위쪽 넓은 바 + 아래쪽 좁은 스템 두 개. U자형은 노치 위 왼쪽
 * 기둥 + 노치 위 오른쪽 기둥 + 노치 아래 전체 폭 바닥 세 개.
 */
export function getFloorRects(shape: RoomShapeId, polygon: Point[]): Rect[] {
  if (shape === "lshape" && polygon.length === 6) {
    const [p0, p1, p2, , p4] = polygon;
    return [
      { x0: p0.x, z0: p0.z, x1: p1.x, z1: p4.z },
      { x0: p1.x, z0: p2.z, x1: p4.x, z1: p4.z },
    ];
  }
  if (shape === "tshape" && polygon.length === 8) {
    const [p0, p1, p2, p3, p4, , p6] = polygon;
    return [
      { x0: p0.x, z0: p0.z, x1: p1.x, z1: p2.z }, // 위쪽 바
      { x0: p6.x, z0: p2.z, x1: p3.x, z1: p4.z }, // 아래쪽 스템
    ];
  }
  if (shape === "ushape" && polygon.length === 8) {
    const [p0, p1, p2, p3, p4, p5, p6] = polygon;
    return [
      { x0: p0.x, z0: p0.z, x1: p1.x, z1: p2.z }, // 노치 왼쪽 기둥
      { x0: p4.x, z0: p4.z, x1: p5.x, z1: p3.z }, // 노치 오른쪽 기둥
      { x0: p0.x, z0: p2.z, x1: p5.x, z1: p6.z }, // 노치 아래 전체 폭
    ];
  }
  const xs = polygon.map((p) => p.x);
  const zs = polygon.map((p) => p.z);
  return [{ x0: Math.min(...xs), z0: Math.min(...zs), x1: Math.max(...xs), z1: Math.max(...zs) }];
}

/**
 * 바닥 면적(m²) — 신발끈 공식(shoelace formula)으로 폴리곤 자체에서 직접
 * 계산한다. 볼록/오목 어느 쪽이든, 축정렬이든 대각선이 있든 상관없이
 * 항상 정확해서(모든 심플 폴리곤에 성립) getFloorRects 같은 도형별 분해가
 * 필요 없다 — STEP 14 예산 계산(바닥재 = 단가 × 면적)에 쓴다.
 */
export function getFloorAreaM2(polygon: Point[]): number {
  let sum2 = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum2 += a.x * b.z - b.x * a.z;
  }
  return Math.abs(sum2) / 2 / 10_000;
}

/**
 * 벽 면적(m²) — 벽 전체(둘레 × 천장높이)에서 문/창문이 차지하는 면적을
 * 뺀, 실제로 페인트가 필요한 순 면적. STEP 14 예산 계산(벽 페인트 = 단가
 * × 면적)에 쓴다.
 */
export function getWallAreaM2(
  polygon: Point[],
  wallHeightCm: number,
  openings: { widthCm: number; heightCm: number }[],
): number {
  const grossCm2 = getWallSegments(polygon).reduce((sum, w) => sum + w.length * wallHeightCm, 0);
  const openingsCm2 = openings.reduce((sum, o) => sum + o.widthCm * o.heightCm, 0);
  return Math.max(0, grossCm2 - openingsCm2) / 10_000;
}

export interface Rect {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

function rectArea(r: Rect): number {
  return Math.max(0, r.x1 - r.x0) * Math.max(0, r.z1 - r.z0);
}

function intersectRects(a: Rect, b: Rect): Rect {
  return {
    x0: Math.max(a.x0, b.x0),
    z0: Math.max(a.z0, b.z0),
    x1: Math.min(a.x1, b.x1),
    z1: Math.min(a.z1, b.z1),
  };
}

/**
 * 사각형 footprint가 floorRects(축정렬 사각형들의 합집합, 서로 안 겹침 —
 * getFloorRects가 만드는 정사각형/직사각형 1개 또는 L자형 2개)에 완전히
 * 들어있는지. "각 꼭짓점이 어느 한 사각형 안에 있는가"로는 오목한 L자
 * 모서리 근처에서 오탐이 날 수 있어서, 대신 footprint와 각 floorRect의
 * 교집합 넓이를 합산해 footprint 전체 넓이와 같은지(=차집합이 없는지)
 * 비교한다 — floorRects끼리 안 겹치니 이 합산에 이중계산 걱정이 없다.
 */
export function isRectInsideFloor(footprint: Rect, floorRects: Rect[]): boolean {
  const covered = floorRects.reduce((sum, r) => sum + rectArea(intersectRects(footprint, r)), 0);
  return covered >= rectArea(footprint) - 1; // 부동소수점 오차 1cm² 허용
}

/** 두 축정렬 사각형이 겹치는지(선만 맞닿는 건 안 겹침으로 본다). */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
}

/**
 * point가 볼록 다각형 polygon 안(경계 포함)에 있는지 — 모든 변에 대해
 * "점이 그 변의 어느 쪽에 있는지"의 부호(외적)가 전부 같은지(또는 변
 * 위에 있는지)로 판정한다. 폴리곤이 시계방향인지 반시계방향인지 몰라도
 * "부호가 전부 일관된가"만 보면 되니 어느 감김 방향이든 그대로 통한다.
 */
export function isPointInConvexPolygon(point: Point, polygon: Point[]): boolean {
  let sign = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = (b.x - a.x) * (point.z - a.z) - (b.z - a.z) * (point.x - a.x);
    if (Math.abs(cross) < 1e-6) continue; // 변 위(경계) — 그 변에 대해선 안/밖 어느 쪽도 아니라 통과
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/**
 * 사각형 footprint가 볼록 다각형 room 안에 완전히 들어있는지 — 네
 * 꼭짓점이 전부 room 안이면 충분하다(사각형도 room도 둘 다 볼록이라,
 * 볼록 도형의 꼭짓점들이 다른 볼록 도형 안에 있으면 그 볼록 껍질 —
 * 즉 사각형 전체 — 도 항상 안에 있다는 표준 성질).
 */
export function isRectInsideConvexPolygon(footprint: Rect, room: Point[]): boolean {
  const corners: Point[] = [
    { x: footprint.x0, z: footprint.z0 },
    { x: footprint.x1, z: footprint.z0 },
    { x: footprint.x1, z: footprint.z1 },
    { x: footprint.x0, z: footprint.z1 },
  ];
  return corners.every((c) => isPointInConvexPolygon(c, room));
}

/**
 * 사각형 footprint가 방 폴리곤 안에 완전히 들어있는지 — shape에 따라
 * 알맞은 방식으로 분기하는 단일 진입점(가구 배치·이동 검사에 쓴다).
 * CONVEX_DIAGONAL_SHAPES(대각선 있는 볼록 도형)는 isRectInsideConvexPolygon,
 * 나머지(직교 도형, 오목해도 됨)는 getFloorRects 기반 isRectInsideFloor.
 */
export function isFootprintInsideRoom(shape: RoomShapeId, polygon: Point[], footprint: Rect): boolean {
  if (CONVEX_DIAGONAL_SHAPES.includes(shape)) return isRectInsideConvexPolygon(footprint, polygon);
  return isRectInsideFloor(footprint, getFloorRects(shape, polygon));
}

export interface WallBox {
  /** 벽 시작점부터의 거리(cm) 구간 — 이 구간 x 아래 높이 구간이 실제
   * 벽체(3D 박스) 하나가 된다. */
  offsetStart: number;
  offsetEnd: number;
  yStart: number;
  yEnd: number;
}

/**
 * 벽 하나(길이 wallLength)를 그 위에 뚫린 문/창문에 맞춰 실제 벽체
 * 박스들로 쪼갠다 — RoomStudioScene3D가 이 목록 그대로 <mesh>를 하나씩
 * 그린다. 문/창문 폭 구간은 세로로 다시 나뉜다: 창문은 바닥~창턱
 * (sillHeightCm)까지, 그리고 (창턱+높이)~천장까지 두 조각(상인방)이
 * 남고, 문은 문틀 위(heightCm)~천장까지 상인방 한 조각만 남는다(바닥은
 * 완전히 뚫림). 문/창문이 없는 구간은 바닥~천장 통짜 한 조각.
 */
export function buildWallBoxes(
  wallLength: number,
  openingsOnWall: { offsetCm: number; widthCm: number; heightCm: number; kind: OpeningKind; sillHeightCm?: number }[],
  wallHeightCm: number,
): WallBox[] {
  const boxes: WallBox[] = [];
  const sorted = [...openingsOnWall].sort((a, b) => a.offsetCm - b.offsetCm);
  let cursor = 0;
  for (const op of sorted) {
    const start = Math.max(0, op.offsetCm - op.widthCm / 2);
    const end = Math.min(wallLength, op.offsetCm + op.widthCm / 2);
    if (start > cursor) boxes.push({ offsetStart: cursor, offsetEnd: start, yStart: 0, yEnd: wallHeightCm });
    const sill = op.kind === "window" ? Math.min(op.sillHeightCm ?? 0, wallHeightCm) : 0;
    const openTop = Math.min(sill + op.heightCm, wallHeightCm);
    if (sill > 0) boxes.push({ offsetStart: start, offsetEnd: end, yStart: 0, yEnd: sill });
    if (openTop < wallHeightCm) boxes.push({ offsetStart: start, offsetEnd: end, yStart: openTop, yEnd: wallHeightCm });
    cursor = Math.max(cursor, end);
  }
  if (cursor < wallLength) boxes.push({ offsetStart: cursor, offsetEnd: wallLength, yStart: 0, yEnd: wallHeightCm });
  // 뜬 오차(부동소수점)로 폭·높이가 사실상 0인 조각은 렌더 안 함.
  return boxes.filter((b) => b.offsetEnd - b.offsetStart > 0.5 && b.yEnd - b.yStart > 0.5);
}

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
 * roomPolygon을 축정렬 사각형들의 합집합으로 쪼갠다 — 3D 바닥 렌더링에
 * 쓴다(정사각형/직사각형은 폴리곤 자체가 이미 사각형이라 바운딩박스
 * 하나, L자형은 lib/roomBuilderStore.ts가 정한 점 순서 규약을 그대로
 * 이용해 왼쪽 전체 기둥 + 오른쪽 아래쪽 기둥 두 개로 나눈다). 셋 중
 * 어느 것도 아닌 shape가 들어오면(방어적으로) 바운딩박스로 폴백한다.
 */
export function getFloorRects(shape: RoomShapeId, polygon: Point[]): { x0: number; z0: number; x1: number; z1: number }[] {
  if (shape === "lshape" && polygon.length === 6) {
    const [p0, p1, p2, , p4] = polygon;
    return [
      { x0: p0.x, z0: p0.z, x1: p1.x, z1: p4.z },
      { x0: p1.x, z0: p2.z, x1: p4.x, z1: p4.z },
    ];
  }
  const xs = polygon.map((p) => p.x);
  const zs = polygon.map((p) => p.z);
  return [{ x0: Math.min(...xs), z0: Math.min(...zs), x1: Math.max(...xs), z1: Math.max(...zs) }];
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

import { TILE_M } from "./editor3d";
import type { Room, RoomType } from "./types";

/**
 * STEP 13 — HouseTemplate.rooms(평면도 좌표)를 룸 에디터 3D 씬(EditorScene3D)의
 * 타일 격자로 변환한다. Room.position은 components/FloorPlan.tsx가 그대로
 * 쓰는 400×300 단위 평면도 좌표계다(house-templates*.json 참고) — 그 좌표
 * 자체는 절대 건드리지 않고, 여기서만 미터/타일 단위로 환산한다.
 *
 * 스케일(PLAN_UNIT_M)은 눈대중이다 — 예를 들어 L 사이즈 거실(200×140
 * 단위)이 실제 거실 폭 5m 안팎으로 보이도록 잡았다. lib/editor3d.ts의
 * TILE_M(가구 배치 격자 한 칸)과 같은 배율 체계를 공유해, 가구
 * 폭(IsoFurnitureDef.w/d, 타일 단위)이 방 크기와 비례가 맞게 놓인다.
 */
export const PLAN_UNIT_M = 0.025;

/** 방 하나의 영역을 타일 격자로 나타낸 것. col/row는 전체 배치의 바운딩
 * 박스 좌상단을 (0,0)으로 하는 공유 좌표계 — PlacedFurniture.col/row와
 * 같은 격자라, 가구는 방마다 좌표계를 새로 잡을 필요 없이 그대로 쓴다. */
export interface RoomTileRect {
  type: RoomType;
  colStart: number;
  rowStart: number;
  /** 배타적 경계(exclusive) — 이 방은 [colStart,colEnd) × [rowStart,rowEnd) 타일. */
  colEnd: number;
  rowEnd: number;
}

export interface RoomLayout3D {
  rects: RoomTileRect[];
  /** 전체 배치가 차지하는 타일 폭/깊이 — 바닥 격자·카메라 프레이밍에 쓴다. */
  cols: number;
  rows: number;
}

/**
 * rooms가 비어 있으면(있을 수 없지만 방어적으로) 1×1 빈 레이아웃을 준다 —
 * 씬이 아예 안 그려지는 것보다는 빈 방 하나가 낫다.
 */
export function buildRoomLayout(rooms: Room[]): RoomLayout3D {
  if (rooms.length === 0) {
    return { rects: [], cols: 1, rows: 1 };
  }

  const minX = Math.min(...rooms.map((r) => r.position.x));
  const minY = Math.min(...rooms.map((r) => r.position.y));
  const toCol = (x: number) => Math.round(((x - minX) * PLAN_UNIT_M) / TILE_M);
  const toRow = (y: number) => Math.round(((y - minY) * PLAN_UNIT_M) / TILE_M);
  // 폭/깊이는 (끝 좌표 반올림 − 시작 좌표 반올림)이 아니라 원본 width/height를
  // 직접 반올림해서 타일 수를 구한다 — 두 좌표를 각각 반올림하면 그 오차가
  // 누적/상쇄되면서 방 폭이 실제보다 1타일 작게 나오는 경우가 있었다(예:
  // 폭 100단위 방이 반올림하면 4타일이어야 하는데 시작/끝을 따로 반올림하면
  // 3타일로 깎여, 4타일짜리 카운터가 못 들어가는 식).
  const toSpan = (size: number) => Math.max(1, Math.round((size * PLAN_UNIT_M) / TILE_M));

  const rects: RoomTileRect[] = rooms.map((r) => {
    const colStart = toCol(r.position.x);
    const rowStart = toRow(r.position.y);
    const colEnd = colStart + toSpan(r.position.width);
    const rowEnd = rowStart + toSpan(r.position.height);
    return { type: r.type, colStart, rowStart, colEnd, rowEnd };
  });

  const cols = Math.max(...rects.map((r) => r.colEnd));
  const rows = Math.max(...rects.map((r) => r.rowEnd));
  return { rects, cols, rows };
}

/**
 * (col,row)에서 시작하는 w×d 가구 footprint가 **완전히 한 방 안에** 들어가고
 * (방 경계를 걸치면 안 됨), allowedTypes가 있으면 그 방 타입이 허용
 * 목록에 있는지까지 확인한다. 방과 방 사이 틈(복도 등, 어느 rect에도
 * 안 속하는 타일)엔 아무것도 못 놓는다 — 그 틈까지 자동으로 막아준다.
 */
export function roomContaining(
  rects: RoomTileRect[],
  col: number,
  row: number,
  w: number,
  d: number,
  allowedTypes?: RoomType[],
): RoomTileRect | null {
  const room = rects.find(
    (r) => col >= r.colStart && row >= r.rowStart && col + w <= r.colEnd && row + d <= r.rowEnd,
  );
  if (!room) return null;
  if (allowedTypes && !allowedTypes.includes(room.type)) return null;
  return room;
}

import type { Point } from "./roomBuilderStore";
import { getWallOutwardNormal, getWallSegments } from "./roomGeometry";

/**
 * STEP 16 — 항공뷰/상단뷰/사이드뷰 카메라 프리셋. 세 프리셋 전부 같은 공용
 * 공식 하나("바운딩 스피어를 FOV에 맞춰 프레이밍")를 쓰고, elevation/
 * azimuth/fov/halfExtent 네 숫자만 프리셋마다 다르다 — 그래서 방 크기·
 * 비율(STEP 11의 7종 프리셋, 20~1000cm 범위)이 뭐든 항상 딱 맞게
 * 프레이밍된다. RoomStudioScene3D.tsx의 CameraRig가 이 결과를
 * CameraControls.setLookAt으로 부드럽게 보간한다.
 *
 * "진짜" orthographic(별도 OrthographicCamera로 스왑) 대신 아주 좁은
 * fov(LOCKED_FOV=5°)의 PerspectiveCamera로 원근 왜곡을 육안상 0에 가깝게
 * 흉내낸다 — 카메라 객체 하나를 CameraControls 하나에 계속 묶어둘 수
 * 있어서, 항공뷰↔상단/사이드뷰 전환까지 포함한 모든 뷰 전환이 위치·화각
 * 둘 다 끊김 없이 한 호흡으로 보간된다(카메라를 진짜로 스왑하면 그
 * 순간 투영 방식 자체가 뚝 끊긴다).
 */

const CM_TO_M = 0.01;
const DEG = Math.PI / 180;
/** 바운딩 스피어에 15% 여백을 두고 프레이밍. */
const PADDING = 1.15;
const AERIAL_FOV = 34;
/** 상단·사이드뷰의 "orthographic 흉내" fov — 위 모듈 설명 참고. */
const LOCKED_FOV = 5;

export type RoomViewMode = "aerial" | "top" | "side";

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/** 표준 구면좌표 → 단위 방향 벡터(world Y가 up). elevation=0은 수평,
 * 90°는 정수직 위. azimuth=0은 +Z 방향(화면 SVG 평면도의 "아래"). */
function dir(elevationRad: number, azimuthRad: number): [number, number, number] {
  return [
    Math.cos(elevationRad) * Math.sin(azimuthRad),
    Math.sin(elevationRad),
    Math.cos(elevationRad) * Math.cos(azimuthRad),
  ];
}

/** 반지름 halfExtentM(+천장 절반 높이)짜리 바운딩 스피어가 fov 안에 딱
 * 들어오는 카메라 거리. */
function framingDistance(halfExtentM: number, wallHeightM: number, fovDeg: number): number {
  const radius = Math.hypot(halfExtentM, wallHeightM / 2);
  return (radius * PADDING) / Math.sin((fovDeg * DEG) / 2);
}

function addScaled(base: [number, number, number], direction: [number, number, number], scale: number): [number, number, number] {
  return [base[0] + direction[0] * scale, base[1] + direction[1] * scale, base[2] + direction[2] * scale];
}

/** sideViewWallId(문자열 벽 인덱스)를 현재 폴리곤에 안전하게 clamp —
 * 방 모양을 바꿔 벽 개수가 줄어든 뒤에도 범위를 벗어난 인덱스를 참조하지
 * 않게 한다. */
export function resolveSideWallIndex(sideViewWallId: string | null, wallCount: number): number {
  if (wallCount <= 0) return 0;
  const parsed = Number(sideViewWallId ?? "0");
  const idx = Number.isFinite(parsed) ? Math.round(parsed) : 0;
  return Math.min(Math.max(idx, 0), wallCount - 1);
}

export function computeCameraPose(
  mode: RoomViewMode,
  roomPolygon: Point[],
  wallHeightCm: number,
  sideViewWallId: string | null,
): CameraPose {
  const wallHeightM = wallHeightCm * CM_TO_M;

  if (mode === "side") {
    const walls = getWallSegments(roomPolygon);
    const wall = walls[resolveSideWallIndex(sideViewWallId, walls.length)];
    const normal = getWallOutwardNormal(wall);
    const azimuth = Math.atan2(normal.x, normal.z);
    const target: [number, number, number] = [
      ((wall.start.x + wall.end.x) / 2) * CM_TO_M,
      wallHeightM / 2,
      ((wall.start.z + wall.end.z) / 2) * CM_TO_M,
    ];
    const wallLengthM = wall.length * CM_TO_M;
    const distance = framingDistance(wallLengthM / 2, wallHeightM, LOCKED_FOV);
    return { target, fov: LOCKED_FOV, position: addScaled(target, dir(0, azimuth), distance) };
  }

  const xs = roomPolygon.map((p) => p.x);
  const zs = roomPolygon.map((p) => p.z);
  const centerXm = ((Math.min(...xs) + Math.max(...xs)) / 2) * CM_TO_M;
  const centerZm = ((Math.min(...zs) + Math.max(...zs)) / 2) * CM_TO_M;
  const spanWm = (Math.max(...xs) - Math.min(...xs)) * CM_TO_M;
  const spanDm = (Math.max(...zs) - Math.min(...zs)) * CM_TO_M;
  const halfExtent = Math.hypot(spanWm, spanDm) / 2;
  // 방 전체 부피의 중심(바닥~천장 중간) — 이 점을 기준으로 잡아야
  // halfExtent·wallHeightM/2로 만든 바운딩 스피어가 바닥 모서리·천장
  // 모서리를 동시에 정확히 감싼다.
  const target: [number, number, number] = [centerXm, wallHeightM / 2, centerZm];

  if (mode === "top") {
    // elevation은 정확히 90°가 아니라 89.95° — lookAt이 forward·up(world
    // Y)이 평행해지는 지점에서 roll을 못 구해 특이점이 생기는 걸 피한다
    // (육안으론 90°와 구분 안 됨). azimuth=0으로 두면 화면 위쪽이 −Z
    // 방향이 되어 기존 2D 평면도(SVG, x-오른쪽/z-아래)와 방향이 맞는다.
    const distance = framingDistance(halfExtent, wallHeightM, LOCKED_FOV);
    return { target, fov: LOCKED_FOV, position: addScaled(target, dir(89.95 * DEG, 0), distance) };
  }

  // 항공뷰(기본값) — 우하단 코너에서 45도 정도 내려다보는 구도.
  const distance = framingDistance(halfExtent, wallHeightM, AERIAL_FOV);
  return { target, fov: AERIAL_FOV, position: addScaled(target, dir(42 * DEG, 45 * DEG), distance) };
}

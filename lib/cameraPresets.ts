import type { Point } from "./roomBuilderStore";
import { getWallOutwardNormal, getWallSegments } from "./roomGeometry";

/**
 * STEP 16 — 항공뷰/상단뷰/사이드뷰 카메라 프리셋. 세 프리셋 전부 같은 공용
 * 원리("바운딩 스피어를 화면에 맞춰 프레이밍")를 쓰고, elevation/azimuth/
 * halfExtent 몇 숫자만 프리셋마다 다르다 — 방 크기·비율(STEP 11의 7종
 * 프리셋, 20~1000cm 범위)이 뭐든 항상 딱 맞게 프레이밍된다.
 *
 * 상단·사이드뷰는 **진짜** OrthographicCamera를 쓴다(처음엔 아주 좁은 fov의
 * PerspectiveCamera로 흉내내려 했었는데, 사이드뷰에서 실패했다 — 벽 하나를
 * 원근 왜곡 없이 프레이밍하려면 fov가 좁을수록 카메라를 그만큼 멀리
 * 물려야 하는데, 그 "멀리"가 방 안쪽 여유 공간보다 커지면 카메라가 반대편
 * 벽을 뚫고 건물 밖으로 나가버린다 — 실제로 이 버그가 났었다. 진짜
 * orthographic은 프레이밍이 카메라 위치가 아니라 프러스텀 크기로 정해져서,
 * 카메라를 방 안쪽 가까이 두고도 벽 전체를 평평하게 담을 수 있다.
 * RoomStudioScene3D.tsx의 CameraRig가 PerspectiveCamera(항공)/
 * OrthographicCamera(상단·사이드) 두 카메라 객체를 두고 viewMode에 따라
 * makeDefault를 스왑한다.
 */

const CM_TO_M = 0.01;
const DEG = Math.PI / 180;
/** 바운딩 스피어에 15% 여백을 두고 프레이밍(항공뷰 거리·상단/사이드뷰
 * 프러스텀 크기 둘 다 이 여백을 쓴다). */
const PADDING = 1.15;
const AERIAL_FOV = 34;

export type RoomViewMode = "aerial" | "top" | "side";
export type CameraProjection = "perspective" | "orthographic";

export interface CameraPose {
  projection: CameraProjection;
  position: [number, number, number];
  target: [number, number, number];
  /** perspective(항공뷰) 전용 — orthographic 포즈에선 0(안 씀). */
  fov: number;
  /** orthographic(상단·사이드뷰) 전용 — 프러스텀 절반 높이(m). 절반 너비는
   * RoomStudioScene3D의 CameraRig가 캔버스 aspect를 곱해서 정한다.
   * perspective 포즈에선 0(안 씀). */
  orthoHalfHeight: number;
}

/** 표준 구면좌표 → 단위 방향 벡터(world Y가 up). elevation=0은 수평,
 * 90°는 정수직 위. azimuth=0은 +Z 방향. */
function dir(elevationRad: number, azimuthRad: number): [number, number, number] {
  return [
    Math.cos(elevationRad) * Math.sin(azimuthRad),
    Math.sin(elevationRad),
    Math.cos(elevationRad) * Math.cos(azimuthRad),
  ];
}

/** halfExtentM(+천장 절반 높이)짜리 바운딩 스피어의 반지름. */
function boundingRadius(halfExtentM: number, wallHeightM: number): number {
  return Math.hypot(halfExtentM, wallHeightM / 2);
}

/** 그 스피어가 fov 안에 딱 들어오는 perspective 카메라 거리(항공뷰 전용). */
function perspectiveDistance(halfExtentM: number, wallHeightM: number, fovDeg: number): number {
  const radius = boundingRadius(halfExtentM, wallHeightM);
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
  const xs = roomPolygon.map((p) => p.x);
  const zs = roomPolygon.map((p) => p.z);
  const centerXm = ((Math.min(...xs) + Math.max(...xs)) / 2) * CM_TO_M;
  const centerZm = ((Math.min(...zs) + Math.max(...zs)) / 2) * CM_TO_M;
  const spanWm = (Math.max(...xs) - Math.min(...xs)) * CM_TO_M;
  const spanDm = (Math.max(...zs) - Math.min(...zs)) * CM_TO_M;
  const roomHalfExtent = Math.hypot(spanWm, spanDm) / 2;

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
    const orthoHalfHeight = boundingRadius(wallLengthM / 2, wallHeightM) * PADDING;
    // 카메라를 벽 "바깥"(outward normal 방향)이 아니라 방 "안쪽"으로
    // 물러세운다 — 그래야 벽의 실내 쪽 면이 보인다(바깥쪽 면이 아니라).
    // orthographic이라 물러서는 거리 자체는 프레이밍에 영향을 안 주니,
    // 방 크기에 비례해 적당히(최대 1.5m) 물러서되 아주 작은 방에서는
    // 반대편 벽을 뚫지 않게 방 자체의 바운딩 반경을 상한으로 clamp한다.
    const setbackM = Math.min(1.5, Math.max(roomHalfExtent, 0.3));
    return {
      projection: "orthographic",
      target,
      fov: 0,
      orthoHalfHeight,
      position: addScaled(target, dir(0, azimuth), -setbackM),
    };
  }

  const target: [number, number, number] = [centerXm, wallHeightM / 2, centerZm];

  if (mode === "top") {
    // elevation은 정확히 90°가 아니라 89.95° — lookAt이 forward·up(world Y)이
    // 평행해지는 지점에서 roll을 못 구해 특이점이 생기는 걸 피한다(육안으론
    // 90°와 구분 안 됨). azimuth=0으로 두면 화면 위쪽이 −Z 방향이 되어
    // 기존 2D 평면도(SVG, x-오른쪽/z-아래)와 방향이 맞는다. orthographic이라
    // 거리 자체는 프레이밍과 무관 — 천장 위로 넉넉히만 띄운다.
    const orthoHalfHeight = boundingRadius(roomHalfExtent, wallHeightM) * PADDING;
    const distance = wallHeightM + Math.max(roomHalfExtent, 1) + 1;
    return {
      projection: "orthographic",
      target,
      fov: 0,
      orthoHalfHeight,
      position: addScaled(target, dir(89.95 * DEG, 0), distance),
    };
  }

  // 항공뷰(기본값) — 우하단 코너에서 45도 정도 내려다보는 구도.
  const distance = perspectiveDistance(roomHalfExtent, wallHeightM, AERIAL_FOV);
  return {
    projection: "perspective",
    target,
    fov: AERIAL_FOV,
    orthoHalfHeight: 0,
    position: addScaled(target, dir(42 * DEG, 45 * DEG), distance),
  };
}

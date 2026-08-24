import { AXES, type Axis, type AxisScores } from "./types";

/**
 * 레이더 SVG 공통 기하 — jib-atlas-v2-preview.html의 pt()/ring() 공식
 * 그대로(viewBox "0 0 340 340", 중심 (170,170), R=150). 랜딩 다섯 축
 * (components/landing/FiveAxes.tsx), 결과(/result), 공유 카드
 * (components/ShareCard.tsx)가 전부 이 헬퍼를 공유한다.
 */
export const RADAR_R = 150;
export const RADAR_CX = 170;
export const RADAR_CY = 170;

export function radarPoint(i: number, value: number): [number, number] {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const r = (RADAR_R * value) / 100;
  return [RADAR_CX + Math.cos(angle) * r, RADAR_CY + Math.sin(angle) * r];
}

function fmt([x, y]: [number, number]): string {
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

/** 링(33/66/100 등) 하나를 그리는 폴리곤 points 문자열. */
export function radarRing(value: number): string {
  return AXES.map((_, i) => fmt(radarPoint(i, value))).join(" ");
}

/** 축 스코어 폴리곤(데이터 모양) points 문자열. */
export function radarShape(scores: AxisScores): string {
  return AXES.map((axis, i) => fmt(radarPoint(i, scores[axis]))).join(" ");
}

/** 각 축 정점의 좌표 — 점(dot)이나 라벨 위치 계산에 쓴다. */
export function radarDots(scores: AxisScores): { axis: Axis; x: number; y: number }[] {
  return AXES.map((axis, i) => {
    const [x, y] = radarPoint(i, scores[axis]);
    return { axis, x, y };
  });
}

/**
 * 축 이름 라벨 위치 — 정점(100%)보다 살짝 바깥(기본 124%)에 두고, 정점이
 * 중심의 좌/우/정중앙 어느 쪽에 있는지에 따라 text-anchor를 자동으로
 * 고른다(오각형이라 위쪽 정점 1개만 middle, 나머지 4개는 좌우로 갈린다) —
 * 그래야 라벨이 도형과 안 겹치고 방향에 맞게 눕는다.
 */
export function radarLabelPoint(
  i: number,
  radiusPercent = 124,
): { x: number; y: number; anchor: "start" | "middle" | "end" } {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const cos = Math.cos(angle);
  const [x, y] = radarPoint(i, radiusPercent);
  const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
  return { x, y, anchor };
}

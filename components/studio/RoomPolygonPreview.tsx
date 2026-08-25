import type { Point } from "@/lib/roomBuilderStore";
import { getPolygonViewBox } from "@/lib/roomGeometry";

/**
 * roomPolygon(cm)을 top-down SVG로 그리는 "정적" 미리보기(클릭/드래그 없음).
 * 카드 미니 프리뷰(STEP 11)와 1·2단계의 큰 프리뷰가 같은 컴포넌트를
 * 크기(className)만 다르게 재사용한다. 문/창문을 배치·이동하는 3단계는
 * 이 컴포넌트가 아니라 별도의 인터랙티브 캔버스(RoomPlanCanvas, STEP 13)를 쓴다.
 */
export function RoomPolygonPreview({
  polygon,
  className,
  strokeWidth = 6,
}: {
  polygon: Point[];
  className?: string;
  /** viewBox 단위(cm) 기준 선 두께. 카드처럼 작은 프리뷰는 그대로, 큰
   * 프리뷰는 상대적으로 얇아 보이게 폴리곤 크기에 맞춰 호출부가 조정한다. */
  strokeWidth?: number;
}) {
  const viewBox = getPolygonViewBox(polygon);
  const points = polygon.map((p) => `${p.x},${p.z}`).join(" ");

  return (
    <svg viewBox={viewBox} className={className} aria-hidden>
      <polygon points={points} fill="var(--color-sage)" stroke="var(--color-hair-strong)" strokeWidth={strokeWidth} />
    </svg>
  );
}

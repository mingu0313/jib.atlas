import type { Point } from "@/lib/roomBuilderStore";

/**
 * roomPolygon(cm)을 top-down SVG로 그리는 미리보기. 카드 미니 프리뷰(STEP 11)와
 * 아래 큰 프리뷰가 같은 컴포넌트를 크기(className)만 다르게 재사용한다.
 * STEP 12~13에서 이 자리가 치수 라벨·문/창문 배치 캔버스로 확장될 예정.
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
  const xs = polygon.map((p) => p.x);
  const zs = polygon.map((p) => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const span = Math.max(maxX - minX, maxZ - minZ, 1);
  const pad = span * 0.12;
  const viewBox = `${minX - pad} ${minZ - pad} ${maxX - minX + pad * 2} ${maxZ - minZ + pad * 2}`;
  const points = polygon.map((p) => `${p.x},${p.z}`).join(" ");

  return (
    <svg viewBox={viewBox} className={className} aria-hidden>
      <polygon points={points} fill="var(--color-sage)" stroke="var(--color-hair-strong)" strokeWidth={strokeWidth} />
    </svg>
  );
}

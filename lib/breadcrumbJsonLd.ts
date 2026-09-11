import { SITE_URL } from "@/lib/siteUrl";

/** BreadcrumbList 구조화 데이터를 만든다 — 구글 생성형 AI 검색 최적화 가이드
 * (developers.google.com/search/docs/fundamentals/ai-optimization-guide)가
 * "필수는 아니지만 사이트 구조를 기계가 더 명확히 이해하게 해준다"고 짚은
 * schema.org 마크업 중, 이 사이트에 실제로 정확히 대응되는(지어내지 않은)
 * 항목이라 골랐다 — /atlas 목록과 /atlas/[id] 상세 둘 다 "홈 > 집 아틀라스
 * (> 게시물 제목)" 구조를 그대로 반영한다.
 *
 * `items`는 루트("홈")부터 현재 페이지까지 순서대로 { name, path } — path는
 * "/atlas"처럼 SITE_URL 기준 상대경로.
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Next.js App Router 컨벤션 파일 — 요청 시 /robots.txt로 응답한다(SEO 가이드
 * "Robots.txt" 항목). 크롤 예산을 콘텐츠 없는 경로에 낭비하지 않게 아래를
 * 막는다:
 * - /login, /reset-password, /atlas/new: 폼 뿐이라 색인할 내용이 없다.
 *   (그래도 색인에서 완전히 빠지도록 각 페이지에 robots: noindex도 같이
 *   둔다 — robots.txt만으론 "크롤 금지"지 "색인 금지"가 아니라서, 다른
 *   곳에서 링크를 타고 들어오면 스니펫 없이 URL만 노출될 수 있다.)
 * - /result, /result/interiors, /en/result: 방문자마다 달라지는 진단
 *   결과라 공개 색인 가치가 없다. 여기는 반대로 robots.txt에서 막지
 *   않는다 — 크롤은 허용해야 각 페이지의 noindex 메타를 읽고 확실히
 *   뺄 수 있다(disallow로 막으면 그 메타를 아예 못 본다).
 * - /auth/*: 리다이렉트만 하는 라우트 핸들러, 렌더링되는 HTML이 없다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/reset-password", "/atlas/new", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

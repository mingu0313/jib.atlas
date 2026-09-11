import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/siteUrl";
import type { HousePost } from "@/lib/types";

/**
 * Next.js App Router 컨벤션 파일 — 요청 시 /sitemap.xml로 응답한다(SEO 가이드
 * "사이트맵" 항목). 정적 경로(랜딩·진단·스튜디오·아틀라스 목록, ko/en 둘 다)에
 * house_posts 각 게시물의 상세 페이지(/atlas/[id])를 더한다 — 유저가 직접
 * 올린 실제 콘텐츠라 개별 색인 가치가 있다(app/atlas/page.tsx 주석 참고:
 * house_posts는 public read 정책이라 로그인 없이도 전부 조회된다).
 *
 * /result, /login, /atlas/new 등은 뺀다 — robots.ts 상단 주석에 이유를
 * 적어뒀다(개인화됐거나 폼뿐인 페이지는 사이트맵에도 올릴 이유가 없다).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/en`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/test`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/en/test`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/studio`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/en/studio`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/atlas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/en/atlas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/en/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("house_posts")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    const posts = (data as Pick<HousePost, "id" | "created_at">[] | null) ?? [];
    postRoutes = posts.map((post) => ({
      url: `${SITE_URL}/atlas/${post.id}`,
      lastModified: post.created_at,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    // Supabase가 잠깐 응답 안 해도 사이트맵 자체가 500으로 죽으면 안 된다 —
    // 정적 경로만이라도 내려준다(getUserSafe와 같은 방어 패턴).
  }

  return [...staticRoutes, ...postRoutes];
}

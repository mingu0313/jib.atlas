import type { Metadata } from "next";

/** app/result/page.tsx가 "use client"라 metadata를 여기 대신 둔다. 방문자마다
 * 다른(쿼리 파라미터로 갈리는) 개인화된 결과라 공개 색인 가치가 없어서
 * noindex — robots.ts 상단 주석 참고(여기는 robots.txt로 크롤 자체를 막지
 * 않는다, 크롤은 허용해야 이 noindex를 Google이 읽을 수 있다). */
export const metadata: Metadata = {
  title: "진단 결과",
  robots: { index: false, follow: true },
};

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return children;
}

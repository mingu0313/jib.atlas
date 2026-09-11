import type { Metadata } from "next";

/** app/atlas/new/page.tsx가 "use client"라 metadata를 여기 대신 둔다. 로그인
 * 유저 전용 등록 폼이라 색인 가치가 없어 noindex — robots.ts에서 크롤도
 * 같이 막는다(로그인 게이트뿐이라 크롤 허용해도 볼 콘텐츠가 없다). */
export const metadata: Metadata = {
  title: "내 집 등록하기",
  robots: { index: false, follow: true },
};

export default function AtlasNewLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/** app/test/page.tsx가 "use client"라 metadata를 직접 export 못 해서
 * (Next.js는 Server Component에서만 metadata export를 인식한다), 이 얇은
 * 서버 레이아웃에 대신 둔다 — app/en/layout.tsx(SetHtmlLang)와 같은 패턴. */
export const metadata: Metadata = {
  title: "라이프스타일 진단",
  description: "몇 가지 질문에 답하면 다섯 개의 축으로 취향을 읽어, 30가지 집 구조 중 하나로 매칭해드려요.",
  alternates: { canonical: "/test", languages: { ko: "/test", en: "/en/test" } },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}

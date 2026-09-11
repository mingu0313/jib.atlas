import type { Metadata } from "next";

/** app/result/interiors/page.tsx가 "use client"라 metadata를 여기 대신
 * 둔다. robots(noindex)는 app/result/layout.tsx에서 이미 상속되므로 여기선
 * title만 더 구체적으로 덮어쓴다.
 *
 * 브랜드 접미사를 직접 붙인다 — 루트 title.template("%s — jib.atlas")은
 * 이미 한 번 템플릿을 소비한 app/result/layout.tsx(자기 title을 문자열로
 * 직접 지정) 아래 2단으로 중첩된 이 레이아웃까지는 안 이어져서(실측:
 * Next가 여기선 접미사 없이 그대로 씀), 여기서만 직접 완성된 문자열로 둔다. */
export const metadata: Metadata = {
  title: "인테리어 추천 결과 — jib.atlas",
};

export default function ResultInteriorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

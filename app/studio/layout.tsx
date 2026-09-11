import type { Metadata } from "next";

/** app/studio/page.tsx가 "use client"라 metadata를 여기 대신 둔다 —
 * app/test/layout.tsx와 같은 이유. */
export const metadata: Metadata = {
  title: "인테리어 스튜디오",
  description: "내 방을 직접 그리고, 가구를 자유롭게 배치해보는 3D 인테리어 에디터.",
  alternates: { canonical: "/studio", languages: { ko: "/studio", en: "/en/studio" } },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}

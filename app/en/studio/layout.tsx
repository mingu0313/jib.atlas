import type { Metadata } from "next";

/** app/studio/layout.tsx의 영문판 — 같은 이유(page.tsx가 "use client"). */
export const metadata: Metadata = {
  title: "Interior Studio",
  description: "Draw your own room and freely arrange furniture in a 3D interior editor.",
  alternates: { canonical: "/en/studio", languages: { ko: "/studio", en: "/en/studio" } },
};

export default function EnglishStudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}

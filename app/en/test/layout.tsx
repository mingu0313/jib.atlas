import type { Metadata } from "next";

/** app/en/test/page.tsx가 "use client"라 metadata를 여기 대신 둔다 —
 * app/test/layout.tsx와 같은 이유. */
export const metadata: Metadata = {
  title: "Take the Quiz",
  description:
    "Answer a few quick questions and get matched to one of 30 house structures, scored across five axes.",
  alternates: { canonical: "/en/test", languages: { ko: "/test", en: "/en/test" } },
};

export default function EnTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}

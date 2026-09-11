import type { Metadata } from "next";

/** app/en/result/page.tsx가 "use client"라 metadata를 여기 대신 둔다 —
 * app/result/layout.tsx와 같은 이유로 noindex. */
export const metadata: Metadata = {
  title: "Your Result",
  robots: { index: false, follow: true },
};

export default function EnResultLayout({ children }: { children: React.ReactNode }) {
  return children;
}

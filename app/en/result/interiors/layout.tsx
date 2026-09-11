import type { Metadata } from "next";

/** app/result/interiors/layout.tsx의 영문판 — 같은 이유(page.tsx가
 * "use client"). */
export const metadata: Metadata = {
  title: "Your Interior Match — jib.atlas",
};

export default function EnglishResultInteriorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

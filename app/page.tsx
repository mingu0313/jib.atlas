import type { Metadata } from "next";
import { Cta } from "@/components/landing/Cta";
import { EditorPreview } from "@/components/landing/EditorPreview";
import { FiveAxes } from "@/components/landing/FiveAxes";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HouseTypes } from "@/components/landing/HouseTypes";
import { Quote } from "@/components/landing/Quote";

/** title/description은 루트 레이아웃 기본값을 그대로 쓴다(이 페이지가
 * "/"라 루트 기본값 자체가 이 페이지 기준으로 쓰여 있다) — 여기선 canonical과
 * ko/en 대응(hreflang)만 지정한다. alternates를 루트가 아니라 페이지마다
 * 직접 지정하는 이유는 app/layout.tsx의 metadata 주석 참고. */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: { ko: "/", en: "/en" },
  },
};

/**
 * 랜딩 페이지 — jib-atlas-v2-handoff/DESIGN-HANDOFF-V2.md "1. 랜딩" 전체를
 * 화면 순서대로 구현한다: 부유형 필 내비 → Hero → 다섯 축 → 집 유형 4칸 →
 * 에디터 프리뷰 → 인용 → CTA → 푸터.
 */
export default function Home() {
  return (
    <main>
      <FloatingNav />
      <Hero />
      <FiveAxes />
      <HouseTypes />
      <EditorPreview />
      <Quote />
      <Cta />
      <Footer />
    </main>
  );
}

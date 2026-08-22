import { Cta } from "@/components/landing/Cta";
import { EditorPreview } from "@/components/landing/EditorPreview";
import { FiveAxes } from "@/components/landing/FiveAxes";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HouseTypes } from "@/components/landing/HouseTypes";
import { Quote } from "@/components/landing/Quote";

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

import { FiveAxes } from "@/components/landing/FiveAxes";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { Hero } from "@/components/landing/Hero";

/**
 * 랜딩 페이지 — jib-atlas-v2-handoff/DESIGN-HANDOFF-V2.md "1. 랜딩" 전체를
 * 화면 순서대로(부유형 필 내비 → Hero → 다섯 축 → 집 유형 4칸 → 에디터
 * 프리뷰 → 인용 → CTA → 푸터) 구현한다. 지금은 앞부분까지 채웠고, 나머지는
 * 이어지는 스텝에서 채운다.
 */
export default function Home() {
  return (
    <main>
      <FloatingNav />
      <Hero />
      <FiveAxes />
    </main>
  );
}

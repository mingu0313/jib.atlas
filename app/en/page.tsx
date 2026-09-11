import type { Metadata } from "next";
import { Cta } from "@/components/landing/Cta";
import { EditorPreview } from "@/components/landing/EditorPreview";
import { FiveAxes } from "@/components/landing/FiveAxes";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HouseTypes } from "@/components/landing/HouseTypes";
import { Quote } from "@/components/landing/Quote";

// title은 브랜드 접미사 없이 둔다 — 루트 title.template("%s — jib.atlas")이
// 자동으로 붙여준다(중복 방지, app/atlas/page.tsx와 같은 이유).
export const metadata: Metadata = {
  title: "Which house should you live in?",
  description:
    "Take a lifestyle quiz to find the house structure that fits you, then furnish it yourself in a 3D interior studio.",
  alternates: {
    canonical: "/en",
    languages: { ko: "/", en: "/en" },
  },
  openGraph: {
    title: "jib.atlas — Which house should you live in?",
    description:
      "Take a lifestyle quiz to find the house structure that fits you, then furnish it yourself in a 3D interior studio.",
    locale: "en_US",
  },
  // 루트 레이아웃(app/layout.tsx)의 twitter 기본값이 한국어라, openGraph처럼
  // 여기서도 직접 덮어써야 트위터 카드 미리보기에 한국어가 안 섞인다 —
  // title/description은 openGraph와 같은 문구를 재사용.
  twitter: {
    card: "summary_large_image",
    title: "jib.atlas — Which house should you live in?",
    description:
      "Take a lifestyle quiz to find the house structure that fits you, then furnish it yourself in a 3D interior studio.",
  },
};

/**
 * 영문 랜딩(`/en`) — STEP 11에서 처음 만들 땐 한국어 랜딩(app/page.tsx)의
 * 5개 스크롤텔링 섹션(FiveAxes/HouseTypes/Quote/EditorPreview/Cta)이
 * 프로즈가 워낙 길어서 옮기지 않고, 퀴즈로 바로 이어지는 짧은 히어로 +
 * 3단계 설명으로 축약했었다 — 그 결과 "How it works" 섹션 밑으로 아무것도
 * 없다는 피드백을 받았다.
 *
 * STEP 18부터 한국어판과 완전히 같은 섹션 구성으로 바꿨다: 각 섹션 컴포넌트
 * (Hero/FiveAxes/HouseTypes/EditorPreview/Quote/Cta/Footer)에 locale prop을
 * 추가해서(기본값 "ko" — 한국어 랜딩은 그대로 동작) 로직·레이아웃·사진은
 * 전부 공유하고 텍스트만 갈아끼우는 방식을 썼다 — FloatingNav가 이미
 * 쓰던 것과 같은 패턴(components/landing/FloatingNav.tsx). 진단(/en/test) →
 * 결과(/en/result)로 이어지는 핵심 루프는 STEP 11부터 전부 완역돼 있다.
 */
export default function EnglishHome() {
  return (
    <main>
      <FloatingNav locale="en" />
      <Hero locale="en" />
      <FiveAxes locale="en" />
      <HouseTypes locale="en" />
      <EditorPreview locale="en" />
      <Quote locale="en" />
      <Cta locale="en" />
      <Footer locale="en" />
    </main>
  );
}

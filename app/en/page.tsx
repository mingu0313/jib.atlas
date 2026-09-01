import Image from "next/image";
import Link from "next/link";
import houseTemplatesEnData from "@/data/house-templates.en.json";
import { HeroEditorWindow } from "@/components/landing/HeroEditorWindow";
import { FloatingNav } from "@/components/landing/FloatingNav";
import { Footer } from "@/components/landing/Footer";

const QUESTION_COUNT = 23;
const TEMPLATE_COUNT = houseTemplatesEnData.length;

const STEPS = [
  { n: "01", text: "Answer 23 quick questions about how you actually want to live." },
  { n: "02", text: `Get matched to one of ${houseTemplatesEnData.length} house structures, scored across 5 axes.` },
  { n: "03", text: "Decorate the matched room yourself in a 2D isometric editor." },
];

export const metadata = {
  title: "jib.atlas — Which house should you live in?",
  description:
    "Take a lifestyle quiz to find the house structure that fits you, then furnish it yourself in a 2D editor.",
};

/**
 * 영문 랜딩(`/en`) — STEP 11. 한국어 랜딩(app/page.tsx)의 5개 스크롤텔링
 * 섹션(FiveAxes/HouseTypes/Quote/EditorPreview/Cta)은 프로즈가 워낙 길어서
 * 이번 STEP엔 그대로 옮기지 않았다 — 대신 퀴즈로 바로 이어지는 짧은 히어로 +
 * 3단계 설명으로 축약했다. 전체 스크롤텔링 번역은 STEP 12 이후 과제.
 * 진단(/en/test) → 결과(/en/result)로 이어지는 핵심 루프는 전부 완역돼
 * 있다(공유 카드 기능은 제거됨).
 */
export default function EnglishHome() {
  return (
    <main>
      <FloatingNav locale="en" />

      <section className="px-6 pt-[150px] sm:px-10 sm:pt-[210px]">
        <span className="label-mono block text-[10px] text-olive-mid">House Series 2026</span>
        <h1 className="font-display mt-6 max-w-[1100px] text-[clamp(36px,7.5vw,110px)] leading-[0.98] tracking-[-0.02em] text-fg text-balance">
          Which house should you live in
          <span className="text-olive-mid">?</span>
        </h1>
        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[420px] text-[15px] leading-[1.75] text-muted">
            Five axes read your taste, and guide you to one of {TEMPLATE_COUNT} house structures.
            Then it&rsquo;s time to make it your own.
          </p>
          <span className="label-mono text-[10px] text-muted">
            {QUESTION_COUNT} questions · 5 min · No sign-up needed
          </span>
        </div>

        <div className="relative mt-[60px] h-[60vh] min-h-[360px] overflow-hidden rounded-[28px] bg-photo-bg sm:mt-[88px] sm:min-h-[420px]">
          <Image
            src="/photos/hero-open.jpg"
            alt="A bright, open house interior"
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%]"
            style={{ background: "linear-gradient(to top, rgba(18,18,15,0.4), rgba(18,18,15,0))" }}
          />
          <HeroEditorWindow />
        </div>
      </section>

      <section className="px-6 py-[110px] sm:px-10">
        <span className="label-mono block text-[10px] text-olive-mid">How it works</span>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="flex flex-col gap-3 border-t border-hair pt-6">
              <span className="label-mono text-[11px] text-faint">{step.n}</span>
              <p className="text-[15px] leading-[1.7] text-fg">{step.text}</p>
            </div>
          ))}
        </div>
        <Link
          href="/en/test"
          className="mt-12 inline-block rounded-full bg-olive px-9 py-[18px] text-[14px] font-semibold text-cream transition hover:bg-fg"
        >
          Start the quiz ↗
        </Link>
      </section>

      <Footer />
    </main>
  );
}

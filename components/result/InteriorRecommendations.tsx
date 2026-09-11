import Image from "next/image";
import {
  badgeLabelFor,
  generateInteriorExplanation,
  matchInteriorStyles,
} from "@/lib/interiorMatching";
import { badgeLabelForEn, generateInteriorExplanationEn, interiorStylesEn } from "@/lib/interiorMatchingEn";
import type { AxisScores } from "@/lib/types";

/**
 * 결과 페이지 "AI 인테리어 추천" — 2x2 비대칭 그리드 카드 4개(STEP 8).
 * 카드별 radius/뱃지 배경을 일부러 맞추지 않는다(jib-atlas 기존 원칙,
 * app/result/page.tsx의 rounded-[22px]/[28px]/[36px]/[18px] 패턴과 동일).
 *
 * lang(기본 "ko") — /en/result/interiors(신규)에서 lang="en"으로 호출하면
 * lib/interiorMatchingEn.ts의 영문 데이터·함수로 갈아끼운다. matchInteriorStyles
 * 자체는 profiles 파라미터를 받는 언어 무관 순수 함수라 두 언어가 같은 함수를
 * 공유하고(lib/matching.ts의 templates 파라미터와 같은 패턴), badge/설명
 * 문장 조립만 lib/persona.ts처럼 *En 짝을 따로 둔다.
 */
const CARD_STYLE = [
  { radius: "rounded-[30px]", badgeBg: "bg-olive", badgeText: "text-cream" },
  { radius: "rounded-[18px]", badgeBg: "bg-sage", badgeText: "text-sage-ink" },
  { radius: "rounded-[24px]", badgeBg: "bg-panel", badgeText: "text-fg" },
  { radius: "rounded-[36px]", badgeBg: "bg-olive-mid", badgeText: "text-cream" },
];

export function InteriorRecommendations({ axisScores, lang = "ko" }: { axisScores: AxisScores; lang?: "ko" | "en" }) {
  const matches = lang === "en" ? matchInteriorStyles(axisScores, 4, interiorStylesEn) : matchInteriorStyles(axisScores);

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-14">
      {matches.map((match, i) => {
        const style = CARD_STYLE[i % CARD_STYLE.length];
        const numLabel = String(i + 1).padStart(2, "0");
        const badge = lang === "en" ? badgeLabelForEn(axisScores, match, i) : badgeLabelFor(axisScores, match, i);
        const explanation =
          lang === "en" ? generateInteriorExplanationEn(axisScores, match, i) : generateInteriorExplanation(axisScores, match, i);

        return (
          <div
            key={match.profile.id}
            className={`flex flex-col overflow-hidden bg-panel ${style.radius} ${i % 3 === 1 ? "sm:mt-10" : ""}`}
          >
            <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
              <Image
                src={match.profile.photoPath}
                alt={match.profile.name}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
                style={{ filter: "grayscale(0.12) contrast(0.97)" }}
              />
              {/* 사진이 밝아도 넘버링/뱃지가 항상 읽히도록 상단에만 살짝 스크림. */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-24"
                style={{ background: "linear-gradient(to bottom, rgba(18,18,15,0.38), rgba(18,18,15,0))" }}
              />
              <span className="font-display absolute top-4 left-5 text-[46px] leading-none text-cream">
                {numLabel}
              </span>
              <span
                className={`label-mono absolute top-5 right-5 rounded-full px-4 py-2 text-[9px] ${style.badgeBg} ${style.badgeText}`}
              >
                {badge}
              </span>
            </div>
            <div className="flex flex-col gap-2.5 px-6 py-7 sm:px-7">
              <span className="font-kr text-[20px] text-fg">{match.profile.name}</span>
              <p className="text-[13.5px] leading-[1.8] text-muted">
                {match.profile.styleBlurb} {explanation}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import Link from "next/link";

/** DESIGN-HANDOFF-V2.md "푸터". locale(기본 "ko") — /en 랜딩 다국어 확장
 * (STEP 18). 로고 링크만 locale에 맞는 홈으로 — 나머지(브랜드 문구)는
 * 원래도 영문/도메인이라 손댈 게 없다. */
export function Footer({ locale = "ko" }: { locale?: "ko" | "en" }) {
  return (
    <footer className="flex items-center justify-between gap-6 border-t border-hair px-6 py-[34px] sm:px-10">
      <Link href={locale === "en" ? "/en" : "/"} className="font-display text-base text-fg">
        jib<span className="text-olive-mid">.</span>atlas
      </Link>
      <span className="label-mono text-[9px] text-muted">jib-atlas.com — House Series 2026</span>
    </footer>
  );
}

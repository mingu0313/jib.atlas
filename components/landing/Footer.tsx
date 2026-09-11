import Link from "next/link";

/** DESIGN-HANDOFF-V2.md "푸터". locale(기본 "ko") — /en 랜딩 다국어 확장
 * (STEP 18). 로고 링크만 locale에 맞는 홈으로 — 나머지(브랜드 문구)는
 * 원래도 영문/도메인이라 손댈 게 없다.
 *
 * 개인정보처리방침 링크(STEP 19) — 인스타그램 공유 전 검토에서 나온
 * "처리방침 페이지 자체가 없다" 이슈 대응. 페이지가 생겼으니 발견 가능한
 * 곳(푸터)에 링크를 둔다 — Google OAuth 동의 화면에도 이 URL을 걸어둘 것. */
export function Footer({ locale = "ko" }: { locale?: "ko" | "en" }) {
  const isEn = locale === "en";
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-hair px-6 py-[34px] sm:px-10">
      <Link href={isEn ? "/en" : "/"} className="font-display text-base text-fg">
        jib<span className="text-olive-mid">.</span>atlas
      </Link>
      <div className="flex items-center gap-4">
        <Link href={isEn ? "/en/privacy" : "/privacy"} className="text-[12px] text-muted transition hover:text-fg">
          {isEn ? "Privacy Policy" : "개인정보처리방침"}
        </Link>
        <span className="label-mono text-[9px] text-muted">jib-atlas.com — House Series 2026</span>
      </div>
    </footer>
  );
}

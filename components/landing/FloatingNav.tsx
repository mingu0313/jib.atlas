"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { useMotion } from "@/components/motion/MotionProvider";
import { useUser } from "@/lib/supabase/useUser";

type Locale = "ko" | "en";

const TEXT: Record<Locale, Record<string, string>> = {
  ko: {
    diagnosis: "진단",
    houseTypes: "집 유형",
    editor: "룸 에디터",
    atlas: "집 지도",
    share: "공유 카드",
    collab: "협업 문의",
    login: "로그인",
    logout: "로그아웃",
    start: "진단 시작 ↗",
    motionOn: "모션 켜기",
    motionOff: "모션 끄기",
    otherLocaleLabel: "EN",
    collabSubject: "[jib.atlas] 협업 문의",
  },
  en: {
    diagnosis: "Quiz",
    houseTypes: "House Types",
    editor: "Room Editor",
    atlas: "House Atlas",
    share: "Share Card",
    collab: "Contact",
    login: "Log in",
    logout: "Log out",
    start: "Start Quiz ↗",
    motionOn: "Motion on",
    motionOff: "Motion off",
    otherLocaleLabel: "한국어",
    collabSubject: "[jib.atlas] Collaboration Inquiry",
  },
};

/**
 * 부유형 필 내비 — DESIGN-HANDOFF-V2.md "1. 랜딩 > 부유형 필 내비".
 * fixed, 상단 28px 40px, 3분할(좌 로고 / 중앙 필 / 우 CTA).
 * 컨테이너는 pointer-events:none이고 자식(링크·버튼)만 auto라 내비 사이
 * 빈 공간을 클릭해도 아래 히어로가 그대로 반응한다.
 *
 * 모션 스위치("모션 전체를 끄는 스위치가 있어야 한다")는 CTA 옆에 작은
 * 점 버튼으로 둔다 — 문서가 위치를 정하지 않아서 항상 눈에 띄는 이
 * 자리를 골랐다.
 *
 * 로그인/협업 문의는 "진단 시작 옆"이라는 요청대로 우측 CTA 클러스터에
 * 둔다 — 모션 스위치와 같은 이유로 sm 이상에서만 텍스트 링크로 보이고,
 * 로그인 상태는 useUser로 구독해 로그인/로그아웃을 스위칭한다.
 *
 * 로고와 우측 텍스트 링크 클러스터에도 중앙 필과 같은 블러 배경을 준다 —
 * 원래 이 둘은 배경이 완전 투명해서, 랜딩을 스크롤하면 그 아래로 지나가는
 * 제목·버튼 글자가 로고/링크 글자와 그대로 겹쳐 보이는 문제가 있었다
 * (예: "House Types" 섹션 영문 타이틀이 로고를 뚫고 지나감). fixed nav
 * 아래로 뭐가 지나가든 항상 읽히도록 각 클러스터를 옅은 필로 감쌌다.
 *
 * locale — STEP 11(다국어). 이 컴포넌트는 지금 한국어 랜딩(`/`)과 영문
 * 랜딩(`/en`) 딱 두 군데에서만 쓰이기 때문에(다른 라우트는 각자 자기
 * 헤더를 그림), 언어 전환 링크는 그냥 "/" ↔ "/en"만 오가면 충분하다 —
 * 깊은 경로별 매핑 테이블은 필요 없다. 에디터·집 지도는 아직 영문화
 * 전이라(STEP 12 이후) en 모드에서도 그대로 한국어 페이지로 링크한다.
 */
export function FloatingNav({ locale = "ko" }: { locale?: Locale }) {
  const { reduced, toggle } = useMotion();
  const { user, loading: userLoading } = useUser();
  const pathname = usePathname();
  const t = TEXT[locale];
  const prefix = locale === "en" ? "/en" : "";
  const otherLocaleHref = locale === "ko" ? "/en" : "/";
  const collabMailto = `mailto:hyo5418@gmail.com?subject=${encodeURIComponent(t.collabSubject)}`;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-6 py-[22px] sm:px-10 sm:py-[28px]">
      <Link
        href={locale === "en" ? "/en" : "/"}
        className="pointer-events-auto rounded-full px-4 py-2 font-display text-[22px] tracking-[-0.01em] text-fg backdrop-blur-[16px] sm:text-[26px]"
        style={{ background: "rgba(247,246,242,0.74)" }}
      >
        jib<span className="text-olive-mid">.</span>atlas
      </Link>

      <nav
        className="pill-mask pointer-events-auto hidden items-center gap-8 rounded-full px-[34px] py-[15px] backdrop-blur-[16px] lg:flex"
        style={{ background: "rgba(247,246,242,0.74)" }}
      >
        <Link href={`${prefix}/test`} className="text-sm font-semibold text-fg transition hover:text-olive-mid">
          {t.diagnosis}
        </Link>
        {locale === "ko" && (
          <Link href="/#house-types" className="text-sm font-semibold text-fg transition hover:text-olive-mid">
            {t.houseTypes}
          </Link>
        )}
        <Link href="/editor" className="text-sm font-semibold text-fg transition hover:text-olive-mid">
          {t.editor}
        </Link>
        <Link href="/atlas" className="text-sm font-semibold text-fg transition hover:text-olive-mid">
          {t.atlas}
        </Link>
        <Link href={`${prefix}/share`} className="text-sm font-semibold text-fg transition hover:text-olive-mid">
          {t.share}
        </Link>
      </nav>

      <div className="pointer-events-auto flex items-center gap-3">
        <Link
          href={otherLocaleHref}
          className="hidden h-9 shrink-0 items-center rounded-full border border-hair px-3.5 text-[11px] font-semibold text-muted backdrop-blur-[16px] transition hover:border-olive hover:text-olive sm:flex"
          style={{ background: "rgba(247,246,242,0.74)" }}
        >
          {t.otherLocaleLabel}
        </Link>

        <button
          type="button"
          onClick={toggle}
          aria-pressed={reduced}
          title={reduced ? t.motionOn : t.motionOff}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hair text-[10px] text-muted backdrop-blur-[16px] transition hover:border-olive hover:text-olive sm:flex"
          style={{ background: "rgba(247,246,242,0.74)" }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: reduced ? "var(--color-dim)" : "var(--color-olive-mid)" }}
          />
        </button>

        <div
          className="hidden items-center gap-5 rounded-full px-5 py-2.5 backdrop-blur-[16px] sm:flex"
          style={{ background: "rgba(247,246,242,0.74)" }}
        >
          <a
            href={collabMailto}
            className="text-sm font-semibold text-fg transition hover:text-olive-mid"
          >
            {t.collab}
          </a>
          {!userLoading &&
            (user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm font-semibold text-fg transition hover:text-olive-mid"
                >
                  {t.logout}
                </button>
              </form>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="text-sm font-semibold text-fg transition hover:text-olive-mid"
              >
                {t.login}
              </Link>
            ))}
        </div>

        <Link
          href={`${prefix}/test`}
          className="rounded-full bg-olive px-6 py-3 text-[13px] font-semibold text-cream transition hover:bg-fg sm:px-[26px]"
        >
          {t.start}
        </Link>
      </div>
    </div>
  );
}

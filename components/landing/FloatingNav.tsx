"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { useMotion } from "@/components/motion/MotionProvider";
import { useUser } from "@/lib/supabase/useUser";

const COLLAB_MAILTO = `mailto:hyo5418@gmail.com?subject=${encodeURIComponent("[jib.atlas] 협업 문의")}`;

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
 */
export function FloatingNav() {
  const { reduced, toggle } = useMotion();
  const { user, loading: userLoading } = useUser();
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-6 py-[22px] sm:px-10 sm:py-[28px]">
      <Link
        href="/"
        className="pointer-events-auto font-display text-[22px] tracking-[-0.01em] text-fg sm:text-[26px]"
      >
        jib<span className="text-olive-mid">.</span>atlas
      </Link>

      <nav
        className="pill-mask pointer-events-auto hidden items-center gap-8 rounded-full px-[34px] py-[15px] backdrop-blur-[16px] lg:flex"
        style={{ background: "rgba(247,246,242,0.74)" }}
      >
        <Link href="/test" className="text-sm font-semibold text-fg transition hover:text-olive-mid">
          진단
        </Link>
        <Link href="/#house-types" className="text-sm font-semibold text-fg transition hover:text-olive-mid">
          집 유형
        </Link>
        <Link href="/editor" className="text-sm font-semibold text-fg transition hover:text-olive-mid">
          룸 에디터
        </Link>
        <Link href="/atlas" className="text-sm font-semibold text-fg transition hover:text-olive-mid">
          집 지도
        </Link>
        <Link href="/share" className="text-sm font-semibold text-fg transition hover:text-olive-mid">
          공유 카드
        </Link>
      </nav>

      <div className="pointer-events-auto flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={reduced}
          title={reduced ? "모션 켜기" : "모션 끄기"}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hair text-[10px] text-muted transition hover:border-olive hover:text-olive sm:flex"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: reduced ? "var(--color-dim)" : "var(--color-olive-mid)" }}
          />
        </button>

        <div className="hidden items-center gap-5 sm:flex">
          <a
            href={COLLAB_MAILTO}
            className="text-sm font-semibold text-fg transition hover:text-olive-mid"
          >
            협업 문의
          </a>
          {!userLoading &&
            (user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm font-semibold text-fg transition hover:text-olive-mid"
                >
                  로그아웃
                </button>
              </form>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="text-sm font-semibold text-fg transition hover:text-olive-mid"
              >
                로그인
              </Link>
            ))}
        </div>

        <Link
          href="/test"
          className="rounded-full bg-olive px-6 py-3 text-[13px] font-semibold text-cream transition hover:bg-fg sm:px-[26px]"
        >
          진단 시작 ↗
        </Link>
      </div>
    </div>
  );
}

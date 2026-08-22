"use client";

import Link from "next/link";
import { useMotion } from "@/components/motion/MotionProvider";

/**
 * 부유형 필 내비 — DESIGN-HANDOFF-V2.md "1. 랜딩 > 부유형 필 내비".
 * fixed, 상단 28px 40px, 3분할(좌 로고 / 중앙 필 / 우 CTA).
 * 컨테이너는 pointer-events:none이고 자식(링크·버튼)만 auto라 내비 사이
 * 빈 공간을 클릭해도 아래 히어로가 그대로 반응한다.
 *
 * 모션 스위치("모션 전체를 끄는 스위치가 있어야 한다")는 CTA 옆에 작은
 * 점 버튼으로 둔다 — 문서가 위치를 정하지 않아서 항상 눈에 띄는 이
 * 자리를 골랐다.
 */
export function FloatingNav() {
  const { reduced, toggle } = useMotion();

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

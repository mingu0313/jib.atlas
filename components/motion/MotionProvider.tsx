"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * jib-atlas-v2-handoff/DESIGN-HANDOFF-V2.md "Motion" 섹션의 패럴랙스(1)와
 * 스크롤 리빌(2)을 사이트 전역에서 담당하는 런타임. 계산식·옵션은 문서
 * 그대로:
 * - 패럴랙스: `off = (vh/2 - (rect.top + rect.height/2)) * coeff`,
 *   `data-px-extra`가 있으면 transform 뒤에 이어붙인다(둘 다 한 번의
 *   style.transform 대입으로 — 따로 겹쳐 쓰면 패럴랙스가 덮어쓴다).
 * - 리빌: IntersectionObserver(rootMargin "0px 0px -12% 0px", threshold
 *   0.08), 진입 시 1회만(unobserve).
 *
 * "모션 전체를 끄는 스위치가 있어야 한다(prefers-reduced-motion도 함께)."
 * — useMotion()의 reduced가 그 스위치다. 꺼지면 패럴랙스는 멈추고(엘리먼트는
 * transform 없는 정지 상태), 리빌 엘리먼트는 즉시 보이는 상태로 전환한다.
 * 다섯 축 스크롤텔링의 활성 축 추적(components/landing/FiveAxes.tsx)은 이
 * 스위치와 무관하게 별도 rAF 루프로 항상 동작한다 — 문서가 명시적으로
 * "끌 때도 스크롤텔링 축 추적은 계속 작동해야 한다"고 요구해서, 여기 게이팅
 * 로직에 얽어두지 않았다.
 *
 * RootLayout(서버 컴포넌트)에 한 번만 마운트되고 라우트가 바뀌어도 언마운트
 * 되지 않으므로, usePathname()을 effect 의존성에 넣어 페이지가 바뀔 때마다
 * 새 DOM의 [data-px]/[data-reveal] 엘리먼트를 다시 스캔한다.
 */

interface MotionCtx {
  reduced: boolean;
  toggle: () => void;
}

const Ctx = createContext<MotionCtx>({ reduced: false, toggle: () => {} });

export function useMotion() {
  return useContext(Ctx);
}

const STORAGE_KEY = "jib-atlas-motion-off";

/** 서버 렌더에는 window/localStorage가 없어 항상 false(모션 켜짐)로 시작한다 —
 * 클라이언트 마운트 후 아래 두 useState 지연 초기화가 실제 값으로 맞춘다. */
function readSystemReduced(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function readUserOff(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // 프라이빗 모드 등으로 localStorage를 못 쓰면 기본값(켜짐)으로 둔다.
    return false;
  }
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [userOff, setUserOff] = useState(readUserOff);
  const [systemReduced, setSystemReduced] = useState(readSystemReduced);
  const pathname = usePathname();

  // 초기값은 위 지연 초기화가 담당하고, 이 effect는 이후 변화를 구독만 한다
  // (effect 안에서 곧장 setState를 호출하지 않도록 — 렌더 캐스케이드 방지).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setSystemReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const reduced = userOff || systemReduced;

  const toggle = useCallback(() => {
    setUserOff((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // 저장 실패는 무시 — 이번 세션 동안만 토글이 유지된다.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.body.dataset.motion = reduced ? "off" : "on";
  }, [reduced]);

  // 패럴랙스
  useEffect(() => {
    if (reduced) {
      document.querySelectorAll<HTMLElement>("[data-px]").forEach((el) => {
        el.style.transform = "";
      });
      return;
    }
    let raf = 0;
    function apply() {
      raf = 0;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-px]").forEach((el) => {
        const coeff = parseFloat(el.dataset.px ?? "0");
        const rect = el.getBoundingClientRect();
        const off = (vh / 2 - (rect.top + rect.height / 2)) * coeff;
        const extra = el.dataset.pxExtra ? ` ${el.dataset.pxExtra}` : "";
        el.style.transform = `translate3d(0,${off}px,0)${extra}`;
      });
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(apply);
    }
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, pathname]);

  // 스크롤 리빌
  useEffect(() => {
    if (reduced) {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const targets = document.querySelectorAll<HTMLElement>(
      "[data-reveal]:not(.is-visible)",
    );
    if (targets.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced, pathname]);

  return <Ctx.Provider value={{ reduced, toggle }}>{children}</Ctx.Provider>;
}

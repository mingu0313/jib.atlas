"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";

/**
 * DESIGN-HANDOFF-V2.md "1. 랜딩 > Hero > #히어로 자동 순환".
 * 6장을 전부 겹쳐 놓고 opacity만 전환한다(조건부 렌더링 금지 — 그러면
 * 크로스페이드 없이 사진이 바뀌는 순간 뚝 끊긴다).
 *
 * 간격(4s)과 페이드(1.1s)는 의도적으로 다르다 — 같게 두면 다음 타이머가
 * 이전 페이드를 중간에 끊어서 전환이 불규칙해 보인다(문서 경고 그대로).
 *
 * 마운트 시 6장을 전부 프리로드한다. 안 하면 아직 안 받아진 사진 차례에서
 * 크로스페이드 없이 툭 나타난다 — "어느 챕터만 유독 뚝뚝 끊긴다"처럼 보이는
 * 원인이 이거다.
 *
 * 자동 전환은 useMotion().reduced(사용자 토글 + prefers-reduced-motion)를
 * 그대로 따른다 — 꺼져 있으면 멈추지만, 점 인디케이터로 수동 이동은 항상 된다.
 */

const HERO_SLIDES = [
  {
    src: "/photos/hero-open.jpg",
    pos: "center 55%",
    alt: "열린 마당이 있는 집",
    caption: "02 — open horizon · 열린 수평선",
  },
  {
    src: "/photos/type-serene.jpg",
    pos: "center 48%",
    alt: "고요한 은신처 유형의 집",
    caption: "01 — serene nest · 고요한 은신처",
  },
  {
    src: "/photos/axis-open.jpg",
    pos: "center 52%",
    alt: "개방성 축을 보여주는 사진",
    caption: "개방성 — 벽을 줄이고 시야를 늘린다",
  },
  {
    src: "/photos/type-precision.jpg",
    pos: "center 50%",
    alt: "정밀한 공간 유형의 집",
    caption: "03 — precision loft · 정밀한 공간",
  },
  {
    src: "/photos/axis-nature.jpg",
    pos: "center 54%",
    alt: "자연친화도 축을 보여주는 사진",
    caption: "자연친화도 — 창과 초록의 몫",
  },
  {
    src: "/photos/type-social.jpg",
    pos: "center 52%",
    alt: "사교적 중정 유형의 집",
    caption: "04 — social atrium · 사교적 중정",
  },
] as const;

const INTERVAL_MS = 4000;
const FADE_MS = 1100;

export function HeroPhotoStage() {
  const { reduced } = useMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    HERO_SLIDES.forEach((slide) => {
      const img = new window.Image();
      img.src = slide.src;
    });
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % HERO_SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div
      data-px="0.07"
      className="absolute inset-x-0 top-0 bottom-[-70px] overflow-hidden rounded-[34px] shadow-[0_50px_110px_-56px_rgba(18,18,15,0.34)] sm:bottom-[-130px]"
    >
      <div
        data-px="-0.05"
        className="absolute inset-x-0 bg-photo-bg"
        style={{ top: "-9%", bottom: "-9%" }}
      >
        {HERO_SLIDES.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
            style={{
              opacity: i === active ? 1 : 0,
              objectPosition: slide.pos,
              transition: `opacity ${FADE_MS}ms ease-in-out`,
            }}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[45%]"
        style={{
          background: "linear-gradient(to bottom, rgba(14,15,12,0.5), rgba(14,15,12,0))",
        }}
      />
      <span className="label-mono absolute bottom-7 left-7 text-[9px] text-cream/85 sm:bottom-9 sm:left-9">
        {HERO_SLIDES[active].caption}
      </span>
      <div className="absolute bottom-[18px] left-7 flex items-center gap-1.5 sm:bottom-[22px] sm:left-9">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`${i + 1}번째 사진으로 이동`}
            onClick={() => setActive(i)}
            className="h-[3px] rounded-full transition-all duration-500"
            style={{
              width: i === active ? 22 : 6,
              background: i === active ? "rgba(247,246,242,0.92)" : "rgba(247,246,242,0.32)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

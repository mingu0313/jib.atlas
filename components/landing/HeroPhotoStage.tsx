"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";

/**
 * DESIGN-HANDOFF-V2.md "1. 랜딩 > Hero > #히어로 자동 순환".
 * N장을 전부 겹쳐 놓고 opacity만 전환한다(조건부 렌더링 금지 — 그러면
 * 크로스페이드 없이 사진이 바뀌는 순간 뚝 끊긴다).
 *
 * 간격(4s)과 페이드(1.1s)는 의도적으로 다르다 — 같게 두면 다음 타이머가
 * 이전 페이드를 중간에 끊어서 전환이 불규칙해 보인다(문서 경고 그대로).
 *
 * 마운트 시 전부 프리로드한다. 안 하면 아직 안 받아진 사진 차례에서
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
    caption: "수평선 — 안과 밖이 나뉘지 않는 하루",
  },
  {
    src: "/photos/hero-solitude.jpg",
    pos: "center 60%",
    alt: "거대한 곡선 천장 아래 벤치에 홀로 앉은 사람",
    caption: "고요 — 문 하나로 완성되는 혼자만의 시간",
  },
  {
    src: "/photos/hero-openview.jpg",
    pos: "center 62%",
    alt: "유리 슬라이딩 도어 하나로만 나뉜 침실과 도심 야경",
    caption: "개방 — 벽이 없어도 되는 이유",
  },
  {
    src: "/photos/type-precision.jpg",
    pos: "center 50%",
    alt: "정밀한 공간 유형의 집",
    caption: "여백 — 꼭 필요한 것만 남은 방",
  },
  {
    src: "/photos/axis-nature.jpg",
    pos: "center 54%",
    alt: "자연친화도 축을 보여주는 사진",
    caption: "초록 — 계단 끝에서 만나는 정원",
  },
  {
    src: "/photos/hero-gather.jpg",
    pos: "center 62%",
    alt: "화분과 나무 사이, 손님을 기다리는 빈 테이블과 의자",
    caption: "환대 — 누군가 곧 채울 빈자리",
  },
  {
    src: "/photos/hero-courtyard.jpg",
    pos: "center 50%",
    alt: "돌과 화단으로 채운 중정을 위에서 내려다본 사진",
    caption: "안뜰 — 쉼을 닮은 마당",
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

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AXES, AXIS_LABELS, type Axis } from "@/lib/types";

/**
 * DESIGN-HANDOFF-V2.md "1. 랜딩 > 다섯 축" + "Motion > 3. 스크롤텔링".
 *
 * 활성 축 판정은 문서가 명시한 대로 IntersectionObserver가 아니라
 * **매 프레임 계산**이다: 뷰포트 중앙선(vh/2)을 포함하는 스텝을 찾고,
 * 없으면(스텝 사이 여백을 지나는 순간) 중앙선에서 가장 가까운 스텝으로
 * 대신한다. 스크롤마다 rAF로 스로틀하고, IO는 빠른 스크롤에서 어긋난다는
 * 이유로 의도적으로 안 쓴다.
 */

const AXIS_PHOTO: Record<Axis, string> = {
  sociability: "/photos/axis-social.jpg",
  minimalism: "/photos/axis-minimal.jpg",
  activity: "/photos/axis-activity.jpg",
  openness: "/photos/axis-open.jpg",
  nature: "/photos/axis-nature.jpg",
};

const AXIS_KEY: Record<Axis, string> = {
  sociability: "Axis 01 · Sociability",
  minimalism: "Axis 02 · Minimalism",
  activity: "Axis 03 · Activity",
  openness: "Axis 04 · Openness",
  nature: "Axis 05 · Nature",
};

const STEPS: { axis: Axis; title: string; desc: string }[] = [
  {
    axis: "sociability",
    title: "누구와, 얼마나 자주 머무는가.",
    desc: "사람들과 어울리는 시간을 즐기는지, 혼자만의 시간을 소중히 여기는지 — 손님을 위한 자리와 공용 공간의 크기가 여기서 갈립니다.",
  },
  {
    axis: "minimalism",
    title: "무엇을 남기고, 무엇을 비울 것인가.",
    desc: "꼭 필요한 것만 남긴 정돈된 공간을 원하는지, 좋아하는 물건들로 채운 공간을 원하는지를 봅니다.",
  },
  {
    axis: "activity",
    title: "집에서도 몸을 움직이고 싶은가.",
    desc: "홈짐이나 작업 공간처럼 활동적인 자리가 필요한지, 편안한 휴식이 먼저인지를 가늠합니다.",
  },
  {
    axis: "openness",
    title: "트인 구조인가, 나뉜 구조인가.",
    desc: "벽 없이 길게 이어지는 개방형 구조를 좋아하는지, 방으로 나뉜 아늑한 구조를 좋아하는지를 봅니다.",
  },
  {
    axis: "nature",
    title: "채광과 초록이 얼마나 필요한가.",
    desc: "큰 창, 식물, 작은 마당 같은 자연 요소가 일상에 얼마나 중요한지를 확인합니다.",
  },
];

/** 실제 응답이 아닌 예시값 — 문서에 적힌 [70,62,44,58,86] 그대로
 * (사교성/미니멀/활동성/개방성/자연 순서, lib/types.ts의 AXES 순서와 같다). */
const SAMPLE_SCORES: Record<Axis, number> = {
  sociability: 70,
  minimalism: 62,
  activity: 44,
  openness: 58,
  nature: 86,
};

const R = 150;
const CX = 170;
const CY = 170;

function polar(i: number, value: number): [number, number] {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const r = (R * value) / 100;
  return [CX + Math.cos(angle) * r, CY + Math.sin(angle) * r];
}

function ringPoints(value: number): string {
  return AXES.map((_, i) => polar(i, value).map((n) => n.toFixed(1)).join(",")).join(" ");
}

const SHAPE_POINTS = AXES.map((axis, i) => polar(i, SAMPLE_SCORES[axis]).map((n) => n.toFixed(1)).join(",")).join(
  " ",
);

export function FiveAxes() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      const centerY = window.innerHeight / 2;
      let containingIdx = -1;
      let nearestIdx = 0;
      let nearestDist = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= centerY && rect.bottom >= centerY) containingIdx = i;
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - centerY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      });
      const next = containingIdx !== -1 ? containingIdx : nearestIdx;
      setActive((prev) => (prev === next ? prev : next));
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const activeAxis = STEPS[active].axis;

  return (
    <section className="px-6 pt-[150px] pb-[100px] sm:px-10 sm:pt-[220px] sm:pb-[150px]">
      <header className="mb-16 flex flex-col gap-3 sm:mb-24" data-reveal>
        <span className="label-mono text-[10px] text-olive-mid">Five Axes</span>
        <h2 className="font-kr text-[clamp(32px,5vw,84px)] leading-[1.02] tracking-[-0.03em]">
          취향은 다섯 개의 축으로 읽힙니다<span className="heading-dot">.</span>
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[44fr_56fr] lg:gap-20">
        {/* 좌: 축 5개 */}
        <div>
          {STEPS.map((step, i) => {
            const isActive = i === active;
            return (
              <div
                key={step.axis}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="flex min-h-[74vh] flex-col justify-center gap-4"
              >
                <span
                  className={`label-mono text-[11px] transition-colors duration-500 ${
                    isActive ? "text-fg" : "text-dimmer"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className={`font-kr text-[clamp(28px,3.6vw,56px)] leading-[1.1] transition-colors duration-500 ${
                    isActive ? "text-fg" : "text-dimmer"
                  }`}
                >
                  {step.title}
                </h3>
                <p className="max-w-[420px] text-[15px] leading-[1.8] text-muted">{step.desc}</p>
                <span className="label-mono text-[9px] text-faint">{AXIS_KEY[step.axis]}</span>
              </div>
            );
          })}
        </div>

        {/* 우: sticky — 사진 크로스페이드 → AXIS PROFILE 패널 */}
        <div className="lg:sticky lg:top-0 lg:flex lg:min-h-screen lg:flex-col lg:justify-center">
          <div
            className="relative overflow-hidden rounded-[26px] bg-photo-bg"
            style={{ aspectRatio: "5 / 4", maxHeight: "46vh" }}
          >
            {STEPS.map((step, i) => (
              <Image
                key={step.axis}
                src={AXIS_PHOTO[step.axis]}
                alt={AXIS_LABELS[step.axis]}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-opacity duration-500"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ))}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%]"
              style={{ background: "linear-gradient(to top, rgba(14,15,12,0.72), rgba(14,15,12,0))" }}
            />
            <span className="label-mono absolute bottom-5 left-6 text-[10px] text-cream">
              {AXIS_LABELS[activeAxis]}
            </span>
          </div>

          <div className="mt-6 rounded-[26px] bg-panel p-7 sm:p-9">
            <span className="label-mono text-[9px] text-muted">Axis Profile</span>

            <div className="mt-4 flex justify-center">
              <svg viewBox="0 0 340 340" className="w-full max-w-[280px]">
                {[33, 66, 100].map((v) => (
                  <polygon key={v} points={ringPoints(v)} fill="none" stroke="var(--color-hair)" strokeWidth={1} />
                ))}
                {AXES.map((axis, i) => {
                  const [x, y] = polar(i, 100);
                  const isActive = axis === activeAxis;
                  return (
                    <line
                      key={axis}
                      x1={CX}
                      y1={CY}
                      x2={x}
                      y2={y}
                      stroke={isActive ? "var(--color-olive)" : "var(--color-hair)"}
                      strokeWidth={isActive ? 2 : 1}
                      style={{ transition: "stroke 0.5s, stroke-width 0.5s" }}
                    />
                  );
                })}
                <polygon points={SHAPE_POINTS} fill="rgba(65,82,31,0.13)" stroke="var(--color-olive)" strokeWidth={1.6} />
                {AXES.map((axis, i) => {
                  const [x, y] = polar(i, SAMPLE_SCORES[axis]);
                  const isActive = axis === activeAxis;
                  return (
                    <circle
                      key={axis}
                      cx={x}
                      cy={y}
                      r={isActive ? 5.7 : 3}
                      fill={isActive ? "var(--color-olive)" : "var(--color-dim)"}
                      style={{ transition: "r 0.5s, fill 0.5s" }}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="mt-6 flex flex-col">
              {AXES.map((axis) => {
                const isActive = axis === activeAxis;
                return (
                  <div key={axis} className="flex items-center gap-3 border-b border-hair py-3 last:border-b-0">
                    <span
                      className={`w-16 shrink-0 text-[12px] transition-colors duration-500 ${
                        isActive ? "text-fg" : "text-faint"
                      }`}
                    >
                      {AXIS_LABELS[axis]}
                    </span>
                    <span className="relative h-[3px] flex-1 bg-hair">
                      <span
                        className="absolute inset-y-0 left-0 transition-all duration-500"
                        style={{
                          width: `${SAMPLE_SCORES[axis]}%`,
                          background: isActive ? "var(--color-olive)" : "#c9cdb8",
                        }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

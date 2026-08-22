"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RADAR_CX, RADAR_CY, radarPoint, radarRing, radarShape } from "@/lib/radar";
import { AXES, AXIS_LABELS, type Axis } from "@/lib/types";

/**
 * DESIGN-HANDOFF-V2.md "1. 랜딩 > 다섯 축" + "Motion > 3. 스크롤텔링".
 * 카피(축 설명·영문 키)는 jib-atlas-v2-handoff/jib-atlas-v2-preview.html의
 * AXIS_STEPS를 그대로 옮겼다 — 마크다운 문서엔 이 문장들이 없고 프리뷰
 * 프로토타입에만 있는 정본 텍스트다.
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

const AXIS_EN: Record<Axis, string> = {
  sociability: "SOCIABILITY",
  minimalism: "MINIMALISM",
  activity: "ACTIVITY",
  openness: "OPENNESS",
  nature: "NATURE",
};

const AXIS_DESC: Record<Axis, string> = {
  sociability:
    "집이 사람을 부르는 곳인지, 사람에게서 물러나는 곳인지. 이 축이 다이닝의 크기와 게스트룸의 존재를 결정합니다.",
  minimalism:
    "물건을 남길 것인지 지울 것인지. 수납이 벽 안으로 들어갈지, 방 한가운데에 놓일지가 여기서 갈립니다.",
  activity: "집에서 몸을 쓰는지, 몸을 놓는지. 다목적 방과 홈짐, 작업실의 필요가 이 축에 달려 있습니다.",
  openness:
    "벽을 줄일 것인지 남길 것인지. 시야가 길어질수록 아늑함은 줄고, 짧아질수록 세계는 좁고 안전해집니다.",
  nature: "창과 초록의 몫. 채광이 인테리어의 기준선이 되는 사람과, 조명으로 충분한 사람이 나뉩니다.",
};

/** 실제 응답이 아닌 예시값 — 문서에 적힌 [70,62,44,58,86] 그대로
 * (사교성/미니멀/활동성/개방성/자연 순서, lib/types.ts의 AXES 순서와 같다). */
const SAMPLE_SCORES: Record<Axis, number> = {
  sociability: 70,
  minimalism: 62,
  activity: 44,
  openness: 58,
  nature: 86,
};

const CX = RADAR_CX;
const CY = RADAR_CY;
const SHAPE_POINTS = radarShape(SAMPLE_SCORES);

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

  const activeAxis = AXES[active];

  return (
    <section className="px-6 pt-[150px] pb-[100px] sm:px-10 sm:pt-[220px] sm:pb-[150px]">
      <header className="mb-16 flex flex-col gap-3 sm:mb-24" data-reveal>
        <span className="label-mono text-[10px] text-olive-mid">Five Axes</span>
        <h2 className="font-kr text-[clamp(32px,5vw,84px)] leading-[1.02] tracking-[-0.03em]">
          취향은 다섯 개의 축으로 읽힙니다<span className="heading-dot">.</span>
        </h2>
      </header>

      {/*
        모바일(<lg)에서는 grid-cols-1로 두 컬럼이 "각자의 행"으로 쪼개지면서
        sticky의 containing block이 사진/패널 자기 콘텐츠 높이(~60vh)로
        줄어들어버려 — 축 5개(74vh×5=370vh)를 스크롤하는 동안 붙어있지 못하고
        먼저 스크롤아웃돼 버렸다(버그 리포트: "스크롤 내리면 사진이 안 보여").
        고쳐서 모바일에서도 flex(세로 스택, 형제 컨테이너 공유)로 두고 사진/
        패널을 맨 위에 sticky로 둬, 축 텍스트가 그 아래로 흘러가게 한다.
        데스크톱에서만 grid 2컬럼으로 전환(그때는 grid stretch가 같은 효과를 준다).
      */}
      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[44fr_56fr] lg:items-start lg:gap-20">
        {/* 좌: 축 5개 — 데스크톱에서는 왼쪽, 모바일에서는 사진/패널 아래(order로 순서만 뒤집는다). */}
        <div className="order-2 lg:order-1">
          {AXES.map((axis, i) => {
            const isActive = i === active;
            return (
              <div
                key={axis}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="flex min-h-[74vh] flex-col justify-center gap-5"
              >
                <span
                  className={`label-mono text-[11px] transition-colors duration-500 ${
                    isActive ? "text-fg" : "text-dimmer"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className={`font-kr text-[clamp(30px,3.6vw,56px)] leading-[1.1] tracking-[-0.02em] transition-colors duration-500 ${
                    isActive ? "text-fg" : "text-dimmer"
                  }`}
                >
                  {AXIS_LABELS[axis]}
                </h3>
                <p className="max-w-[400px] text-[15px] leading-[1.85] text-muted">{AXIS_DESC[axis]}</p>
                <span className="label-mono text-[10px] text-dim">{AXIS_EN[axis]}</span>
              </div>
            );
          })}
        </div>

        {/* 우: sticky — 위에서 아래로 사진 → AXIS PROFILE 패널(레이더+막대).
            sticky·top-0는 모든 화면 크기에서 켜져 있어야 한다(위 주석 참고). */}
        <div className="sticky top-20 order-1 z-10 lg:top-0 lg:order-2 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:gap-6">
          <div
            className="relative aspect-[5/4] max-h-[26vh] overflow-hidden rounded-[26px] bg-photo-bg sm:max-h-[36vh] lg:max-h-[46vh]"
          >
            {AXES.map((axis, i) => (
              <Image
                key={axis}
                src={AXIS_PHOTO[axis]}
                alt={AXIS_LABELS[axis]}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-opacity duration-500"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ))}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%]"
              style={{ background: "linear-gradient(to top, rgba(18,18,15,0.46), rgba(18,18,15,0))" }}
            />
            <span className="font-kr absolute bottom-6 left-7 text-[26px] text-bg">{AXIS_LABELS[activeAxis]}</span>
          </div>

          {/* 레이더+막대 패널 — 원본 프리뷰(jib-atlas-v2-preview.html)는 화면 크기와
              무관하게 사진과 패널이 항상 같이 sticky로 붙어서 축이 바뀔 때마다 함께
              전환된다. 예전엔 모바일에서만 이 패널을 숨겼는데(화면을 다 덮는다는
              우려), 그러면 정작 "축마다 패널이 같이 바뀌는" 핵심 동작 자체가 안
              보이니 원본과 똑같이 모든 화면에서 보이게 둔다. */}
          <div className="mt-6 rounded-[26px] bg-panel p-6 sm:p-9 lg:mt-0">
            <div className="flex items-baseline justify-between gap-5">
              <span className="label-mono text-[10px] text-olive-mid">Axis Profile</span>
              <span className="font-display text-base tracking-[0.02em] text-faint">{AXIS_EN[activeAxis]}</span>
            </div>

            <div className="mt-5 flex justify-center">
              <svg viewBox="0 0 340 340" className="w-full max-w-[260px]">
                {[33, 66, 100].map((v) => (
                  <polygon key={v} points={radarRing(v)} fill="none" stroke="var(--color-hair)" strokeWidth={1} />
                ))}
                {AXES.map((axis, i) => {
                  const [x, y] = radarPoint(i, 100);
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
                  const [x, y] = radarPoint(i, SAMPLE_SCORES[axis]);
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
                  <div
                    key={axis}
                    className="grid grid-cols-[76px_1fr_28px] items-center gap-3 border-b border-hair py-3.5 sm:grid-cols-[104px_1fr_30px] sm:gap-4 sm:py-4"
                  >
                    <span
                      className={`text-[13px] transition-colors duration-500 ${isActive ? "text-fg" : "text-faint"}`}
                    >
                      {AXIS_LABELS[axis]}
                    </span>
                    <span className="relative h-[3px] bg-hair">
                      <span
                        className="absolute inset-y-0 left-0 transition-all duration-500"
                        style={{
                          width: `${SAMPLE_SCORES[axis]}%`,
                          background: isActive ? "var(--color-olive)" : "#c9cdb8",
                        }}
                      />
                    </span>
                    <span className="label-mono text-right text-[10px] text-faint">{SAMPLE_SCORES[axis]}</span>
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

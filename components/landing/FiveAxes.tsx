"use client";

import { useEffect, useRef, useState } from "react";
import { RADAR_CX, RADAR_CY, radarLabelPoint, radarPoint, radarRing, radarShape } from "@/lib/radar";
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
        sticky의 containing block이 패널 자기 콘텐츠 높이(~60vh)로 줄어들어버려
        — 축 5개(74vh×5=370vh)를 스크롤하는 동안 붙어있지 못하고 먼저
        스크롤아웃돼 버렸다(버그 리포트: "스크롤 내리면 패널이 안 보여").
        고쳐서 모바일에서도 flex(세로 스택, 형제 컨테이너 공유)로 두고 패널을
        맨 위에 sticky로 둬, 축 텍스트가 그 아래로 흘러가게 한다. 데스크톱에서만
        grid 2컬럼으로 전환(그때는 grid stretch가 같은 효과를 준다).
      */}
      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[44fr_56fr] lg:items-start lg:gap-20">
        {/* 좌: 축 5개 — 데스크톱에서는 왼쪽, 모바일에서는 패널 아래(order로 순서만 뒤집는다). */}
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

        {/* 우: sticky — AXIS PROFILE 패널(레이더+막대). sticky·top-0는 모든
            화면 크기에서 켜져 있어야 한다(위 주석 참고).

            예전엔 lg:min-h-screen + justify-center로 뷰포트 안에서 수직
            중앙 정렬했는데, 노트북처럼 높이가 낮은 화면(대략 900px 미만)
            에서는 실제 높이가 뷰포트보다 커져서 위아래가 똑같이 잘려나갔다 —
            게다가 flex justify-center로 넘친 콘텐츠는 스크롤로도 못 끌어올 수
            있는 잘 알려진 CSS 함정이라(가운데 정렬 시 넘친 앞부분이 스크롤
            영역 밖에 생김), 축 막대 뒤쪽(미니멀·활동성·개방성·자연친화)이
            아예 안 보이는 버그가 났다(피드백: "사교성 밑에 있는 나머지가 안
            보여"). justify-center를 버리고 위 정렬 + max-h-screen +
            overflow-y-auto로 바꿔서, 내용이 넘치면 이 패널 안에서 스크롤해
            전부 볼 수 있게 했다.

            사진 밴드 제거 — 예전엔 이 자리 위에 aspect-[5/4] 사진 밴드가
            먼저 있고 그 아래 이 프로필 패널이 이어졌는데, 사진(최대 약
            400~700px)+패널(약 650~750px)을 합치면 흔한 노트북 높이
            (700~900px)에서 항상 넘쳐서 위 max-h-screen overflow-y-auto가
            켜졌다 — 그러면 바깥 페이지 스크롤(축 전환)과 이 패널 안쪽 스크롤
            (넘친 내용 보기)이 동시에 존재해 "스크롤이 두 개"인 것처럼
            느껴졌다(피드백: "둘 다 따로 스크롤하게 만들었는데 어색하다").
            사진을 빼서 패널 하나만 남기면 대부분 화면에서 내부 스크롤 없이
            한 번에 다 보인다 — overflow-y-auto/max-h는 정말 짧은 화면을 위한
            방어선으로만 남겨뒀다. 사진을 나중에 다시 넣는다면 "패널 높이 +
            사진 높이 ≤ 흔한 뷰포트 높이(700~900px)"를 반드시 먼저 확인할 것
            — 안 그러면 이 버그가 그대로 재발한다. */}
        <div className="sticky top-20 order-1 z-10 max-h-[calc(100vh-5rem)] overflow-y-auto lg:top-0 lg:order-2 lg:max-h-screen lg:overflow-y-auto lg:py-10">
          <div className="rounded-[26px] bg-panel p-6 sm:p-9">
            <div className="flex items-baseline justify-between gap-5">
              <span className="label-mono text-[10px] text-olive-mid">Axis Profile</span>
              <span className="font-display text-base tracking-[0.02em] text-faint">{AXIS_EN[activeAxis]}</span>
            </div>

            <div className="mt-5 flex justify-center">
              <svg viewBox="0 0 340 340" className="w-full max-w-[260px]" style={{ overflow: "visible" }}>
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
                {/* 정점에 축 이름을 붙인다 — 없으면 육각형만 봐선 어떤 축인지 알 수 없다. */}
                {AXES.map((axis, i) => {
                  const { x, y, anchor } = radarLabelPoint(i);
                  const isActive = axis === activeAxis;
                  return (
                    <text
                      key={axis}
                      x={x}
                      y={y}
                      textAnchor={anchor}
                      dominantBaseline="middle"
                      fontSize={12}
                      fill={isActive ? "var(--color-fg)" : "var(--color-faint)"}
                      style={{ fontFamily: "var(--font-sans)", transition: "fill 0.5s" }}
                    >
                      {AXIS_LABELS[axis]}
                    </text>
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

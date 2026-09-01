"use client";

import { useEffect, useState } from "react";

/**
 * 진단 완료 → 결과 진입 사이에 뜨는 브랜드 로딩 화면. `calculateScores`는
 * 동기 순수 함수라 계산 자체는 즉시 끝나지만, 결과를 받아들일 기대감을
 * 만들기 위해 UX상 의도적으로 몇 초 붙잡아둔다.
 *
 * 브랜드 시그니처인 블루프린트(평면도) 선이 실시간으로 그려지는 애니메이션
 * 위에 `messages`를 순서대로 보여준다. 프로젝트에 framer-motion/gsap이
 * 설치돼 있지 않아(components/motion/MotionProvider.tsx가 유일한 모션
 * 수단, 그마저도 rAF+IntersectionObserver 방식) 새 의존성 없이 SVG
 * `pathLength` + CSS keyframes만으로 구현했다.
 *
 * 마지막 문구는 자동으로 결과 페이지로 안 넘어간다 — 잠깐 보여준 뒤
 * `finalCta` 문구의 클릭 가능한 버튼으로 전환되고, 사용자가 직접 눌러야만
 * `onDone`이 불린다(기대감을 극대화하려는 의도적 설계, 자동 전환 아님).
 */
export function DiagnosisLoader({
  messages,
  finalCta,
  messageIntervalMs = 1100,
  onDone,
}: {
  messages: string[];
  finalCta: string;
  messageIntervalMs?: number;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    if (index >= messages.length - 1) {
      // 마지막 문구에 도달 — 잠깐 보여준 뒤 클릭 유도 상태로 바꾼다.
      // 여기서 자동으로 onDone을 부르지 않는다: 사용자가 직접 눌러야
      // 결과로 넘어가게 하는 게 이 컴포넌트의 핵심 목적이다.
      const timeout = setTimeout(() => setCtaVisible(true), messageIntervalMs);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setIndex((i) => i + 1), messageIntervalMs);
    return () => clearTimeout(timeout);
  }, [index, messages.length, messageIntervalMs]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-11 bg-bg">
      <svg viewBox="0 0 200 150" className="h-auto w-[200px]" aria-hidden>
        <rect
          x={20}
          y={20}
          width={160}
          height={110}
          rx={4}
          fill="none"
          stroke="var(--color-olive)"
          strokeWidth={2}
          pathLength={1}
          className="blueprint-line"
          style={{ animationDuration: "1.1s", animationDelay: "0s" }}
        />
        <line
          x1={100}
          y1={20}
          x2={100}
          y2={130}
          stroke="var(--color-olive)"
          strokeWidth={1.5}
          pathLength={1}
          className="blueprint-line"
          style={{ animationDuration: "0.6s", animationDelay: "0.9s" }}
        />
        <line
          x1={20}
          y1={80}
          x2={100}
          y2={80}
          stroke="var(--color-olive)"
          strokeWidth={1.5}
          pathLength={1}
          className="blueprint-line"
          style={{ animationDuration: "0.5s", animationDelay: "1.4s" }}
        />
        {/* 현관 문 스윙 호 — 블루프린트 도면에서 흔한 표기라 이걸 마지막에 그려서 마무리 느낌을 준다. */}
        <path
          d="M 140 130 A 20 20 0 0 0 160 110"
          fill="none"
          stroke="var(--color-olive-mid)"
          strokeWidth={1.5}
          pathLength={1}
          className="blueprint-line"
          style={{ animationDuration: "0.5s", animationDelay: "1.8s" }}
        />
      </svg>

      {ctaVisible ? (
        <button
          type="button"
          onClick={onDone}
          className="blueprint-text label-mono rounded-full border border-olive px-7 py-3.5 text-[11px] text-olive-mid transition hover:bg-olive hover:text-cream"
        >
          {finalCta}
        </button>
      ) : (
        <p key={index} className="label-mono blueprint-text text-[11px] text-olive-mid">
          {messages[index]}
        </p>
      )}

      <style>{`
        .blueprint-line {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation-name: blueprint-draw;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes blueprint-draw {
          to { stroke-dashoffset: 0; }
        }
        .blueprint-text {
          animation: blueprint-text-fade 0.4s ease-out;
        }
        @keyframes blueprint-text-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .blueprint-line { animation: none; stroke-dashoffset: 0; }
          .blueprint-text { animation: none; }
        }
      `}</style>
    </div>
  );
}

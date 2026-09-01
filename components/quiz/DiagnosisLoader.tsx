"use client";

import { useEffect, useState } from "react";

/**
 * 결과 진입 전 브랜드 로딩 화면. `calculateScores`는 동기 순수 함수라 계산
 * 자체는 즉시 끝나지만, 결과를 받아들일 여유를 주기 위해 UX상 의도적으로
 * `durationMs`만큼 붙잡아둔다.
 *
 * 브랜드 시그니처인 블루프린트(평면도) 선이 실시간으로 그려지는 애니메이션
 * 위에 `messages`를 순서대로 보여준다. 프로젝트에 framer-motion/gsap이
 * 설치돼 있지 않아(components/motion/MotionProvider.tsx가 유일한 모션
 * 수단, 그마저도 rAF+IntersectionObserver 방식) 새 의존성 없이 SVG
 * `pathLength` + CSS keyframes만으로 구현했다 — `pathLength={1}`을 주면
 * 실제 선 길이와 무관하게 `stroke-dasharray:1`/`stroke-dashoffset`을
 * 0~1 사이 값으로만 다루면 돼서 `getTotalLength()` 같은 JS 계측이 필요 없다.
 *
 * ko/en 페이지가 각자 다른 `messages` 배열과 `durationMs`를 넘겨 쓴다 — 이
 * 컴포넌트 자체엔 문구를 하드코딩하지 않는다(빠른 진단 완료 직후엔 3단계
 * 메시지로 2~3초, 정밀 모드 완료 직후엔 더 짧고 담백한 1단계 메시지로 쓰는
 * 식 — app/test/page.tsx 참고).
 */
export function DiagnosisLoader({
  messages,
  durationMs,
  onDone,
}: {
  messages: string[];
  durationMs: number;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const step = durationMs / messages.length;
    const interval = setInterval(() => {
      setIndex((i) => Math.min(i + 1, messages.length - 1));
    }, step);
    const timeout = setTimeout(onDone, durationMs);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // messages/durationMs/onDone은 마운트 시점 값으로 고정한다 — 부모가
    // 리렌더될 때마다 타이머가 재설정되면 로딩이 끝나지 않을 수 있다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <p key={index} className="label-mono blueprint-text text-[11px] text-olive-mid">
        {messages[index]}
      </p>

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

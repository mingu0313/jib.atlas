"use client";

import Link from "next/link";
import { useState } from "react";
import { StepBudget } from "@/components/studio/StepBudget";
import { StepDimensions } from "@/components/studio/StepDimensions";
import { StepFinish } from "@/components/studio/StepFinish";
import { StepShape } from "@/components/studio/StepShape";

/**
 * `/studio` — 진단과 무관한 독립 룸빌더 진입 경로(STEP 15). IKEA 홈디자인
 * 플래너를 참고한 4단계 위저드로 간다: ① 모양·크기 → ② 치수 → ③ 문/창문·
 * 마감재 → ④ 예산(STEP 14까지 전부 구현).
 *
 * 기존 `/editor`(진단 매칭 → 고정 격자 3D 방, lib/editorStore.ts)는 그대로
 * 두고 완전히 별도로 만든 새 store(lib/roomBuilderStore.ts)를 쓴다 — 집
 * 아틀라스 공유(house_posts.room_items)가 기존 격자 구조에 의존하고 있어서,
 * 이 정밀 빌더가 그 위에 얹히면 안 된다.
 *
 * 단계 이동은 이 페이지 안의 로컬 state(activeStep)로만 관리한다 — 아직
 * URL로 딥링크할 필요(예: 새로고침 후에도 2단계 유지)가 없어서 쿼리
 * 파라미터 동기화는 안 넣었다. 필요해지면 그때 추가.
 *
 * 상단바는 랜딩의 FloatingNav 대신 /editor와 같은 자체 툴바 패턴을 쓴다 —
 * FloatingNav는 실제로 `/`·`/en` 랜딩 두 곳에서만 쓰이고, 도구성 페이지는
 * 각자 로고+단계 라벨+뒤로가기로 된 얇은 바를 쓰는 게 이 저장소 관례다.
 */

const STEPS = [
  { id: "shape", label: "모양·크기" },
  { id: "dimensions", label: "치수" },
  { id: "finish", label: "문/창문·마감재" },
  { id: "budget", label: "예산" },
] as const;

export default function StudioPage() {
  const [activeStep, setActiveStep] = useState(1); // 1-indexed, STEPS 배열과 맞춤

  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      {/* 상단바 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair px-6 py-5 sm:px-8">
        <div className="flex items-center gap-[18px] sm:gap-[22px]">
          <Link href="/" className="font-display text-[22px] text-fg">
            jib<span className="text-olive-mid">.</span>atlas
          </Link>
          <span className="h-[18px] w-px bg-hair" />
          <span className="label-mono text-[10px] text-olive-mid">
            Room Studio — {activeStep}. {STEPS[activeStep - 1].label}
          </span>
        </div>
        <Link
          href="/"
          className="rounded-full border border-hair px-[22px] py-[11px] text-[12px] text-[#5f5f57] transition hover:border-olive hover:text-fg"
        >
          홈으로
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-12 px-6 py-12 sm:px-10 sm:py-16">
        {/* 4단계 인디케이터 — 이미 지나온 단계만 클릭해 되돌아갈 수 있다. */}
        <ol className="flex flex-wrap items-center gap-3">
          {STEPS.map((step, i) => {
            const stepNum = i + 1;
            const active = stepNum === activeStep;
            const reachable = stepNum <= 4;
            const visited = stepNum < activeStep;
            return (
              <li key={step.id} className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!reachable || (!visited && !active)}
                  onClick={() => setActiveStep(stepNum)}
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors disabled:cursor-default"
                  style={{
                    borderColor: active ? "var(--color-olive)" : "var(--color-hair)",
                    background: active ? "var(--color-sage)" : "transparent",
                    color: active ? "var(--color-sage-ink)" : visited ? "var(--color-fg)" : "var(--color-faint)",
                  }}
                >
                  <span className="label-mono text-[10px]">{stepNum}</span>
                  {step.label}
                </button>
                {i < STEPS.length - 1 && <span className="h-px w-6 bg-hair" aria-hidden />}
              </li>
            );
          })}
        </ol>

        {activeStep === 1 && <StepShape onNext={() => setActiveStep(2)} />}
        {activeStep === 2 && <StepDimensions onBack={() => setActiveStep(1)} onNext={() => setActiveStep(3)} />}
        {activeStep === 3 && <StepFinish onBack={() => setActiveStep(2)} onNext={() => setActiveStep(4)} />}
        {activeStep === 4 && <StepBudget onBack={() => setActiveStep(3)} />}
      </div>
    </main>
  );
}

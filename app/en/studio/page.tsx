"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import houseTemplatesEnData from "@/data/house-templates.en.json";
import { StepDimensions } from "@/components/studio/StepDimensions";
import { StepFinish } from "@/components/studio/StepFinish";
import { StepFurniture } from "@/components/studio/StepFurniture";
import { StepShape } from "@/components/studio/StepShape";
import { StudioPreviewPanel } from "@/components/studio/StudioPreviewPanel";
import { calculateScores } from "@/lib/scoring";
import { matchHouseTemplate } from "@/lib/matching";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { getStudioDefaults } from "@/lib/studioDefaults";
import { useTestStore } from "@/lib/store";
import type { Answer, HouseTemplate } from "@/lib/types";

const houseTemplatesEn = houseTemplatesEnData as HouseTemplate[];

/**
 * 영문 스튜디오(`/en/studio`) — app/studio/page.tsx와 마크업·로직은 완전히
 * 동일하고, 문구만 영문으로 바꾸고 모든 Step 컴포넌트·StudioPreviewPanel에
 * lang="en"을 흘려보낸다(STEP 16 다국어 확장). 진단 답변(useTestStore)은
 * /test·/en/test 어느 쪽에서 왔든 문항 id가 같아(q1..q15, m1..m8) 축
 * 스코어는 동일하지만, matchHouseTemplate에 houseTemplatesEn을 넘겨서
 * matchedTemplate.name(위 안내 배너에 그대로 노출됨, app/result/page.tsx의
 * "이 집 꾸미러 가기" 흐름과 동일한 경로)이 영문으로 뜨게 한다 — 기본
 * (한국어) templates로 매칭하면 /en/studio인데 배너에 한국어 집 유형
 * 이름이 섞여 보이는 버그가 된다.
 */

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8 — app/studio/page.tsx와 동일 기준

const STEPS = [
  { id: "shape", label: "Shape & Size" },
  { id: "dimensions", label: "Dimensions" },
  { id: "finish", label: "Doors, windows & finish" },
  { id: "furniture", label: "Furniture" },
] as const;

export default function EnglishStudioPage() {
  const [activeStep, setActiveStep] = useState(() => (useRoomBuilderStore.getState().matchedTemplate ? 4 : 1));
  const [autoApplyDismissed, setAutoApplyDismissed] = useState(false);

  const answers = useTestStore((s) => s.answers);
  const matchedTemplate = useRoomBuilderStore((s) => s.matchedTemplate);
  const applyTemplateDefaults = useRoomBuilderStore((s) => s.applyTemplateDefaults);
  const clearMatchedTemplate = useRoomBuilderStore((s) => s.clearMatchedTemplate);

  useEffect(() => {
    if (matchedTemplate || autoApplyDismissed) return;
    if (Object.keys(answers).length < TOTAL_QUESTION_COUNT) return;
    const answerList: Answer[] = Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }));
    const { axisScores } = calculateScores(answerList);
    const [topMatch] = matchHouseTemplate(axisScores, houseTemplatesEn);
    const defaults = getStudioDefaults(topMatch.template);
    applyTemplateDefaults(
      { id: topMatch.template.id, name: topMatch.template.name },
      defaults.roomShape,
      defaults.wallColorHex,
      defaults.floorStyleId,
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveStep(4);
  }, [answers, matchedTemplate, autoApplyDismissed, applyTemplateDefaults]);

  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      {/* app/studio/page.tsx와 같은 이유(접근성/시맨틱 구조)로 sr-only h1. */}
      <h1 className="sr-only">Interior Studio — jib.atlas</h1>
      {/* 상단바 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair px-6 py-5 sm:px-8">
        <div className="flex items-center gap-[18px] sm:gap-[22px]">
          <Link href="/en" className="font-display text-[22px] text-fg">
            jib<span className="text-olive-mid">.</span>atlas
          </Link>
          <span className="h-[18px] w-px bg-hair" />
          <span className="label-mono text-[10px] text-olive-mid">
            Interior Studio — {activeStep}. {STEPS[activeStep - 1].label}
          </span>
        </div>
        <Link
          href="/en"
          className="rounded-full border border-hair px-[22px] py-[11px] text-[12px] text-[#5f5f57] transition hover:border-olive hover:text-fg"
        >
          Home
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-12 px-6 py-12 sm:px-10 sm:py-16">
        {/* 4단계 인디케이터 — 이미 지나온 단계만 클릭해 되돌아갈 수 있다. */}
        <ol className="flex flex-wrap items-center gap-3">
          {STEPS.map((step, i) => {
            const stepNum = i + 1;
            const active = stepNum === activeStep;
            const reachable = stepNum <= STEPS.length;
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

        {/* 진단 매칭 기준으로 시작했을 때만 — 언제든 중립 기본값으로 되돌릴 수 있게. */}
        {matchedTemplate && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-full bg-sage px-5 py-3 text-[12px] text-sage-ink">
            <span>
              We pre-picked a shape, wall color, and floor based on your <strong className="font-semibold">{matchedTemplate.name}</strong>{" "}
              match — feel free to change any of it.
            </span>
            <button
              type="button"
              onClick={() => {
                clearMatchedTemplate();
                setAutoApplyDismissed(true);
                setActiveStep(1);
              }}
              className="shrink-0 underline underline-offset-2 hover:no-underline"
            >
              Start from scratch
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_440px]">
          <div className="min-w-0">
            {activeStep === 1 && <StepShape onNext={() => setActiveStep(2)} lang="en" />}
            {activeStep === 2 && <StepDimensions onBack={() => setActiveStep(1)} onNext={() => setActiveStep(3)} lang="en" />}
            {activeStep === 3 && <StepFinish onBack={() => setActiveStep(2)} onNext={() => setActiveStep(4)} lang="en" />}
            {activeStep === 4 && <StepFurniture onBack={() => setActiveStep(3)} lang="en" />}
          </div>
          <div className="lg:sticky lg:top-24">
            <StudioPreviewPanel step={activeStep} lang="en" />
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StepBudget } from "@/components/studio/StepBudget";
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
import type { Answer } from "@/lib/types";

/**
 * `/studio` — 이 서비스의 유일한 룸빌더(인테리어 견적 스튜디오)다. IKEA
 * 홈디자인 플래너를 참고한 5단계 위저드: ① 모양·크기 → ② 치수 → ③ 문/창문·
 * 마감재 → ④ 가구 → ⑤ 예산(STEP 11~14 + 가구 배치).
 *
 * 진단(/test → /result)을 마치고 왔든, 랜딩에서 "진단 없이 바로 꾸며보기"로
 * 곧장 왔든 같은 페이지를 쓴다 — 마운트 시 useTestStore에 완료된 진단
 * 답변이 있으면(그리고 아직 매칭 기준을 적용/초기화한 적 없으면) 자동으로
 * 매칭 타입에 맞는 모양·벽색·바닥 기본값을 한 번 적용한다(아래
 * useEffect). 없으면 중립 기본값(직사각형·웜화이트·원목)으로 시작한다.
 *
 * 예전엔 진단 결과가 이 폴리곤 빌더 대신 격자+박스가구 방식인 `/editor`로
 * 갔었다 — 이제 `/result`·`/en/result`·랜딩·로그인/비번재설정 후 리다이렉트·
 * `/atlas`의 "방 꾸미고 공유하기" 버튼(app/atlas/page.tsx) 전부 여기로
 * 통일했고, 아무도 안 쓰던 `/editor` 코드 자체(및 그 위에 있던 "지도에
 * 공유하기" 기능, lib/editorStore.ts, app/api/layout/route.ts)는 삭제했다.
 * 이 스튜디오의 가구 배치(store.furniture)는 `/atlas`의 house_posts.room_items
 * 스키마(col/row 격자 기준)와 형태가 달라서(store.furniture는 cx/cz 자유
 * 좌표), `/editor`가 하던 "지도에 공유하기"(house_posts insert) 액션은
 * `/studio`에 아직 없다 — room_items로의 변환(또는 스키마 확장)은 별도
 * 작업으로 남겨뒀다. 지금 `/atlas`에 실제로 글을 올리는 유일한 경로는
 * `/atlas/new`(실사진 업로드)뿐이다.
 *
 * 단계 이동은 이 페이지 안의 로컬 state(activeStep)로만 관리한다 — 아직
 * URL로 딥링크할 필요가 없어서 쿼리 파라미터 동기화는 안 넣었다.
 *
 * 콘텐츠 영역은 좌(단계별 컨트롤)/우(상시 2D·3D 프리뷰 패널) 2컬럼이다.
 * StudioPreviewPanel은 여기 페이지 레벨에서 activeStep이 바뀌어도 리마운트
 * 없이 계속 살아있다 — 안에 있는 3D 씬(<Canvas>)이 단계를 넘길 때마다
 * 초기화되지 않고 카메라 각도를 유지하는 이유가 이거다(컴포넌트 자체 주석
 * 참고).
 *
 * 상단바는 랜딩의 FloatingNav 대신 각자 로고+단계 라벨+뒤로가기로 된
 * 얇은 툴바를 쓰는 이 저장소 관례를 따른다.
 */

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8 — lib/store.ts 진단 완료 기준과 동일

const STEPS = [
  { id: "shape", label: "모양·크기" },
  { id: "dimensions", label: "치수" },
  { id: "finish", label: "문/창문·마감재" },
  { id: "furniture", label: "가구" },
  { id: "budget", label: "예산" },
] as const;

export default function StudioPage() {
  const [activeStep, setActiveStep] = useState(1); // 1-indexed, STEPS 배열과 맞춤
  const [autoApplyDismissed, setAutoApplyDismissed] = useState(false);

  const answers = useTestStore((s) => s.answers);
  const matchedTemplate = useRoomBuilderStore((s) => s.matchedTemplate);
  const applyTemplateDefaults = useRoomBuilderStore((s) => s.applyTemplateDefaults);
  const clearMatchedTemplate = useRoomBuilderStore((s) => s.clearMatchedTemplate);

  useEffect(() => {
    // 이미 적용됐거나(matchedTemplate) "처음부터 다시 시작"으로 유저가
    // 직접 걷어냈으면(autoApplyDismissed) 다시 덮어쓰지 않는다.
    if (matchedTemplate || autoApplyDismissed) return;
    if (Object.keys(answers).length < TOTAL_QUESTION_COUNT) return; // 진단 미완료 — 중립 기본값 유지
    const answerList: Answer[] = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
    const { axisScores } = calculateScores(answerList);
    const [topMatch] = matchHouseTemplate(axisScores);
    const defaults = getStudioDefaults(topMatch.template);
    applyTemplateDefaults(
      { id: topMatch.template.id, name: topMatch.template.name },
      defaults.roomShape,
      defaults.wallColorHex,
      defaults.floorStyleId,
    );
  }, [answers, matchedTemplate, autoApplyDismissed, applyTemplateDefaults]);

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
            Interior Studio — {activeStep}. {STEPS[activeStep - 1].label}
          </span>
        </div>
        <Link
          href="/"
          className="rounded-full border border-hair px-[22px] py-[11px] text-[12px] text-[#5f5f57] transition hover:border-olive hover:text-fg"
        >
          홈으로
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-12 px-6 py-12 sm:px-10 sm:py-16">
        {/* 5단계 인디케이터 — 이미 지나온 단계만 클릭해 되돌아갈 수 있다. */}
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
              <strong className="font-semibold">{matchedTemplate.name}</strong> 매칭 결과를 기준으로 시작했어요 —
              자유롭게 바꿔도 괜찮아요.
            </span>
            <button
              type="button"
              onClick={() => {
                clearMatchedTemplate();
                setAutoApplyDismissed(true);
              }}
              className="shrink-0 underline underline-offset-2 hover:no-underline"
            >
              처음부터 다시 시작
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_440px]">
          <div className="min-w-0">
            {activeStep === 1 && <StepShape onNext={() => setActiveStep(2)} />}
            {activeStep === 2 && <StepDimensions onBack={() => setActiveStep(1)} onNext={() => setActiveStep(3)} />}
            {activeStep === 3 && <StepFinish onBack={() => setActiveStep(2)} onNext={() => setActiveStep(4)} />}
            {activeStep === 4 && <StepFurniture onBack={() => setActiveStep(3)} onNext={() => setActiveStep(5)} />}
            {activeStep === 5 && <StepBudget onBack={() => setActiveStep(4)} />}
          </div>
          <div className="lg:sticky lg:top-24">
            <StudioPreviewPanel step={activeStep} />
          </div>
        </div>
      </div>
    </main>
  );
}

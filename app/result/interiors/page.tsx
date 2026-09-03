"use client";

import Link from "next/link";
import { InteriorRecommendations } from "@/components/result/InteriorRecommendations";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import type { Answer } from "@/lib/types";

/**
 * STEP 8 — "AI가 추천하는 나에게 맞는 인테리어" 결과 화면. /result에서 CTA를
 * 눌러 로딩 화면(DiagnosisLoader, /result 쪽에서 오버레이로 띄움)을 거친 뒤
 * 도착하는 라우트다. /test → /result와 같은 패턴: 로딩은 출발 페이지에서
 * 보여주고, 도착 라우트는 zustand persist(useTestStore)에서 답변을 다시
 * 읽어 즉시 렌더한다 — 점수를 URL로 안 넘겨도 새로고침해도 그대로 재현된다.
 */
export default function InteriorRecommendationsPage() {
  const answers = useTestStore((state) => state.answers);
  const answeredCount = Object.keys(answers).length;

  if (answeredCount === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-kr text-xl">아직 결과가 없어요</h1>
        <p className="text-muted">진단 테스트를 먼저 완료하면 추천을 볼 수 있어요.</p>
        <Link href="/test" className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg">
          진단 테스트 하러 가기
        </Link>
      </main>
    );
  }

  const answerList: Answer[] = Object.entries(answers).map(([questionId, optionId]) => ({
    questionId,
    optionId,
  }));
  const { axisScores } = calculateScores(answerList);

  return (
    <main className="px-6 pt-[100px] pb-[120px] sm:px-10 sm:pt-[150px]">
      <Link href="/result" className="label-mono text-[10px] text-olive-mid transition hover:text-fg">
        ← 결과로 돌아가기
      </Link>

      <span className="label-mono mt-8 block text-[10px] text-olive-mid">AI Interior Match</span>
      <h1 className="font-kr mt-4 max-w-2xl text-[clamp(28px,4.4vw,56px)] leading-[1.12] tracking-[-0.02em]">
        당신의 성향에 맞춰 고른 인테리어예요<span className="heading-dot">.</span>
      </h1>
      <p className="mt-4 max-w-xl text-[14px] leading-[1.8] text-muted">
        5개 축 점수를 바탕으로 어울리는 인테리어 스타일 4가지를 골랐어요. 카드마다 왜 이 공간이
        당신과 맞는지 짧게 풀어뒀어요.
      </p>

      <div className="mt-16">
        <InteriorRecommendations axisScores={axisScores} />
      </div>

      <div className="mt-20 flex flex-wrap items-center gap-[22px] border-t border-hair pt-12">
        <Link
          href="/studio"
          className="rounded-full bg-olive px-[42px] py-5 text-[15px] font-semibold text-cream transition hover:bg-fg"
        >
          내 집 꾸미러 가기
        </Link>
        <Link href="/result" className="text-[13px] text-muted transition hover:text-fg">
          결과 다시 보기
        </Link>
      </div>
    </main>
  );
}

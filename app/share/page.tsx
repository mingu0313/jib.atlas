"use client";

import Link from "next/link";
import { ShareCard } from "@/components/ShareCard";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona } from "@/lib/persona";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import type { Answer } from "@/lib/types";

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8

/**
 * 공유 카드 — DESIGN-HANDOFF-V2.md "4. 공유 카드". `/result/share`가 아니라
 * 문서의 라우트 표대로 최상위 `/share`로 옮겼다.
 */
export default function SharePage() {
  const answers = useTestStore((state) => state.answers);

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-kr text-xl">아직 결과가 없어요</h1>
        <p className="text-muted">진단 테스트를 먼저 완료하면 공유 카드를 만들 수 있어요.</p>
        <Link href="/test" className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg">
          진단 테스트 하러 가기
        </Link>
      </main>
    );
  }

  const answerList: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
    questionId,
    value,
  }));
  const { axisScores } = calculateScores(answerList);
  const [topMatch] = matchHouseTemplate(axisScores);
  const persona = generatePersona(axisScores);
  const typeNum = topMatch.template.id.replace(/^t/, "").padStart(2, "0");

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 px-6 pt-[100px] pb-[90px] sm:px-10 sm:pt-[140px]">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="label-mono text-[11px] text-olive-mid">Share Card</span>
        <h2 className="font-kr text-[clamp(28px,3.4vw,48px)] tracking-[-0.03em]">
          결과를 카드로 남기세요<span className="heading-dot">.</span>
        </h2>
      </div>

      <ShareCard
        typeNum={typeNum}
        templateName={topMatch.template.name}
        personaName={persona.name}
        axisScores={axisScores}
      />

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
        <Link
          href="/result"
          className="rounded-full bg-olive px-9 py-[18px] text-[14px] font-semibold text-cream transition hover:bg-fg"
        >
          결과로 돌아가기
        </Link>
        <span className="text-[13px] text-muted">화면을 캡처해서 공유해보세요</span>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { InteriorRecommendations } from "@/components/result/InteriorRecommendations";
import lifestyleQuestionsEnData from "@/data/lifestyle-questions.en.json";
import mbtiQuestionsEnData from "@/data/mbti-questions.en.json";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import type { Answer } from "@/lib/types";

/**
 * 영문 인테리어 추천 결과(`/en/result/interiors`) — app/result/interiors/page.tsx
 * 와 마크업·로직 동일, InteriorRecommendations만 lang="en"으로 호출해
 * lib/interiorMatchingEn.ts 데이터를 쓴다. 진단 완료 게이트는 15+8=23문항
 * 기준(KO와 동일 — useTestStore 응답이 언어 전환에도 이어진다).
 */
const TOTAL_QUESTION_COUNT = lifestyleQuestionsEnData.length + mbtiQuestionsEnData.length; // 23

export default function EnglishInteriorRecommendationsPage() {
  const answers = useTestStore((state) => state.answers);
  const answeredCount = Object.keys(answers).length;

  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-display text-xl">No result yet</h1>
        <p className="text-muted">Finish the quiz first to see your recommendations.</p>
        <Link href="/en/test" className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg">
          Take the quiz
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
      <Link href="/en/result" className="label-mono text-[10px] text-olive-mid transition hover:text-fg">
        ← Back to results
      </Link>

      <span className="label-mono mt-8 block text-[10px] text-olive-mid">AI Interior Match</span>
      <h1 className="font-display mt-4 max-w-2xl text-[clamp(28px,4.4vw,56px)] leading-[1.12] tracking-[-0.02em]">
        Interior picks matched to your style<span className="heading-dot">.</span>
      </h1>
      <p className="mt-4 max-w-xl text-[14px] leading-[1.8] text-muted">
        We picked 4 interior styles that suit you based on your five-axis scores — each card explains briefly why
        it&apos;s a match.
      </p>

      <div className="mt-16">
        <InteriorRecommendations axisScores={axisScores} lang="en" />
      </div>

      <div className="mt-20 flex flex-wrap items-center gap-[22px] border-t border-hair pt-12">
        <Link
          href="/en/studio"
          className="rounded-full bg-olive px-[42px] py-5 text-[15px] font-semibold text-cream transition hover:bg-fg"
        >
          Decorate this room
        </Link>
        <Link href="/en/result" className="text-[13px] text-muted transition hover:text-fg">
          Back to your result
        </Link>
      </div>
    </main>
  );
}

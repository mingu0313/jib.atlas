"use client";

import Link from "next/link";
import { ShareCard } from "@/components/ShareCard";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona, getRarityTier } from "@/lib/persona";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import type { Answer } from "@/lib/types";

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8

export default function SharePage() {
  const answers = useTestStore((state) => state.answers);

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">아직 결과가 없어요</h1>
        <p className="text-muted">
          진단 테스트를 먼저 완료하면 공유 카드를 만들 수 있어요.
        </p>
        <Link
          href="/test"
          className="rounded-sm bg-teal-600 px-6 py-3 text-white transition hover:bg-teal-700"
        >
          진단 테스트 하러 가기
        </Link>
      </main>
    );
  }

  const answerList: Answer[] = Object.entries(answers).map(
    ([questionId, value]) => ({ questionId, value }),
  );
  const { axisScores, mbtiType } = calculateScores(answerList);
  const [topMatch] = matchHouseTemplate(axisScores);
  const persona = generatePersona(axisScores);
  const rarity = getRarityTier(topMatch.similarity);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-6 sm:p-10">
      <header className="text-center">
        <h1 className="text-xl font-semibold">공유 카드</h1>
        <p className="mt-1 text-sm text-muted">
          인스타 스토리(9:16)에 맞춘 카드예요. 화면을 캡처해서 공유해보세요.
        </p>
      </header>

      <ShareCard
        personaName={persona.name}
        mbtiType={mbtiType}
        templateName={topMatch.template.name}
        rarity={rarity}
        similarity={topMatch.similarity}
        axisScores={axisScores}
      />

      <Link
        href="/result"
        className="text-sm text-muted underline underline-offset-2"
      >
        결과 페이지로 돌아가기
      </Link>
    </main>
  );
}

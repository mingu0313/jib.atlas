"use client";

import Link from "next/link";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { FloorPlan } from "@/components/FloorPlan";
import { generateExplanation } from "@/lib/explain";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona, getRarityTier } from "@/lib/persona";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import { AXES, AXIS_LABELS } from "@/lib/types";
import type { Answer } from "@/lib/types";

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8

export default function ResultPage() {
  const answers = useTestStore((state) => state.answers);
  const reset = useTestStore((state) => state.reset);

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">아직 결과가 없어요</h1>
        <p className="text-muted">
          진단 테스트를 먼저 완료하면 결과를 볼 수 있어요.
        </p>
        <Link
          href="/test"
          className="rounded-full bg-teal-600 px-6 py-3 text-white transition hover:bg-teal-700"
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
  const matches = matchHouseTemplate(axisScores);
  const topMatch = matches[0];
  const explanation = generateExplanation(axisScores, topMatch.template);
  const [traitSentence, matchSentence, ...featureLines] =
    explanation.split("\n");
  const persona = generatePersona(axisScores);
  const rarity = getRarityTier(topMatch.similarity);

  const radarData = AXES.map((axis) => ({
    axis: AXIS_LABELS[axis],
    score: Math.round(axisScores[axis]),
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-6 sm:p-10">
      <header className="text-center">
        <p className="text-sm text-muted">당신의 캐릭터는</p>
        <p className="text-3xl font-bold tracking-tight">{persona.name}</p>
        <p className="mt-1 text-sm text-muted">MBTI 성향 {mbtiType}</p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <FloorPlan rooms={topMatch.template.rooms} />
        </div>
        <div className="flex flex-col justify-center gap-3">
          <p className="text-sm text-muted">당신에게 어울리는 집 구조</p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {topMatch.template.name}
          </h1>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-coral-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {rarity} · 유사도 {topMatch.similarity.toFixed(1)}%
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">5축 성향 분석</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-strong)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 13, fill: "var(--foreground)" }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar
                dataKey="score"
                stroke="var(--teal-600)"
                fill="var(--teal-500)"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <p className="text-base leading-relaxed sm:text-lg">
          {traitSentence}
        </p>
        <p className="mt-2 text-base font-medium leading-relaxed sm:text-lg">
          {matchSentence}
        </p>
        <ul className="mt-4 space-y-1 text-muted">
          {featureLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">이런 구조도 어울려요</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {matches.map((match, i) => (
            <li
              key={match.template.id}
              className={`rounded-xl border p-4 ${
                i === 0
                  ? "border-teal-600 bg-teal-50"
                  : "border-border bg-surface"
              }`}
            >
              <p className="text-sm text-muted">{i + 1}순위</p>
              <p className="font-semibold">{match.template.name}</p>
              <p className="text-sm text-muted">
                유사도 {match.similarity.toFixed(1)}%
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col items-center gap-3 pb-8 sm:flex-row sm:justify-center">
        <Link
          href="/result/share"
          className="rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-teal-700"
        >
          공유 카드 만들기
        </Link>
        <button
          type="button"
          onClick={reset}
          className="text-sm text-muted underline underline-offset-2"
        >
          다시 진단하기
        </button>
      </div>
    </main>
  );
}

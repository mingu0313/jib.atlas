"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import houseTemplatesData from "@/data/house-templates.en.json";
import lifestyleQuestionsData from "@/data/lifestyle-questions.en.json";
import mbtiQuestionsData from "@/data/mbti-questions.en.json";
import { BinaryQuestionCard, type BinaryDisplayOption } from "@/components/quiz/BinaryQuestionCard";
import { DiagnosisLoader } from "@/components/quiz/DiagnosisLoader";
import { useTestStore } from "@/lib/store";
import type { BinaryQuestion, MbtiBinaryQuestion, MbtiIndicator, OptionId } from "@/lib/types";

/**
 * 영문 퀴즈 페이지(`/en/test`) — app/test/page.tsx와 마크업·로직은 완전히
 * 동일하고, 데이터 소스만 영문 JSON(data/*.en.json)으로 바꿨다. 문항 id가
 * 한국어판과 같아서(q1..q15, m1..m8) useTestStore(zustand, localStorage
 * 공유)의 응답이 언어 전환에도 그대로 이어진다.
 */

const lifestyleQuestions = lifestyleQuestionsData as BinaryQuestion[];
const mbtiQuestions = mbtiQuestionsData as MbtiBinaryQuestion[];

const INDICATOR_LABELS: Record<MbtiIndicator, string> = {
  EI: "Energy Direction",
  SN: "Perception",
  TF: "Judgment",
  JP: "Lifestyle",
};

type QuizItem = {
  id: string;
  format: "balance" | "image";
  category: string;
  prompt: string;
  photo?: string;
  options: [BinaryDisplayOption, BinaryDisplayOption];
};

const allQuestions: QuizItem[] = [
  ...lifestyleQuestions.map((q): QuizItem => ({
    id: q.id,
    format: q.format,
    category: q.category,
    prompt: q.prompt,
    photo: q.photo,
    options: q.options,
  })),
  ...mbtiQuestions.map((q): QuizItem => ({
    id: q.id,
    format: "balance",
    category: INDICATOR_LABELS[q.indicator],
    prompt: q.prompt,
    options: q.options,
  })),
];

const HOUSE_TEMPLATE_COUNT = houseTemplatesData.length; // 30

const LOADING_MESSAGES = [
  "Analyzing your 5 traits…",
  `Comparing against ${HOUSE_TEMPLATE_COUNT} house types…`,
  "Found your match!",
];
const LOADING_FINAL_CTA = "See your result?";

export default function EnglishTestPage() {
  const router = useRouter();
  const answers = useTestStore((state) => state.answers);
  const setAnswer = useTestStore((state) => state.setAnswer);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const firstUnanswered = allQuestions.findIndex((q) => !(q.id in answers));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(firstUnanswered === -1 ? allQuestions.length - 1 : firstUnanswered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = allQuestions.length;
  const currentQuestion = allQuestions[index];

  function handleAnswer(optionId: OptionId) {
    setAnswer(currentQuestion.id, optionId);
    if (index === totalCount - 1) {
      setLoading(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (loading) {
    return (
      <DiagnosisLoader
        messages={LOADING_MESSAGES}
        finalCta={LOADING_FINAL_CTA}
        onDone={() => {
          window.scrollTo(0, 0);
          router.push("/en/result");
        }}
      />
    );
  }

  if (!currentQuestion) return null;

  const stepLabel = String(index + 1).padStart(2, "0");

  return (
    <main className={`grid grid-cols-1 lg:min-h-screen ${currentQuestion.photo ? "lg:grid-cols-[40fr_60fr]" : ""}`}>
      {currentQuestion.photo && (
        <div className="relative hidden overflow-hidden rounded-r-[36px] bg-photo-bg lg:block">
          <Image
            key={currentQuestion.id}
            src={currentQuestion.photo}
            alt=""
            fill
            sizes="40vw"
            priority={index === 0}
            className="object-cover"
            style={{ filter: "grayscale(0.32) contrast(0.94) brightness(1.04)" }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(200deg, rgba(247,246,242,0.10), rgba(230,226,214,0.55))" }}
          />
          <div className="absolute bottom-11 left-12 flex flex-col gap-1">
            <span className="font-display text-[132px] leading-[0.86]" style={{ color: "rgba(255,255,255,0.85)" }}>
              {stepLabel}
            </span>
            <span className="label-mono text-[10px]" style={{ color: "rgba(44,55,20,0.55)" }}>
              {currentQuestion.category}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col px-6 py-9 sm:px-10 lg:px-[60px] lg:py-9">
        <div className="flex items-center justify-between gap-5">
          <span className="font-display text-[22px] text-fg">
            jib<span className="text-olive-mid">.</span>atlas
          </span>
          <div className="flex items-center gap-5">
            <span className="label-mono text-[10px] text-faint">
              {index + 1} of {totalCount}
            </span>
            <button
              type="button"
              onClick={() => router.push("/en")}
              className="text-[13px] text-muted transition hover:text-fg"
            >
              Exit
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-[46px] pt-10" style={{ maxWidth: 780 }}>
          <div className="flex flex-col gap-[26px]">
            <span className="label-mono text-[11px] text-olive-mid">{currentQuestion.category}</span>
            <h2 className="font-display text-[clamp(26px,3.2vw,48px)] leading-[1.22] tracking-[-0.028em] text-fg">
              {currentQuestion.prompt}
            </h2>
          </div>

          <BinaryQuestionCard
            format={currentQuestion.format}
            options={currentQuestion.options}
            onSelect={handleAnswer}
          />

          <div className="flex items-center gap-3 sm:gap-[26px]">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="shrink-0 text-[13px] text-muted transition hover:text-fg disabled:opacity-0"
            >
              ← Back
            </button>
            <span className="flex min-w-0 items-center gap-1 sm:gap-[7px]">
              {allQuestions.map((q, i) => (
                <span
                  key={q.id}
                  className={`h-[3px] shrink-0 rounded-full transition-all duration-250 ${
                    i === index ? "w-5 sm:w-7" : "w-1.5 sm:w-2"
                  }`}
                  style={{
                    background:
                      i < index ? "var(--color-olive)" : i === index ? "var(--color-olive-mid)" : "var(--color-hair)",
                  }}
                />
              ))}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

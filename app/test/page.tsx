"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import lifestyleQuestionsData from "@/data/lifestyle-questions.json";
import mbtiQuestionsData from "@/data/mbti-questions.json";
import { useTestStore } from "@/lib/store";
import type { MbtiQuestion, Question } from "@/lib/types";

const lifestyleQuestions = lifestyleQuestionsData as Question[];
const mbtiQuestions = mbtiQuestionsData as MbtiQuestion[];

/** 라이프스타일 15문항 다음에 MBTI 8문항이 이어지는 순서로 노출한다. */
const allQuestions: { id: string; text: string }[] = [
  ...lifestyleQuestions,
  ...mbtiQuestions,
];

const LIKERT_LABELS = [
  "전혀 아니다",
  "아니다",
  "보통이다",
  "그렇다",
  "매우 그렇다",
];

export default function TestPage() {
  const router = useRouter();
  const answers = useTestStore((state) => state.answers);
  const setAnswer = useTestStore((state) => state.setAnswer);
  const reset = useTestStore((state) => state.reset);
  const [index, setIndex] = useState(0);

  // 새로고침 등으로 다시 들어왔을 때, 이미 응답한 문항 다음부터 이어서 시작한다.
  useEffect(() => {
    const firstUnanswered = allQuestions.findIndex((q) => !(q.id in answers));
    setIndex(firstUnanswered === -1 ? allQuestions.length - 1 : firstUnanswered);
    // 최초 마운트 시 1회만 동기화한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = allQuestions.length;
  const currentQuestion = allQuestions[index];
  const answeredCount = Object.keys(answers).length;

  function handleAnswer(value: number) {
    setAnswer(currentQuestion.id, value);
    if (index === totalCount - 1) {
      router.push("/result");
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (!currentQuestion) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
            <span>
              {index + 1} / {totalCount}
            </span>
            <span>{answeredCount}개 응답 완료</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{ width: `${((index + 1) / totalCount) * 100}%` }}
            />
          </div>
        </div>

        <h1 className="min-h-24 text-xl font-semibold sm:text-2xl">
          {currentQuestion.text}
        </h1>

        <div className="mt-8 grid grid-cols-5 gap-2">
          {LIKERT_LABELS.map((label, i) => {
            const value = i + 1;
            const selected = answers[currentQuestion.id] === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleAnswer(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                  selected
                    ? "border-black bg-black text-white"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <span className="text-lg font-bold">{value}</span>
                <span className="break-keep text-[11px] leading-tight text-inherit opacity-80">
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-between text-sm">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="text-gray-500 underline disabled:opacity-0"
          >
            이전 문항
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setIndex(0);
            }}
            className="text-gray-400 underline"
          >
            처음부터 다시
          </button>
        </div>
      </div>
    </main>
  );
}

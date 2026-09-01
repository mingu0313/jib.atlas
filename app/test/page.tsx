"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import houseTemplatesData from "@/data/house-templates.json";
import lifestyleQuestionsData from "@/data/lifestyle-questions.json";
import mbtiQuestionsData from "@/data/mbti-questions.json";
import { BinaryQuestionCard, type BinaryDisplayOption } from "@/components/quiz/BinaryQuestionCard";
import { DiagnosisLoader } from "@/components/quiz/DiagnosisLoader";
import { useTestStore } from "@/lib/store";
import type { BinaryQuestion, MbtiBinaryQuestion, MbtiIndicator, OptionId } from "@/lib/types";

/**
 * 퀴즈 페이지 — 단일 진단 흐름(23문항, 밸런스게임형/이미지 선택형 이지선다,
 * 기존 5점 리커트 대체)으로 문항을 답하는 화면.
 *
 * `lifestyleQuestions`(15개)와 `mbtiQuestions`(8개)를 이어붙인 `allQuestions`
 * 하나를 처음부터 끝까지 순서대로 진행한다 — 예전엔 15번째에서 결과로
 * 빠졌다가 "더 정밀하게 보기"로 나머지 8개를 마저 답하는 2단계 구조였지만,
 * 실사용 결과 15문항과 23문항 매칭 결과가 사실상 같아서 정밀 모드가 실질적
 * 가치를 안 준다고 판단해 폐기했다 — 지금은 23문항을 다 답해야 결과를 볼 수
 * 있는 단일 흐름이다.
 */

const lifestyleQuestions = lifestyleQuestionsData as BinaryQuestion[];
const mbtiQuestions = mbtiQuestionsData as MbtiBinaryQuestion[];

const INDICATOR_LABELS: Record<MbtiIndicator, string> = {
  EI: "에너지 방향",
  SN: "인식 방식",
  TF: "판단 기준",
  JP: "생활 양식",
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

// 순차 전환되는 로딩 문구 — 마지막 문구는 자동으로 넘어가지 않고
// DiagnosisLoader가 알아서 클릭 유도 버튼(finalCta)으로 바꿔준다.
const LOADING_MESSAGES = [
  "5가지 성향을 분석하는 중…",
  `${HOUSE_TEMPLATE_COUNT}가지 집 유형과 비교하는 중…`,
  "당신에게 맞는 집을 찾았어요!",
];
const LOADING_FINAL_CTA = "결과를 보러갈까요?";

export default function TestPage() {
  const router = useRouter();
  const answers = useTestStore((state) => state.answers);
  const setAnswer = useTestStore((state) => state.setAnswer);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // 새로고침 등으로 다시 들어왔을 때, 이미 응답한 문항 다음부터 이어서 시작한다.
  useEffect(() => {
    const firstUnanswered = allQuestions.findIndex((q) => !(q.id in answers));
    // 마운트 직후 localStorage 복원값과 1회 동기화하는 의도된 부작용이라 억제한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(firstUnanswered === -1 ? allQuestions.length - 1 : firstUnanswered);
    // 최초 마운트 시 1회만 동기화한다.
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
          router.push("/result");
        }}
      />
    );
  }

  if (!currentQuestion) return null;

  const stepLabel = String(index + 1).padStart(2, "0");

  return (
    <main className={`grid grid-cols-1 lg:min-h-screen ${currentQuestion.photo ? "lg:grid-cols-[40fr_60fr]" : ""}`}>
      {/* 좌: 사진 + 대형 넘버 — 이미지 선택형 문항은 옵션 사진 두 장이 이미
          화면의 시각 정보라 이 패널을 안 쓴다. */}
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

      {/* 우: 질문 + 선택지 */}
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
              onClick={() => router.push("/")}
              className="text-[13px] text-muted transition hover:text-fg"
            >
              나가기
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-[46px] pt-10" style={{ maxWidth: 780 }}>
          <div className="flex flex-col gap-[26px]">
            <span className="label-mono text-[11px] text-olive-mid">{currentQuestion.category}</span>
            <h2 className="font-kr text-[clamp(26px,3.2vw,48px)] leading-[1.22] tracking-[-0.028em] text-fg">
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
              ← 이전
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

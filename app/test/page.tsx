"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import lifestyleQuestionsData from "@/data/lifestyle-questions.json";
import mbtiQuestionsData from "@/data/mbti-questions.json";
import { useTestStore } from "@/lib/store";
import { AXIS_LABELS } from "@/lib/types";
import type { Axis, MbtiIndicator, MbtiQuestion, Question } from "@/lib/types";

/**
 * 퀴즈 페이지 — DESIGN-HANDOFF-V2.md "2. 퀴즈" + jib-atlas-v2-preview.html의
 * 실제 마크업(좌 40fr 사진+대형 넘버, 우 60fr 카테고리+질문+카드형 선택지+
 * 필 대시 인디케이터)을 그대로 따른다.
 *
 * 문서의 "문항 5개·4지선다·직접 점수"는 프리뷰 프로토타입의 QS 배열
 * (축마다 1문항)이 정본이지만, 실제 앱은 이 프로젝트가 v1 때부터 써온
 * 23문항(라이프스타일 15 + MBTI 8, lib/scoring.ts의 5점 리커트+리버스
 * 스코어링)을 그대로 쓴다 — 문서도 "실제 앱에서는 프로토타입 로컬 구현
 * 대신 lib/scoring.ts 사용"이라고 명시한다. 선택지가 5개라 문서의 2×2
 * 카드 그리드를 2열 그리드로 유지하고 마지막 5번째 카드만 2칸을 채운다.
 *
 * 좌측 사진은 QS 배열이 축마다 실제로 매칭해둔 photo(카테고리 5개 = 사진
 * 5장)를 그대로 재사용한다: nature→type-serene, sociability→type-social,
 * minimalism→type-precision, activity→type-open, openness→quiz-structure.
 * MBTI 8문항엔 대응 사진이 없어서(QS에 MBTI 항목 자체가 없음), 지표별로
 * 같은 5장을 돌려 쓴다.
 */

const lifestyleQuestions = lifestyleQuestionsData as Question[];
const mbtiQuestions = mbtiQuestionsData as MbtiQuestion[];

const INDICATOR_LABELS: Record<MbtiIndicator, string> = {
  EI: "에너지 방향",
  SN: "인식 방식",
  TF: "판단 기준",
  JP: "생활 양식",
};

const AXIS_PHOTO: Record<Axis, string> = {
  nature: "/photos/type-serene.jpg",
  sociability: "/photos/type-social.jpg",
  minimalism: "/photos/type-precision.jpg",
  activity: "/photos/type-open.jpg",
  openness: "/photos/quiz-structure.jpg",
};

const INDICATOR_PHOTO: Record<MbtiIndicator, string> = {
  EI: "/photos/type-social.jpg",
  SN: "/photos/quiz-structure.jpg",
  TF: "/photos/type-serene.jpg",
  JP: "/photos/type-precision.jpg",
};

type QuizItem = { id: string; text: string; category: string; photo: string };

const allQuestions: QuizItem[] = [
  ...lifestyleQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    category: AXIS_LABELS[q.axis],
    photo: AXIS_PHOTO[q.axis],
  })),
  ...mbtiQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    category: INDICATOR_LABELS[q.indicator],
    photo: INDICATOR_PHOTO[q.indicator],
  })),
];

const LIKERT_LABELS = ["전혀 아니다", "아니다", "보통이다", "그렇다", "매우 그렇다"];

export default function TestPage() {
  const router = useRouter();
  const answers = useTestStore((state) => state.answers);
  const setAnswer = useTestStore((state) => state.setAnswer);
  const [index, setIndex] = useState(0);

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

  function handleAnswer(value: number) {
    setAnswer(currentQuestion.id, value);
    if (index === totalCount - 1) {
      window.scrollTo(0, 0);
      router.push("/result");
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (!currentQuestion) return null;

  const stepLabel = String(index + 1).padStart(2, "0");

  return (
    <main className="grid grid-cols-1 lg:min-h-screen lg:grid-cols-[40fr_60fr]">
      {/* 좌: 사진 + 대형 넘버 */}
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
            <h2 className="font-kr text-[clamp(28px,3.6vw,58px)] leading-[1.22] tracking-[-0.028em] text-fg">
              {currentQuestion.text}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {LIKERT_LABELS.map((label, i) => {
              const value = i + 1;
              const selected = answers[currentQuestion.id] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleAnswer(value)}
                  className={`flex items-center gap-[18px] rounded-[18px] border p-[26px] text-left transition-all duration-150 hover:border-olive hover:bg-panel ${
                    i === 4 ? "col-span-2" : ""
                  }`}
                  style={{
                    borderColor: selected ? "var(--color-olive)" : "var(--color-hair)",
                    background: selected ? "var(--color-sage)" : "var(--color-card)",
                  }}
                >
                  <span
                    className="label-mono text-[11px]"
                    style={{ color: selected ? "var(--color-olive)" : "var(--color-dim)" }}
                  >
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] font-medium text-fg">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-[26px]">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="text-[13px] text-muted transition hover:text-fg disabled:opacity-0"
            >
              ← 이전
            </button>
            <span className="flex items-center gap-[7px]">
              {allQuestions.map((q, i) => (
                <span
                  key={q.id}
                  className="h-[3px] rounded-full transition-all duration-250"
                  style={{
                    width: i === index ? 28 : 8,
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

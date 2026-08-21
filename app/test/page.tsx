"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import lifestyleQuestionsData from "@/data/lifestyle-questions.json";
import mbtiQuestionsData from "@/data/mbti-questions.json";
import { useTestStore } from "@/lib/store";
import { AXIS_LABELS } from "@/lib/types";
import type { MbtiIndicator, MbtiQuestion, Question } from "@/lib/types";

/**
 * 퀴즈 페이지 — app/result/jib-atlas.design/jib.atlas.dc.html의 "2. 퀴즈"
 * 스펙(전면 다크, 좌측 사진+대형 넘버, 카테고리 라벨, 카드형 선택지, 대시
 * 인디케이터)의 무드를 가져오되, 아래 두 가지는 사용자 지시로 다르게 했다:
 * - **문항은 그대로 보존**: 프로토타입의 고정 5문항·4지선다·직접 점수
 *   대신, 실제 23문항(라이프스타일 15 + MBTI 8)·5점 리커트·
 *   lib/scoring.ts의 리버스 스코어링을 그대로 쓴다. 선택지가 5개라
 *   스펙의 2×2 카드 그리드 대신 2×3(6칸 중 1칸 빈칸)으로 배치했다.
 * - **다크 배경은 안 씀**: app/globals.css에 "다크모드는 에디터 화면에만
 *   국한한다"고 이미 적혀 있어서(v2 코멘트 참고), 페이지 전체를 다크로
 *   바꾸지 않고 라이트 토큰을 유지한 채 좌측 패널만 teal-700 같은 진한
 *   톤으로 스펙의 "무게감"만 흉내냈다. 문항별 실사진도 이 프로젝트는
 *   안 쓰기로 해온 원칙이라, 사진 대신 그 진한 패널 위에 대형 고스트
 *   넘버 + 카테고리 라벨을 얹었다.
 */

const lifestyleQuestions = lifestyleQuestionsData as Question[];
const mbtiQuestions = mbtiQuestionsData as MbtiQuestion[];

/** MBTI 4개 지표의 한글 설명 — 표준적으로 쓰이는 이름이라 지어낸 게 아니다. */
const INDICATOR_LABELS: Record<MbtiIndicator, string> = {
  EI: "에너지 방향",
  SN: "인식 방식",
  TF: "판단 기준",
  JP: "생활 양식",
};

type QuizItem = { id: string; text: string; category: string };

/** 라이프스타일 15문항 다음에 MBTI 8문항이 이어지는 순서로 노출한다. */
const allQuestions: QuizItem[] = [
  ...lifestyleQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    category: AXIS_LABELS[q.axis],
  })),
  ...mbtiQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    category: INDICATOR_LABELS[q.indicator],
  })),
];

const LIKERT_LABELS = [
  "전혀 아니다",
  "아니다",
  "보통이다",
  "그렇다",
  "매우 그렇다",
];

const DOT_TEXTURE = (rgba: string, size = 16) => ({
  backgroundImage: `radial-gradient(${rgba} 1px, transparent 1px)`,
  backgroundSize: `${size}px ${size}px`,
});

export default function TestPage() {
  const router = useRouter();
  const answers = useTestStore((state) => state.answers);
  const setAnswer = useTestStore((state) => state.setAnswer);
  const reset = useTestStore((state) => state.reset);
  const [index, setIndex] = useState(0);

  // 새로고침 등으로 다시 들어왔을 때, 이미 응답한 문항 다음부터 이어서 시작한다.
  // answers는 zustand persist가 localStorage에서 복원하는 값이라 서버에는 없다.
  // 서버 렌더 결과와 index=0으로 일치시켜 하이드레이션 불일치를 피하고,
  // 복원된 answers는 마운트 후 이 effect에서 한 번만 index에 반영한다.
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
      router.push("/result");
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (!currentQuestion) return null;

  const stepLabel = String(index + 1).padStart(2, "0");
  const progressPct = ((index + 1) / totalCount) * 100;

  return (
    <main className="grid grid-cols-1 lg:min-h-[calc(100vh_-_63px)] lg:grid-cols-[38fr_62fr]">
      {/* 좌: 진한 톤 패널 — 실사진 대신 대형 고스트 넘버 + 카테고리 */}
      <div className="relative hidden overflow-hidden bg-teal-700 lg:block">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={DOT_TEXTURE("rgba(240,247,244,0.6)")}
        />
        <div className="absolute bottom-11 left-14 flex flex-col gap-2">
          <span className="font-serif text-[120px] leading-[0.9] font-light text-white/10">
            {stepLabel}
          </span>
          <span className="font-mono text-[10px] tracking-[0.4em] text-white/55 uppercase">
            {currentQuestion.category}
          </span>
        </div>
      </div>

      {/* 우: 질문 + 선택지 */}
      <div className="flex flex-col justify-center gap-10 px-6 py-16 sm:px-10 lg:px-20 lg:py-20">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.4em] text-teal-600 uppercase">
              question {stepLabel}
            </span>
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted">
              {index + 1} of {totalCount}
            </span>
          </div>
          <div className="relative h-[2px] bg-border">
            <div
              className="absolute top-0 left-0 h-[2px] bg-teal-600 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-mono text-[11px] tracking-[0.5em] text-coral-600 uppercase lg:hidden">
            {currentQuestion.category}
          </span>
          <h2 className="max-w-[660px] font-serif text-[clamp(26px,3vw,42px)] leading-[1.32] font-light text-pretty">
            {currentQuestion.text}
          </h2>
        </div>

        <div className="grid max-w-[640px] grid-cols-2 gap-3.5 sm:grid-cols-3">
          {LIKERT_LABELS.map((label, i) => {
            const value = i + 1;
            const selected = answers[currentQuestion.id] === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleAnswer(value)}
                className={`flex flex-col items-start gap-3 rounded-[2px] border p-5 text-left transition-all duration-150 ${
                  selected
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-border bg-surface text-foreground hover:border-coral-500"
                }`}
              >
                <span
                  className={`font-mono text-[10px] tracking-[0.3em] ${
                    selected ? "opacity-70" : "opacity-55"
                  }`}
                >
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            );
          })}
          <span aria-hidden className="hidden sm:block" />
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="text-xs text-muted transition hover:text-foreground disabled:opacity-0"
          >
            ← 이전
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setIndex(0);
            }}
            className="text-xs text-muted underline underline-offset-2 transition hover:text-foreground"
          >
            처음부터 다시
          </button>
        </div>
      </div>
    </main>
  );
}

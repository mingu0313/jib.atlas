import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OptionId } from "./types";

interface TestState {
  /** questionId -> 고른 옵션(A/B) */
  answers: Record<string, OptionId>;
  setAnswer: (questionId: string, optionId: OptionId) => void;
  reset: () => void;
}

/**
 * 진단 테스트 응답 상태. localStorage에 저장해서 새로고침해도
 * 진행 상황이 유지되도록 한다.
 *
 * persist 키를 v2로 새로 잡았다 — 이지선다 전환 전엔 값이 1~5 리커트
 * 숫자였는데, 그 값을 그대로 옵션 id(A/B)로 잘못 해석하면 채점이 조용히
 * 깨진다. 기존 키에 남아있던 값과 충돌하지 않도록 별도 키를 쓴다.
 */
export const useTestStore = create<TestState>()(
  persist(
    (set) => ({
      answers: {},
      setAnswer: (questionId, optionId) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: optionId },
        })),
      reset: () => set({ answers: {} }),
    }),
    { name: "jib-atlas-test-answers-v2" },
  ),
);

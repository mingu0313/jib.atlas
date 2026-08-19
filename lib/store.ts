import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TestState {
  /** questionId -> 5점 리커트 응답값 (1~5) */
  answers: Record<string, number>;
  setAnswer: (questionId: string, value: number) => void;
  reset: () => void;
}

/**
 * 진단 테스트 응답 상태. localStorage에 저장해서 새로고침해도
 * 진행 상황이 유지되도록 한다.
 */
export const useTestStore = create<TestState>()(
  persist(
    (set) => ({
      answers: {},
      setAnswer: (questionId, value) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: value },
        })),
      reset: () => set({ answers: {} }),
    }),
    { name: "jib-atlas-test-answers" },
  ),
);

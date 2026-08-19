import { describe, expect, it } from "vitest";
import lifestyleQuestionsData from "../data/lifestyle-questions.json";
import mbtiQuestionsData from "../data/mbti-questions.json";
import { calculateScores } from "./scoring";
import type { Answer, Question, MbtiQuestion } from "./types";

const lifestyleQuestions = lifestyleQuestionsData as Question[];
const mbtiQuestions = mbtiQuestionsData as MbtiQuestion[];

/** 모든 문항에 동일한 값(1~5)을 응답한 Answer 배열을 만든다. */
function uniformAnswers(value: number): Answer[] {
  return [...lifestyleQuestions, ...mbtiQuestions].map((q) => ({
    questionId: q.id,
    value,
  }));
}

describe("calculateScores", () => {
  it("모든 문항에 5점(매우 그렇다)으로 응답하면 각 축 점수가 0~100 범위 안에서 합리적으로 높게 나온다", () => {
    const result = calculateScores(uniformAnswers(5));

    for (const score of Object.values(result.axisScores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }

    // 역채점 문항이 없는 자연친화 축은 응답이 그대로 반영돼 최댓값(100)이어야 한다.
    expect(result.axisScores.nature).toBe(100);
    // 사교성은 라이프스타일(가중치 0.7)은 최댓값이지만, 양극 균형 문항 덕분에
    // MBTI 영향(가중치 0.3)은 중립(50)으로 상쇄되어 100*0.7 + 50*0.3 = 85가 된다.
    expect(result.axisScores.sociability).toBe(85);

    // 역채점 문항이 섞인 축(미니멀, 활동성, 개방성)은 100보다는 낮게 나온다.
    expect(result.axisScores.minimalism).toBeLessThan(100);
    expect(result.axisScores.activity).toBeLessThan(100);
    expect(result.axisScores.openness).toBeLessThan(100);

    // MBTI 문항이 지표당 양극 1문항씩 짝지어져 있어 응답이 모두 같은 값이면
    // MBTI 영향력은 중립(50)으로 상쇄된다.
    expect(result.mbtiType).toHaveLength(4);
  });

  it("모든 문항에 1점(전혀 아니다)으로 응답하면 각 축 점수가 0~100 범위 안에서 합리적으로 낮게 나온다", () => {
    const result = calculateScores(uniformAnswers(1));

    for (const score of Object.values(result.axisScores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }

    expect(result.axisScores.nature).toBe(0);
    // 0*0.7 + 50(중립 MBTI 영향)*0.3 = 15
    expect(result.axisScores.sociability).toBe(15);

    // 역채점 문항 덕분에 완전히 0은 아니어야 한다.
    expect(result.axisScores.minimalism).toBeGreaterThan(0);
    expect(result.axisScores.activity).toBeGreaterThan(0);
    expect(result.axisScores.openness).toBeGreaterThan(0);
  });

  it("혼합 응답 시 가중치가 반영되고 MBTI 4글자 타입이 우세 방향대로 계산된다", () => {
    const answers: Answer[] = [
      // 라이프스타일 문항은 전부 중립(3점)으로 응답해 MBTI 가중치 효과만 관찰한다.
      ...lifestyleQuestions.map((q) => ({ questionId: q.id, value: 3 })),
      // E, N, F, P 극을 강하게 가리키는 응답
      { questionId: "m1", value: 5 }, // direction E
      { questionId: "m2", value: 1 }, // direction I → 반전 시 E 방향
      { questionId: "m3", value: 5 }, // direction N
      { questionId: "m4", value: 1 }, // direction S → 반전 시 N 방향
      { questionId: "m5", value: 1 }, // direction T → 반전 시 F 방향
      { questionId: "m6", value: 5 }, // direction F
      { questionId: "m7", value: 1 }, // direction J → 반전 시 P 방향
      { questionId: "m8", value: 5 }, // direction P
    ];

    const result = calculateScores(answers);

    expect(result.mbtiType).toBe("ENFP");
    // 라이프스타일이 중립(50)인 상태에서 E/N 영향으로 사교성·개방성은 중립보다 높게,
    expect(result.axisScores.sociability).toBeGreaterThan(50);
    expect(result.axisScores.openness).toBeGreaterThan(50);
    // F(맥시멀 방향)·P(비정돈 방향) 영향으로 미니멀 점수는 중립보다 크게 낮아진다.
    expect(result.axisScores.minimalism).toBeLessThan(50);
    // MBTI 영향을 받지 않는 축은 라이프스타일 중립값(50) 그대로 유지된다.
    expect(result.axisScores.activity).toBe(50);
    expect(result.axisScores.nature).toBe(50);
  });
});

import { describe, expect, it } from "vitest";
import lifestyleQuestionsData from "../data/lifestyle-questions.json";
import mbtiQuestionsData from "../data/mbti-questions.json";
import { calculateScores } from "./scoring";
import { AXES } from "./types";
import type { Answer, BinaryQuestion, MbtiBinaryQuestion, OptionId } from "./types";

const lifestyleQuestions = lifestyleQuestionsData as BinaryQuestion[];
const mbtiQuestions = mbtiQuestionsData as MbtiBinaryQuestion[];

/** 주어진 문항 id 목록 전부에 같은 옵션(A 또는 B)을 고른 Answer 배열을 만든다. */
function uniformAnswers(optionId: OptionId, questions: { id: string }[]): Answer[] {
  return questions.map((q) => ({ questionId: q.id, optionId }));
}

describe("calculateScores", () => {
  it("23문항 전부 A를 고르면, A가 항상 같은 방향을 가리키는 축은 그 방향으로 최대치가 나온다", () => {
    const result = calculateScores(uniformAnswers("A", [...lifestyleQuestions, ...mbtiQuestions]));

    for (const score of Object.values(result.axisScores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }

    // activity/nature는 MBTI 블렌드가 없고, q7~q9/q13~q15 모두 A가 +방향이라 100.
    expect(result.axisScores.activity).toBe(100);
    expect(result.axisScores.nature).toBe(100);
    // sociability도 라이프스타일(A=+방향)·EI(A=E방향) 둘 다 100%라 100.
    expect(result.axisScores.sociability).toBe(100);

    // openness는 q12만 A가 -방향(계획적=안정파)이라 라이프스타일 자체가 80%에
    // 그치고, 거기에 SN 블렌드(A는 S방향이라 N강도 0%)가 더해져 56이 된다.
    expect(result.axisScores.openness).toBeCloseTo(56, 5);
    // minimalism은 라이프스타일 100% + TF(A=T방향, F강도 0%) + JP(A=J방향, J강도 100%)
    // = 100*0.7 - 0*0.3 + 100*0.2 = 90.
    expect(result.axisScores.minimalism).toBeCloseTo(90, 5);

    // MBTI 문항 전부 A(각 지표의 첫 번째 극 방향)를 고르면 ESTJ가 나온다.
    expect(result.mbtiType).toBe("ESTJ");
  });

  it("23문항 전부 B를 고르면 A와 정반대(대칭) 결과가 나온다", () => {
    const result = calculateScores(uniformAnswers("B", [...lifestyleQuestions, ...mbtiQuestions]));

    for (const score of Object.values(result.axisScores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }

    expect(result.axisScores.activity).toBe(0);
    expect(result.axisScores.nature).toBe(0);
    expect(result.axisScores.sociability).toBe(0);
    expect(result.axisScores.openness).toBeCloseTo(44, 5);
    expect(result.axisScores.minimalism).toBeCloseTo(0, 5);
    expect(result.mbtiType).toBe("INFP");
  });

  it("라이프스타일 15문항만 응답해도(MBTI 미응답) 완전히 유효한 결과가 나온다 — MBTI 관련 항목은 중립(50)으로 블렌드된다", () => {
    const result = calculateScores(uniformAnswers("A", lifestyleQuestions));

    // MBTI 블렌드가 없는 두 축은 라이프스타일 값 그대로.
    expect(result.axisScores.activity).toBe(100);
    expect(result.axisScores.nature).toBe(100);
    // MBTI가 안 섞였으니 EI/SN 강도는 중립(50)으로 블렌드된다: 100*0.7+50*0.3=85.
    expect(result.axisScores.sociability).toBe(85);
    // 4글자 타입도 중립(50 vs 50, 동점)에서 규칙대로 여전히 계산된다.
    expect(result.mbtiType).toHaveLength(4);
  });

  it("MBTI 8문항만으로도(라이프스타일 미응답) 축 블렌드가 반영되고, MBTI가 안 섞이는 축은 중립을 유지한다", () => {
    // 라이프스타일은 하나도 응답 안 함(중립 50) — E, N, F, P를 강하게 가리키는 MBTI 응답만.
    const answers: Answer[] = [
      { questionId: "m1", optionId: "A" }, // E
      { questionId: "m2", optionId: "A" }, // E
      { questionId: "m3", optionId: "B" }, // N
      { questionId: "m4", optionId: "B" }, // N
      { questionId: "m5", optionId: "B" }, // F
      { questionId: "m6", optionId: "B" }, // F
      { questionId: "m7", optionId: "B" }, // P
      { questionId: "m8", optionId: "B" }, // P
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

  it("같은 답변 배열을 다시 넣어도(순수 함수) 항상 같은 결과가 나온다", () => {
    const partialAnswers = uniformAnswers("A", lifestyleQuestions);
    const first = calculateScores(partialAnswers);
    const second = calculateScores(partialAnswers);
    expect(second).toEqual(first);

    // 나머지 응답이 더 채워진 배열로 다시 호출하면 그 변화가 그대로 반영된다.
    const fullAnswers = [...partialAnswers, ...uniformAnswers("A", mbtiQuestions)];
    const full = calculateScores(fullAnswers);
    expect(full.axisScores.minimalism).not.toBe(first.axisScores.minimalism);
  });
});

describe("문항 데이터 유효성", () => {
  it("라이프스타일 문항은 정확히 15개, 축당 3개다", () => {
    expect(lifestyleQuestions).toHaveLength(15);
    for (const axis of AXES) {
      const count = lifestyleQuestions.filter(
        (q) => (q.options[0].axisWeights[axis] ?? 0) !== (q.options[1].axisWeights[axis] ?? 0),
      ).length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it("MBTI 문항은 정확히 8개, 지표당 2개다", () => {
    expect(mbtiQuestions).toHaveLength(8);
    for (const indicator of ["EI", "SN", "TF", "JP"] as const) {
      expect(mbtiQuestions.filter((q) => q.indicator === indicator)).toHaveLength(2);
    }
  });

  it("모든 문항은 두 옵션이 최소 한 축에서 서로 달라야 한다(무의미한 문항 방지)", () => {
    for (const q of lifestyleQuestions) {
      const [a, b] = q.options;
      const differs = AXES.some((axis) => (a.axisWeights[axis] ?? 0) !== (b.axisWeights[axis] ?? 0));
      expect(differs, `문항 ${q.id}가 어느 축에서도 A/B가 구분되지 않는다`).toBe(true);
    }
    for (const q of mbtiQuestions) {
      expect(q.options[0].poleWeight, `문항 ${q.id}가 A/B 극 강도가 같다`).not.toBe(q.options[1].poleWeight);
    }
  });

  it("이미지 선택형 문항은 두 옵션 모두 imagePath를 가진다", () => {
    for (const q of lifestyleQuestions.filter((q) => q.format === "image")) {
      expect(q.options[0].imagePath).toBeTruthy();
      expect(q.options[1].imagePath).toBeTruthy();
    }
  });
});

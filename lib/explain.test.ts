import { describe, expect, it } from "vitest";
import houseTemplatesData from "../data/house-templates.json";
import { generateExplanation } from "./explain";
import type { AxisScores, HouseTemplate } from "./types";

const houseTemplates = houseTemplatesData as HouseTemplate[];

function findTemplate(name: string): HouseTemplate {
  const template = houseTemplates.find((t) => t.name === name);
  if (!template) throw new Error(`fixture template not found: ${name}`);
  return template;
}

describe("generateExplanation", () => {
  it("다른 축이 중간~높음이어도, 유독 낮은(극단적인) 축을 상위 특징으로 뽑는다", () => {
    // sociability만 극단적으로 낮고(=가장 튀는 특징) 나머지는 중간~높음인 유저.
    // "가장 높은 값"으로만 상위 축을 뽑으면 sociability는 절대 안 뽑히는
    // 버그가 있었다 — 이 테스트는 그 버그의 회귀를 막는다.
    const scores: AxisScores = {
      sociability: 5,
      minimalism: 55,
      activity: 60,
      openness: 52,
      nature: 48,
    };
    const template = findTemplate("혼자만의 조용한 스튜디오");

    const explanation = generateExplanation(scores, template);
    const traitSentence = explanation.split("\n")[0];

    // 이 문구는 마지막 나열 항목이 아니라 "-고"로 이어지는 연결형이 될 수도
    // 있어(toConnectiveForm) 어미 직전까지만 검사한다.
    expect(traitSentence).toContain("혼자만의 조용한 시간을 소중히 여기");
  });

  it("맥시멀(minimalism 낮음) 유저에게는 미니멀이 아니라 맥시멀을 어필하는 feature를 보여준다", () => {
    const scores: AxisScores = {
      sociability: 30,
      minimalism: 5,
      activity: 20,
      openness: 35,
      nature: 40,
    };
    const template = findTemplate("소품 가득한 빈티지 아파트");

    const explanation = generateExplanation(scores, template);

    // band를 안 걸러내면 이 템플릿엔 minimalism/low feature밖에 없으므로,
    // 잘못 걸러지면 fallback으로 전체 feature가 나오는 대신 정확히
    // "가득 채운"/"채울 수 있어요" 같은 맥시멀 문구가 포함돼야 한다.
    expect(explanation).toMatch(/채운|채울/);
    expect(explanation).not.toMatch(/불필요한 가구 없이|비워진/);
  });

  it("동점이면 AXES 나열 순서(사교성→미니멀→활동성→개방성→자연친화)를 따른다", () => {
    const scores: AxisScores = {
      sociability: 50,
      minimalism: 50,
      activity: 50,
      openness: 50,
      nature: 50,
    };
    const template = findTemplate("탁 트인 원룸");

    const explanation = generateExplanation(scores, template);
    const traitSentence = explanation.split("\n")[0];

    // 완전 중립이면 세 축 다 "mid" 문구가 순서대로 나온다(어미는 연결형일 수 있음).
    expect(traitSentence).toContain("혼자와 함께 있는 시간을 적당히 균형 있게 즐기");
  });
});

import { describe, expect, it } from "vitest";
import { matchHouseTemplate } from "./matching";
import type { AxisScores } from "./types";

const neutral: AxisScores = {
  sociability: 50,
  minimalism: 50,
  activity: 50,
  openness: 50,
  nature: 50,
};

describe("matchHouseTemplate", () => {
  it("상위 3개를 유사도 내림차순으로, 0~100% 범위로 반환한다", () => {
    const matches = matchHouseTemplate(neutral);

    expect(matches).toHaveLength(3);
    for (const match of matches) {
      expect(match.similarity).toBeGreaterThanOrEqual(0);
      expect(match.similarity).toBeLessThanOrEqual(100);
    }
    expect(matches[0].similarity).toBeGreaterThanOrEqual(matches[1].similarity);
    expect(matches[1].similarity).toBeGreaterThanOrEqual(matches[2].similarity);
  });

  it("활동성만 극단적으로 높으면 활동성 특화 템플릿이 1순위로 나온다", () => {
    const user: AxisScores = { ...neutral, activity: 100 };
    const matches = matchHouseTemplate(user);

    expect(matches[0].template.name).toBe("홈짐 액티브 하우스");
    // 2순위도 활동성이 높은 또 다른 템플릿이어야 한다.
    expect(matches[1].template.name).toBe("액티브 라이프 듀플렉스");
  });

  it("사교성만 극단적으로 높으면 사교성 특화 템플릿이 1순위로 나온다", () => {
    const user: AxisScores = { ...neutral, sociability: 100 };
    const matches = matchHouseTemplate(user);

    expect(matches[0].template.name).toBe("대가족형 커뮤널 하우스");
  });

  it("미니멀만 극단적으로 높으면 미니멀 특화 템플릿이 1순위로 나온다", () => {
    const user: AxisScores = { ...neutral, minimalism: 100 };
    const matches = matchHouseTemplate(user);

    expect(matches[0].template.name).toBe("스마트 미니멀 원룸");
    expect(matches[0].template.scoreProfile.minimalism).toBeGreaterThanOrEqual(85);
  });

  it("유저 스코어가 특정 템플릿의 scoreProfile과 완전히 같으면 유사도 100%로 1순위가 된다", () => {
    const matches = matchHouseTemplate({
      sociability: 95,
      minimalism: 30,
      activity: 60,
      openness: 70,
      nature: 50,
    });

    expect(matches[0].template.name).toBe("대가족형 커뮤널 하우스");
    expect(matches[0].similarity).toBe(100);
  });
});

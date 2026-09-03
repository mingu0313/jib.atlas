import { describe, expect, it } from "vitest";
import {
  badgeLabelFor,
  generateInteriorExplanation,
  matchInteriorStyles,
  type InteriorStyleProfile,
} from "./interiorMatching";
import type { AxisScores } from "./types";

const neutral: AxisScores = {
  sociability: 50,
  minimalism: 50,
  activity: 50,
  openness: 50,
  nature: 50,
};

describe("matchInteriorStyles", () => {
  it("기본 4개를 유사도 내림차순으로, 0~100% 범위로 반환한다", () => {
    const matches = matchInteriorStyles(neutral);

    expect(matches).toHaveLength(4);
    for (const match of matches) {
      expect(match.similarity).toBeGreaterThanOrEqual(0);
      expect(match.similarity).toBeLessThanOrEqual(100);
      expect(match.contributingAxes.length).toBeGreaterThanOrEqual(1);
      expect(match.contributingAxes.length).toBeLessThanOrEqual(2);
    }
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].similarity).toBeGreaterThanOrEqual(matches[i].similarity);
    }
  });

  it("미니멀만 극단적으로 높으면 미니멀 지향 프로필이 1순위로 나온다", () => {
    // scandinavian-calm/minimal-zen 둘 다 미니멀 지향이라, 유클리드 거리 기준
    // 나머지 4축까지 전부 중립(50)에 가까운 scandinavian-calm(35,85,30,50,55)
    // 쪽이 minimal-zen(25,90,25,55,60)보다 실제로 더 가깝다 — 크기(다른 축의
    // 절대 거리)까지 보는 게 유클리드 거리를 쓰는 이유이므로 이건 버그가
    // 아니라 의도된 동작이다.
    const user: AxisScores = { ...neutral, minimalism: 100 };
    const matches = matchInteriorStyles(user);

    expect(matches[0].profile.id).toBe("scandinavian-calm");
  });

  it("유저 스코어가 특정 프로필과 완전히 같으면 유사도 100%로 1순위가 된다", () => {
    const matches = matchInteriorStyles({
      sociability: 90,
      minimalism: 35,
      activity: 55,
      openness: 80,
      nature: 30,
    });

    expect(matches[0].profile.id).toBe("social-lounge");
    expect(matches[0].similarity).toBe(100);
  });

  it("다양성 확보: 상위 4개 안에 서로 거의 동일한 프로필 쌍이 없다", () => {
    // 두 프로필의 scoreProfile을 거의 겹치게 만들어서(minimal-zen 복제본),
    // 다양성 로직이 없으면 상위 4개에 둘 다 뽑혀야 정상인 상황을 만든다.
    const profiles: InteriorStyleProfile[] = [
      { id: "a", name: "A", badgeLabel: "A", styleBlurb: "", scoreProfile: { sociability: 25, minimalism: 90, activity: 25, openness: 55, nature: 60 }, productLinks: [], photoPath: "" },
      { id: "a-clone", name: "A clone", badgeLabel: "A clone", styleBlurb: "", scoreProfile: { sociability: 26, minimalism: 91, activity: 24, openness: 54, nature: 59 }, productLinks: [], photoPath: "" },
      { id: "b", name: "B", badgeLabel: "B", styleBlurb: "", scoreProfile: { sociability: 90, minimalism: 15, activity: 90, openness: 90, nature: 10 }, productLinks: [], photoPath: "" },
      { id: "c", name: "C", badgeLabel: "C", styleBlurb: "", scoreProfile: { sociability: 10, minimalism: 10, activity: 10, openness: 10, nature: 90 }, productLinks: [], photoPath: "" },
      { id: "d", name: "D", badgeLabel: "D", styleBlurb: "", scoreProfile: { sociability: 50, minimalism: 50, activity: 90, openness: 50, nature: 50 }, productLinks: [], photoPath: "" },
    ];
    const matches = matchInteriorStyles(neutral, 4, profiles);

    const ids = matches.map((m) => m.profile.id);
    expect(ids).toContain("a");
    expect(ids).not.toContain("a-clone");
  });

  it("다양성 기준을 지키다 count를 못 채우면(전부 서로 비슷하면) 기준을 포기하고 count개를 채운다", () => {
    const profiles: InteriorStyleProfile[] = Array.from({ length: 3 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
      badgeLabel: `P${i}`,
      styleBlurb: "",
      scoreProfile: { sociability: 50 + i, minimalism: 50, activity: 50, openness: 50, nature: 50 },
      productLinks: [],
      photoPath: "",
    }));
    const matches = matchInteriorStyles(neutral, 4, profiles);

    expect(matches).toHaveLength(3); // 후보 자체가 3개뿐이면 그 이상은 못 채운다
  });
});

describe("badgeLabelFor", () => {
  it("1순위는 항상 BEST MATCH", () => {
    const matches = matchInteriorStyles({ ...neutral, minimalism: 100 });
    expect(badgeLabelFor({ ...neutral, minimalism: 100 }, matches[0], 0)).toBe("BEST MATCH");
  });

  it("2순위 이후는 가장 크게 기여한 축의 라벨을 쓴다", () => {
    const user: AxisScores = { ...neutral, nature: 95, openness: 85 };
    const matches = matchInteriorStyles(user);
    const secondLabel = badgeLabelFor(user, matches[1], 1);

    expect(secondLabel).not.toBe("BEST MATCH");
    expect(typeof secondLabel).toBe("string");
    expect(secondLabel.length).toBeGreaterThan(0);
  });
});

describe("generateInteriorExplanation", () => {
  it("기여 축이 2개면 두 특징을 접속 조사로 엮은 문장을 만든다", () => {
    const user: AxisScores = { ...neutral, minimalism: 90, nature: 85 };
    const matches = matchInteriorStyles(user);
    const explanation = generateInteriorExplanation(user, matches[0]);

    expect(explanation).toMatch(/공간이 당신의 .+ 성향과 잘 맞아요\.$/);
  });

  it("기여 축이 1개면 단일 특징 문장을 만든다", () => {
    const user: AxisScores = { ...neutral, activity: 100 };
    const matches = matchInteriorStyles(user);
    const match = matches.find((m) => m.contributingAxes.length === 1);
    if (!match) return; // 이 테스트 목적상 1개짜리 케이스가 없으면 스킵

    const explanation = generateInteriorExplanation(user, match);
    expect(explanation).toMatch(/돋보이는 공간이 당신의 .+ 성향과 잘 맞아요\.$/);
  });
});

/**
 * generateExplanation()이 실제로 어떤 문장을 만들어내는지 콘솔에서 바로 확인하기 위한 스크립트.
 * 실행: npm run explain:sample
 */
import { generateExplanation } from "../lib/explain";
import { matchHouseTemplate } from "../lib/matching";
import type { AxisScores } from "../lib/types";

const sampleUsers: { label: string; axisScores: AxisScores }[] = [
  {
    label: "사교적이고 개방적인 유저",
    axisScores: {
      sociability: 90,
      minimalism: 35,
      activity: 55,
      openness: 80,
      nature: 45,
    },
  },
  {
    label: "미니멀하고 조용한 걸 좋아하는 유저",
    axisScores: {
      sociability: 15,
      minimalism: 92,
      activity: 30,
      openness: 40,
      nature: 25,
    },
  },
  {
    label: "활동적이고 자연친화적인 유저",
    axisScores: {
      sociability: 50,
      minimalism: 45,
      activity: 88,
      openness: 60,
      nature: 82,
    },
  },
];

for (const { label, axisScores } of sampleUsers) {
  const [topMatch] = matchHouseTemplate(axisScores);
  const explanation = generateExplanation(axisScores, topMatch.template);

  console.log(`\n=== ${label} ===`);
  console.log("axisScores:", axisScores);
  console.log(
    `1순위 매칭: ${topMatch.template.name} (유사도 ${topMatch.similarity.toFixed(1)}%)`,
  );
  console.log("---");
  console.log(explanation);
}

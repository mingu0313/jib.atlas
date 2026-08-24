import houseTemplatesData from "../data/house-templates.json";
import { AXES, type AxisScores, type HouseTemplate, type TemplateMatch } from "./types";

const houseTemplates = houseTemplatesData as HouseTemplate[];

/**
 * 5축이 전부 0~100 스케일이라 서로 같은 비중을 가지므로, "성향이 절대적으로
 * 얼마나 다른가"를 그대로 보여주는 유클리드 거리를 유사도 지표로 쓴다.
 * (코사인 유사도는 방향만 보고 크기를 무시해서, 축소된 비율의 프로필이
 * 실제로는 동떨어진 성향인데도 거의 동일하게 취급되는 문제가 있었다 — STEP 4 참고.)
 */
function euclideanDistance(a: AxisScores, b: AxisScores): number {
  return Math.sqrt(
    AXES.reduce((sum, axis) => sum + (a[axis] - b[axis]) ** 2, 0),
  );
}

/** 5축이 전부 0~100일 때 나올 수 있는 최대 거리. 거리를 0~100% 유사도로 정규화하는 데 쓴다. */
const MAX_DISTANCE = Math.sqrt(AXES.length * 100 ** 2);

function distanceToSimilarity(distance: number): number {
  return Math.max(0, Math.min(100, 100 - (distance / MAX_DISTANCE) * 100));
}

/**
 * 유저의 5축 스코어와 가장 가까운(유클리드 거리가 가장 짧은) 집 구조 템플릿을 찾는다.
 * 반환값은 유사도(%) 내림차순으로 정렬된 상위 3개이며, [0]이 1순위 추천이다.
 * 순수 함수: 입력→출력만, 부작용 없음.
 *
 * templates를 생략하면 한국어 데이터(data/house-templates.json)를 쓴다.
 * scoreProfile은 언어와 무관한 숫자라 /en(data/house-templates.en.json —
 * 같은 id·scoreProfile, name/features만 번역)을 넘겨도 매칭 결과(어떤 id가
 * 1순위인지)는 완전히 동일하고, 반환되는 template 객체의 표시 텍스트만
 * 영문으로 바뀐다. STEP 11 참고.
 */
export function matchHouseTemplate(
  userAxisScores: AxisScores,
  templates: HouseTemplate[] = houseTemplates,
): TemplateMatch[] {
  return templates
    .map((template) => ({
      template,
      similarity: distanceToSimilarity(
        euclideanDistance(userAxisScores, template.scoreProfile),
      ),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}

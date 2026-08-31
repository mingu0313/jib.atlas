import { ImageResponse } from "next/og";
import houseTemplatesData from "@/data/house-templates.json";
import houseTemplatesEnData from "@/data/house-templates.en.json";
import { ShareCardImage, CARD_SIZES, type ShareCardRatio } from "@/components/shareCard/ShareCardImage";
import { loadShareCardFonts } from "@/lib/shareCard/fonts";
import { loadHousePhotoDataUri, pickHousePhotoFile } from "@/lib/shareCard/housePhoto";
import { generatePersona, generatePersonaEn } from "@/lib/persona";
import { AXES, AXIS_LABELS, AXIS_LABELS_EN, type AxisScores, type HouseTemplate } from "@/lib/types";

/**
 * 결과 공유카드 PNG — 서버사이드 렌더링(Next `ImageResponse`/satori).
 * `/share`, `/en/share`가 이 라우트를 <img src>와 다운로드 양쪽에 그대로
 * 쓴다. GET 하나로 두 사이즈를 `ratio` 쿼리로 분기한다.
 *
 * scores(사교성 등 5개)를 안 넘기면 매칭된 템플릿의 scoreProfile로
 * 대체한다 — `/api/share-card?typeId=t18&ratio=1x1`만으로도 브라우저에서
 * 바로 열어 디자인 QA를 할 수 있게 하는 부수 효과.
 */

const TEMPLATES_KO = houseTemplatesData as HouseTemplate[];
const TEMPLATES_EN = houseTemplatesEnData as HouseTemplate[];

function parseRatio(value: string | null): ShareCardRatio {
  return value === "1x1" ? "1x1" : "9x16";
}

function parseAxisScores(searchParams: URLSearchParams, fallback: AxisScores): AxisScores {
  const scores = { ...fallback };
  for (const axis of AXES) {
    const raw = searchParams.get(axis);
    if (raw === null) continue;
    const n = Number(raw);
    if (Number.isFinite(n)) scores[axis] = Math.max(0, Math.min(100, n));
  }
  return scores;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const lang = searchParams.get("lang") === "en" ? "en" : "ko";
  const templates = lang === "en" ? TEMPLATES_EN : TEMPLATES_KO;

  const typeId = searchParams.get("typeId");
  const templateIndex = templates.findIndex((t) => t.id === typeId);
  if (templateIndex === -1) {
    return new Response("알 수 없는 typeId예요.", { status: 400 });
  }
  const template = templates[templateIndex];

  const ratio = parseRatio(searchParams.get("ratio"));
  const axisScores = parseAxisScores(searchParams, template.scoreProfile);
  const persona = lang === "en" ? generatePersonaEn(axisScores) : generatePersona(axisScores);
  const { width, height } = CARD_SIZES[ratio];

  const photoFile = pickHousePhotoFile(template.id, template.scoreProfile);

  try {
    const [fonts, photoDataUri] = await Promise.all([
      loadShareCardFonts(origin),
      // 사진은 못 구해도 카드 자체는 완성돼야 하니 실패를 여기서 삼키고
      // null로 흡수한다 — ShareCardImage가 밴드를 빈 배경으로 그린다.
      loadHousePhotoDataUri(origin, photoFile).catch((err) => {
        console.error("[share-card] 사진 로딩 실패", err);
        return null;
      }),
    ]);
    return new ImageResponse(
      (
        <ShareCardImage
          ratio={ratio}
          typeIndex={templateIndex + 1}
          typeTotal={templates.length}
          title={template.name}
          description={persona.description}
          axisScores={axisScores}
          axisLabels={lang === "en" ? AXIS_LABELS_EN : AXIS_LABELS}
          photoDataUri={photoDataUri}
        />
      ),
      {
        width,
        height,
        fonts,
        headers: {
          // 매 요청 같은 typeId+ratio+scores면 항상 같은 픽셀이 나오는
          // 순수 렌더링이라 CDN/브라우저가 자유롭게 캐시해도 안전하다.
          "cache-control": "public, max-age=31536000, immutable",
        },
      },
    );
  } catch (err) {
    console.error("[share-card] 이미지 생성 실패", err);
    return new Response("이미지를 만들지 못했어요.", { status: 500 });
  }
}

import { AXES, type Axis, type AxisScores } from "@/lib/types";

/**
 * 공유카드 이미지 밴드에 쓸 "실제 집 사진"을 유형별로 고른다.
 *
 * 30개 템플릿 전부에 짝지어진 실사진은 없다 — 랜딩 페이지가 쓰는 무드
 * 사진 15장(public/photos/*)이 갖고 있는 전부다. 그래서 두 단계로 고른다:
 * 1. components/landing/HouseTypes.tsx의 FEATURED가 이미 특정 템플릿과
 *    실사진을 짝지어둔 4개(t9/t1/t11/t5)는 그 사진을 그대로 쓴다.
 * 2. 나머지 26개는 scoreProfile에서 가장 높은 축의 무드 사진
 *    (axis-*.jpg 5장이 5축과 정확히 1:1로 이미 존재한다)으로 대신한다 —
 *    정확히 그 구조는 아니어도 "이 축이 도드라진 집"이라는 결은 맞는
 *    실사진이 걸린다.
 *
 * 원본은 최대 4400만 화소·10MB짜리라 공유카드 밴드(가로 1080px 기준
 * 세로 260~408px)에 쓰기엔 지나치게 크다 — public/photos/share-card/에
 * 리사이즈본(최장변 1200px, JPEG q74)을 따로 뒀다. 원본은 랜딩 페이지가
 * 그대로 쓴다(스크립트로 만든 파생 자산이라 리사이즈 로직 자체는 커밋에
 * 남기지 않았다 — 원본이 바뀌면 다시 만들면 된다).
 */

const CURATED_PHOTO_FILE: Partial<Record<string, string>> = {
  t9: "type-serene.jpg",
  t1: "type-open.jpg",
  t11: "type-precision.jpg",
  t5: "type-social.jpg",
};

const AXIS_PHOTO_FILE: Record<Axis, string> = {
  sociability: "axis-social.jpg",
  minimalism: "axis-minimal.jpg",
  activity: "axis-activity.jpg",
  openness: "axis-open.jpg",
  nature: "axis-nature.jpg",
};

function dominantAxis(scoreProfile: AxisScores): Axis {
  return AXES.reduce((best, axis) => (scoreProfile[axis] > scoreProfile[best] ? axis : best));
}

export function pickHousePhotoFile(templateId: string, scoreProfile: AxisScores): string {
  return CURATED_PHOTO_FILE[templateId] ?? AXIS_PHOTO_FILE[dominantAxis(scoreProfile)];
}

const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

// fonts.ts와 같은 이유(=[[jib-atlas-cloudflare-no-fs-at-runtime]])로 fs가
// 아니라 자기 자신에게 fetch한다 — Cloudflare Workers엔 런타임 fs가 없다.
const dataUriCache = new Map<string, Promise<string>>();

export function loadHousePhotoDataUri(origin: string, file: string): Promise<string> {
  let cached = dataUriCache.get(file);
  if (!cached) {
    cached = fetch(new URL(`/photos/share-card/${file}`, origin))
      .then(async (res) => {
        if (!res.ok) throw new Error(`공유카드 사진을 불러오지 못했어요: ${file} (${res.status})`);
        const buf = await res.arrayBuffer();
        const ext = file.split(".").pop() ?? "jpg";
        const mime = MIME_BY_EXT[ext] ?? "image/jpeg";
        return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
      })
      .catch((err) => {
        dataUriCache.delete(file);
        throw err;
      });
    dataUriCache.set(file, cached);
  }
  return cached;
}

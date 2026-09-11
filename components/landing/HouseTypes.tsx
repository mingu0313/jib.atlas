import Image from "next/image";
import Link from "next/link";
import houseTemplatesData from "@/data/house-templates.json";
import houseTemplatesEnData from "@/data/house-templates.en.json";
import type { HouseTemplate } from "@/lib/types";

const houseTemplates = houseTemplatesData as HouseTemplate[];
const houseTemplatesEn = houseTemplatesEnData as HouseTemplate[];
const TEMPLATE_COUNT = houseTemplates.length; // 30 (STEP 11-B에서 22 → 30으로 확장)

function byId(id: string, templates: HouseTemplate[]) {
  const t = templates.find((h) => h.id === id);
  if (!t) throw new Error(`house-types: missing template id ${id}`);
  return t;
}

/** 전체 템플릿 중 성향이 뚜렷하게 갈리는 4개를 대표로 뽑는다 — DESIGN-HANDOFF-V2.md
 * "집 유형 4칸"의 사진·이름이 실제 결이 맞는 템플릿으로 짝지었다. "영문명"은 실제
 * 데이터에 없는 필드라, 지어낸 고유명 대신 무드를 요약하는 짧은 영문 태그로
 * 대체했다(진짜 유형명은 그 아래 한글로 그대로 보여준다 — house-templates.json의
 * name을 임의로 바꿔 쓰지 않는다. 이 이름은 진단 결과 페이지 등 다른 화면에서도
 * 같은 뜻으로 쓰이는 실제 유형명이라, 랜딩에서만 다른 문구로 보여주면 둘이
 * 어긋나 보인다).
 *
 * 사진 출처 — "4칸이 다 같은 베이지 원룸 사진처럼 보이고, 설명이랑도 안 맞는다"는
 * 피드백을 받아서(예: "실용적·붙박이 수납" 설명에 가구 하나 없는 새하얀 빈 공간
 * 사진, "온 가족" 설명에 좁은 바 카운터 사진), type-*.jpg 4장 대신
 * data/interior-styles.json(결과 페이지 인테리어 매칭용 10개 스타일, 공간감·색감이
 * 뚜렷이 다름)에서 실제로 설명과 맞는 사진을 가져왔다 — 스타일 매칭 로직
 * (lib/interiorMatching.ts)과는 별개로 사진 에셋만 재사용하는 것이라 서로 영향
 * 없음.
 *
 * 템플릿 선택 — 그다음엔 "탁 트인 원룸(t1)·깔끔하고 실용적인 원룸(t11) 둘 다
 * '원룸'으로 끝나서 문구가 겹쳐 보인다"는 피드백을 받았다. t11 대신, minimalism
 * 축에서 t11(90)보다도 더 극단적인(95, 30개 중 최고) t2("깔끔한 화이트
 * 인테리어")로 교체 — 이름이 "원룸"과 안 겹치고, features[0]("화이트 톤 공간")·
 * features[1]("붙박이 수납장으로 정리")이 흰 붙박이 수납장이 있는
 * interior-scandinavian-calm.jpg와도 문구 그대로 맞아떨어진다. 나머지 3장 이름
 * (스튜디오/원룸/집)과도 안 겹침.
 *   - Serene Nest → t9(혼자만의 조용한 스튜디오): type-serene.jpg — 나무 사이로
 *     볕 드는 창가 리딩 체어, 1인 스케일.
 *   - Open Loft → t1(탁 트인 원룸): interior-industrial-loft.jpg — 나선계단 +
 *     복층 + 높은 천장의 실제 로프트 구조.
 *   - Precision Box → t2(깔끔한 화이트 인테리어): interior-scandinavian-calm.jpg
 *     — 벽 한쪽을 채운 흰 붙박이 수납장.
 *   - Social House → t5(온 가족이 함께 사는 집): interior-active-urban.jpg —
 *     아일랜드 바스툴 4개 + 넉넉한 거실 + 정원 슬라이딩 도어.
 * 네 장 다 이미 4:5 비율로 준비돼 있어 크롭 없이 그대로 들어간다. */
const FEATURED_IDS = [
  { num: "01", tag: "Serene Nest", photo: "/photos/type-serene.jpg", id: "t9" },
  { num: "02", tag: "Open Loft", photo: "/photos/interior-industrial-loft.jpg", id: "t1" },
  { num: "03", tag: "Precision Box", photo: "/photos/interior-scandinavian-calm.jpg", id: "t2" },
  { num: "04", tag: "Social House", photo: "/photos/interior-active-urban.jpg", id: "t5" },
];

/** locale(기본 "ko") — /en 랜딩 다국어 확장(STEP 18). 골라둔 4개 템플릿
 * (id 기준, house-templates.json/house-templates.en.json이 1:1 대응)은
 * 그대로 두고, 보여줄 이름·설명만 언어별 데이터에서 다시 조회한다. */
export function HouseTypes({ locale = "ko" }: { locale?: "ko" | "en" }) {
  const isEn = locale === "en";
  const templates = isEn ? houseTemplatesEn : houseTemplates;
  const FEATURED = FEATURED_IDS.map((f) => ({ ...f, template: byId(f.id, templates) }));

  return (
    <section id="house-types" className="px-6 pt-[100px] pb-[150px] sm:px-10">
      <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end" data-reveal>
        <div className="flex flex-col gap-3">
          <span className="label-mono text-[10px] text-olive-mid">House Types</span>
          <h2 className={`${isEn ? "font-display" : "font-kr"} text-[clamp(28px,4vw,52px)] leading-[1.1] tracking-[-0.02em]`}>
            {isEn ? (
              <>What kind of space are you<span className="heading-dot">.</span></>
            ) : (
              <>당신의 공간은 어떤 성격인가요<span className="heading-dot">.</span></>
            )}
          </h2>
        </div>
        <Link
          href={isEn ? "/en/test" : "/test"}
          className="rounded-full border border-fg/70 px-6 py-3 text-[13px] font-semibold text-fg transition hover:bg-fg hover:text-cream"
        >
          {isEn ? "Find out with the quiz →" : "진단으로 찾아보기 →"}
        </Link>
      </div>
      <p className="mb-10 max-w-lg text-[14px] leading-[1.8] text-muted" data-reveal>
        {isEn
          ? `Here are 4 of the ${TEMPLATE_COUNT} house structures, chosen for how differently they read your personality.`
          : `${TEMPLATE_COUNT}가지 집 구조 중 성향이 뚜렷하게 갈리는 4가지를 먼저 보여드려요.`}
      </p>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-11">
        {FEATURED.map((item) => (
          <div key={item.template.id} className="flex flex-col border-t border-hair pt-[30px]" data-reveal>
            <div className="relative overflow-hidden rounded-[18px]" style={{ aspectRatio: "4 / 5" }}>
              {/* loading="eager" — Hero 바로 아래 첫 스크롤 섹션이라, 기본 lazy가
                  브라우저 native lazy-load 임계 거리에 걸려 스크롤하는 동안 사진이
                  뒤늦게 팝인하는 끊김으로 보였다. 4장뿐이라 전부 즉시 받아도 부담이
                  적다 — Next 16은 priority가 deprecated라(preload로 대체) 여기처럼
                  "화면마다 어떤 게 LCP일지 갈리는 여러 장" 케이스엔 문서가 권장하는
                  대로 preload 대신 loading="eager"를 쓴다. */}
              <Image
                src={item.photo}
                alt={item.template.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                loading="eager"
                className="object-cover"
                style={{ filter: "grayscale(0.18) contrast(0.96)" }}
              />
            </div>
            <span className="label-mono mt-5 text-[10px] text-olive-mid">{item.num}</span>
            <span className="font-display mt-2 text-[29px] leading-[1.1] text-fg">{item.tag}</span>
            <span className={`${isEn ? "font-display" : "font-kr"} mt-1 text-[15px] text-fg`}>{item.template.name}</span>
            <p className="mt-3 text-[14px] leading-[1.7] text-muted">{item.template.features[0]?.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

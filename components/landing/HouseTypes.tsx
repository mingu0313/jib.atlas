import Image from "next/image";
import Link from "next/link";
import houseTemplatesData from "@/data/house-templates.json";
import type { HouseTemplate } from "@/lib/types";

const houseTemplates = houseTemplatesData as HouseTemplate[];
const TEMPLATE_COUNT = houseTemplates.length; // 30 (STEP 11-B에서 22 → 30으로 확장)

function byId(id: string) {
  const t = houseTemplates.find((h) => h.id === id);
  if (!t) throw new Error(`house-types: missing template id ${id}`);
  return t;
}

/** 전체 템플릿 중 성향이 뚜렷하게 갈리는 4개를 대표로 뽑는다 — DESIGN-HANDOFF-V2.md
 * "집 유형 4칸"의 사진과 실제 결이 맞는 템플릿으로 짝지었다. "영문명"은 실제 데이터에
 * 없는 필드라, 지어낸 고유명 대신 무드를 요약하는 짧은 영문 태그로 대체했다(진짜
 * 유형명은 그 아래 한글로 그대로 보여준다).
 *
 * 사진 출처 — "4칸이 다 같은 베이지 원룸 사진처럼 보이고, 설명이랑도 안 맞는다"는
 * 피드백을 받았다(예: "실용적·붙박이 수납" 설명에 가구 하나 없는 새하얀 빈 공간
 * 사진, "온 가족" 설명에 좁은 바 카운터 사진). type-*.jpg 4장은 애초에 한 촬영
 * 톤(따뜻한 베이지, 1인 원룸 스케일)으로만 골라져 있어서 구조적으로 서로 안 갈렸다.
 * 대신 data/interior-styles.json(결과 페이지 인테리어 매칭용 10개 스타일, 각각
 * 공간감·색감이 뚜렷이 다름)에서 실제로 설명과 맞는 사진을 가져왔다 — 스타일
 * 매칭 로직(lib/interiorMatching.ts)과는 별개로 사진 에셋만 재사용하는 것이라
 * 서로 영향 없음.
 *   - Serene Nest(t9, 조용한 스튜디오): 기존 그대로 — 나무 사이로 볕 드는 창가
 *     리딩 체어, 1인 스케일이 문구와 잘 맞았음.
 *   - Open Loft(t1, 천장까지 트인 개방감): interior-industrial-loft.jpg — 나선
 *     계단 + 복층 + 높은 천장이 있는 실제 로프트 구조라 "탁 트인" 문구에 훨씬
 *     직접적으로 맞음.
 *   - Precision Box(t11, 붙박이 수납·효율적 동선): 처음엔 interior-scandinavian-calm.jpg를
 *     썼는데 "Open Loft랑 너무 겹쳐 보인다"는 피드백을 받았다 — 둘 다 "가구
 *     몇 개 놓인 널찍한 방" 와이드샷이라, 사진만으론 실루엣이 비슷했다.
 *     Serene Nest처럼 성격이 뚜렷한 사진이 필요해서 interior-artisan-studio.jpg로
 *     교체 — 마주보게 짝지은 쿠션·오토만, 리본 창까지 좌우 대칭으로 딱 맞춘
 *     구도 자체가 "제자리에 정확히" 있다는 인상을 준다. 톤(카키 벽)도 Open
 *     Loft(어두운 인더스트리얼)·Social House(중성 그레이)와 겹치지 않음.
 *   - Social House(t5, 대가족이 모여 사는 집): interior-active-urban.jpg — 아일랜드
 *     바스툴 4개 + 넉넉한 거실 + 정원으로 이어지는 슬라이딩 도어까지, "사람이
 *     모이는 걸 전제로 지어진 집" 스케일이 실제로 느껴짐.
 * 네 장 다 이미 4:5 비율로 준비돼 있어 크롭 없이 그대로 들어간다. */
const FEATURED = [
  { num: "01", tag: "Serene Nest", photo: "/photos/type-serene.jpg", template: byId("t9") },
  { num: "02", tag: "Open Loft", photo: "/photos/interior-industrial-loft.jpg", template: byId("t1") },
  { num: "03", tag: "Precision Box", photo: "/photos/interior-artisan-studio.jpg", template: byId("t11") },
  { num: "04", tag: "Social House", photo: "/photos/interior-active-urban.jpg", template: byId("t5") },
];

export function HouseTypes() {
  return (
    <section id="house-types" className="px-6 pt-[100px] pb-[150px] sm:px-10">
      <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end" data-reveal>
        <div className="flex flex-col gap-3">
          <span className="label-mono text-[10px] text-olive-mid">House Types</span>
          <h2 className="font-kr text-[clamp(28px,4vw,52px)] leading-[1.1] tracking-[-0.02em]">
            당신의 공간은 어떤 성격인가요<span className="heading-dot">.</span>
          </h2>
        </div>
        <Link
          href="/test"
          className="rounded-full border border-fg/70 px-6 py-3 text-[13px] font-semibold text-fg transition hover:bg-fg hover:text-cream"
        >
          진단으로 찾아보기 →
        </Link>
      </div>
      <p className="mb-10 max-w-lg text-[14px] leading-[1.8] text-muted" data-reveal>
        {TEMPLATE_COUNT}가지 집 구조 중 성향이 뚜렷하게 갈리는 4가지를 먼저 보여드려요.
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
            <span className="font-kr mt-1 text-[15px] text-fg">{item.template.name}</span>
            <p className="mt-3 text-[14px] leading-[1.7] text-muted">{item.template.features[0]?.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

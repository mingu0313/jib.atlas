import Image from "next/image";
import Link from "next/link";
import houseTemplatesData from "@/data/house-templates.json";
import type { HouseTemplate } from "@/lib/types";

const houseTemplates = houseTemplatesData as HouseTemplate[];
const TEMPLATE_COUNT = houseTemplates.length; // 22

function byId(id: string) {
  const t = houseTemplates.find((h) => h.id === id);
  if (!t) throw new Error(`house-types: missing template id ${id}`);
  return t;
}

/** 22개 템플릿 중 성향이 뚜렷하게 갈리는 4개를 대표로 뽑는다 — DESIGN-HANDOFF-V2.md
 * "집 유형 4칸"의 사진 4장(type-serene/open/precision/social)과 실제 결이 맞는 템플릿으로
 * 짝지었다. "영문명"은 실제 데이터에 없는 필드라, 지어낸 고유명 대신 무드를 요약하는
 * 짧은 영문 태그로 대체했다(진짜 유형명은 그 아래 한글로 그대로 보여준다). */
const FEATURED = [
  { num: "01", tag: "Serene Nest", photo: "/photos/type-serene.jpg", template: byId("t9") },
  { num: "02", tag: "Open Loft", photo: "/photos/type-open.jpg", template: byId("t1") },
  { num: "03", tag: "Precision Box", photo: "/photos/type-precision.jpg", template: byId("t11") },
  { num: "04", tag: "Social House", photo: "/photos/type-social.jpg", template: byId("t5") },
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
              <Image
                src={item.photo}
                alt={item.template.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
                style={{ filter: "grayscale(0.18) contrast(0.96)" }}
              />
            </div>
            <span className="label-mono mt-5 text-[10px] text-faint">{item.num}</span>
            <span className="font-display mt-2 text-[29px] leading-[1.1] text-fg">{item.tag}</span>
            <span className="font-kr mt-1 text-[15px] text-fg">{item.template.name}</span>
            <p className="mt-3 text-[14px] leading-[1.7] text-muted">{item.template.features[0]?.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

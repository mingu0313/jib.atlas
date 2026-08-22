import Image from "next/image";

/** DESIGN-HANDOFF-V2.md "인용" 섹션. */
export function Quote() {
  return (
    <section className="grid grid-cols-1 gap-10 px-6 py-[100px] sm:px-10 sm:py-[170px] lg:grid-cols-[42fr_58fr] lg:gap-[70px]">
      <div
        data-px="0.12"
        className="relative overflow-hidden rounded-[28px] bg-photo-bg"
        style={{ aspectRatio: "4 / 5" }}
        data-reveal
      >
        <Image
          src="/photos/quote-wall.jpg"
          alt="질감이 있는 벽 사진"
          fill
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col justify-center gap-8" data-reveal>
        <p className="font-kr text-[clamp(26px,3.4vw,52px)] leading-[1.32] tracking-[-0.02em] text-fg">
          “집은 취향의 결과가 아니라, 취향을 만드는 조건이다.”
        </p>
        <div className="flex flex-col gap-1.5">
          <span className="text-[14px] text-fg">jib.atlas</span>
          <span className="label-mono text-[11px] text-olive-mid">House Series 2026</span>
        </div>
      </div>
    </section>
  );
}

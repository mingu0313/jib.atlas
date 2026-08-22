import Image from "next/image";
import Link from "next/link";

const QUESTION_COUNT = 23;

/** DESIGN-HANDOFF-V2.md "CTA" — 올리브 단색 배경이 아니라 사진 + 어두운
 * 오버레이가 이 섹션의 방식이다. */
export function Cta() {
  return (
    <section className="px-6 pt-[60px] pb-[100px] sm:px-10 sm:pb-[150px]">
      <div
        data-px="0.08"
        className="relative overflow-hidden rounded-[36px] bg-photo-bg px-6 py-[100px] text-center sm:px-10 sm:py-[160px]"
        data-reveal
      >
        <Image
          src="/photos/cta-cabin.jpg"
          alt="숲 속 오두막 사진"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(14,15,12,0.78) 0%, rgba(14,15,12,0.46) 60%, rgba(14,15,12,0.40) 100%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-7">
          <span className="label-mono text-[10px] text-cream/80">
            {QUESTION_COUNT}문항 · 5분
          </span>
          <h2 className="font-kr text-[clamp(34px,6vw,96px)] leading-[1]" style={{ color: "#f7f6f2" }}>
            지금 찾아보세요<span style={{ color: "#c9d3a8" }}>.</span>
          </h2>
          <Link
            href="/test"
            className="rounded-full bg-bg px-[52px] py-[18px] text-[13px] font-semibold text-fg transition hover:bg-cream"
          >
            진단 시작하기 ↗
          </Link>
        </div>
      </div>
    </section>
  );
}

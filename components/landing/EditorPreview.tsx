import Image from "next/image";
import Link from "next/link";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { RD, RW } from "@/lib/editorStore";
import type { IsoFurnitureDef } from "@/lib/types";

const furnitureCount = (furnitureCatalogData as IsoFurnitureDef[]).length; // 9

const STEPS = [
  { n: "01", text: "왼쪽 팔레트에서 소파·테이블 같은 가구를 고릅니다." },
  { n: "02", text: "바닥 타일을 클릭하면 좌상단 기준으로 그 자리에 놓입니다." },
  { n: "03", text: "다른 가구와 겹치거나 방을 벗어나면 자동으로 거부돼요." },
  { n: "04", text: "배치는 계정에 자동으로 저장돼 다음에도 이어서 꾸밀 수 있어요." },
];

/** DESIGN-HANDOFF-V2.md "에디터 프리뷰". */
export function EditorPreview() {
  return (
    <section className="grid min-h-[92vh] grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center gap-8 px-6 py-16 sm:px-10 lg:px-16" data-reveal>
        <h2 className="font-kr text-[clamp(28px,4vw,52px)] leading-[1.1] tracking-[-0.02em]">
          방을 직접 꾸며보세요<span className="heading-dot">.</span>
        </h2>
        <p className="max-w-[420px] text-[15px] leading-[1.8] text-muted">
          매칭된 집 구조 위에서, {RW} × {RD} 타일의 아이소메트릭 룸에 가구를
          직접 배치합니다. 팔레트에서 고르고 타일을 클릭하기만 하면 돼요.
        </p>
        <div className="flex flex-col">
          {STEPS.map((step) => (
            <div key={step.n} className="grid grid-cols-[52px_1fr] items-start gap-2 border-t border-hair py-5 last:border-b last:border-hair">
              <span className="label-mono text-[11px] text-olive-mid">{step.n}</span>
              <span className="text-[14px] leading-[1.7] text-fg">{step.text}</span>
            </div>
          ))}
        </div>
        <Link
          href="/editor"
          className="w-fit rounded-full bg-sage px-8 py-4 text-[13px] font-semibold text-sage-ink transition hover:bg-olive hover:text-cream"
        >
          에디터 열어보기
        </Link>
      </div>

      <div
        data-px="0.10"
        className="relative min-h-[420px] overflow-hidden rounded-none lg:rounded-[36px_0_0_36px]"
      >
        <Image
          src="/photos/editor-studio.jpg"
          alt="스튜디오 인테리어 사진"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          style={{ filter: "grayscale(0.2)" }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[40%]"
          style={{ background: "linear-gradient(to bottom, rgba(14,15,12,0.5), rgba(14,15,12,0))" }}
        />
        <span className="label-mono absolute bottom-8 left-8 text-[10px] text-cream/90">
          {RW} × {RD} Tiles · {furnitureCount} Furniture
        </span>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import type { OptionId } from "@/lib/types";

/** BinaryQuestion.options / MbtiBinaryQuestion.options 둘 다 이 모양만
 * 필요로 한다 — 축 가중치(axisWeights)나 극 강도(poleWeight)는 채점에만
 * 쓰이고 화면엔 안 나오니, 표시에 필요한 값만 뽑아 페이지 쪽에서 매핑해
 * 넘긴다. */
export interface BinaryDisplayOption {
  id: OptionId;
  label?: string;
  imagePath?: string;
}

/**
 * 밸런스게임형/이미지 선택형 문항 하나를 보여주는 이지선다 카드 — ko/en
 * 퀴즈 페이지(app/test/page.tsx, app/en/test/page.tsx)가 공유한다. 기존
 * 5점 리커트 버튼 그리드를 대체한다.
 */
export function BinaryQuestionCard({
  format,
  options,
  onSelect,
}: {
  format: "balance" | "image";
  options: [BinaryDisplayOption, BinaryDisplayOption];
  onSelect: (id: OptionId) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-5">
      {options.map((option, i) => (
        <div key={option.id} className="contents sm:flex">
          {i === 1 && (
            <span className="label-mono hidden shrink-0 items-center text-[10px] text-faint sm:flex">VS</span>
          )}
          <button
            type="button"
            onClick={() => onSelect(option.id)}
            className="group flex w-full flex-1 flex-col overflow-hidden rounded-[18px] border text-left transition-all duration-150 hover:border-olive hover:bg-panel"
            style={{ borderColor: "var(--color-hair)", background: "var(--color-card)" }}
          >
            {format === "image" && option.imagePath ? (
              <>
                <div className="relative h-[180px] w-full sm:h-[220px]">
                  <Image
                    src={option.imagePath}
                    alt={option.label ?? ""}
                    fill
                    sizes="(min-width: 640px) 40vw, 90vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                </div>
                {option.label && (
                  <span className="px-5 py-4 text-[13px] leading-[1.6] text-fg">{option.label}</span>
                )}
              </>
            ) : (
              <span className="flex flex-1 items-center px-6 py-8 text-[16px] leading-[1.6] font-medium text-fg sm:px-7 sm:py-10 sm:text-[17px]">
                {option.label}
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

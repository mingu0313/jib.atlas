"use client";

import Link from "next/link";
import { useMemo } from "react";
import { calculateStudioBudget } from "@/lib/budget";
import { MockPriceProvider } from "@/lib/priceProvider";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";

// 모듈 스코프에 하나만 — MockPriceProvider는 상태가 없는 순수 조회
// 객체라 렌더마다 새로 만들 이유가 없다. 실데이터 Provider로 바꿀 때도
// 이 한 줄만 교체하면 된다(lib/priceProvider.ts 주석 참고).
const priceProvider = new MockPriceProvider();

function formatWon(n: number): string {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

/**
 * STEP 14 — 4단계: 예산. 지금까지 정한 방 크기·마감재·문/창문으로
 * lib/budget.ts가 계산한 값을 총액 + 항목별 브레이크다운으로 보여준다.
 * 가구는 이 스튜디오에 아직 배치 기능이 없어 0원으로만 표시된다 — 나중에
 * /studio에 가구 배치가 생기면 furnitureItems만 채워 넘기면 된다
 * (calculateStudioBudget 시그니처는 이미 그걸 받게 돼 있다).
 */
export function StepBudget({ onBack }: { onBack: () => void }) {
  const roomShape = useRoomBuilderStore((s) => s.roomShape);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);
  const wallColorHex = useRoomBuilderStore((s) => s.wallColorHex);
  const floorStyleId = useRoomBuilderStore((s) => s.floorStyleId);
  const openings = useRoomBuilderStore((s) => s.openings);

  const budget = useMemo(
    () =>
      calculateStudioBudget({
        provider: priceProvider,
        roomShape,
        roomPolygon,
        wallHeightCm,
        wallColorHex,
        floorStyleId,
        openings,
      }),
    [roomShape, roomPolygon, wallHeightCm, wallColorHex, floorStyleId, openings],
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="font-kr text-[clamp(26px,3.4vw,40px)] leading-[1.15]">
          예상 예산이에요<span className="heading-dot">.</span>
        </h1>
        <p className="max-w-lg text-[14px] leading-[1.8] text-muted">
          지금까지 고른 크기·마감재·문/창문을 기준으로 어림한 값이에요.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-[28px] bg-olive px-6 py-12 text-center sm:px-10">
        <span className="label-mono text-[10px] text-sage">Estimated Total</span>
        <span className="font-kr text-[clamp(36px,6vw,64px)] leading-none text-cream">{formatWon(budget.total)}</span>
      </div>

      <div className="flex flex-col rounded-[22px] bg-panel">
        {budget.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 border-b border-hair px-6 py-4 last:border-b-0"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-fg">{item.label}</span>
              <span className="label-mono text-[10px] text-faint">{item.quantityLabel}</span>
            </div>
            <span className="text-[14px] font-semibold text-fg">{formatWon(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-[1.7] text-faint">
        * 실제 쇼핑몰 시세를 조사한 값이 아니라, 이 화면을 위해 대략 어림한 참고용 가격이에요. 가구는 이 스튜디오에서
        아직 배치할 수 없어 0원으로 잡혀 있어요.
      </p>

      {/* STEP 15 역유입 — 강제 팝업이 아니라 마지막 단계 하단에 자연스럽게. */}
      <div className="flex flex-col items-start gap-4 rounded-[22px] border border-hair px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="label-mono text-[10px] text-olive-mid">Lifestyle Quiz</span>
          <p className="text-[14px] text-fg">당신의 라이프스타일 유형도 알아볼까요?</p>
        </div>
        <Link
          href="/test"
          className="shrink-0 rounded-full bg-olive px-6 py-3 text-[12px] font-semibold text-cream transition hover:bg-fg"
        >
          진단 시작하기 →
        </Link>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-full border border-hair px-8 py-4 text-[13px] font-semibold text-[#5f5f57] transition hover:border-olive hover:text-fg"
      >
        ← 이전
      </button>
    </div>
  );
}

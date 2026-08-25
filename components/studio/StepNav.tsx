"use client";

/**
 * 각 Step 컴포넌트 하단의 이전/다음 버튼 쌍 — 5개 Step 파일에 거의 똑같이
 * 복붙돼 있던 걸 DRY. 스타일은 기존 마크업 그대로(시각적 변화 없음).
 * onBack/onNext 둘 다 optional이라 첫 단계(뒤로가기 없음)·마지막 단계
 * (다음 없음)도 그대로 표현할 수 있다.
 */
export function StepNav({
  onBack,
  onNext,
  nextLabel,
  backLabel = "← 이전",
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-hair px-8 py-4 text-[13px] font-semibold text-[#5f5f57] transition hover:border-olive hover:text-fg"
        >
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      {onNext && nextLabel && (
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-olive px-8 py-4 text-[13px] font-semibold text-cream transition hover:bg-fg"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

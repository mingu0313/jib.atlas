"use client";

/**
 * 각 Step 컴포넌트 하단의 이전/다음 버튼 쌍 — 5개 Step 파일에 거의 똑같이
 * 복붙돼 있던 걸 DRY. 스타일은 기존 마크업 그대로(시각적 변화 없음).
 * onBack/onNext 둘 다 optional이라 첫 단계(뒤로가기 없음)·마지막 단계
 * (다음 없음)도 그대로 표현할 수 있다.
 *
 * lang(기본 "ko") — /en/studio 다국어 확장(STEP 16). backLabel 기본값만
 * 언어별로 갈아끼운다 — nextLabel은 단계마다 다른 문장(예: "다음: 치수
 * 조정하기 →")이라 항상 호출부(각 Step 컴포넌트)가 직접 넘긴다.
 */
export function StepNav({
  onBack,
  onNext,
  nextLabel,
  backLabel,
  lang = "ko",
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  lang?: "ko" | "en";
}) {
  const resolvedBackLabel = backLabel ?? (lang === "en" ? "← Back" : "← 이전");
  return (
    <div className="flex items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-hair px-8 py-4 text-[13px] font-semibold text-[#5f5f57] transition hover:border-olive hover:text-fg"
        >
          {resolvedBackLabel}
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

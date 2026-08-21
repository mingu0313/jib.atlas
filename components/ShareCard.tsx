import { AXES, AXIS_LABELS, type AxisScores } from "@/lib/types";
import type { RarityTier } from "@/lib/persona";

/**
 * 인스타 스토리(9:16) 공유용 결과 카드. 그라디언트/중첩 카드 없이
 * 플랫한 색 블록 + teal/coral 액센트만으로 구성한다.
 * PNG 내보내기 기능은 없음 — 화면 그대로 스크린샷해서 공유하는 용도.
 */
export function ShareCard({
  personaName,
  mbtiType,
  templateName,
  rarity,
  similarity,
  axisScores,
}: {
  personaName: string;
  mbtiType: string;
  templateName: string;
  rarity: RarityTier;
  similarity: number;
  axisScores: AxisScores;
}) {
  return (
    <div className="flex aspect-[9/16] w-full max-w-[360px] flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface p-6 text-foreground">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-semibold tracking-tight text-teal-700">
          jib.atlas
        </span>
        <span>라이프스타일 매칭 결과</span>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full bg-coral-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {rarity} · {similarity.toFixed(0)}% 매치
        </span>
        <h2 className="text-2xl font-bold leading-snug">{personaName}</h2>
        <p className="text-sm text-muted">MBTI 성향 {mbtiType}</p>
      </div>

      <div className="flex flex-col gap-2">
        {AXES.map((axis) => (
          <div key={axis} className="flex items-center gap-2 text-xs">
            <span className="w-12 shrink-0 text-muted">
              {AXIS_LABELS[axis]}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-teal-600"
                style={{ width: `${Math.round(axisScores[axis])}%` }}
              />
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm text-muted">당신에게 어울리는 집 구조</p>
        <p className="font-serif text-lg font-normal">{templateName}</p>
      </div>
    </div>
  );
}

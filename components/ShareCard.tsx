import { DEFAULT_PLACED_DEFS } from "@/lib/editorStore";
import { buildIsoBoxes, TILES, WALL_COL0, WALL_ROW0 } from "@/lib/iso";
import { AXES, AXIS_LABELS, type AxisScores } from "@/lib/types";

const TEMPLATE_COUNT = 22;

const BOXES = buildIsoBoxes(DEFAULT_PLACED_DEFS.map((d) => ({ key: `${d.defId}-${d.col}-${d.row}`, ...d })));

/**
 * 인스타 스토리(9:16 화면 안에 뜨는) 공유용 결과 카드 —
 * DESIGN-HANDOFF-V2.md "4. 공유 카드" + jib-atlas-v2-preview.html 마크업.
 * width 440px, radius 32px, 그라데이션 배경(#e6e2d6→#dcd5c3→#d1c8b1),
 * 아이소메트릭 룸(실제 /editor·랜딩 히어로 미니 창과 같은 lib/iso 좌표계
 * 재사용, viewBox만 크롭) → 유형명 → 축 5행 바 → 모노 워터마크.
 *
 * "Instrument Serif 46px 영문 유형명"은 실제 데이터에 영문명이 없어
 * Gowun Batang 국문 유형명으로 대체했다(app/result/page.tsx와 같은 이유).
 * "{{type.num}} / 04"의 04는 프로토타입의 고정 4유형 수 — 실제 22개 템플릿
 * 수로 바꿨다.
 *
 * PNG 내보내기 기능은 없음 — 화면 그대로 캡처해서 공유하는 용도(문서에도
 * "실제 구현에서는 이 카드 영역을 캔버스로 캡처해 이미지 저장/공유"라고
 * 적혀 있다).
 */
export function ShareCard({
  typeNum,
  templateName,
  personaName,
  axisScores,
  axisLabels = AXIS_LABELS,
}: {
  typeNum: string;
  templateName: string;
  personaName: string;
  axisScores: AxisScores;
  /** /en 라우트에서 영문 라벨(AXIS_LABELS_EN)을 넘긴다. 기본은 한국어. STEP 11. */
  axisLabels?: Record<(typeof AXES)[number], string>;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[32px] px-9 pt-10 pb-[34px] shadow-[0_40px_90px_-44px_rgba(18,18,15,0.34)]"
      style={{
        maxWidth: 440,
        background: "linear-gradient(165deg, #e6e2d6 0%, #dcd5c3 60%, #d1c8b1 100%)",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-display text-[19px]" style={{ color: "#2c3714" }}>
          jib.atlas
        </span>
        <span className="label-mono text-[9px]" style={{ color: "rgba(44,55,20,0.55)" }}>
          {typeNum} / {TEMPLATE_COUNT}
        </span>
      </div>

      <div className="mt-[18px] mb-1.5 flex justify-center">
        <svg viewBox="180 10 500 380" className="w-full" style={{ overflow: "visible" }}>
          <polygon points={WALL_ROW0} fill="#d3ccb9" />
          <polygon points={WALL_COL0} fill="#ddd7c7" />
          {TILES.map((t) => (
            <polygon
              key={`${t.col}-${t.row}`}
              points={t.points}
              fill={(t.col + t.row) % 2 ? "#ebe8de" : "#e5e1d6"}
              stroke="rgba(18,18,15,0.05)"
              strokeWidth={0.6}
            />
          ))}
          {BOXES.map((box) => (
            <g key={box.key}>
              <polygon points={box.shadow} fill="rgba(18,18,15,0.07)" />
              <polygon points={box.left} fill={box.leftFill} />
              <polygon points={box.right} fill={box.rightFill} />
              <polygon points={box.top} fill={box.topFill} />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2.5 flex flex-col gap-1.5">
        <span className="font-kr text-[40px] leading-[1.0] tracking-[-0.02em]" style={{ color: "#12120f" }}>
          {templateName}
          <span style={{ color: "#6f8036" }}>.</span>
        </span>
        <span className="text-[15px]" style={{ color: "#5f5f57" }}>
          {personaName}
        </span>
      </div>

      <div className="mt-[22px] flex flex-col" style={{ borderTop: "1px solid rgba(18,18,15,0.14)" }}>
        {AXES.map((axis) => (
          <div
            key={axis}
            className="grid grid-cols-[84px_1fr_26px] items-center gap-3 py-[11px]"
            style={{ borderBottom: "1px solid rgba(18,18,15,0.10)" }}
          >
            <span className="text-[11px]" style={{ color: "#5f5f57" }}>
              {axisLabels[axis]}
            </span>
            <span className="relative block h-[3px]" style={{ background: "rgba(18,18,15,0.10)" }}>
              <span
                className="absolute top-0 left-0 h-[3px]"
                style={{ width: `${Math.round(axisScores[axis])}%`, background: "#41521f" }}
              />
            </span>
            <span className="label-mono text-right text-[9px]" style={{ color: "#86867c" }}>
              {Math.round(axisScores[axis])}
            </span>
          </div>
        ))}
      </div>

      <span className="label-mono mt-5 block text-[9px]" style={{ color: "rgba(44,55,20,0.5)" }}>
        jib-atlas.com — House Series 2026
      </span>
    </div>
  );
}

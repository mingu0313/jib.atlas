import { AXES, type Axis, type AxisScores } from "@/lib/types";

/**
 * 결과 공유카드 — 서버사이드 PNG(ImageResponse/satori, app/api/share-card/route.tsx)
 * 전용 프레젠테이션 컴포넌트. 앱의 일반 페이지 트리에 마운트되는 React
 * 컴포넌트가 아니라 satori가 순회할 JSX 엘리먼트를 만드는 순수 함수라
 * "use client"가 없다 — 훅도, 브라우저 API도 쓰지 않는다.
 *
 * satori는 실제 브라우저 CSS 엔진이 아니라 자체 flex 레이아웃 엔진이라
 * 지원 범위가 제한적이다(https://github.com/vercel/satori#css). 특히:
 * - 자식이 있는 요소는 전부 `display: "flex"`를 명시해야 한다(기본 block
 *   레이아웃이 없다) — 줄바꿈 클램프에 쓰는 `display: "block"`만 예외.
 * - 여러 줄 말줄임(`text-wrap`/`line-clamp`)은 CSS 표준 문법이 아니라
 *   `display: "block"` + `lineClamp: n` 조합으로만 동작한다(satori 자체
 *   확장 — 실제 렌더링해서 확인함, 표준 -webkit-line-clamp 조합은 이 satori
 *   버전에서 무시됐다).
 * - `letterSpacing`은 실험 결과 "0.2em" 같은 문자열 단위가 아니라 그 요소
 *   자기 폰트 크기 기준 px 절대값으로 넘겨야 한다 — em(fontSize, ratio)로
 *   직접 환산한다.
 */

export type ShareCardRatio = "9x16" | "1x1";

export const CARD_SIZES: Record<ShareCardRatio, { width: number; height: number }> = {
  "9x16": { width: 1080, height: 1920 },
  "1x1": { width: 1080, height: 1080 },
};

const COLORS = {
  bg: "#F7F4ED",
  fg: "#16130F",
  muted: "#5A5449",
  faint: "#A39B8A",
  accent: "#B4592F",
  imagePlaceholder: "#EAE5DA",
  track: "#DED8CB",
};

/** em(그 요소 자신의 fontSize 기준) → satori가 받는 px 절대값. */
function em(fontSizePx: number, ratio: number) {
  return fontSizePx * ratio;
}

/**
 * 유형명 길이에 따른 제목 폰트 크기 — 8자 이하/9~12자/13자 이상 3단계.
 * 30종 유형명 길이가 제각각이라(예: "탁 트인 원룸" 6자 vs "작업실 겸용
 * 예술가의 집" 11자) 고정 크기면 길수록 넘치거나 줄바꿈이 어색해진다.
 */
function titleFontSize(title: string, ratio: ShareCardRatio): number {
  const steps = ratio === "9x16" ? ([142, 124, 106] as const) : ([96, 84, 72] as const);
  if (title.length <= 8) return steps[0];
  if (title.length <= 12) return steps[1];
  return steps[2];
}

/**
 * 점수가 가장 높은 축 하나만 강조색을 받는다("최고점 항목 1개만 accent").
 * 동점이면 AXES에 나열된 순서(백엔드 고정 순서)상 앞선 축이 이긴다.
 */
function pickHighestAxis(axisScores: AxisScores): Axis {
  return AXES.reduce((best, axis) => (axisScores[axis] > axisScores[best] ? axis : best));
}

/**
 * 1:1 카드는 상위 3개만 보여준다. "상위"는 (개성이 아니라) 점수 자체가 높은
 * 축 3개를 뜻한다 — 그래야 "최고점 항목" 강조가 항상 화면에 보이는 3개 중
 * 하나가 된다. 노출 순서는 뽑고 나서 다시 AXES 고정 순서로 정렬한다(스펙의
 * "백엔드 순서 유지"를 부분집합에도 적용).
 */
function pickTopAxesByScore(axisScores: AxisScores, count: number): Axis[] {
  const ranked = [...AXES].sort((a, b) => axisScores[b] - axisScores[a]).slice(0, count);
  return AXES.filter((axis) => ranked.includes(axis));
}

export function ShareCardImage({
  ratio,
  typeIndex,
  typeTotal,
  title,
  description,
  axisScores,
  axisLabels,
  roomImageDataUri,
}: {
  ratio: ShareCardRatio;
  /** 1-based 유형 순번. */
  typeIndex: number;
  typeTotal: number;
  title: string;
  description: string;
  axisScores: AxisScores;
  axisLabels: Record<Axis, string>;
  roomImageDataUri: string;
}) {
  const { width, height } = CARD_SIZES[ratio];
  const isSquare = ratio === "1x1";
  const typeCode = String(typeIndex).padStart(3, "0");
  const highestAxis = pickHighestAxis(axisScores);
  const visibleAxes = isSquare ? pickTopAxesByScore(axisScores, 3) : AXES;

  const wordmarkSize = isSquare ? 44 : 50;
  const typeCodeSize = isSquare ? 20 : 23;
  const accentLineSize = isSquare ? 36 : 46;
  const descriptionSize = isSquare ? 32 : 41;
  const bandHeight = isSquare ? 260 : 408;
  const bandRadius = isSquare ? 20 : 26;
  const metricRowGap = isSquare ? 18 : 24;
  const metricLabelWidth = isSquare ? 112 : 134;
  const metricValueWidth = isSquare ? 52 : 62;
  const metricGap = isSquare ? 18 : 22;
  const metricFontSize = isSquare ? 24 : 29;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        boxSizing: "border-box",
        padding: isSquare ? "64px 60px" : "77px 72px",
        backgroundColor: COLORS.bg,
        fontFamily: "Pretendard",
      }}
    >
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ display: "flex", fontFamily: "Instrument Serif", fontSize: wordmarkSize, color: COLORS.fg }}>
          jib.atlas
        </span>
        <span
          style={{
            display: "flex",
            fontSize: typeCodeSize,
            letterSpacing: em(typeCodeSize, 0.2),
            color: COLORS.faint,
          }}
        >
          {typeCode}
        </span>
      </div>

      {/* 본문 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: isSquare ? 28 : 48,
        }}
      >
        <span
          style={{
            display: "flex",
            fontFamily: "Instrument Serif",
            fontStyle: "italic",
            fontSize: accentLineSize,
            color: COLORS.accent,
          }}
        >
          Type {typeIndex} of {typeTotal}
        </span>

        <div
          style={{
            display: "block",
            lineClamp: 2,
            fontWeight: 700,
            fontSize: titleFontSize(title, ratio),
            lineHeight: isSquare ? 1.0 : 0.98,
            letterSpacing: em(titleFontSize(title, ratio), -0.05),
            color: COLORS.fg,
          }}
        >
          {title}
        </div>

        {(!isSquare || description) && (
          <div
            style={{
              display: "block",
              lineClamp: isSquare ? 1 : 2,
              fontSize: descriptionSize,
              lineHeight: 1.5,
              color: COLORS.muted,
              // satori가 style 값으로 undefined를 받으면 내부에서 죽는다 —
              // 1:1엔 maxWidth 제약이 필요 없어서(패딩만으로 충분히 좁다)
              // 아예 키 자체를 안 넣는다.
              ...(isSquare ? {} : { maxWidth: 720 }),
            }}
          >
            {description}
          </div>
        )}

        {/* 이미지 밴드 — 3D 룸 대역. 실패할 수 없는 인라인 data URI라
            #EAE5DA 배경은 항상 보이는 하한선일 뿐 실제로 드러날 일은 없다. */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: bandHeight,
            borderRadius: bandRadius,
            overflow: "hidden",
            backgroundColor: COLORS.imagePlaceholder,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- satori가 읽는 JSX 트리라 next/image가 아니라 이 img 자체가 렌더 대상 */}
          <img src={roomImageDataUri} alt="" width={width} height={bandHeight} style={{ objectFit: "cover" }} />
        </div>

        {/* 지표 */}
        <div style={{ display: "flex", flexDirection: "column", gap: metricRowGap }}>
          {visibleAxes.map((axis) => {
            const score = Math.round(axisScores[axis]);
            const isHighest = axis === highestAxis;
            const valueColor = isHighest ? COLORS.accent : COLORS.fg;
            return (
              <div key={axis} style={{ display: "flex", alignItems: "center", gap: metricGap }}>
                <span
                  style={{
                    display: "flex",
                    width: metricLabelWidth,
                    flex: "none",
                    fontSize: metricFontSize,
                    color: COLORS.muted,
                  }}
                >
                  {axisLabels[axis]}
                </span>
                <div style={{ display: "flex", position: "relative", flex: 1, height: 3, backgroundColor: COLORS.track }}>
                  <div
                    style={{
                      display: "flex",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: `${score}%`,
                      height: "100%",
                      backgroundColor: valueColor,
                    }}
                  />
                </div>
                <span
                  style={{
                    display: "flex",
                    width: metricValueWidth,
                    flex: "none",
                    justifyContent: "flex-end",
                    fontSize: metricFontSize,
                    fontWeight: 600,
                    color: valueColor,
                  }}
                >
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isSquare && (
        <span
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 20,
            letterSpacing: em(20, 0.1),
            color: COLORS.faint,
          }}
        >
          JIB-ATLAS.COM
        </span>
      )}
    </div>
  );
}

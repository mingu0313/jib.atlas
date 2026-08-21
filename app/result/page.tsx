"use client";

import Link from "next/link";
import { FloorPlan } from "@/components/FloorPlan";
import { generateExplanation } from "@/lib/explain";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona, getRarityTier } from "@/lib/persona";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import { AXES, AXIS_LABELS, ROOM_TYPE_LABELS } from "@/lib/types";
import type { Answer, AxisScores } from "@/lib/types";

/**
 * 결과 페이지 — app/result/jib-atlas.design/jib.atlas.dc.html의 결과 화면
 * (`grid 52fr 48fr`, 좌: 유형/캐릭터/CTA, 우: AXIS PROFILE 레이더+막대)을
 * 이 프로젝트의 실제 데이터/로직으로 다시 구현했다. 채점·매칭·캐릭터명은
 * lib/scoring.ts, lib/matching.ts, lib/persona.ts를 그대로 쓴다. 색·radius·
 * 폰트는 app/globals.css 토큰 / app/layout.tsx의 next/font 변수만 쓴다.
 *
 * 원본 프로토타입과 다르게 채운 부분(핸드오프 README에도 명시된 괴리와 같은 종류):
 * - 프로토타입의 고정 영문 유형명(`type.en1/en2`, 예: Serene/Nest) → 없으므로
 *   실제 템플릿 이름(data/house-templates.json)을 마지막 띄어쓰기 기준으로
 *   나눠 2행(300/700 primary) 구성에 맞춤 (모든 템플릿명이 "수식어 + 명사"
 *   구조라 이 방식이 안전하게 통한다)
 * - 고정 서술(`type.desc`) → lib/explain.ts의 generateExplanation() 결과
 *   (유저 축 점수 기반 실제 설명 문장)로 대체
 * - 태그 칩(`type.tags`, 예: "프라이빗 침실") → 매칭된 템플릿의 실제 방 구성
 *   (rooms[].type → ROOM_TYPE_LABELS)에서 뽑음
 * - `--chart-2` 토큰은 globals.css에 없어서(README상 "새 토큰 만들지 말 것")
 *   막대 교차색은 teal-500/teal-600으로 대체
 * - "이런 구조도 어울려요"(2·3순위 매칭)와 "나만의 인테리어" 섹션은 이
 *   핸드오프 파일엔 없는 추가 요청. 전자는 matchHouseTemplate()이 반환하는
 *   상위 3개 중 나머지 두 개를 그대로 보여준다. 후자는 랜딩 페이지 Editor
 *   Preview 섹션과 같은 시각 언어(primary bg + 도트 오버레이 + accent CTA)를
 *   쓰되, 장식용 SVG 대신 실제 매칭된 템플릿의 평면도
 *   (components/FloorPlan.tsx)를 보여준다
 */

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8

const DOT_TEXTURE = (rgba: string, size = 16) => ({
  backgroundImage: `radial-gradient(${rgba} 1px, transparent 1px)`,
  backgroundSize: `${size}px ${size}px`,
});

/** "은둔형 프라이빗 스튜디오" → { lead: "은둔형 프라이빗", tail: "스튜디오" } */
function splitTitle(name: string) {
  const idx = name.lastIndexOf(" ");
  if (idx === -1) return { lead: "", tail: name };
  return { lead: name.slice(0, idx), tail: name.slice(idx + 1) };
}

// 레이더 SVG 기하 — design_handoff의 pt()/ringPts() 공식 그대로.
const RADAR_R = 112;
const RADAR_CX = 170;
const RADAR_CY = 152;

function polarPoint(i: number, value: number): [number, number] {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const r = (RADAR_R * value) / 100;
  return [RADAR_CX + Math.cos(angle) * r, RADAR_CY + Math.sin(angle) * r];
}

function ringPoints(value: number): string {
  return AXES.map((_, i) => {
    const [x, y] = polarPoint(i, value);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function buildRadar(axisScores: AxisScores) {
  const rings = [25, 50, 75, 100].map(ringPoints);
  const axisLines = AXES.map((_, i) => {
    const [x2, y2] = polarPoint(i, 100);
    return { x2, y2 };
  });
  const shapePoints = AXES.map((axis, i) => {
    const [x, y] = polarPoint(i, axisScores[axis]);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const dots = AXES.map((axis, i) => {
    const [x, y] = polarPoint(i, axisScores[axis]);
    return { x, y };
  });
  const labels = AXES.map((axis, i) => {
    const [x, y] = polarPoint(i, 127);
    return {
      text: axis.slice(0, 4).toUpperCase(),
      x,
      y: y + (i === 0 ? -4 : 4),
      anchor: Math.abs(x - RADAR_CX) < 14 ? "middle" : x > RADAR_CX ? "start" : "end",
    } as const;
  });
  return { rings, axisLines, shapePoints, dots, labels };
}

export default function ResultPage() {
  const answers = useTestStore((state) => state.answers);
  const reset = useTestStore((state) => state.reset);

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">아직 결과가 없어요</h1>
        <p className="text-muted">
          진단 테스트를 먼저 완료하면 결과를 볼 수 있어요.
        </p>
        <Link
          href="/test"
          className="rounded-sm bg-teal-600 px-6 py-3 text-white transition hover:bg-teal-700"
        >
          진단 테스트 하러 가기
        </Link>
      </main>
    );
  }

  const answerList: Answer[] = Object.entries(answers).map(
    ([questionId, value]) => ({ questionId, value }),
  );
  const { axisScores, mbtiType } = calculateScores(answerList);
  const matches = matchHouseTemplate(axisScores);
  const topMatch = matches[0];
  const explanation = generateExplanation(axisScores, topMatch.template);
  const [traitSentence, matchSentence, ...featureLines] = explanation.split("\n");
  const persona = generatePersona(axisScores);
  const rarity = getRarityTier(topMatch.similarity);
  const similarity = Math.round(topMatch.similarity);

  const { lead, tail } = splitTitle(topMatch.template.name);
  const typeNum = topMatch.template.id.replace(/^t/, "").padStart(2, "0");
  const roomTags = Array.from(
    new Set(topMatch.template.rooms.map((room) => ROOM_TYPE_LABELS[room.type])),
  ).slice(0, 4);

  const radar = buildRadar(axisScores);
  const axisRows = AXES.map((axis, i) => ({
    axis,
    ko: AXIS_LABELS[axis],
    val: Math.round(axisScores[axis]),
    color: i % 2 ? "var(--color-teal-500)" : "var(--color-teal-600)",
  }));

  return (
    <main>
      <section className="grid grid-cols-1 border-b border-border lg:min-h-[calc(100vh_-_63px)] lg:grid-cols-[52fr_48fr]">
        {/* ── 좌: 유형 / 설명 / 캐릭터 / CTA ── */}
        <div className="flex flex-col justify-center gap-[26px] border-b border-border px-6 py-16 sm:px-10 lg:border-r lg:border-b-0 lg:px-16 lg:py-[90px]">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="font-mono text-[10px] tracking-[0.45em] text-teal-600 uppercase">
              your house type — {typeNum}
            </span>
            <span className="rounded-[2px] border border-coral-500 px-2.5 py-1 font-mono text-[9px] tracking-[0.3em] text-coral-500 uppercase">
              {rarity}
            </span>
          </div>

          <h1 className="font-serif text-[clamp(40px,5.4vw,74px)] leading-[1.02] font-light tracking-[-0.02em]">
            {lead && (
              <>
                {lead}
                <br />
              </>
            )}
            <span className="font-bold text-teal-600">{tail}</span>
          </h1>

          <p className="max-w-[460px] text-[13px] leading-[1.9] text-muted">
            {traitSentence} {matchSentence}
          </p>
          {featureLines.length > 0 && (
            <ul className="flex max-w-[460px] flex-col gap-1.5 text-[13px] leading-[1.7] text-muted">
              {featureLines.map((line, i) => (
                <li key={i}>{line.replace(/^- /, "")}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3">
            <span className="font-mono text-[9px] tracking-[0.4em] text-muted uppercase">
              캐릭터
            </span>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-serif text-[28px] font-normal">{persona.name}</span>
              <span className="text-xs text-muted">MBTI 성향 {mbtiType}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {roomTags.map((tag) => (
              <span
                key={tag}
                className="rounded-[2px] border border-border bg-surface px-3.5 py-2 text-[11px] text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-5">
            <Link
              href="/editor"
              className="rounded-[2px] bg-teal-600 px-10 py-[18px] text-[13px] font-medium text-white transition hover:bg-coral-600"
            >
              이 집 꾸미러 가기
            </Link>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted transition hover:text-foreground"
            >
              다시 진단하기
            </button>
            <Link
              href="/result/share"
              className="text-xs text-muted underline underline-offset-2 transition hover:text-foreground"
            >
              공유 카드 만들기
            </Link>
          </div>
        </div>

        {/* ── 우: AXIS PROFILE ── */}
        <div className="flex flex-col justify-center gap-9 bg-secondary px-6 py-16 sm:px-10 lg:px-16 lg:py-[90px]">
          <div className="flex items-end justify-between gap-5">
            <span className="font-mono text-[10px] tracking-[0.45em] text-teal-600 uppercase">
              axis profile
            </span>
            <div className="text-right">
              <div className="font-serif text-[34px] leading-none">
                {similarity}
                <span className="text-lg">%</span>
              </div>
              <div className="font-mono text-[8px] tracking-[0.3em] text-muted uppercase">
                match
              </div>
            </div>
          </div>

          <div className="flex justify-center border border-border bg-surface p-6">
            <svg viewBox="0 0 340 320" className="w-full max-w-[380px]">
              {radar.rings.map((r, i) => (
                <polygon key={i} points={r} fill="none" stroke="var(--color-border)" strokeWidth={1} />
              ))}
              {radar.axisLines.map((a, i) => (
                <line
                  key={i}
                  x1={RADAR_CX}
                  y1={RADAR_CY}
                  x2={a.x2}
                  y2={a.y2}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
              ))}
              <polygon
                points={radar.shapePoints}
                fill="rgba(35,40,58,0.14)"
                stroke="var(--color-teal-600)"
                strokeWidth={2}
              />
              {radar.dots.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={3.5} fill="var(--color-coral-500)" />
              ))}
              {radar.labels.map((l, i) => (
                <text
                  key={i}
                  x={l.x}
                  y={l.y}
                  textAnchor={l.anchor}
                  fill="var(--color-muted)"
                  fontFamily="var(--font-mono)"
                  fontSize={9}
                  letterSpacing="0.2em"
                >
                  {l.text}
                </text>
              ))}
            </svg>
          </div>

          <div className="flex flex-col border-t border-border">
            {axisRows.map((row) => (
              <div
                key={row.axis}
                className="grid grid-cols-[96px_1fr_44px] items-center gap-[18px] border-b border-border py-4"
              >
                <span className="text-xs text-secondary-foreground">{row.ko}</span>
                <span className="relative block h-[3px] bg-[rgba(35,40,58,0.08)]">
                  <span
                    className="absolute top-0 left-0 h-[3px]"
                    style={{ background: row.color, width: `${row.val}%` }}
                  />
                </span>
                <span className="text-right font-mono text-[10px] text-muted">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 이런 구조도 어울려요 (2·3순위 매칭) ── */}
      <section className="border-b border-border bg-background px-6 py-16 sm:px-10 lg:px-16 lg:py-[90px]">
        <div className="mb-10 flex flex-col gap-3.5">
          <span className="font-mono text-[10px] tracking-[0.45em] text-teal-600 uppercase">
            also matched
          </span>
          <h2 className="font-serif text-[clamp(22px,2.6vw,32px)] font-normal">
            이런 구조도 어울려요
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {matches.slice(1).map((match, i) => (
            <div
              key={match.template.id}
              className="flex flex-col gap-2.5 border border-border bg-surface p-7"
            >
              <span className="font-mono text-[10px] tracking-[0.3em] text-muted uppercase">
                {i + 2}순위 · 유사도 {Math.round(match.similarity)}%
              </span>
              <span className="font-serif text-2xl font-normal">
                {match.template.name}
              </span>
              <span className="text-[13px] leading-[1.7] text-muted">
                {match.template.features[0]?.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 나만의 인테리어 ── */}
      <section className="relative overflow-hidden bg-teal-600 px-6 py-16 sm:px-10 lg:px-16 lg:py-[110px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={DOT_TEXTURE("rgba(255,255,255,0.7)")}
        />
        <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-[26px]">
            <span className="font-mono text-[10px] tracking-[0.45em] text-white/65 uppercase">
              my interior
            </span>
            <h2 className="font-serif text-[clamp(26px,3.2vw,44px)] leading-[1.15] font-normal text-white">
              나만의 인테리어를
              <br />
              완성해보세요
            </h2>
            <p className="max-w-[420px] text-[13px] leading-[1.8] text-white/75">
              {topMatch.template.name} 구조 위에서, 팔레트의 가구를 캔버스로
              끌어놓고 선택해서 이동·회전·삭제하며 당신만의 공간을
              완성하세요. 배치는 계정에 자동으로 저장돼요.
            </p>
            <Link
              href="/editor"
              className="w-fit rounded-[2px] bg-coral-600 px-[34px] py-4 text-[13px] font-medium text-white transition hover:bg-coral-700"
            >
              지금 꾸미러 가기
            </Link>
          </div>
          <div className="flex justify-center [animation:floaty_8s_ease-in-out_infinite]">
            <div className="w-full max-w-[420px] overflow-hidden border border-white/15 bg-surface p-3">
              <FloorPlan rooms={topMatch.template.rooms} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

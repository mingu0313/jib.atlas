"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import houseTemplatesEnData from "@/data/house-templates.en.json";
import { FloorPlan } from "@/components/FloorPlan";
import { generateExplanationEn } from "@/lib/explainEn";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersonaEn, getRarityTierEn } from "@/lib/persona";
import { radarDots, radarLabelPoint, radarRing, radarShape } from "@/lib/radar";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import { AXES, AXIS_LABELS_EN, ROOM_TYPE_LABELS_EN } from "@/lib/types";
import type { Answer, HouseTemplate } from "@/lib/types";

const houseTemplatesEn = houseTemplatesEnData as HouseTemplate[];

/**
 * 영문 결과 페이지(`/en/result`) — STEP 11. app/result/page.tsx와 마크업은
 * 동일하고, 채점(calculateScores)은 언어 무관이라 그대로 쓰되 매칭·페르소나
 * ·설명 문장은 전용 영문 함수/데이터(lib/matching.ts의 templates 파라미터,
 * lib/persona.ts의 *En, lib/explainEn.ts)로 바꿨다. "이런 구조도 어울려요"·
 * "나만의 인테리어"(평면도) 두 섹션도 그대로 옮기고 텍스트만 번역했다.
 */

const TOTAL_QUESTION_COUNT = 23;

export default function EnglishResultPage() {
  const router = useRouter();
  const answers = useTestStore((state) => state.answers);
  const reset = useTestStore((state) => state.reset);

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-display text-xl">No result yet</h1>
        <p className="text-muted">Finish the quiz first to see your result.</p>
        <Link href="/en/test" className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg">
          Take the quiz
        </Link>
      </main>
    );
  }

  const answerList: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
    questionId,
    value,
  }));
  const { axisScores, mbtiType } = calculateScores(answerList);
  const matches = matchHouseTemplate(axisScores, houseTemplatesEn);
  const topMatch = matches[0];
  const explanation = generateExplanationEn(axisScores, topMatch.template);
  const [traitSentence, matchSentence, ...featureLines] = explanation.split("\n");
  const persona = generatePersonaEn(axisScores);
  const rarity = getRarityTierEn(topMatch.similarity);
  const similarity = Math.round(topMatch.similarity);

  const typeNum = topMatch.template.id.replace(/^t/, "").padStart(2, "0");
  const roomTags = Array.from(
    new Set(topMatch.template.rooms.map((room) => ROOM_TYPE_LABELS_EN[room.type])),
  ).slice(0, 4);

  const axisRows = AXES.map((axis, i) => ({
    axis,
    label: AXIS_LABELS_EN[axis],
    val: Math.round(axisScores[axis]),
    color: i % 2 ? "#6f8036" : "#41521f",
  }));
  const dots = radarDots(axisScores);

  function retake() {
    reset();
    window.scrollTo(0, 0);
    router.push("/en/test");
  }

  return (
    <main className="px-6 pt-[100px] pb-[90px] sm:px-10 sm:pt-[150px]">
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="label-mono text-[11px] text-olive-mid">Your House Type — {typeNum}</span>
        <span className="label-mono rounded-full bg-sage px-3.5 py-1.5 text-[10px] text-sage-ink">
          {rarity} · {similarity}%
        </span>
      </div>

      <h1 className="font-display mt-5 text-[clamp(34px,6.5vw,104px)] leading-[1.0] tracking-[-0.02em]">
        {topMatch.template.name}
        <span className="heading-dot">.</span>
      </h1>

      <div className="mt-[70px] grid grid-cols-1 items-start gap-14 lg:grid-cols-[52fr_48fr] lg:gap-[70px]">
        {/* 좌 */}
        <div className="flex flex-col gap-[34px]">
          <p className="max-w-[520px] text-[16px] leading-[1.9] text-[#5f5f57]">
            {traitSentence} {matchSentence}
          </p>
          {featureLines.length > 0 && (
            <ul className="flex max-w-[520px] flex-col gap-1.5 text-[14px] leading-[1.7] text-muted">
              {featureLines.map((line, i) => (
                <li key={i}>{line.replace(/^- /, "")}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-[9px] border-t border-hair pt-6">
            <span className="label-mono text-[10px] text-faint">Character</span>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-display text-[clamp(22px,2.4vw,34px)] tracking-[-0.01em]">{persona.name}</span>
              <span className="text-xs text-muted">MBTI type {mbtiType}</span>
            </div>
            <p className="text-[14px] text-muted">{persona.description}</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="label-mono text-[10px] text-faint">Spaces in this house</span>
            <div className="flex flex-wrap gap-[9px]">
              {roomTags.map((tag) => (
                <span key={tag} className="rounded-full border border-hair px-[18px] py-2.5 text-[13px] text-[#5f5f57]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-[22px]">
            <Link
              href="/studio"
              className="rounded-full bg-olive px-[42px] py-5 text-[15px] font-semibold text-cream transition hover:bg-fg"
            >
              Decorate this room
            </Link>
            <Link
              href="/en/share"
              className="rounded-full bg-sage px-[34px] py-5 text-[14px] font-semibold text-sage-ink transition hover:bg-olive hover:text-cream"
            >
              View share card
            </Link>
            <button type="button" onClick={retake} className="text-[13px] text-muted transition hover:text-fg">
              Retake the quiz
            </button>
          </div>
        </div>

        {/* 우: AXIS PROFILE */}
        <div className="flex flex-col gap-[30px] rounded-[28px] bg-panel px-6 py-11 sm:px-10">
          <span className="label-mono text-[10px] text-olive-mid">Axis Profile</span>

          <div className="flex justify-center">
            <svg viewBox="0 0 340 340" className="w-full max-w-[360px]" style={{ overflow: "visible" }}>
              {[33, 66, 100].map((v) => (
                <polygon key={v} points={radarRing(v)} fill="none" stroke="rgba(18,18,15,0.10)" strokeWidth={1} />
              ))}
              {AXES.map((axis) => {
                const target = dots.find((d) => d.axis === axis)!;
                return (
                  <line
                    key={axis}
                    x1={170}
                    y1={170}
                    x2={target.x}
                    y2={target.y}
                    stroke="rgba(18,18,15,0.10)"
                    strokeWidth={1}
                  />
                );
              })}
              <polygon points={radarShape(axisScores)} fill="rgba(65,82,31,0.14)" stroke="#41521f" strokeWidth={2} />
              {dots.map((d) => (
                <circle key={d.axis} cx={d.x} cy={d.y} r={4} fill="#6f8036" />
              ))}
              {AXES.map((axis, i) => {
                const { x, y, anchor } = radarLabelPoint(i);
                return (
                  <text
                    key={axis}
                    x={x}
                    y={y}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    fontSize={13}
                    fill="#5f5f57"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {AXIS_LABELS_EN[axis]}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-col border-t border-hair">
            {axisRows.map((row) => (
              <div
                key={row.axis}
                className="grid grid-cols-[104px_1fr_30px] items-center gap-4 border-b border-hair py-4"
              >
                <span className="text-[13px] text-[#5f5f57]">{row.label}</span>
                <span className="relative block h-[3px] bg-[rgba(18,18,15,0.08)]">
                  <span
                    className="absolute top-0 left-0 h-[3px]"
                    style={{ background: row.color, width: `${row.val}%` }}
                  />
                </span>
                <span className="label-mono text-right text-[10px] text-faint">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 다른 매칭 후보 ── */}
      <section className="mt-[100px] border-t border-hair pt-[90px]">
        <div className="mb-10 flex flex-col gap-3">
          <span className="label-mono text-[10px] text-olive-mid">Also Matched</span>
          <h2 className="font-display text-[clamp(20px,2.4vw,30px)]">These also suit you</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {matches.slice(1).map((match, i) => (
            <div key={match.template.id} className="flex flex-col gap-2.5 rounded-[22px] bg-panel p-7">
              <span className="label-mono text-[10px] text-faint">
                #{i + 2} match · {Math.round(match.similarity)}% similarity
              </span>
              <span className="font-display text-2xl">{match.template.name}</span>
              <span className="text-[13px] leading-[1.7] text-muted">{match.template.features[0]?.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 나만의 인테리어 ── */}
      <section className="relative mt-[90px] overflow-hidden rounded-[36px] bg-olive px-6 py-16 sm:px-10 lg:px-16 lg:py-[110px]">
        <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-[26px]">
            <span className="label-mono text-[10px] text-sage">My Interior</span>
            <h2 className="font-display text-[clamp(24px,2.8vw,40px)] leading-[1.15] text-cream">
              Make it your own
              <br />
              interior
            </h2>
            <p className="max-w-[420px] text-[13px] leading-[1.8] text-cream/75">
              Starting from a shape, wall color, and floor matched to your {topMatch.template.name} profile, set
              the real dimensions, add doors and windows, and see an estimated budget right away.
            </p>
            <Link
              href="/studio"
              className="w-fit rounded-full bg-sage px-[34px] py-4 text-[13px] font-semibold text-sage-ink transition hover:bg-cream"
            >
              Decorate it now
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-[420px] overflow-hidden rounded-[18px] bg-cream p-3">
              <FloorPlan
                rooms={topMatch.template.rooms}
                roomLabels={ROOM_TYPE_LABELS_EN}
                ariaLabel="House floor plan"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

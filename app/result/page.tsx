"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FloorPlan } from "@/components/FloorPlan";
import { generateExplanation } from "@/lib/explain";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona, getRarityTier } from "@/lib/persona";
import { radarDots, radarLabelPoint, radarRing, radarShape } from "@/lib/radar";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import { AXES, AXIS_LABELS, ROOM_TYPE_LABELS } from "@/lib/types";
import type { Answer } from "@/lib/types";

/**
 * 결과 페이지 — DESIGN-HANDOFF-V2.md "3. 결과" + jib-atlas-v2-preview.html
 * 마크업 그대로. 채점·매칭·캐릭터명은 지시대로 lib/scoring.ts,
 * lib/matching.ts, lib/persona.ts를 쓴다.
 *
 * 문서의 h1(Instrument Serif, 영문 유형명)은 실제 데이터(data/house-templates.json)에
 * 영문명이 없어서 Gowun Batang 국문 유형명으로 대체했다 — 지어낸 영문 고유명을
 * 사실인 것처럼 내세우지 않기 위해서다(House Types 섹션의 "무드 태그"와 달리
 * 이 이름은 유저의 실제 매칭 결과라 정확도가 더 중요하다).
 *
 * "이런 구조도 어울려요"(2·3순위 매칭)·"나만의 인테리어"(평면도) 두 섹션은
 * v2 문서에 없는, 기존에 추가돼 있던 실제 기능이라 v2 토큰으로 재도장만
 * 하고 그대로 유지했다.
 */

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8

export default function ResultPage() {
  const router = useRouter();
  const answers = useTestStore((state) => state.answers);
  const reset = useTestStore((state) => state.reset);

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-kr text-xl">아직 결과가 없어요</h1>
        <p className="text-muted">진단 테스트를 먼저 완료하면 결과를 볼 수 있어요.</p>
        <Link href="/test" className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg">
          진단 테스트 하러 가기
        </Link>
      </main>
    );
  }

  const answerList: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
    questionId,
    value,
  }));
  const { axisScores, mbtiType } = calculateScores(answerList);
  const matches = matchHouseTemplate(axisScores);
  const topMatch = matches[0];
  const explanation = generateExplanation(axisScores, topMatch.template);
  const [traitSentence, matchSentence, ...featureLines] = explanation.split("\n");
  const persona = generatePersona(axisScores);
  const rarity = getRarityTier(topMatch.similarity);
  const similarity = Math.round(topMatch.similarity);

  const typeNum = topMatch.template.id.replace(/^t/, "").padStart(2, "0");
  const roomTags = Array.from(new Set(topMatch.template.rooms.map((room) => ROOM_TYPE_LABELS[room.type]))).slice(
    0,
    4,
  );

  const axisRows = AXES.map((axis, i) => ({
    axis,
    ko: AXIS_LABELS[axis],
    val: Math.round(axisScores[axis]),
    color: i % 2 ? "#6f8036" : "#41521f",
  }));
  const dots = radarDots(axisScores);

  function retake() {
    reset();
    window.scrollTo(0, 0);
    router.push("/test");
  }

  return (
    <main className="px-6 pt-[100px] pb-[90px] sm:px-10 sm:pt-[150px]">
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="label-mono text-[11px] text-olive-mid">Your House Type — {typeNum}</span>
        <span className="label-mono rounded-full bg-sage px-3.5 py-1.5 text-[10px] text-sage-ink">
          {rarity} · {similarity}%
        </span>
      </div>

      <h1 className="font-kr mt-5 text-[clamp(40px,8vw,130px)] leading-[0.98] tracking-[-0.03em]">
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
            <span className="label-mono text-[10px] text-faint">캐릭터</span>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-kr text-[clamp(24px,2.6vw,38px)] tracking-[-0.02em]">{persona.name}</span>
              <span className="text-xs text-muted">MBTI 성향 {mbtiType}</span>
            </div>
            <p className="text-[14px] text-muted">{persona.description}</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="label-mono text-[10px] text-faint">이 집에 있는 공간</span>
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
              이 집 꾸미러 가기
            </Link>
            <Link
              href="/share"
              className="rounded-full bg-sage px-[34px] py-5 text-[14px] font-semibold text-sage-ink transition hover:bg-olive hover:text-cream"
            >
              공유 카드 보기
            </Link>
            <button type="button" onClick={retake} className="text-[13px] text-muted transition hover:text-fg">
              다시 진단하기
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
              {/* 정점에 어떤 축인지 이름을 안 붙여놔서 육각형만 봐선 뭐가 뭔지 알 수
                  없다는 피드백 — 각 정점 바깥에 축 이름을 붙인다. */}
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
                    {AXIS_LABELS[axis]}
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
                <span className="text-[13px] text-[#5f5f57]">{row.ko}</span>
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

      {/* ── 이런 구조도 어울려요 (2·3순위 매칭) — v2 문서 밖 기존 기능, 토큰만 교체 ── */}
      <section className="mt-[100px] border-t border-hair pt-[90px]">
        <div className="mb-10 flex flex-col gap-3">
          <span className="label-mono text-[10px] text-olive-mid">Also Matched</span>
          <h2 className="font-kr text-[clamp(22px,2.6vw,32px)]">이런 구조도 어울려요</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {matches.slice(1).map((match, i) => (
            <div key={match.template.id} className="flex flex-col gap-2.5 rounded-[22px] bg-panel p-7">
              <span className="label-mono text-[10px] text-faint">
                {i + 2}순위 · 유사도 {Math.round(match.similarity)}%
              </span>
              <span className="font-kr text-2xl">{match.template.name}</span>
              <span className="text-[13px] leading-[1.7] text-muted">{match.template.features[0]?.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 나만의 인테리어 — v2 문서 밖 기존 기능, 토큰만 교체 ── */}
      <section className="relative mt-[90px] overflow-hidden rounded-[36px] bg-olive px-6 py-16 sm:px-10 lg:px-16 lg:py-[110px]">
        <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-[26px]">
            <span className="label-mono text-[10px] text-sage">My Interior</span>
            <h2 className="font-kr text-[clamp(26px,3.2vw,44px)] leading-[1.15] text-cream">
              나만의 인테리어를
              <br />
              완성해보세요
            </h2>
            <p className="max-w-[420px] text-[13px] leading-[1.8] text-cream/75">
              {topMatch.template.name} 성향에 맞춘 모양·벽색·바닥을 기본값으로,
              방 크기와 문/창문까지 직접 정하고 예상 예산까지 바로 확인하세요.
            </p>
            <Link
              href="/studio"
              className="w-fit rounded-full bg-sage px-[34px] py-4 text-[13px] font-semibold text-sage-ink transition hover:bg-cream"
            >
              지금 꾸미러 가기
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-[420px] overflow-hidden rounded-[18px] bg-cream p-3">
              <FloorPlan rooms={topMatch.template.rooms} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

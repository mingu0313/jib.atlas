import Image from "next/image";
import Link from "next/link";
import { IsoRoomArt } from "@/components/IsoRoomArt";
import houseTemplatesData from "@/data/house-templates.json";
import { AXIS_LABELS } from "@/lib/types";
import type { HouseTemplate } from "@/lib/types";

/**
 * 랜딩 페이지. 색·radius·폰트는 app/globals.css 토큰과 app/layout.tsx의
 * next/font 변수만 쓰고, 프로토타입의 하드코딩 값은 옮기지 않았다.
 *
 * 히어로만 새 handoff(app/result/jib-atlas.design/jib.atlas.dc.html, 섹션 1)에
 * 맞춰 다시 구현했다 — 아이폰 목업 안의 "결과 화면 축소판"은 순수 장식용
 * 미리보기라 실제 유저 데이터가 없다. 대신 House Types 섹션과 같은 대표
 * 템플릿(FEATURED[0], t9)의 실제 이름/특징/scoreProfile로 채워서 완전히
 * 지어낸 문구는 없게 했다.
 *
 * Process~Footer는 아직 이전 handoff(design_handoff_jib_atlas/jib.atlas.dc.html)
 * 버전 그대로다 — 다음 단계에서 새 handoff에 맞춰 다시 구현할 예정.
 *
 * 원본 프로토타입과 다르게 채운 부분(README에도 명시돼 있던 괴리):
 * - 4가지 고정 유형(Serene Nest 등) → 실제 데이터(data/house-templates.json,
 *   22개)에서 대표 4개를 뽑아 진짜 이름/설명으로 채움
 * - "5문항·3분", "4 types/9 furniture" 같은 프로토타입 전용 숫자 →
 *   실제 문항 수(23)·템플릿 수(22)·가구 수(furniture-catalog.json, 8)로 교체
 * - Unsplash 이미지는 handoff가 실제로 쓰는 URL 그대로 재사용한다(House
 *   Types 섹션의 사진 셀 2개, /test 좌측 패널) — next.config.ts에
 *   images.unsplash.com을 remotePatterns로 허용해뒀다. Cloudflare Workers엔
 *   Next 기본 이미지 최적화(sharp) API가 없어서 images.unoptimized:true로
 *   리사이즈 없이 원본 그대로 서빙한다
 * - Editor Preview 섹션의 에디터 설명 문구는 실제 /editor 구현(아이소메트릭
 *   타일 클릭 배치, components/EditorCanvas.tsx)과 정확히 일치한다
 * - 아이소메트릭 미니룸 SVG는 순수 장식용으로 새로 만든 components/
 *   IsoRoomArt.tsx — 실제 에디터 캔버스 로직과는 무관하다 (그 파일 설명 참고)
 */

const houseTemplates = houseTemplatesData as HouseTemplate[];

const QUESTION_COUNT = 23;
const TEMPLATE_COUNT = houseTemplates.length; // 22

function templateById(id: string) {
  const t = houseTemplates.find((h) => h.id === id);
  if (!t) throw new Error(`landing copy references missing template id: ${id}`);
  return t;
}

/** House Types 섹션에 쓸 대표 4개 — 5축 공간에서 서로 뚜렷이 다른 성향을 고름.
 * photo URL은 handoff의 House Types 사진 셀(01/04)이 실제로 쓰는 것 그대로. */
const FEATURED = [
  {
    num: "01",
    kind: "photo" as const,
    template: templateById("t9"), // 은둔형 프라이빗 스튜디오
    photo: "https://images.unsplash.com/photo-1720706405494-e552f264dd8d?w=700&h=800&fit=crop&auto=format",
  },
  { num: "02", kind: "flat" as const, template: templateById("t1") }, // 오픈형 로프트 스튜디오
  { num: "03", kind: "flat" as const, template: templateById("t11") }, // 스마트 미니멀 원룸
  {
    num: "04",
    kind: "photo" as const,
    template: templateById("t5"), // 대가족형 커뮤널 하우스
    photo: "https://images.unsplash.com/photo-1554612292-c175942fb8c1?w=700&h=800&fit=crop&auto=format",
  },
];

const DOT_TEXTURE = (rgba: string, size = 16) => ({
  backgroundImage: `radial-gradient(${rgba} 1px, transparent 1px)`,
  backgroundSize: `${size}px ${size}px`,
});

/** "은둔형 프라이빗 스튜디오" → { lead: "은둔형 프라이빗", tail: "스튜디오" } — 히어로 목업/
 * /result 양쪽에서 쓰는 "수식어 + 명사" 2행 타이틀 분리 규칙(모든 템플릿명이 이 구조). */
function splitTitle(name: string) {
  const idx = name.lastIndexOf(" ");
  if (idx === -1) return { lead: "", tail: name };
  return { lead: name.slice(0, idx), tail: name.slice(idx + 1) };
}

/** 히어로 아이폰 목업 안 "결과 화면 축소판"용 — FEATURED[0](t9)의 실제 데이터로 채운다.
 * 방문자 본인의 진단 결과가 아니라 순수 미리보기 예시라, 실제 similarity/rarity 대신
 * scoreProfile 중 3축만 뽑아 보여준다. */
const HERO_PREVIEW_TEMPLATE = FEATURED[0].template;
const HERO_PREVIEW_TITLE = splitTitle(HERO_PREVIEW_TEMPLATE.name);
const HERO_PREVIEW_TAGLINE = HERO_PREVIEW_TEMPLATE.features[0]?.text ?? "";
const HERO_PREVIEW_AXES = (["nature", "minimalism", "sociability"] as const).map(
  (axis, i) => ({
    axis,
    val: Math.round(HERO_PREVIEW_TEMPLATE.scoreProfile[axis]),
    color: i % 2 ? "var(--color-teal-500)" : "var(--color-teal-600)",
  }),
);

export default function Home() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative grid grid-cols-1 items-center overflow-hidden border-b border-border bg-background px-6 py-16 sm:px-10 lg:min-h-[calc(100vh_-_63px)] lg:grid-cols-[52fr_48fr] lg:px-16 lg:py-20">
        <div
          className="pointer-events-none absolute -right-[120px] top-[60px] hidden h-[480px] w-[540px] bg-teal-600 opacity-[0.045] lg:block"
          style={{ borderRadius: "62% 38% 47% 53% / 44% 58% 42% 56%" }}
        />

        {/* 좌: 카피 + CTA */}
        <div className="relative flex flex-col items-start gap-[34px] pb-14 lg:pb-0">
          <span className="font-mono text-[10px] tracking-[0.45em] text-teal-600 uppercase">
            jib.atlas — house series 2026
          </span>
          <h1 className="font-serif text-[clamp(50px,6vw,84px)] leading-[1.06] tracking-[-0.02em]">
            <span className="block font-light">나는 어떤</span>
            <span className="block font-normal">집에</span>
            <span className="block font-light text-coral-600 italic">살아야 할까?</span>
          </h1>
          <span className="font-mono text-[11px] tracking-[0.34em] text-muted uppercase">
            {QUESTION_COUNT}문항 · 5분 · 회원가입 없음
          </span>
          <Link
            href="/test"
            className="rounded-full bg-teal-600 px-[46px] py-5 text-sm font-medium text-white shadow-[0_12px_32px_rgba(8,80,65,0.14)] transition-all duration-200 hover:bg-coral-600 hover:shadow-[0_14px_36px_rgba(217,97,62,0.20)]"
          >
            진단 시작하기
          </Link>
        </div>

        {/* 우: 기울어진 아이폰 목업 — 결과 화면 축소판 */}
        <div className="relative flex min-h-[460px] items-center justify-center lg:min-h-[600px] lg:[perspective:1400px]">
          <div
            className="pointer-events-none absolute top-[64%] left-1/2 h-[150px] w-[340px] -translate-x-1/2 -translate-y-1/2 blur-[18px]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(8,80,65,0.10) 0%, rgba(8,80,65,0.04) 45%, rgba(8,80,65,0) 72%)",
            }}
          />

          <div className="relative [animation:floaty_8s_ease-in-out_infinite] [transform-style:preserve-3d]">
            <div
              className="w-[280px] rounded-[48px] p-[11px] sm:w-[308px] lg:[transform:rotateY(-17deg)_rotateX(5deg)_rotateZ(-2.5deg)]"
              style={{
                background: "linear-gradient(150deg,#ffffff 0%,#f4f1e9 60%,#e9e4d8 100%)",
                boxShadow: "0 2px 3px rgba(28,28,24,0.05), 0 30px 70px -20px rgba(8,80,65,0.16)",
              }}
            >
              <div
                className="relative overflow-hidden rounded-[38px] bg-surface"
                style={{ boxShadow: "inset 0 0 0 1px rgba(28,28,24,0.06)" }}
              >
                <div className="absolute top-[11px] left-1/2 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-foreground opacity-90" />

                <div className="flex flex-col gap-5 px-6 pt-[52px] pb-[30px]">
                  <div className="flex flex-col gap-[9px]">
                    <span className="font-mono text-[7px] tracking-[0.42em] text-teal-600 uppercase">
                      your house type — 01
                    </span>
                    <span className="font-serif text-[31px] leading-[1.04] font-light">
                      {HERO_PREVIEW_TITLE.lead && (
                        <>
                          {HERO_PREVIEW_TITLE.lead}
                          <br />
                        </>
                      )}
                      <span className="font-semibold text-teal-600">
                        {HERO_PREVIEW_TITLE.tail}
                      </span>
                    </span>
                    <span className="font-serif text-[13px] leading-[1.5] text-muted italic">
                      {HERO_PREVIEW_TAGLINE}
                    </span>
                  </div>

                  <div className="flex justify-center border-t border-b border-border py-2">
                    <svg viewBox="0 0 120 116" width={128} style={{ display: "block" }}>
                      <polygon
                        points="60,10 105.6,43.2 88.2,96.8 31.8,96.8 14.4,43.2"
                        fill="none"
                        stroke="rgba(8,80,65,0.12)"
                        strokeWidth={1}
                      />
                      <polygon
                        points="60,34 82.8,50.6 74.1,77.4 45.9,77.4 37.2,50.6"
                        fill="none"
                        stroke="rgba(8,80,65,0.10)"
                        strokeWidth={1}
                      />
                      <polygon
                        points="60,22 87.4,49.1 68.5,69.7 47.3,75.5 21.2,45.4"
                        fill="rgba(8,80,65,0.13)"
                        stroke="var(--color-teal-600)"
                        strokeWidth={1.6}
                      />
                      {[
                        [60, 22],
                        [87.4, 49.1],
                        [68.5, 69.7],
                        [47.3, 75.5],
                        [21.2, 45.4],
                      ].map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r={2.6} fill="var(--color-coral-500)" />
                      ))}
                    </svg>
                  </div>

                  <div className="flex flex-col gap-[11px]">
                    {HERO_PREVIEW_AXES.map((row) => (
                      <div
                        key={row.axis}
                        className="grid grid-cols-[52px_1fr_22px] items-center gap-2.5"
                      >
                        <span className="text-[9px] text-secondary-foreground">
                          {AXIS_LABELS[row.axis]}
                        </span>
                        <span className="relative block h-[3px] bg-[rgba(8,80,65,0.08)]">
                          <span
                            className="absolute top-0 left-0 h-[3px]"
                            style={{ background: row.color, width: `${row.val}%` }}
                          />
                        </span>
                        <span className="text-right font-mono text-[8px] text-muted">
                          {row.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-full bg-teal-600 py-[13px] text-center text-[10px] font-medium text-white">
                    이 집 꾸미러 가기
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 떠 있는 원형 배지 */}
          <div className="absolute top-[66px] right-4 hidden [animation:floaty_6s_ease-in-out_infinite] sm:block">
            <div
              className="flex h-[66px] w-[66px] rotate-[-8deg] items-center justify-center rounded-full bg-surface"
              style={{ boxShadow: "0 10px 26px -8px rgba(8,80,65,0.20), 0 0 0 1px rgba(8,80,65,0.06)" }}
            >
              <svg viewBox="0 0 34 26" width={30} style={{ display: "block" }}>
                <polygon
                  points="17,3 31,11 17,19 3,11"
                  fill="none"
                  stroke="var(--color-teal-600)"
                  strokeWidth={1.4}
                />
                <polygon points="3,11 17,19 17,23.6 3,15.6" fill="rgba(8,80,65,0.14)" />
                <polygon points="31,11 17,19 17,23.6 31,15.6" fill="rgba(217,97,62,0.22)" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="border-b border-border bg-background px-6 py-16 sm:px-10 lg:px-16 lg:py-[110px]">
        <div className="mb-12 flex flex-col gap-3.5 lg:mb-16">
          <span className="font-mono text-[10px] tracking-[0.45em] text-teal-600 uppercase">
            how it works
          </span>
          <h2 className="font-serif text-[clamp(26px,3.2vw,44px)] font-normal">
            어떻게 진행되나요?
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:gap-12">
          {[
            {
              n: "01",
              title: "성향 진단",
              desc: `라이프스타일 15문항과 MBTI 보조 8문항, 총 ${QUESTION_COUNT}문항에 답하면 사교성·미니멀리즘·활동성·개방성·자연친화도 점수가 계산됩니다.`,
            },
            {
              n: "02",
              title: "집 유형 발견",
              desc: `${TEMPLATE_COUNT}가지 유형 중 가장 가까운 곳으로 매칭되고, 레이더 차트로 다섯 축을 확인합니다.`,
            },
            {
              n: "03",
              title: "직접 꾸미기",
              desc: "2D 룸 에디터에서 가구를 골라 원하는 자리에 배치하며 공간을 완성합니다.",
            },
          ].map((step) => (
            <div key={step.n} className="flex flex-col gap-3 border-t-2 border-teal-600 pt-[26px]">
              <span className="font-mono text-[10px] tracking-[0.4em] text-coral-600">
                {step.n}
              </span>
              <h3 className="font-serif text-2xl font-normal">{step.title}</h3>
              <p className="text-[13px] leading-[1.8] text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── House Types ── */}
      <section className="border-b border-border bg-secondary px-6 py-16 sm:px-10 lg:px-16 lg:py-[110px]">
        <div className="mb-14 flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end lg:mb-16">
          <div className="flex flex-col gap-3.5">
            <span className="font-mono text-[10px] tracking-[0.45em] text-teal-600 uppercase">
              house types
            </span>
            <h2 className="font-serif text-[clamp(26px,3.2vw,44px)] leading-[1.15] font-normal">
              당신의 공간은
              <br />
              어떤 성격인가요?
            </h2>
          </div>
          <Link
            href="/test"
            className="rounded-[2px] border border-teal-600 px-[26px] py-[14px] text-xs whitespace-nowrap text-teal-600 transition hover:bg-teal-600 hover:text-white"
          >
            진단으로 찾아보기 →
          </Link>
        </div>
        <p className="mb-8 max-w-lg text-[13px] leading-[1.8] text-muted">
          {TEMPLATE_COUNT}가지 집 구조 중 성향이 뚜렷하게 갈리는 4가지를
          먼저 보여드려요.
        </p>
        <div className="grid grid-cols-1 gap-0 border border-border sm:grid-cols-2">
          {FEATURED.map((item, i) => {
            const feature = item.template.features[0]?.text;
            if (item.kind === "flat") {
              // primary(딥틸) 배경 셀 — 기본 border-border(틸 틴트)는 이 배경에서
              // 안 보이니 밝은 반투명 라인을 따로 쓴다. i===1(우상단)은 데스크톱
              // 기준 왼쪽 경계, i===2(좌하단)는 위쪽 경계.
              const lightBorder =
                i === 1 ? "border-t sm:border-t-0 sm:border-l" : "border-t";
              return (
                <div
                  key={item.template.id}
                  className={`flex min-h-[290px] flex-col justify-between border-white/12 bg-teal-600 p-9 ${lightBorder}`}
                >
                  <span className="font-serif text-[64px] leading-none font-light text-white/35">
                    {item.num}
                  </span>
                  <div className="flex flex-col gap-2.5">
                    <span className="font-serif text-[30px] text-white">
                      {item.template.name}
                    </span>
                    <span className="text-xs leading-[1.8] text-white/75">{feature}</span>
                  </div>
                </div>
              );
            }
            // 사진 셀 — 실사진 위에 딥틸 그라디언트를 얹어 텍스트를 흰 톤으로 얹는다.
            const border = i === 3 ? "border-t border-border sm:border-l" : "";
            return (
              <div
                key={item.template.id}
                className={`relative flex min-h-[290px] flex-col justify-end overflow-hidden ${border}`}
              >
                <Image
                  src={item.photo}
                  alt={item.template.name}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(8,80,65,0.86), rgba(8,80,65,0.05))",
                  }}
                />
                <div className="relative flex flex-col gap-1.5 p-8">
                  <span className="font-mono text-[9px] tracking-[0.4em] text-white/70">
                    {item.num}
                  </span>
                  <span className="font-serif text-[30px] font-normal text-white">
                    {item.template.name}
                  </span>
                  <span className="text-xs leading-[1.8] text-white/80">{feature}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Editor Preview ── */}
      <section className="relative overflow-hidden bg-teal-600 px-6 py-16 sm:px-10 lg:px-16 lg:py-[110px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={DOT_TEXTURE("rgba(255,255,255,0.7)")}
        />
        <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-[26px]">
            <span className="font-mono text-[10px] tracking-[0.45em] text-white/65 uppercase">
              the editor
            </span>
            <h2 className="font-serif text-[clamp(26px,3.2vw,44px)] leading-[1.15] font-normal text-white">
              방을 직접
              <br />
              꾸며보세요
            </h2>
            <p className="max-w-[400px] text-[13px] leading-[1.8] text-white/75">
              10 × 8 타일의 아이소메트릭 룸. 팔레트에서 가구를 고르고 타일을
              클릭하면 그 자리에 놓입니다. 겹치는 자리에는 놓이지 않아요.
              배치는 계정에 자동으로 저장돼요.
            </p>
            <Link
              href="/editor"
              className="w-fit rounded-[2px] bg-coral-600 px-[34px] py-4 text-[13px] font-medium text-white transition hover:bg-coral-700"
            >
              에디터 열어보기
            </Link>
          </div>
          <div className="flex justify-center [animation:floaty_8s_ease-in-out_infinite]">
            <IsoRoomArt className="w-full max-w-[460px]" tone="onPrimary" />
          </div>
        </div>
      </section>

      {/* ── Quiz CTA ── */}
      <section className="relative overflow-hidden bg-secondary px-6 py-20 text-center sm:px-10 lg:px-16 lg:py-[130px]">
        <span className="pointer-events-none absolute top-[14%] left-[6%] font-serif text-[120px] leading-none font-light text-teal-600/[0.06] sm:text-[180px]">
          01
        </span>
        <span className="pointer-events-none absolute right-[6%] bottom-[8%] font-serif text-[120px] leading-none font-light text-teal-600/[0.06] sm:text-[180px]">
          {QUESTION_COUNT}
        </span>
        <div className="relative flex flex-col items-center gap-7">
          <span className="font-mono text-[10px] tracking-[0.45em] text-teal-600 uppercase">
            무료 · 회원가입 불필요
          </span>
          <h2 className="font-serif text-[clamp(34px,5vw,68px)] leading-[1.1] font-light">
            {QUESTION_COUNT}가지 질문,
            <br />
            <span className="font-normal text-teal-600 italic">5분</span>
          </h2>
          <Link
            href="/test"
            className="rounded-[2px] bg-teal-600 px-[60px] py-[18px] text-[13px] font-medium text-white transition hover:bg-coral-600"
          >
            진단 시작하기
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="flex items-center justify-between gap-6 border-t border-border px-6 py-8 sm:px-10 lg:px-16">
        <span className="font-serif text-base">
          jib<span className="text-coral-600">.</span>atlas
        </span>
        <span className="font-mono text-[9px] tracking-[0.35em] text-muted uppercase">
          jib-atlas.com — house series 2026
        </span>
      </footer>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { HeroFloorPlan } from "@/components/HeroFloorPlan";
import { IsoRoomArt } from "@/components/IsoRoomArt";
import houseTemplatesData from "@/data/house-templates.json";
import type { HouseTemplate } from "@/lib/types";

/**
 * 랜딩 페이지. 색·radius·폰트는 app/globals.css 토큰과 app/layout.tsx의
 * next/font 변수만 쓰고, 프로토타입의 하드코딩 값은 옮기지 않았다.
 *
 * 히어로는 사용자가 직접 준 새 디자인 브리프("그레이지+카퍼, 건축 도면"
 * — 좌 30%/우 70% 비대칭, 세리프 금지, 건축 도면 라인 드로잉, 스크롤
 * 조립 애니메이션 하나만)로 완전히 새로 만들었다. 아이폰 목업 등 이전
 * handoff 기반 버전은 걷어냈다 — components/HeroFloorPlan.tsx 참고.
 * 색·폰트 팔레트는 브리프 확인대로 사이트 전체 토큰(app/globals.css)에
 * 반영해서 아래 Process~Footer(아직 handoff 레이아웃 그대로)도 새
 * 팔레트를 자동으로 물려받는다.
 *
 * Process~Footer는 레이아웃(3단 프로세스, House Types 체커보드, Editor
 * Preview 밴드, Quiz CTA)은 이전 handoff 그대로 두고, 새 팔레트/폰트
 * 토큰을 물려받은 김에 타이포 굵기(h2~h3를 그로테스크에 맞는
 * font-semibold로)와 구분선(두꺼운 컬러 보더 → 헤어라인)만 다듬었다.
 * House Types 체커보드·숫자 마커(01~04, 실제 순번)·Editor Preview의
 * IsoRoomArt(실제 /editor가 진짜 아이소메트릭이라 정확한 표현)는 브리프의
 * "금지 목록"과 안 겹쳐서 그대로 뒀다.
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

export default function Home() {
  return (
    <main>
      {/* ── Hero — 좌 30% 카피 / 우 70% 건축 도면 라인 드로잉 ── */}
      <section className="grid grid-cols-1 border-b border-border bg-background lg:min-h-[calc(100vh_-_63px)] lg:grid-cols-[30fr_70fr]">
        <div className="flex flex-col justify-center gap-7 border-b border-border px-6 py-16 sm:px-10 lg:border-r lg:border-b-0 lg:px-12 lg:py-0">
          <span className="font-mono text-[10px] tracking-[0.4em] text-muted uppercase">
            jib.atlas — house series 2026
          </span>
          <h1 className="font-serif text-[clamp(30px,3vw,44px)] leading-[1.2] font-semibold tracking-[-0.01em] text-foreground">
            나는 어떤 <span className="text-coral-500">집</span>에 살아야
            할까?
          </h1>
          <p className="max-w-[320px] text-[13px] leading-[1.8] text-muted">
            사교성·미니멀리즘·활동성·개방성·자연친화도. 다섯 개의 축으로
            취향을 읽고, {TEMPLATE_COUNT}가지 집 구조 중 당신에게 맞는 곳을
            찾아 직접 꾸며봅니다.
          </p>
          <Link
            href="/test"
            className="w-fit rounded-[2px] bg-teal-600 px-8 py-4 text-[13px] font-medium text-white transition hover:bg-coral-600"
          >
            성향 진단 시작하기
          </Link>
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted uppercase">
            {QUESTION_COUNT}문항 · 5분
          </span>
        </div>

        <div className="relative min-h-[420px] overflow-hidden bg-surface lg:min-h-0">
          <div className="absolute inset-0 p-8 sm:p-12 lg:p-16">
            <HeroFloorPlan className="h-full w-full" />
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="border-b border-border bg-background px-6 py-16 sm:px-10 lg:px-16 lg:py-[110px]">
        <div className="mb-12 flex flex-col gap-3.5 lg:mb-16">
          <span className="font-mono text-[10px] tracking-[0.45em] text-teal-600 uppercase">
            how it works
          </span>
          <h2 className="font-serif text-[clamp(26px,3.2vw,44px)] font-semibold">
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
            <div key={step.n} className="flex flex-col gap-3 border-t border-foreground pt-[26px]">
              <span className="font-mono text-[10px] tracking-[0.4em] text-coral-600">
                {step.n}
              </span>
              <h3 className="font-serif text-2xl font-semibold">{step.title}</h3>
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
            <h2 className="font-serif text-[clamp(26px,3.2vw,44px)] leading-[1.15] font-semibold">
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
                    <span className="font-serif text-[30px] font-semibold text-white">
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
                      "linear-gradient(to top, rgba(35,40,58,0.86), rgba(35,40,58,0.05))",
                  }}
                />
                <div className="relative flex flex-col gap-1.5 p-8">
                  <span className="font-mono text-[9px] tracking-[0.4em] text-white/70">
                    {item.num}
                  </span>
                  <span className="font-serif text-[30px] font-semibold text-white">
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
            <h2 className="font-serif text-[clamp(26px,3.2vw,44px)] leading-[1.15] font-semibold text-white">
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
          <h2 className="font-serif text-[clamp(34px,5vw,68px)] leading-[1.1] font-semibold">
            {QUESTION_COUNT}가지 질문,
            <br />
            <span className="text-coral-500">5분</span>
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

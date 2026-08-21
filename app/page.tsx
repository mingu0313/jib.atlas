import Link from "next/link";
import { IsoRoomArt } from "@/components/IsoRoomArt";
import houseTemplatesData from "@/data/house-templates.json";
import type { HouseTemplate } from "@/lib/types";

/**
 * 랜딩 페이지 — design_handoff_jib_atlas/jib.atlas.dc.html("에디토리얼 딥틸"
 * 하이파이 디자인, README 기준 픽셀 단위 재현 대상)를 이 Next.js/Tailwind
 * 환경의 패턴으로 다시 구현했다. 색·radius·폰트는 app/globals.css 토큰과
 * app/layout.tsx의 next/font 변수만 쓰고, 프로토타입의 하드코딩 값은
 * 옮기지 않았다.
 *
 * 원본 프로토타입과 다르게 채운 부분(README에도 명시돼 있던 괴리):
 * - 4가지 고정 유형(Serene Nest 등) → 실제 데이터(data/house-templates.json,
 *   22개)에서 대표 4개를 뽑아 진짜 이름/설명으로 채움
 * - "5문항·3분", "4 types/9 furniture" 같은 프로토타입 전용 숫자 →
 *   실제 문항 수(23)·템플릿 수(22)·가구 수(furniture-catalog.json, 8)로 교체
 * - Unsplash 이미지 hotlink → 이 프로젝트는 실사진을 안 쓰기로 해왔어서
 *   같은 자리에 flat 컬러 + 도트 텍스처로 대체
 * - "10×8 타일 클릭 배치" 같은 에디터 설명 → 지금 실제 에디터(react-konva
 *   드래그앤드롭)에 맞는 문구로 수정
 * - 아이소메트릭 미니룸 SVG는 순수 장식용으로 새로 만든 components/
 *   IsoRoomArt.tsx — 실제 에디터 캔버스 로직과는 무관하다 (그 파일 설명 참고)
 */

const houseTemplates = houseTemplatesData as HouseTemplate[];

const QUESTION_COUNT = 23;
const TEMPLATE_COUNT = houseTemplates.length; // 22
const FURNITURE_COUNT = 8;

function templateById(id: string) {
  const t = houseTemplates.find((h) => h.id === id);
  if (!t) throw new Error(`landing copy references missing template id: ${id}`);
  return t;
}

/** House Types 섹션에 쓸 대표 4개 — 5축 공간에서 서로 뚜렷이 다른 성향을 고름. */
const FEATURED = [
  { num: "01", kind: "text" as const, template: templateById("t9") }, // 은둔형 프라이빗 스튜디오
  { num: "02", kind: "flat" as const, template: templateById("t1") }, // 오픈형 로프트 스튜디오
  { num: "03", kind: "flat" as const, template: templateById("t11") }, // 스마트 미니멀 원룸
  { num: "04", kind: "text" as const, template: templateById("t5") }, // 대가족형 커뮤널 하우스
];

const DOT_TEXTURE = (rgba: string, size = 16) => ({
  backgroundImage: `radial-gradient(${rgba} 1px, transparent 1px)`,
  backgroundSize: `${size}px ${size}px`,
});

export default function Home() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="grid min-h-[calc(100vh_-_63px)] grid-cols-1 border-b border-border lg:grid-cols-[55fr_45fr]">
        <div className="flex flex-col justify-center gap-[30px] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
          <span className="font-mono text-[10px] tracking-[0.45em] text-teal-600 uppercase">
            jib.atlas — house series 2026
          </span>
          <h1 className="font-serif text-[clamp(50px,6vw,84px)] leading-[1.02] tracking-[-0.02em]">
            <span className="block font-light">나는 어떤</span>
            <span className="block font-bold text-teal-600">집에</span>
            <span className="block font-light italic">살아야 할까?</span>
          </h1>
          <p className="max-w-[420px] text-[13px] leading-[1.8] text-muted">
            사교성·미니멀리즘·활동성·개방성·자연친화도. 다섯 개의 축으로
            취향을 읽고, {TEMPLATE_COUNT}가지 집 구조 중 당신에게 맞는 곳을
            찾아 직접 꾸며봅니다.
          </p>
          <div className="flex flex-wrap items-center gap-[22px]">
            <Link
              href="/test"
              className="rounded-[2px] bg-teal-600 px-10 py-[18px] text-[13px] font-medium text-white transition hover:bg-coral-600"
            >
              성향 진단 시작하기
            </Link>
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted uppercase">
              {QUESTION_COUNT}문항 · 5분
            </span>
          </div>
          <div className="mt-5 flex items-center gap-3.5">
            <span className="h-px w-14 bg-teal-600 opacity-40" />
            <span className="font-mono text-[9px] tracking-[0.4em] text-muted uppercase">
              scroll
            </span>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden border-t border-border bg-secondary lg:border-t-0 lg:border-l">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={DOT_TEXTURE("rgba(8,80,65,0.22)")}
          />
          <div
            className="pointer-events-none absolute -left-[90px] top-[110px] h-[380px] w-[420px] bg-teal-600 opacity-[0.07]"
            style={{ borderRadius: "62% 38% 47% 53% / 44% 58% 42% 56%" }}
          />
          <div className="absolute inset-0 flex items-center justify-center [animation:floaty_7s_ease-in-out_infinite]">
            <IsoRoomArt className="w-[86%]" />
          </div>
          <div className="absolute top-10 left-10 flex flex-col gap-1.5">
            <span className="font-mono text-[9px] tracking-[0.4em] text-teal-600 uppercase">
              preview
            </span>
            <span className="text-[11px] text-muted">가구 배치 예시</span>
          </div>
          <div className="absolute right-6 bottom-6 flex border border-border bg-surface sm:right-10 sm:bottom-10">
            <div className="border-r border-border px-[20px] py-[14px]">
              <div className="font-serif text-[22px]">{TEMPLATE_COUNT}</div>
              <div className="font-mono text-[8px] tracking-[0.3em] text-muted uppercase">
                types
              </div>
            </div>
            <div className="border-r border-border px-[20px] py-[14px]">
              <div className="font-serif text-[22px]">{FURNITURE_COUNT}</div>
              <div className="font-mono text-[8px] tracking-[0.3em] text-muted uppercase">
                furniture
              </div>
            </div>
            <div className="px-[20px] py-[14px]">
              <div className="font-serif text-[22px]">
                5<span className="text-[13px]">분</span>
              </div>
              <div className="font-mono text-[8px] tracking-[0.3em] text-muted uppercase">
                to finish
              </div>
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
            // secondary(웜 샌드) 배경 셀 — 일반 border-border로 충분히 보인다.
            const border = i === 3 ? "border-t border-border sm:border-l" : "";
            return (
              <div
                key={item.template.id}
                className={`relative flex min-h-[290px] flex-col justify-end overflow-hidden bg-secondary p-8 ${border}`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={DOT_TEXTURE("rgba(8,80,65,0.18)", 14)}
                />
                <div className="relative flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] tracking-[0.4em] text-teal-600">
                    {item.num}
                  </span>
                  <span className="font-serif text-[30px] font-normal">
                    {item.template.name}
                  </span>
                  <span className="text-xs leading-[1.8] text-muted">{feature}</span>
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
              추천받은 집 구조 위에서, 팔레트의 가구를 캔버스로 끌어놓고
              선택해서 이동·회전·삭제하며 나만의 공간을 완성하세요. 배치는
              계정에 자동으로 저장돼요.
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

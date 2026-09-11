import Image from "next/image";
import Link from "next/link";
import { ROOM_SHAPE_PRESETS } from "@/lib/roomBuilderStore";

const STEPS = [
  { n: "01", text: "정사각형·직사각형·L자형 중 방 모양을 고르고, 실제 치수를 cm/ft로 입력합니다." },
  { n: "02", text: "벽에 문과 창문을 배치하고, 벽 색상·바닥 스타일을 고릅니다." },
  { n: "03", text: "3D로 바로 확인하면서 마음에 들 때까지 자유롭게 바꿔볼 수 있어요." },
  { n: "04", text: "카탈로그에서 가구를 골라 원하는 자리에 자유롭게 배치해보세요." },
];

/** STEPS의 영문판 — /en 랜딩 다국어 확장(STEP 18). */
const STEPS_EN = [
  { n: "01", text: "Pick a room shape — square, rectangle, or L-shaped — and enter the real dimensions in cm/ft." },
  { n: "02", text: "Place doors and windows on the walls, and choose a wall color and floor style." },
  { n: "03", text: "Check it in 3D as you go, and freely tweak it until it feels right." },
  { n: "04", text: "Pick furniture from the catalog and place it wherever you like." },
];

/**
 * 랜딩 "에디터 프리뷰" 섹션 — 원래 STEP 8(격자+박스가구 아이소메트릭
 * 에디터, `/editor`)을 설명했지만, `/studio`(STEP 11~14 정밀 룸빌더)로
 * 진단 결과 흐름이 통합되면서 이 섹션도 `/studio`가 실제로 하는 일 —
 * 모양·치수 → 문/창문·마감재 → 3D → 가구 배치 — 로 다시 썼다. 옛 카피(타일
 * 클릭, 가구 배치, 자동 저장)를 그대로 두고 링크만 바꾸면 실제로 없는
 * 기능을 약속하게 돼서, 4단계 설명 전체를 교체했다.
 *
 * 04번 항목은 원래 "예상 예산까지 보여드려요"였는데, 예산 단계(STEP 14)를
 * 실제 가격 데이터 없이 mock 단가로만 굴러가는 기능이라 판단해 전면
 * 삭제하면서 여기 카피도 실제로 남은 마지막 단계(가구 배치)로 바꿨다 —
 * 위 문단이 경고한 "실제로 없는 기능을 약속" 문제가 그대로 재발할
 * 뻔했다.
 *
 * locale(기본 "ko") — /en 랜딩 다국어 확장(STEP 18). "/studio" 링크도
 * locale에 맞춰 "/en/studio"로 바뀐다.
 */
export function EditorPreview({ locale = "ko" }: { locale?: "ko" | "en" }) {
  const isEn = locale === "en";
  const steps = isEn ? STEPS_EN : STEPS;
  return (
    // min-h-[92vh]는 lg 전용이다 — 모바일(grid-cols-1)에서 컨테이너 전체에
    // 걸면, 텍스트 칸(짧다)과 사진 칸을 합친 자연 높이가 92vh보다 모자랄 때
    // grid의 auto 트랙이 그 차이를 각 행 사이 여백으로 늘려버려서 "스튜디오
    // 열어보기" 버튼과 사진 사이에 쓸데없이 큰 빈 공간이 생겼다(실기기
    // 리포트: "배치가 어색함"). lg에서 2컬럼일 땐 의도대로 두 칸 높이를
    // 맞추는 용도라 그대로 둔다.
    <section className="grid grid-cols-1 lg:min-h-[92vh] lg:grid-cols-2">
      <div className="flex flex-col justify-center gap-8 px-6 py-16 sm:px-10 lg:px-16" data-reveal>
        <h2 className={`${isEn ? "font-display" : "font-kr"} text-[clamp(28px,4vw,52px)] leading-[1.1] tracking-[-0.02em]`}>
          {isEn ? (
            <>Decorate the room yourself<span className="heading-dot">.</span></>
          ) : (
            <>방을 직접 꾸며보세요<span className="heading-dot">.</span></>
          )}
        </h2>
        <p className="max-w-[420px] text-[15px] leading-[1.8] text-muted">
          {isEn
            ? "An interior studio that starts from the shape, wall color, and floor matched to your house structure, then lets you set the exact room size and doors/windows, and furnish it freely."
            : "매칭된 집 구조에 맞춘 모양·벽색·바닥을 기본값 삼아, 방 크기와 문/창문까지 직접 정하고 가구까지 자유롭게 배치하는 인테리어 스튜디오입니다."}
        </p>
        <div className="flex flex-col">
          {steps.map((step) => (
            <div key={step.n} className="grid grid-cols-[52px_1fr] items-start gap-2 border-t border-hair py-5 last:border-b last:border-hair">
              <span className="label-mono text-[11px] text-olive-mid">{step.n}</span>
              <span className="text-[14px] leading-[1.7] text-fg">{step.text}</span>
            </div>
          ))}
        </div>
        <Link
          href={isEn ? "/en/studio" : "/studio"}
          className="w-fit rounded-full bg-sage px-8 py-4 text-[13px] font-semibold text-sage-ink transition hover:bg-olive hover:text-cream"
        >
          {isEn ? "Open the studio" : "스튜디오 열어보기"}
        </Link>
      </div>

      <div
        data-px="0.10"
        className="relative min-h-[420px] overflow-hidden rounded-none lg:rounded-[36px_0_0_36px]"
      >
        <Image
          src="/photos/editor-studio.jpg"
          alt={isEn ? "Studio interior photo" : "스튜디오 인테리어 사진"}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          style={{ filter: "grayscale(0.2)" }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[40%]"
          style={{ background: "linear-gradient(to bottom, rgba(14,15,12,0.5), rgba(14,15,12,0))" }}
        />
        <span className="label-mono absolute bottom-8 left-8 text-[10px] text-cream/90">
          {ROOM_SHAPE_PRESETS.length} Room Shapes · cm/ft · 3D Preview
        </span>
      </div>
    </section>
  );
}

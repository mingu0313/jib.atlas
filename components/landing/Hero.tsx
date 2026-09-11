import houseTemplatesData from "@/data/house-templates.json";
import { HeroPhotoStage } from "@/components/landing/HeroPhotoStage";

const QUESTION_COUNT = 23;
const TEMPLATE_COUNT = houseTemplatesData.length;

/**
 * DESIGN-HANDOFF-V2.md "1. 랜딩 > Hero". 프로토타입의 "5문항·3분"은 실제
 * 문항 수(라이프스타일 15 + MBTI 8 = 23)로 바꿔 썼다 — 이 저장소가 v1 때부터
 * 지켜온 관례("프로토타입 전용 숫자 대신 실제 데이터/문항 수 사용", 예전
 * app/page.tsx 주석 참고)와 같은 이유다.
 *
 * 사진 스테이지(자동 순환 크로스페이드)는 클라이언트 상태가 필요해
 * HeroPhotoStage로 분리했다 — 그 컴포넌트 주석에 문서 "히어로 자동 순환"
 * 섹션과의 대응이 적혀 있다.
 *
 * locale(기본 "ko") — /en 랜딩 다국어 확장(STEP 18). 예전엔 /en 랜딩이 이
 * 섹션 대신 완전히 축약된 자체 히어로를 썼는데(app/en/page.tsx 옛 버전),
 * 한국어판과 내용이 어긋나 있다는 피드백으로 이 컴포넌트를 그대로
 * 공유하는 쪽으로 바꿨다 — TEMPLATE_COUNT는 ko/en 데이터 길이가 항상
 * 같아서(house-templates.en.json은 house-templates.json의 1:1 번역)
 * 어느 쪽을 세도 무방하다.
 */
export function Hero({ locale = "ko" }: { locale?: "ko" | "en" }) {
  const isEn = locale === "en";
  return (
    <section className="px-6 pt-[150px] sm:px-10 sm:pt-[210px]">
      <span className="label-mono block text-[10px] text-olive-mid">
        House Series 2026
      </span>
      <h1
        className={`${isEn ? "font-display" : "font-kr"} mt-6 max-w-[1500px] text-[clamp(40px,9vw,160px)] leading-[0.94] tracking-[-0.035em] text-fg text-balance`}
      >
        {isEn ? (
          <>We&rsquo;ll draw your space&rsquo;s blueprint, right now<span className="heading-dot">.</span></>
        ) : (
          <>당신의 공간 설계도, 지금 그려드릴게요<span className="heading-dot">.</span></>
        )}
      </h1>
      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-[420px] text-[15px] leading-[1.75] text-muted">
          {isEn
            ? `Five axes read your taste and draw up one of ${TEMPLATE_COUNT} house structures for you. Then it's yours to decorate.`
            : `다섯 개의 축으로 취향을 읽고, ${TEMPLATE_COUNT}가지 집 구조 중 하나로 설계도를 그립니다. 그다음은 직접 꾸며보는 일입니다.`}
        </p>
        <span className="label-mono text-[10px] text-muted">
          {isEn ? `${QUESTION_COUNT} questions · 5 min` : `${QUESTION_COUNT}문항 · 5분`}
        </span>
      </div>

      <div className="relative mt-[60px] h-[70vh] min-h-[420px] sm:mt-[88px] sm:min-h-[480px]">
        <HeroPhotoStage locale={locale} />
      </div>
    </section>
  );
}

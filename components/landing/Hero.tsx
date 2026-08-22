import Image from "next/image";
import { HeroEditorWindow } from "@/components/landing/HeroEditorWindow";

const QUESTION_COUNT = 23;

/**
 * DESIGN-HANDOFF-V2.md "1. 랜딩 > Hero". 프로토타입의 "5문항·3분"은 실제
 * 문항 수(라이프스타일 15 + MBTI 8 = 23)로 바꿔 썼다 — 이 저장소가 v1 때부터
 * 지켜온 관례("프로토타입 전용 숫자 대신 실제 데이터/문항 수 사용", 예전
 * app/page.tsx 주석 참고)와 같은 이유다.
 */
export function Hero() {
  return (
    <section className="px-6 pt-[150px] sm:px-10 sm:pt-[210px]">
      <span className="label-mono block text-[10px] text-olive-mid">
        House Series 2026
      </span>
      <h1 className="font-kr mt-6 max-w-[1500px] text-[clamp(40px,9vw,160px)] leading-[0.94] tracking-[-0.035em] text-fg text-balance">
        나는 어떤 집에 살아야 할까<span className="heading-dot">.</span>
      </h1>
      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-[420px] text-[15px] leading-[1.75] text-muted">
          다섯 개의 축으로 취향을 읽고, 22가지 집 구조 중 하나로 안내합니다.
          그다음은 직접 꾸며보는 일입니다.
        </p>
        <span className="label-mono text-[10px] text-muted">
          {QUESTION_COUNT}문항 · 5분 · 회원가입 없음
        </span>
      </div>

      <div className="relative mt-[60px] h-[70vh] min-h-[420px] sm:mt-[88px] sm:min-h-[480px]">
        <div
          data-px="0.07"
          className="absolute inset-x-0 top-0 bottom-[-70px] overflow-hidden rounded-[34px] shadow-[0_50px_110px_-56px_rgba(18,18,15,0.34)] sm:bottom-[-130px]"
        >
          <div
            data-px="-0.05"
            className="absolute inset-x-0 bg-photo-bg"
            style={{ top: "-9%", bottom: "-9%" }}
          >
            <Image
              src="/photos/hero-court.jpg"
              alt="집 안뜰을 내려다본 사진"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[45%]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(14,15,12,0.5), rgba(14,15,12,0))",
            }}
          />
          <span className="label-mono absolute bottom-7 left-7 text-[9px] text-cream/85 sm:bottom-9 sm:left-9">
            House Court — Seoul
          </span>
        </div>

        <HeroEditorWindow />
      </div>
    </section>
  );
}

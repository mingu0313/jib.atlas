/**
 * 랜딩 히어로 우측 — 기울어진 3D 스마트폰 목업. 안에는 "결과 화면
 * 축소판"(실제 유저 데이터가 아니라 순수 미리보기 예시 — app/page.tsx의
 * HERO_PREVIEW_*가 House Types 대표 템플릿 데이터로 채워서 넘겨준다)이
 * 떠 있다.
 *
 * v2("에디토리얼 딥틸") 시절 히어로에 있던 것과 같은 구조(perspective +
 * rotateY/X/Z 틸트, floaty 애니메이션, 노치, 레이더 아이콘 + 축 바 +
 * CTA)를 그대로 복원했지만, 색은 그 버전의 하드코딩 hex(웜크림 베젤,
 * 딥틸/코랄 리터럴 색)가 아니라 지금 팔레트("그레이지+카퍼") 토큰으로
 * 새로 입혔다 — 웜크림 베젤은 v3 브리프가 "AI 생성 디자인의 흔한
 * 기본값"이라 명시적으로 피하라고 한 톤이라, 대신 잉크(--teal-600) 계열
 * 그라디언트의 어두운 디바이스 베젤로 바꿨다.
 */

type AxisRow = { label: string; val: number };

export function HeroPhoneMockup({
  typeNum,
  leadTitle,
  tailTitle,
  tagline,
  axes,
  ctaLabel,
}: {
  typeNum: string;
  leadTitle: string;
  tailTitle: string;
  tagline: string;
  axes: AxisRow[];
  ctaLabel: string;
}) {
  return (
    <div className="relative flex items-center justify-center lg:[perspective:1400px]">
      {/* 바닥 그림자 */}
      <div
        className="pointer-events-none absolute top-[64%] left-1/2 h-[150px] w-[340px] -translate-x-1/2 -translate-y-1/2 blur-[18px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(35,40,58,0.14) 0%, rgba(35,40,58,0.05) 45%, rgba(35,40,58,0) 72%)",
        }}
      />

      <div className="relative [animation:floaty_8s_ease-in-out_infinite] [transform-style:preserve-3d]">
        <div
          className="w-[260px] rounded-[48px] p-[11px] sm:w-[288px] lg:[transform:rotateY(-17deg)_rotateX(5deg)_rotateZ(-2.5deg)]"
          style={{
            background: "linear-gradient(150deg,#3a3f56 0%,#23283a 55%,#14161f 100%)",
            boxShadow: "0 2px 3px rgba(0,0,0,0.2), 0 30px 70px -20px rgba(35,40,58,0.45)",
          }}
        >
          <div
            className="relative overflow-hidden rounded-[38px] bg-background"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            <div className="absolute top-[11px] left-1/2 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-foreground opacity-90" />

            <div className="flex flex-col gap-5 px-6 pt-[52px] pb-[30px]">
              <div className="flex flex-col gap-[9px]">
                <span className="font-mono text-[7px] tracking-[0.42em] text-teal-600 uppercase">
                  your house type — {typeNum}
                </span>
                <span className="font-serif text-[27px] leading-[1.1] font-light">
                  {leadTitle && (
                    <>
                      {leadTitle}
                      <br />
                    </>
                  )}
                  <span className="font-semibold text-coral-500">{tailTitle}</span>
                </span>
                <span className="text-[12px] leading-[1.5] text-muted">{tagline}</span>
              </div>

              <div className="flex justify-center border-t border-b border-border py-2">
                <svg viewBox="0 0 120 116" width={128} style={{ display: "block" }}>
                  <polygon
                    points="60,10 105.6,43.2 88.2,96.8 31.8,96.8 14.4,43.2"
                    fill="none"
                    stroke="rgba(35,40,58,0.14)"
                    strokeWidth={1}
                  />
                  <polygon
                    points="60,34 82.8,50.6 74.1,77.4 45.9,77.4 37.2,50.6"
                    fill="none"
                    stroke="rgba(35,40,58,0.12)"
                    strokeWidth={1}
                  />
                  <polygon
                    points="60,22 87.4,49.1 68.5,69.7 47.3,75.5 21.2,45.4"
                    fill="rgba(35,40,58,0.10)"
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
                {axes.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[52px_1fr_22px] items-center gap-2.5"
                  >
                    <span className="text-[9px] text-secondary-foreground">{row.label}</span>
                    <span className="relative block h-[3px] bg-[rgba(35,40,58,0.08)]">
                      <span
                        className="absolute top-0 left-0 h-[3px] bg-teal-600"
                        style={{ width: `${row.val}%` }}
                      />
                    </span>
                    <span className="text-right font-mono text-[8px] text-muted">{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-full bg-teal-600 py-[13px] text-center text-[10px] font-medium text-white">
                {ctaLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 떠 있는 원형 배지 */}
      <div className="absolute top-[54px] right-0 hidden [animation:floaty_6s_ease-in-out_infinite] sm:block">
        <div
          className="flex h-[66px] w-[66px] rotate-[-8deg] items-center justify-center rounded-full bg-background"
          style={{
            boxShadow: "0 10px 26px -8px rgba(35,40,58,0.28), 0 0 0 1px rgba(35,40,58,0.08)",
          }}
        >
          <svg viewBox="0 0 34 26" width={30} style={{ display: "block" }}>
            <polygon
              points="17,3 31,11 17,19 3,11"
              fill="none"
              stroke="var(--color-teal-600)"
              strokeWidth={1.4}
            />
            <polygon points="3,11 17,19 17,23.6 3,15.6" fill="rgba(35,40,58,0.14)" />
            <polygon points="31,11 17,19 17,23.6 31,15.6" fill="rgba(181,101,29,0.24)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

/**
 * 랜딩 페이지 — design-reference/kyiv-luxebouquets의 8개 섹션
 * (Navbar/Hero/About/Benefits/Contact/Service/Reviews/Footer) 구성·
 * 순서·스페이싱(80px/60px/24px)·타이포 스케일(50/38/28px 등)을 그대로
 * 반영했다. 원본의 흑백(#121212/#fff) 팔레트와 flower-shop 카피/이미지는
 * 옮기지 않고 jib.atlas 웜톤 teal+coral 토큰(globals.css)과 실제 도메인
 * (성격/라이프스타일 진단 → 집 구조 매칭 → 2D 에디터)에 맞춰 새로 썼다.
 * 공유 유틸(.section-title 등)은 globals.css에 정의돼 있다.
 *
 * Navbar 섹션은 app/layout.tsx의 전역 헤더(jib.atlas 로고 + 로그인 상태)가
 * 이미 그 역할을 하고 있어 이 페이지에 별도로 중복 배치하지 않았다.
 */

const STEPS = [
  {
    n: "01",
    title: "5분, 23문항",
    desc: "라이프스타일 진단 시작",
    href: "/test",
    cta: "진단 시작",
    bg: "bg-teal-600",
  },
  {
    n: "02",
    title: "나에게 맞는 집 구조",
    desc: "22가지 평면도 중 매칭 결과 보기",
    href: "/result",
    cta: "결과 보기",
    bg: "bg-coral-600",
  },
  {
    n: "03",
    title: "2D 에디터로 완성",
    desc: "가구를 직접 배치해보기",
    href: "/editor",
    cta: "에디터 열기",
    bg: "bg-teal-700",
  },
];

const BENEFITS = [
  {
    title: "5분, 23문항",
    desc: "길고 지루한 설문 대신, 라이프스타일 15문항과 MBTI 8문항만으로 빠르게 끝나요.",
  },
  {
    title: "22가지 집 구조 매칭",
    desc: "사회성·미니멀리즘·활동성·개방성·자연친화 5개 축 점수로 가장 잘 맞는 평면도를 골라줘요.",
  },
  {
    title: "2D 에디터로 커스터마이징",
    desc: "추천받은 구조가 끝이 아니에요 — 가구를 직접 배치하고 회전하며 내 공간으로 다듬어요.",
  },
  {
    title: "공유 가능한 결과 카드",
    desc: "내 캐릭터 이름과 진단 결과를 인스타 스토리용 카드로 저장해 친구에게 공유해요.",
  },
];

const HIGHLIGHTS = [
  {
    stat: "5분",
    title: "23문항으로 끝나는 빠른 진단",
    sub: "라이프스타일 15문항 + MBTI 보조 8문항",
  },
  {
    stat: "22가지",
    title: "라이프스타일에 맞는 집 구조 매칭",
    sub: undefined,
  },
  {
    stat: "2D",
    title: "에디터로 가구까지 직접 배치",
    sub: undefined,
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="flex flex-col lg:min-h-[720px] lg:flex-row">
        <div className="relative flex min-h-[400px] flex-1 overflow-hidden bg-teal-600 lg:min-h-0">
          {/* 그라디언트 대신 옅은 도트 텍스처로 밋밋한 flat 컬러에 결을 준다. */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <div className="absolute bottom-6 left-6 flex max-w-md flex-col gap-4 md:bottom-10 md:left-10">
            <span className="font-mono w-fit text-xs font-medium tracking-[0.2em] text-white/80 uppercase">
              5분 라이프스타일 진단
            </span>
            <h1 className="font-serif text-[36px] leading-[1.1] font-normal text-white italic [text-shadow:0_2px_20px_rgba(0,0,0,0.3)] md:text-[48px] lg:text-[67px]">
              jib.atlas
            </h1>
            <p className="max-w-sm text-white/85">
              성격/라이프스타일 진단을 받고, 그 결과에 맞는 집 구조를
              추천받은 뒤 2D 에디터에서 가구를 배치하며 완성하는 웹앱.
            </p>
            <Link href="/test" className="btn-outline-light w-fit">
              진단 시작하기
            </Link>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
          {STEPS.map((step) => (
            <Link
              key={step.n}
              href={step.href}
              className={`group relative flex min-h-[240px] flex-col justify-between overflow-hidden p-5 transition-transform duration-300 hover:scale-[1.02] md:min-h-[300px] ${step.bg}`}
            >
              <span className="w-fit rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                {step.n}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-medium text-white">
                  {step.title}
                </span>
                <span className="text-sm text-white/80">{step.desc}</span>
                <span className="text-sm font-semibold text-white underline underline-offset-[3px]">
                  {step.cta} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="flex flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-4 px-6 py-[60px] lg:p-20">
          <p className="section-label">어떻게 만들어졌나</p>
          <h2 className="section-title">
            취향을 먼저,
            <br />
            공간은 그다음
          </h2>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-[60px] lg:p-20">
          <h3 className="text-[28px] font-medium md:text-[38px]">
            jib.atlas
          </h3>
          <p className="leading-[1.7] text-muted">
            같은 평수, 같은 구조라도 어울리는 사람은 따로 있어요. jib.atlas는
            성격/라이프스타일 진단으로 먼저 나를 이해하고, 거기에 맞는 집
            구조를 추천한 다음 — 추천으로 끝내지 않고 2D 에디터에서 가구
            배치까지 직접 다듬어보게 해요.
          </p>
          <Link href="/test" className="text-link w-fit">
            진단 시작하기
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-[60px] lg:p-20">
        <h2 className="section-title">왜 jib.atlas인가요?</h2>
        <div className="mt-9 grid grid-cols-1 lg:grid-cols-2">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="border-t border-border py-10 lg:pr-[60px] lg:[&:nth-child(even)]:border-l lg:[&:nth-child(even)]:pr-0 lg:[&:nth-child(even)]:pl-[60px]"
            >
              <h3 className="mb-4 text-[28px] font-medium md:text-[38px]">
                {item.title}
              </h3>
              <p className="leading-[1.7] text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact → 핵심 수치 + 시작 CTA */}
      <section className="flex flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-[60px] lg:p-20">
          <h2 className="section-title">지금, 5분이면 충분해요</h2>
          <p className="text-lg font-medium">
            로그인 없이도 바로 진단을 시작할 수 있어요.
          </p>
          <Link href="/test" className="btn-primary w-fit">
            진단 시작하기
          </Link>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-12 px-6 py-[60px] lg:p-20">
          {HIGHLIGHTS.map((item) => (
            <div key={item.stat}>
              <h3 className="mb-4 text-[28px] font-medium md:text-[38px]">
                {item.stat}
              </h3>
              <p className="text-base font-semibold">{item.title}</p>
              {item.sub && (
                <p className="mt-1 text-sm font-medium text-muted">
                  {item.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Service */}
      <section className="px-6 py-20 text-center">
        <h2 className="section-title">우리 서비스</h2>
      </section>

      <section className="flex flex-col lg:min-h-[720px] lg:flex-row">
        <div className="min-h-[300px] flex-1 bg-teal-50 bg-[repeating-linear-gradient(0deg,var(--color-teal-100)_0px,var(--color-teal-100)_1px,transparent_1px,transparent_40px),repeating-linear-gradient(90deg,var(--color-teal-100)_0px,var(--color-teal-100)_1px,transparent_1px,transparent_40px)] lg:min-h-0" />
        <div className="flex flex-1 flex-col justify-center px-6 py-[60px] lg:p-20">
          <p className="section-label">service</p>
          <h2 className="section-title mb-6">2D 인테리어 에디터</h2>
          <p className="mb-8 text-lg font-medium leading-[1.7]">
            추천받은 평면도 위에 가구를 직접 옮기고 회전시키며 나만의 배치를
            만들어보세요. 추천은 시작일 뿐, 완성은 직접 하는 거예요.
          </p>
          <Link href="/editor" className="text-link w-fit">
            에디터 살펴보기
          </Link>
        </div>
      </section>

      <section className="relative flex min-h-[500px] items-center justify-center overflow-hidden bg-teal-700 text-center md:min-h-[720px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative z-10 max-w-[600px] px-10">
          <p className="section-label !text-white">service</p>
          <h2 className="section-title mb-6 !text-white">
            결과를 카드로 공유하기
          </h2>
          <p className="mb-8 text-lg font-medium leading-[1.7] text-white/90">
            내 캐릭터 이름과 진단 결과를 인스타 스토리용 카드로 저장해서
            친구에게 공유해보세요.
          </p>
          <Link href="/result" className="btn-outline-light">
            결과 예시 보기
          </Link>
        </div>
      </section>

      {/* Reviews → 브랜드 메시지 */}
      <section className="px-6 py-[60px] text-center lg:p-20">
        <p className="section-label">what we believe</p>
        <h2 className="section-title">당신다운 공간을 만나보세요</h2>
        <blockquote className="mx-auto mt-6 mb-4 max-w-[800px] text-[18px] leading-[1.6] font-normal italic sm:text-[22px]">
          &ldquo;같은 평수, 같은 구조라도 어울리는 방식은 사람마다 달라요.
          취향을 먼저 알면 공간은 훨씬 쉬워져요.&rdquo;
        </blockquote>
        <p className="mb-8 text-base font-medium text-muted">— jib.atlas</p>
        <Link href="/test" className="text-link">
          진단 시작하기 →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="flex flex-col gap-10 border-b border-border px-6 py-10 md:px-6 lg:flex-row lg:gap-20 lg:px-20 lg:py-[60px]">
          <div className="flex-1">
            <p className="leading-[1.7]">
              혼자 고민하지 마세요. 5분짜리 진단이 시작을 도와드려요.
            </p>
          </div>
          <div className="flex flex-1 items-start">
            <Link href="/test" className="btn-primary w-fit">
              진단 시작하기
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-10 px-6 py-10 md:px-6 lg:flex-row lg:gap-20 lg:px-20 lg:py-[60px]">
          <div className="flex-1">
            <h4 className="mb-6 text-[21px] font-medium text-muted">
              jib.atlas
            </h4>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted">about</span>
              <span className="text-base font-medium">
                라이프스타일 진단으로 나에게 맞는 집 구조를 찾고, 2D
                에디터에서 직접 완성하는 웹앱.
              </span>
            </div>
          </div>

          <div className="flex flex-[2] flex-col gap-8 sm:flex-row sm:gap-[60px]">
            <div>
              <h4 className="mb-5 text-base font-medium text-muted">
                이용하기
              </h4>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <Link href="/test" className="text-base font-medium">
                    진단 시작
                  </Link>
                </li>
                <li>
                  <Link href="/result" className="text-base font-medium">
                    결과 보기
                  </Link>
                </li>
                <li>
                  <Link href="/editor" className="text-base font-medium">
                    에디터 열기
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-5 text-base font-medium text-muted">계정</h4>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <Link href="/login" className="text-base font-medium">
                    로그인
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

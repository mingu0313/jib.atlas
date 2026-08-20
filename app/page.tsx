import Link from "next/link";

/**
 * 랜딩 페이지 — 섹션 리듬(히어로 스플릿 / 2단 소개 / 보더 그리드 베네핏 /
 * 기능 스포트라이트 / 클로징 CTA)은 design-reference/kyiv-luxebouquets를
 * 구조만 참고해 재구성했다. 색/이미지/카피는 참고자료를 그대로 쓰지 않고
 * jib.atlas 자체 웜톤 teal+coral 토큰(globals.css)과 실제 도메인
 * (성격/라이프스타일 진단 → 집 구조 매칭 → 2D 에디터)에 맞춰 새로 썼다.
 */

const STEPS = [
  {
    n: "01",
    title: "5분, 23문항",
    desc: "라이프스타일 15문항 + MBTI 8문항으로 나의 취향을 파악해요.",
    href: "/test",
    cta: "진단 시작",
  },
  {
    n: "02",
    title: "나에게 맞는 집 구조",
    desc: "5축 점수를 기준으로 14가지 평면도 중 가장 잘 맞는 걸 찾아줘요.",
    href: "/result",
    cta: "결과 보기",
  },
  {
    n: "03",
    title: "2D 에디터로 완성",
    desc: "추천받은 구조 위에 가구를 직접 배치하며 나만의 공간으로.",
    href: "/editor",
    cta: "에디터 열기",
  },
];

const BENEFITS = [
  {
    title: "5분, 23문항",
    desc: "길고 지루한 설문 대신, 라이프스타일 15문항과 MBTI 8문항만으로 빠르게 끝나요.",
  },
  {
    title: "14가지 집 구조 매칭",
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

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="flex flex-col lg:min-h-[640px] lg:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-6 bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-16 text-white sm:px-10 lg:px-16">
          <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide">
            5분 라이프스타일 진단
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            jib.atlas
          </h1>
          <p className="max-w-md text-white/85">
            성격/라이프스타일 진단을 받고, 그 결과에 맞는 집 구조를 추천받은
            뒤, 2D 에디터에서 직접 가구를 배치하며 인테리어를 커스터마이징하는
            웹앱.
          </p>
          <Link
            href="/test"
            className="w-fit rounded-full bg-white px-6 py-3 font-medium text-teal-700 transition hover:bg-white/90"
          >
            진단 시작하기
          </Link>
        </div>

        <div className="flex flex-1 flex-col">
          {STEPS.map((step) => (
            <Link
              key={step.n}
              href={step.href}
              className="group flex flex-1 flex-col justify-center gap-2 border-t border-border px-6 py-10 transition-colors first:border-t-0 hover:bg-coral-50 sm:px-10 lg:border-t-0 lg:border-b lg:last:border-b-0"
            >
              <span className="text-sm font-semibold text-coral-600">
                {step.n}
              </span>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="max-w-sm text-sm text-muted">{step.desc}</p>
              <span className="mt-1 text-sm font-medium text-teal-700 underline underline-offset-4 group-hover:no-underline">
                {step.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="flex flex-col border-t border-border lg:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-3 px-6 py-16 sm:px-10 lg:px-16">
          <p className="text-sm font-medium tracking-wide text-coral-600 uppercase">
            어떻게 만들어졌나
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            취향을 먼저,
            <br />
            공간은 그다음
          </h2>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-4 border-t border-border px-6 py-16 sm:px-10 lg:border-t-0 lg:border-l lg:px-16">
          <p className="text-muted">
            같은 평수, 같은 구조라도 어울리는 사람은 따로 있어요. jib.atlas는
            성격/라이프스타일 진단으로 먼저 나를 이해하고, 거기에 맞는 집
            구조를 추천한 다음 — 추천으로 끝내지 않고 2D 에디터에서 가구
            배치까지 직접 다듬어보게 해요.
          </p>
          <Link
            href="/test"
            className="w-fit text-sm font-medium text-teal-700 underline underline-offset-4"
          >
            진단 시작하기
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border px-6 py-16 sm:px-10 lg:px-16">
        <h2 className="text-3xl font-semibold sm:text-4xl">
          왜 jib.atlas인가요?
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          {BENEFITS.map((item, i) => (
            <div
              key={item.title}
              className={`border-t border-border py-8 ${
                i % 2 === 1 ? "sm:border-l sm:pl-10" : "sm:pr-10"
              }`}
            >
              <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Editor spotlight */}
      <section className="border-t border-border bg-gradient-to-br from-teal-700 to-teal-600 px-6 py-20 text-center text-white sm:px-10">
        <p className="text-sm font-medium tracking-wide text-white/70 uppercase">
          핵심 기능
        </p>
        <h2 className="mx-auto mt-3 max-w-lg text-3xl font-semibold sm:text-4xl">
          추천받은 구조를, 내 손으로 완성하기
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/85">
          가구를 옮기고 회전시키며 평면도 위에 나만의 배치를 만들어보세요.
          추천은 시작일 뿐, 완성은 직접 하는 거예요.
        </p>
        <Link
          href="/editor"
          className="mt-8 inline-flex rounded-full border border-white px-6 py-3 font-medium text-white transition hover:bg-white hover:text-teal-700"
        >
          에디터 살펴보기
        </Link>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border px-6 py-20 text-center sm:px-10">
        <h2 className="text-3xl font-semibold sm:text-4xl">
          지금, 5분이면 충분해요
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-muted">
          로그인 없이도 바로 진단을 시작할 수 있어요.
        </p>
        <Link
          href="/test"
          className="mt-8 inline-flex rounded-full bg-teal-600 px-8 py-3 font-medium text-white transition hover:bg-teal-700"
        >
          진단 시작하기
        </Link>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted sm:px-10">
        jib.atlas — 나에게 맞는 집을 찾는 가장 쉬운 방법
      </footer>
    </main>
  );
}

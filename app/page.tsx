import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="rounded-full bg-coral-50 px-3 py-1 text-xs font-medium tracking-wide text-coral-600">
        5분 라이프스타일 진단
      </span>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        jib.atlas
      </h1>
      <p className="max-w-md text-muted">
        성격/라이프스타일 진단을 받고, 그 결과에 맞는 집 구조를 추천받은 뒤,
        2D 에디터에서 직접 가구를 배치하며 인테리어를 커스터마이징하는 웹앱.
      </p>
      <Link
        href="/test"
        className="rounded-full bg-teal-600 px-6 py-3 font-medium text-white transition hover:bg-teal-700"
      >
        진단 시작하기
      </Link>
    </main>
  );
}

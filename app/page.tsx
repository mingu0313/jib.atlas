import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">jib.atlas</h1>
      <p className="max-w-md text-gray-500">
        성격/라이프스타일 진단을 받고, 그 결과에 맞는 집 구조를 추천받은 뒤,
        2D 에디터에서 직접 가구를 배치하며 인테리어를 커스터마이징하는 웹앱.
      </p>
      <Link
        href="/test"
        className="rounded-full bg-black px-6 py-3 text-white transition hover:bg-gray-800"
      >
        진단 시작하기
      </Link>
    </main>
  );
}

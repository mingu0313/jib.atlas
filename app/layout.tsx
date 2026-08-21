import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Fraunces, Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getUserSafe } from "@/lib/supabase/server";
import "./globals.css";

// 헤딩용 세리프(Fraunces) — 본문은 계속 산세리프를 쓰되 h1~h3만 세리프로
// 바꾸는 것만으로 "AI가 뽑아낸 제네릭 SaaS UI" 느낌에서 벗어나는 효과가 크다.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});
// 라벨/뱃지/태그처럼 자간을 넓게 쓰는 "eyebrow" 텍스트 전용.
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "jib.atlas",
  description:
    "라이프스타일 진단으로 나에게 어울리는 집 구조를 찾고, 2D 에디터에서 직접 가구를 배치해보는 웹앱.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // 로그인 상태 조회가 실패해도(env var 누락, Supabase 장애 등) 절대
  // 사이트 전체를 죽이지 않는다 — 실패하면 로그아웃 상태로 취급한다.
  const user = await getUserSafe();
  // 브라우저의 Supabase 클라이언트(lib/supabase/client.ts)가 쓸 설정.
  // Next.js의 NEXT_PUBLIC_* 빌드 타임 주입에 기대지 않고, 요청 시점에
  // Cloudflare 런타임 바인딩에서 읽은 값을 페이지에 그대로 심어준다.
  const supabaseEnv = await getSupabaseEnv();

  return (
    <html
      lang="ko"
      className={`${fraunces.variable} ${dmSans.variable} ${dmMono.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <head>
        {supabaseEnv && (
          <script
            id="__supabase_config"
            type="application/json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(supabaseEnv).replace(/</g, "\\u003c"),
            }}
          />
        )}
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <div className="sticky top-0 z-50 flex items-center justify-between gap-6 border-b border-border bg-[rgba(250,249,245,0.92)] px-5 py-[18px] backdrop-blur-[10px] sm:px-10">
          <Link href="/" className="flex items-baseline gap-2.5">
            <span className="font-serif text-[21px] font-semibold tracking-[-0.01em]">
              jib<span className="text-coral-600">.</span>atlas
            </span>
            <span className="hidden font-mono text-[9px] tracking-[0.4em] text-muted uppercase sm:inline">
              house series 2026
            </span>
          </Link>
          <div className="flex items-center gap-5 sm:gap-8">
            <nav className="hidden items-center gap-8 md:flex">
              <Link
                href="/"
                className="text-[13px] text-muted transition hover:text-foreground"
              >
                홈
              </Link>
              <Link
                href="/test"
                className="text-[13px] text-muted transition hover:text-foreground"
              >
                성향 진단
              </Link>
              <Link
                href="/result"
                className="text-[13px] text-muted transition hover:text-foreground"
              >
                집 유형
              </Link>
              <Link
                href="/editor"
                className="text-[13px] text-muted transition hover:text-foreground"
              >
                룸 에디터
              </Link>
            </nav>
            {user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-[13px] text-muted transition hover:text-foreground"
                >
                  로그아웃
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="hidden text-[13px] text-muted transition hover:text-foreground sm:inline"
              >
                로그인
              </Link>
            )}
            <Link
              href="/test"
              className="rounded-[2px] bg-teal-600 px-[22px] py-3 text-xs font-medium tracking-[0.02em] text-white transition hover:bg-coral-600"
            >
              진단 시작
            </Link>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}

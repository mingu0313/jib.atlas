import type { Metadata } from "next";
import { DM_Mono, Gowun_Batang, Instrument_Sans, Instrument_Serif, Noto_Sans_KR } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getUserSafe } from "@/lib/supabase/server";
import "./globals.css";

// jib-atlas-v2-handoff/DESIGN-HANDOFF-V2.md "폰트 (4종)" 그대로.
// 영문 디스플레이(유형명·로고·큰 숫자) — Instrument Serif는 400(+ italic)만 나온다.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});
// 국문 디스플레이(헤딩·질문·인용) — 이 팔레트의 시그니처 서체.
const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  subsets: ["latin"],
  weight: ["400", "700"],
});
// 본문·UI(라틴). 한글 글리프가 없어서 --font-sans에서 Noto Sans KR과 스택으로 묶는다.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
// 라벨(8–11px, uppercase, 넓은 자간) 전용.
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "jib.atlas",
  description:
    "라이프스타일 진단으로 나에게 어울리는 집 구조를 찾고, 2D 에디터에서 직접 가구를 배치해보는 웹앱.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // 로그인 상태 조회가 실패해도(env var 누락, Supabase 장애 등) 절대
  // 사이트 전체를 죽이지 않는다 — 실패하면 로그아웃 상태로 취급한다.
  // (개별 페이지가 필요하면 직접 lib/supabase/useUser로 조회한다 — v2는
  // 전역 상단바가 없어서 이 값을 layout 차원에서 더는 쓰지 않지만,
  // getUserSafe 자체가 요청마다 쿠키를 갱신해주는 부작용이 있어 유지한다.)
  await getUserSafe();
  const supabaseEnv = await getSupabaseEnv();

  return (
    <html
      lang="ko"
      className={`${instrumentSerif.variable} ${gowunBatang.variable} ${instrumentSans.variable} ${notoSansKr.variable} ${dmMono.variable} h-full antialiased`}
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
      {/* v2는 화면마다(랜딩 부유형 필 내비 / 퀴즈·에디터 자체 상단바 / 결과·
          공유는 상단바 없음) 다른 헤더를 쓰는 디자인이라, v1 시절의 전역
          sticky 상단바는 여기서 없앴다 — 각 라우트가 자기 헤더를 그린다. */}
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

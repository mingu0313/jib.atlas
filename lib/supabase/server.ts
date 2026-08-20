import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트/라우트 핸들러에서 쓰는 Supabase 클라이언트.
 * next/headers의 cookies()를 통해 요청/응답 쿠키를 읽고 쓴다.
 *
 * 주의: 서버 컴포넌트 렌더링 중에는 쿠키를 쓸 수 없으므로(Next.js 제약),
 * setAll이 실패해도 무시한다 — proxy.ts가 매 요청마다 세션 쿠키를
 * 갱신해주기 때문에 실제 세션 유지에는 문제가 없다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // 서버 컴포넌트에서 호출된 경우 — proxy.ts가 세션 갱신을 대신 처리한다.
          }
        },
      },
    },
  );
}

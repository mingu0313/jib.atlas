import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트/라우트 핸들러에서 쓰는 Supabase 클라이언트.
 * next/headers의 cookies()를 통해 요청/응답 쿠키를 읽고 쓴다.
 *
 * 원래는 proxy.ts(구 middleware)에서 매 요청마다 세션을 갱신하는 게
 * 정석이지만, Next.js 16의 proxy는 Node.js 런타임 전용으로 바뀌었고
 * @opennextjs/cloudflare(1.20.2 기준)가 이를 아직 지원하지 않아 빌드가
 * 깨진다 — 그래서 proxy.ts 없이 아래 두 경로로만 세션을 갱신한다:
 * 1) 브라우저 Supabase 클라이언트(lib/supabase/client.ts)가 자체적으로
 *    액세스 토큰을 미리 갱신해서 쿠키에 반영한다 (autoRefreshToken).
 * 2) 라우트 핸들러/서버 액션에서 getUser()가 토큰을 갱신하면 아래
 * setAll로 쿠키에 반영된다.
 * 서버 컴포넌트 렌더링 중에는 쿠키를 쓸 수 없으므로(Next.js 제약) 이때는
 * setAll이 실패해도 무시한다 — 그 요청 한정으로만 갱신된 토큰을 못 쓰고
 * 넘어갈 뿐, 다음 요청에서 위 두 경로로 다시 갱신된다.
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

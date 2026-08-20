import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * 서버 컴포넌트/라우트 핸들러에서 쓰는 Supabase 클라이언트.
 * next/headers의 cookies()를 통해 요청/응답 쿠키를 읽고 쓴다.
 * URL/anon key는 getSupabaseEnv()로 가져온다 (env.ts 설명 참고 — Next.js
 * 빌드 타임 주입에 의존하지 않고 Cloudflare 런타임 바인딩을 우선 쓴다).
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
  const env = await getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase 설정을 못 찾았어요 (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). " +
        "Cloudflare Worker의 Variables and Secrets에 값이 들어있는지 확인해주세요.",
    );
  }

  return createServerClient(env.url, env.anonKey, {
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
          // 서버 컴포넌트에서 호출된 경우 — 이 요청 한정으로만 갱신된
          // 토큰을 못 쓰고 넘어간다 (server.ts 상단 설명 참고).
        }
      },
    },
  });
}

/**
 * getUser()를 호출하되 절대 던지지 않는다. RootLayout처럼 모든 페이지를
 * 감싸는 곳에서 그대로 getUser()를 쓰면, env var가 빠졌거나 Supabase가
 * 잠깐이라도 응답을 안 하는 순간 사이트 전체가 500으로 죽는다 — 로그인
 * 상태 표시는 로그인 기능 자체보다 덜 중요하니 실패하면 "로그아웃 상태"로
 * 취급하고 넘어간다.
 */
export async function getUserSafe() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("getUserSafe failed:", error);
    return null;
  }
}

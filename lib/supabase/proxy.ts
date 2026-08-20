import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 매 요청마다 Supabase 세션 쿠키를 갱신한다. 이걸 안 하면 access token이
 * 만료됐을 때 서버 컴포넌트/라우트 핸들러에서 만료된 세션을 그대로 읽게 된다.
 *
 * Next.js 16부터 middleware.ts가 proxy.ts로 이름이 바뀌었다 — 이 함수는
 * 루트의 proxy.ts에서 호출된다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser()가 필요한 경우 access token을 검증/갱신한다. 반환값은 안 쓰지만
  // 호출 자체가 만료된 세션을 갱신하는 부수효과를 일으킨다.
  await supabase.auth.getUser();

  return response;
}

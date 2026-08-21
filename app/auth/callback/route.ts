import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth(Google 등) 로그인 후 Supabase가 되돌려보내는 라우트.
 * signInWithOAuth()가 만든 인증 URL로 로그인하면 Google → Supabase를 거쳐
 * 여기로 `code`가 붙어서 돌아온다. 그 code를 세션으로 교환하고 원래
 * 가려던 곳(next)으로 보낸다. (app/auth/confirm/route.ts와 같은 패턴 —
 * 이 프로젝트는 proxy.ts/middleware.ts를 못 쓰므로 라우트 핸들러에서 처리한다.)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/editor";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
    redirect(
      `/login?error=oauth-failed&message=${encodeURIComponent(error.message)}`,
    );
  }

  // code가 없는 경우 — Supabase가 실패 시 code 대신 error/error_description을
  // 붙여 보내는 경우가 많다(예: redirect_to가 Supabase의 Redirect URLs
  // 허용 목록에 없을 때). 뭐가 왔는지 그대로 넘겨서 화면에서 원인을 보게 한다.
  const rawParams = searchParams.toString();
  redirect(
    `/login?error=oauth-failed&message=${encodeURIComponent(
      rawParams ? `no-code, params=${rawParams}` : "no-code, no-params-at-all",
    )}`,
  );
}

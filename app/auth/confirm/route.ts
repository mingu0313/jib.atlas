import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase 회원가입 확인 / 비밀번호 재설정 이메일의 링크가 가리키는 라우트.
 * (Supabase 대시보드 Auth 설정에서 "Confirm email"을 껐다면 signup 쪽은 안 쓰인다.)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/studio";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // recovery(비밀번호 재설정) 링크는 Supabase 이메일 템플릿이 next를
      // 어떻게 넘기든 항상 새 비밀번호 설정 화면으로 보낸다 — 그냥 next로
      // 보내면 비밀번호를 안 바꾸고 지나칠 수 있다.
      redirect(type === "recovery" ? "/reset-password" : next);
    }
  }

  redirect("/login?error=confirm-failed");
}

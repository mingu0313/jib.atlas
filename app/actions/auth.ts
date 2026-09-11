"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * `<form action={signOut}>`로 직접 넘기는 서버 액션은 FormData 하나만
 * 인자로 받는다 — components/landing/FloatingNav.tsx가 로그아웃 후 돌아갈
 * 곳을 hidden input("redirectTo")으로 같이 넘겨서, 영문 랜딩(`/en`)에서
 * 로그아웃해도 한국어 /login으로 튕기지 않게 한다(STEP 17 다국어 확장).
 * 값이 없거나 이상하면(폼 직접 조작 등) 항상 한국어 /login으로 안전하게
 * 되돌아간다.
 */
export async function signOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const redirectTo = formData.get("redirectTo");
  redirect(redirectTo === "/en/login" ? "/en/login" : "/login");
}

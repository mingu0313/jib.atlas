"use server";

import { createClient } from "@/lib/supabase/server";

const MAX_LEN = { name: 80, email: 200, message: 4000 };

export interface CollabInquiryResult {
  ok: boolean;
  error?: string;
}

/**
 * 부유형 내비 "협업 문의" 모달(CollabInquiryModal)에서 호출한다.
 * 로그인 여부와 무관하게 누구나 보낼 수 있어야 해서(방문자용 문의 폼)
 * collab_inquiries 테이블에 그냥 insert만 한다 — RLS는 insert만 공개,
 * 읽기는 대시보드(서비스 role)에서만 된다(0005_collab_inquiries.sql).
 *
 * `honeypot`은 봇 방지용 숨김 필드 — 사람 눈엔 안 보이지만 봇은 채우는
 * 경우가 많아서, 채워져 있으면 실제로는 저장하지 않고 성공한 척만 한다
 * (봇에게 실패 신호를 주지 않아야 재시도를 덜 유발한다).
 */
export async function submitCollabInquiry(formData: FormData): Promise<CollabInquiryResult> {
  const honeypot = String(formData.get("company") ?? "").trim();
  if (honeypot) return { ok: true };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "missing" };
  }
  if (!email.includes("@")) {
    return { ok: false, error: "invalid-email" };
  }
  if (name.length > MAX_LEN.name || email.length > MAX_LEN.email || message.length > MAX_LEN.message) {
    return { ok: false, error: "too-long" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("collab_inquiries").insert({
      name: name.slice(0, MAX_LEN.name),
      email: email.slice(0, MAX_LEN.email),
      message: message.slice(0, MAX_LEN.message),
    });
    if (error) return { ok: false, error: "server" };
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

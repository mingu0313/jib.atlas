"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { COLLAB_EMAIL } from "@/lib/contactEmail";
import { createClient } from "@/lib/supabase/server";

const MAX_LEN = { name: 80, email: 200, message: 4000 };

/** Resend 무료 도메인. 커스텀 도메인을 따로 인증하기 전까진 이 주소로만
 * 보낼 수 있고, 수신도 Resend 가입 이메일로만 된다 — COLLAB_EMAIL이 가입
 * 이메일과 다르면 Resend 대시보드에서 도메인을 인증해야 한다. */
const FROM_EMAIL = "jib.atlas <onboarding@resend.dev>";

export interface CollabInquiryResult {
  ok: boolean;
  error?: string;
}

/**
 * Cloudflare 런타임 바인딩(대시보드 Variables and Secrets) → process.env
 * 순으로 시도한다 — lib/supabase/env.ts의 getSupabaseEnv()와 같은 이유
 * (빌드 타임 주입 대신 요청 시점 런타임 바인딩을 우선한다).
 */
async function getResendApiKey(): Promise<string | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bound = env as unknown as Record<string, string | undefined>;
    if (bound.RESEND_API_KEY) return bound.RESEND_API_KEY;
  } catch {
    // Cloudflare 컨텍스트가 없는 환경(로컬 next dev 등) — process.env로 폴백.
  }
  return process.env.RESEND_API_KEY ?? null;
}

/**
 * 문의가 들어왔다는 걸 이메일로 바로 알린다 — Resend REST API를 fetch로
 * 직접 호출한다(SDK 의존성 추가 없이, Cloudflare Workers의 fetch만으로 동작).
 * 키가 없거나 발송이 실패해도 절대 던지지 않는다 — 이메일은 편의 기능일
 * 뿐, 문의 자체는 이미 collab_inquiries 테이블에 안전하게 저장된 뒤라
 * 이것 때문에 방문자에게 실패로 보이면 안 된다(대시보드에서 여전히 확인 가능).
 */
async function notifyByEmail(name: string, email: string, message: string): Promise<void> {
  const apiKey = await getResendApiKey();
  if (!apiKey) {
    console.error("collabInquiry: RESEND_API_KEY 없음 — 알림 메일 건너뜀 (문의는 DB에 저장됨)");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [COLLAB_EMAIL],
        reply_to: email,
        subject: `[jib.atlas 협업 문의] ${name}`,
        text: `이름: ${name}\n이메일: ${email}\n\n${message}`,
      }),
    });
    if (!res.ok) console.error("collabInquiry: Resend 발송 실패", res.status, await res.text());
  } catch (error) {
    console.error("collabInquiry: Resend 발송 중 예외", error);
  }
}

/**
 * 부유형 내비 "협업 문의" 모달(CollabInquiryModal)에서 호출한다.
 * 로그인 여부와 무관하게 누구나 보낼 수 있어야 해서(방문자용 문의 폼)
 * collab_inquiries 테이블에 그냥 insert만 한다 — RLS는 insert만 공개,
 * 읽기는 대시보드(서비스 role)에서만 된다(0005_collab_inquiries.sql).
 * DB 저장에 더해, notifyByEmail()로 알림 메일도 바로 보낸다.
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

  const trimmedName = name.slice(0, MAX_LEN.name);
  const trimmedEmail = email.slice(0, MAX_LEN.email);
  const trimmedMessage = message.slice(0, MAX_LEN.message);

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("collab_inquiries").insert({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    });
    if (error) return { ok: false, error: "server" };
  } catch {
    return { ok: false, error: "server" };
  }

  await notifyByEmail(trimmedName, trimmedEmail, trimmedMessage);
  return { ok: true };
}

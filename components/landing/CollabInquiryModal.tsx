"use client";

import { useEffect, useState } from "react";
import { submitCollabInquiry } from "@/app/actions/collabInquiry";

type Locale = "ko" | "en";

const COLLAB_EMAIL = "hyo5418@gmail.com";

const TEXT: Record<Locale, Record<string, string>> = {
  ko: {
    title: "협업 문의",
    subtitle: "간단히 남겨주시면 이메일로 답장 드릴게요.",
    name: "이름",
    email: "이메일",
    message: "문의 내용",
    messagePlaceholder: "어떤 협업을 생각하고 계신가요?",
    submit: "보내기",
    sending: "보내는 중…",
    sent: "문의가 전달됐어요. 곧 답장 드릴게요!",
    close: "닫기",
    errorMissing: "모든 항목을 입력해주세요.",
    errorEmail: "이메일 주소 형식을 확인해주세요.",
    errorTooLong: "내용이 너무 길어요. 줄여서 다시 시도해주세요.",
    errorServer: "전송에 실패했어요. 잠시 후 다시 시도해주세요.",
    directly: "직접 메일 보내기",
    copyEmail: "이메일 복사",
    copied: "복사됨 ✓",
  },
  en: {
    title: "Get in touch",
    subtitle: "Leave a quick note and we'll reply by email.",
    name: "Name",
    email: "Email",
    message: "Message",
    messagePlaceholder: "What did you have in mind?",
    submit: "Send",
    sending: "Sending…",
    sent: "Your message is on its way — we'll reply soon!",
    close: "Close",
    errorMissing: "Please fill in every field.",
    errorEmail: "Please check your email address.",
    errorTooLong: "That's too long — please shorten it and try again.",
    errorServer: "Couldn't send that. Please try again in a moment.",
    directly: "Email directly",
    copyEmail: "Copy email",
    copied: "Copied ✓",
  },
};

const ERROR_KEY: Record<string, string> = {
  missing: "errorMissing",
  "invalid-email": "errorEmail",
  "too-long": "errorTooLong",
  server: "errorServer",
};

/**
 * "협업 문의" 클릭 시 뜨는 인라인 문의 폼 — 방문자가 자기 메일 앱을 거치지
 * 않고 사이트 안에서 바로 보낼 수 있게 해달라는 요청으로 만들었다
 * (이전엔 mailto: 링크 + 클립보드 복사였는데, "사이트에서 바로 할 수
 * 있게"라는 후속 요청이 명시적으로 이걸 원했다). 제출은 서버 액션
 * app/actions/collabInquiry.ts가 collab_inquiries 테이블에 저장한다
 * (0005_collab_inquiries.sql).
 *
 * 그래도 메일이 편한 사람을 위해 하단에 mailto: + 클립보드 복사 보조
 * 옵션은 남겨뒀다(FloatingNav의 예전 협업 문의 복사 로직과 동일).
 */
export function CollabInquiryModal({
  open,
  onClose,
  locale = "ko",
}: {
  open: boolean;
  onClose: () => void;
  locale?: Locale;
}) {
  const t = TEXT[locale];
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [errorKey, setErrorKey] = useState<string>("errorServer");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // 닫힐 때 다음에 열었을 때 이전 결과가 안 보이게 리셋한다.
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setStatus("idle"), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "pending") return;
    setStatus("pending");
    const result = await submitCollabInquiry(new FormData(e.currentTarget));
    if (result.ok) {
      setStatus("sent");
    } else {
      setErrorKey(ERROR_KEY[result.error ?? "server"] ?? "errorServer");
      setStatus("error");
    }
  }

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(COLLAB_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 무시 — 아래 mailto: 링크가 대안이다.
    }
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(18,18,15,0.4)" }}
      />

      <div className="relative w-full max-w-[420px] rounded-[24px] bg-card p-7 shadow-[0_40px_90px_-44px_rgba(18,18,15,0.5)] sm:p-9">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-panel hover:text-fg"
        >
          ✕
        </button>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="font-kr text-xl">{t.sent}</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-olive px-6 py-3 text-[13px] font-semibold text-cream transition hover:bg-fg"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-kr text-2xl">{t.title}</h2>
            <p className="mt-2 text-[13px] text-muted">{t.subtitle}</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              {/* 봇 방지용 허니팟 — 사람에게는 안 보인다. */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute h-0 w-0 opacity-0"
              />
              <input
                type="text"
                name="name"
                required
                maxLength={80}
                placeholder={t.name}
                className="rounded-[14px] border border-hair bg-bg px-4 py-3 text-[14px] text-fg outline-none focus:border-olive"
              />
              <input
                type="email"
                name="email"
                required
                maxLength={200}
                placeholder={t.email}
                className="rounded-[14px] border border-hair bg-bg px-4 py-3 text-[14px] text-fg outline-none focus:border-olive"
              />
              <textarea
                name="message"
                required
                maxLength={4000}
                rows={4}
                placeholder={t.messagePlaceholder}
                className="resize-none rounded-[14px] border border-hair bg-bg px-4 py-3 text-[14px] text-fg outline-none focus:border-olive"
              />

              {status === "error" && (
                <p className="text-[13px]" style={{ color: "#a3402a" }}>
                  {t[errorKey]}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "pending"}
                className="mt-1 rounded-full bg-olive px-6 py-3 text-[14px] font-semibold text-cream transition hover:bg-fg disabled:opacity-50"
              >
                {status === "pending" ? t.sending : t.submit}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-4 border-t border-hair pt-4 text-[12px] text-muted">
              <a href={`mailto:${COLLAB_EMAIL}`} className="underline underline-offset-2 transition hover:text-fg">
                {t.directly}
              </a>
              <button type="button" onClick={handleCopyEmail} className="underline underline-offset-2 transition hover:text-fg">
                {copied ? t.copied : t.copyEmail}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

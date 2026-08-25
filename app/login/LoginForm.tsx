"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";
// signup 결과 상태. "already": Supabase가 보안상 에러 없이 성공처럼
// 응답하지만 실제로는 새 메일을 안 보낸 경우(이미 가입된 이메일) —
// data.user.identities가 빈 배열이면 이 케이스다.
type SignupResult = "idle" | "sent" | "already";

const RESEND_COOLDOWN_SECONDS = 30;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/studio";

  // /auth/confirm, /auth/callback이 실패하면 /login?error=...로 되돌려보낸다.
  // 예전엔 이 파라미터를 아예 안 읽어서 로그인 화면에 그냥 멈춰있는 것처럼
  // 보였다 — 원인을 알 수 있게 화면에 표시한다.
  const errorParam = searchParams.get("error");
  const initialError =
    errorParam === "oauth-failed"
      ? "구글 로그인에 실패했어요. 잠시 후 다시 시도해주세요."
      : errorParam === "confirm-failed"
        ? "이메일 인증 링크가 만료됐거나 이미 사용됐어요. 다시 시도해주세요."
        : null;

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [signupResult, setSignupResult] = useState<SignupResult>("idle");
  const [forgotSent, setForgotSent] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function resetToMode(nextMode: Mode) {
    setMode(nextMode);
    setSignupResult("idle");
    setForgotSent(false);
    setError(null);
    setResendCooldown(0);
  }

  async function handleGoogleLogin() {
    setError(null);
    setGooglePending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(error.message);
        setGooglePending(false);
      }
      // 성공하면 브라우저가 Google 로그인 페이지로 이동하므로 여기서 더 할 일은 없다.
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
      setGooglePending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
          return;
        }
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${next}` },
        });
        if (error) {
          setError(error.message);
          return;
        }
        // Supabase는 이메일 열거(enumeration) 방지를 위해 이미 가입된
        // 이메일로 다시 signUp을 호출해도 에러를 안 준다 — 새 계정이 아니라
        // identities가 빈 배열로 온다. 이 경우엔 메일이 안 갔으니 "보냈어요"
        // 라고 하면 안 된다.
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setSignupResult("already");
        } else {
          setSignupResult("sent");
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
        }
      }
    } catch (err) {
      // createClient()가 던지는 경우(예: env var 누락으로 supabaseUrl이 비어있음)를
      // 포함해서, "처리 중…"에 멈춰있지 않고 항상 에러를 보여준다.
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setPending(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      // recovery 타입은 app/auth/confirm/route.ts가 항상 /reset-password로
      // 보내도록 처리해서, 여기서 넘기는 next 값과 무관하게 새 비밀번호
      // 설정 화면에 도착한다.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setForgotSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setPending(false);
    }
  }

  async function handleResend(kind: "signup" | "recovery") {
    if (resendCooldown > 0) return;
    setError(null);

    try {
      const supabase = createClient();
      const { error } =
        kind === "signup"
          ? await supabase.auth.resend({
              type: "signup",
              email,
              options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${next}` },
            })
          : await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
            });
      if (error) {
        setError(error.message);
        return;
      }
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    }
  }

  if (signupResult === "already") {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="font-kr mb-4 text-xl">이미 가입된 이메일이에요</h1>
        <p className="text-muted">
          {email}로는 이미 계정이 있어서 새 확인 메일을 보내지 않았어요. 로그인하거나 비밀번호를
          재설정해보세요.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => resetToMode("login")}
            className="w-full rounded-full bg-olive px-6 py-3 text-[14px] font-semibold text-cream transition hover:bg-fg"
          >
            로그인하기
          </button>
          <button
            type="button"
            onClick={() => resetToMode("forgot")}
            className="w-full text-sm text-muted underline underline-offset-2 transition hover:text-fg"
          >
            비밀번호 재설정
          </button>
        </div>
      </div>
    );
  }

  if (signupResult === "sent") {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="font-kr mb-4 text-xl">가입 확인 이메일을 보냈어요</h1>
        <p className="text-muted">
          {email}로 보낸 이메일의 링크를 눌러 인증을 마치면 로그인할 수 있어요.
        </p>
        <p className="mt-2 text-xs text-muted">메일이 안 보이면 스팸함도 확인해주세요.</p>
        {error && (
          <p className="mt-3 text-sm" style={{ color: "#a3402a" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => handleResend("signup")}
          disabled={resendCooldown > 0}
          className="mt-6 w-full rounded-full border border-hair px-6 py-3 text-[14px] font-semibold text-fg transition hover:border-olive hover:text-olive disabled:opacity-50"
        >
          {resendCooldown > 0 ? `확인 메일 재전송 (${resendCooldown}초 후 가능)` : "확인 메일 재전송"}
        </button>
        <button
          type="button"
          onClick={() => resetToMode("login")}
          className="mt-4 w-full text-sm text-muted underline underline-offset-2 transition hover:text-fg"
        >
          로그인으로 돌아가기
        </button>
      </div>
    );
  }

  if (mode === "forgot" && forgotSent) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="font-kr mb-4 text-xl">재설정 링크를 보냈어요</h1>
        <p className="text-muted">
          {email}로 보낸 이메일의 링크를 눌러 새 비밀번호를 설정해주세요.
        </p>
        <p className="mt-2 text-xs text-muted">메일이 안 보이면 스팸함도 확인해주세요.</p>
        {error && (
          <p className="mt-3 text-sm" style={{ color: "#a3402a" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => handleResend("recovery")}
          disabled={resendCooldown > 0}
          className="mt-6 w-full rounded-full border border-hair px-6 py-3 text-[14px] font-semibold text-fg transition hover:border-olive hover:text-olive disabled:opacity-50"
        >
          {resendCooldown > 0 ? `재설정 링크 재전송 (${resendCooldown}초 후 가능)` : "재설정 링크 재전송"}
        </button>
        <button
          type="button"
          onClick={() => resetToMode("login")}
          className="mt-4 w-full text-sm text-muted underline underline-offset-2 transition hover:text-fg"
        >
          로그인으로 돌아가기
        </button>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={handleForgotSubmit} className="w-full max-w-sm">
        <h1 className="font-kr mb-3 text-2xl">비밀번호 재설정</h1>
        <p className="mb-6 text-sm text-muted">가입한 이메일을 입력하면 재설정 링크를 보내드려요.</p>
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-[14px] border border-hair bg-card px-4 py-3 text-fg outline-none focus:border-olive"
        />
        {error && (
          <p className="mt-3 text-sm" style={{ color: "#a3402a" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-full bg-olive px-6 py-3 text-[14px] font-semibold text-cream transition hover:bg-fg disabled:opacity-50"
        >
          {pending ? "처리 중…" : "재설정 링크 보내기"}
        </button>
        <button
          type="button"
          onClick={() => resetToMode("login")}
          className="mt-4 w-full text-sm text-muted underline underline-offset-2 transition hover:text-fg"
        >
          로그인으로 돌아가기
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <h1 className="font-kr mb-7 text-2xl">{mode === "login" ? "로그인" : "회원가입"}</h1>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googlePending}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-hair px-4 py-3 text-[14px] font-medium text-fg transition hover:bg-panel disabled:opacity-50"
      >
        <GoogleIcon />
        {googlePending ? "이동 중…" : "Google로 계속하기"}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-hair" />
        또는
        <span className="h-px flex-1 bg-hair" />
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-[14px] border border-hair bg-card px-4 py-3 text-fg outline-none focus:border-olive"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[14px] border border-hair bg-card px-4 py-3 text-fg outline-none focus:border-olive"
        />
      </div>

      {mode === "login" && (
        <button
          type="button"
          onClick={() => resetToMode("forgot")}
          className="mt-3 text-right text-xs text-muted underline underline-offset-2 transition hover:text-fg"
        >
          비밀번호를 잊으셨나요?
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm" style={{ color: "#a3402a" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-olive px-6 py-3 text-[14px] font-semibold text-cream transition hover:bg-fg disabled:opacity-50"
      >
        {pending ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
      </button>

      <button
        type="button"
        onClick={() => resetToMode(mode === "login" ? "signup" : "login")}
        className="mt-4 w-full text-sm text-muted underline underline-offset-2 transition hover:text-fg"
      >
        {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
      </button>
    </form>
  );
}

/** 공식 Google 4색 "G" 로고. 외부 이미지 없이 인라인 SVG로 둔다. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9C16.66 14.2 17.64 11.94 17.64 9.2Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

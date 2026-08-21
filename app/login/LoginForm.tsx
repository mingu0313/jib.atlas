"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/editor";

  // /auth/callback, /auth/confirm이 실패하면 /login?error=...로 되돌려보낸다.
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
  const [signupDone, setSignupDone] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${next}` },
        });
        if (error) {
          setError(error.message);
          return;
        }
        setSignupDone(true);
      }
    } catch (err) {
      // createClient()가 던지는 경우(예: env var 누락으로 supabaseUrl이 비어있음)를
      // 포함해서, "처리 중…"에 멈춰있지 않고 항상 에러를 보여준다.
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setPending(false);
    }
  }

  if (signupDone) {
    return (
      <div className="text-center">
        <h1 className="mb-4 text-xl font-semibold">가입 확인 이메일을 보냈어요</h1>
        <p className="max-w-sm text-muted">
          {email}로 보낸 이메일의 링크를 눌러 인증을 마치면 로그인할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">
        {mode === "login" ? "로그인" : "회원가입"}
      </h1>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googlePending}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border px-4 py-3 font-medium transition hover:bg-surface disabled:opacity-50"
      >
        <GoogleIcon />
        {googlePending ? "이동 중…" : "Google로 계속하기"}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        또는
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-border px-4 py-3 outline-none focus:border-teal-600"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border px-4 py-3 outline-none focus:border-teal-600"
        />
      </div>

      {error && <p className="mt-3 text-sm text-coral-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-sm bg-teal-600 px-6 py-3 text-white transition hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "login" ? "signup" : "login"));
          setError(null);
        }}
        className="mt-4 w-full text-sm text-muted underline underline-offset-2"
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

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/editor";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setPending(false);
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
        setPending(false);
        return;
      }
      setSignupDone(true);
      setPending(false);
    }
  }

  if (signupDone) {
    return (
      <div className="text-center">
        <h1 className="mb-4 text-xl font-semibold">가입 확인 이메일을 보냈어요</h1>
        <p className="max-w-sm text-gray-500">
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

      <div className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-black"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-black"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-black px-6 py-3 text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "login" ? "signup" : "login"));
          setError(null);
        }}
        className="mt-4 w-full text-sm text-gray-500 underline"
      >
        {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
      </button>
    </form>
  );
}

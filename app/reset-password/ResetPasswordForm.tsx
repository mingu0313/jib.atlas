"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * 비밀번호 재설정 링크로 들어오는 화면 — app/auth/confirm/route.ts가
 * recovery 타입 verifyOtp를 마친 뒤(이때 이미 임시 세션이 선다) 여기로
 * 보낸다. 세션 없이(주소를 직접 친 경우 등) 들어오면 updateUser가
 * "Auth session missing!"으로 실패하므로 그 경우를 알아보기 쉬운 메시지로
 * 바꿔서 보여준다.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(
          error.message === "Auth session missing!"
            ? "링크가 만료됐거나 이미 사용됐어요. 로그인 화면에서 재설정을 다시 요청해주세요."
            : error.message,
        );
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push("/studio");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="font-kr mb-4 text-xl">비밀번호를 바꿨어요</h1>
        <p className="text-muted">잠시 후 이동할게요.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <h1 className="font-kr mb-7 text-2xl">새 비밀번호 설정</h1>
      <input
        type="password"
        required
        minLength={6}
        placeholder="새 비밀번호 (6자 이상)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
        {pending ? "처리 중…" : "비밀번호 바꾸기"}
      </button>
    </form>
  );
}

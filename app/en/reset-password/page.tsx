import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/app/reset-password/ResetPasswordForm";

/** app/reset-password/page.tsx의 영문판 — STEP 17 다국어 확장. */
export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: true },
};

export default function EnglishResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Suspense fallback={null}>
        <ResetPasswordForm lang="en" />
      </Suspense>
    </main>
  );
}

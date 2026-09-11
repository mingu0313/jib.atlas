import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/app/login/LoginForm";

/** app/login/page.tsx의 영문판 — STEP 17 다국어 확장. LoginForm 자체는
 * 두 언어가 공유하고(app/login/LoginForm.tsx), lang="en"만 넘긴다. */
export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: true },
};

export default function EnglishLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginForm lang="en" />
      </Suspense>
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

// 폼뿐이라 색인할 내용이 없다 — robots.ts에서도 크롤 자체를 막지만, 다른
// 곳에서 링크를 타고 들어와 크롤될 경우를 대비해 noindex도 같이 둔다.
export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

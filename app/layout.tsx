import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "jib.atlas",
  description:
    "라이프스타일 진단으로 나에게 어울리는 집 구조를 찾고, 2D 에디터에서 직접 가구를 배치해보는 웹앱.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm">
          <Link
            href="/"
            className="font-semibold tracking-tight text-teal-700"
          >
            jib.atlas
          </Link>
          <div className="flex items-center gap-3 text-muted">
            {user ? (
              <>
                <span>{user.email}</span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="text-muted underline underline-offset-2 transition hover:text-foreground"
                  >
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="underline underline-offset-2 transition hover:text-foreground"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}

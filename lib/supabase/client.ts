import { createBrowserClient } from "@supabase/ssr";

/**
 * app/layout.tsx가 심어둔 <script id="__supabase_config"> JSON을 읽는다.
 * (Next.js 빌드 타임에 NEXT_PUBLIC_* 값이 안 박혀 들어가도 동작하도록,
 * 서버가 요청 시점에 Cloudflare 런타임 env를 읽어 페이지에 넣어준 값이다.)
 * 못 찾으면 process.env로 폴백한다 (로컬 next dev 등).
 */
function readSupabaseConfig() {
  if (typeof document !== "undefined") {
    const el = document.getElementById("__supabase_config");
    if (el?.textContent) {
      try {
        const parsed = JSON.parse(el.textContent) as {
          url?: string;
          anonKey?: string;
        };
        if (parsed.url && parsed.anonKey) {
          return { url: parsed.url, anonKey: parsed.anonKey };
        }
      } catch {
        // 무시하고 아래 폴백으로.
      }
    }
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트.
 * 세션은 쿠키에 저장되어 서버 컴포넌트/라우트 핸들러와 공유된다.
 */
export function createClient() {
  const { url, anonKey } = readSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase 설정을 못 찾았어요. 페이지를 새로고침해도 안 되면 관리자에게 문의해주세요.",
    );
  }
  return createBrowserClient(url, anonKey);
}

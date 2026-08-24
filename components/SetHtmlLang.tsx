"use client";

import { useEffect } from "react";

/**
 * app/layout.tsx의 <html lang="ko">는 루트 레이아웃 하나뿐이라 라우트별로
 * 다시 선언할 수 없다 — Cloudflare Workers 빌드가 middleware/proxy.ts를
 * 지원 안 해서(jib-atlas-no-proxy-middleware 메모 참고) 요청 시점에 경로별로
 * lang을 갈아끼우는 것도 못 한다. 대신 /en 하위 레이아웃(app/en/layout.tsx)
 * 에서 이 컴포넌트로 마운트 시 document.documentElement.lang만 클라이언트에서
 * 바꿔준다. STEP 11(다국어).
 */
export function SetHtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [lang]);

  return null;
}

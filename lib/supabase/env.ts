import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

/**
 * Supabase URL/anon key를 가져온다. 두 경로를 시도한다:
 *
 * 1) Cloudflare Worker 런타임 바인딩(대시보드의 "Variables and Secrets").
 *    Next.js의 NEXT_PUBLIC_* 빌드 타임 주입은 Cloudflare Workers Builds의
 *    빌드 환경변수(런타임 Variables/Secrets와는 다른 위치)에 값을 넣어야만
 *    동작하는데, 그 위치를 찾기 까다로워서 대신 요청 시점에 런타임
 *    바인딩에서 직접 읽는다 — 대시보드 어디에 넣었든 Worker 런타임에
 *    노출되는 값이면 다 동작한다.
 * 2) process.env — 로컬 `next dev`(Cloudflare 컨텍스트가 없음)에서는
 *    .env.local의 값을 그대로 쓴다.
 */
export async function getSupabaseEnv(): Promise<SupabaseEnv | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bound = env as unknown as Record<string, string | undefined>;
    const url = bound.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = bound.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anonKey) return { url, anonKey };
  } catch {
    // Cloudflare 컨텍스트가 없는 환경(로컬 next dev 등) — process.env로 폴백.
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) return { url, anonKey };

  return null;
}

import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * 임시 진단용 라우트. Cloudflare에 등록한 env var가 실제로 이 Worker에
 * 보이는지 확인하려고 만들었다 — 값 자체는 절대 노출하지 않고
 * 존재 여부/길이/앞 몇 글자만 보여준다. 문제 해결되면 지운다.
 */
export async function GET() {
  const env = await getSupabaseEnv();

  let rawKeys: string[] = [];
  try {
    const { env: cfEnv } = await getCloudflareContext({ async: true });
    rawKeys = Object.keys(cfEnv as object);
  } catch (e) {
    rawKeys = [`getCloudflareContext 실패: ${e instanceof Error ? e.message : String(e)}`];
  }

  return NextResponse.json({
    resolvedFromGetSupabaseEnv: env
      ? {
          urlPrefix: env.url.slice(0, 20),
          anonKeyLength: env.anonKey.length,
        }
      : null,
    cloudflareEnvBindingKeys: rawKeys,
    processEnvHasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    processEnvHasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}

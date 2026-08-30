/**
 * 공유카드 PNG(ImageResponse/satori)에 쓸 폰트 5종을 불러온다.
 *
 * fs.readFile이 아니라 fetch로 public/fonts/*를 받아오는 이유: 이 라우트가
 * Cloudflare Workers(opennextjs-cloudflare)에서 돌 때는 실 파일시스템이
 * 없어서 process.cwd() 기준 fs 읽기가 동작하지 않는다 — public/ 정적
 * 파일은 wrangler.jsonc의 ASSETS 바인딩으로만 서빙된다. wrangler.jsonc에
 * 이미 있는 WORKER_SELF_REFERENCE 서비스 바인딩도 같은 이유(워커 안에서
 * 자기 자신에게 fetch)로 마련된 것이라, 여기서도 같은 패턴을 쓴다.
 * next dev/next start(Node)에서도 fetch는 그대로 동작해 런타임을 안 가린다.
 *
 * 모듈 스코프에 캐시해 같은 워커 인스턴스에서는 요청마다 다시 받지 않는다
 * (콜드 스타트 시 리셋). 실패하면 캐시를 비워 다음 요청이 재시도하게 한다.
 */

export interface ShareCardFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700;
  style: "normal" | "italic";
}

interface FontFile extends Omit<ShareCardFont, "data"> {
  file: string;
}

const FONT_FILES: FontFile[] = [
  { name: "Pretendard", file: "Pretendard-Regular.otf", weight: 400, style: "normal" },
  { name: "Pretendard", file: "Pretendard-SemiBold.otf", weight: 600, style: "normal" },
  { name: "Pretendard", file: "Pretendard-Bold.otf", weight: 700, style: "normal" },
  { name: "Instrument Serif", file: "InstrumentSerif-Regular.woff", weight: 400, style: "normal" },
  { name: "Instrument Serif", file: "InstrumentSerif-Italic.woff", weight: 400, style: "italic" },
];

let cachedFonts: Promise<ShareCardFont[]> | null = null;

export function loadShareCardFonts(origin: string): Promise<ShareCardFont[]> {
  if (!cachedFonts) {
    cachedFonts = Promise.all(
      FONT_FILES.map(async ({ file, ...meta }) => {
        const res = await fetch(new URL(`/fonts/${file}`, origin));
        if (!res.ok) throw new Error(`공유카드 폰트를 불러오지 못했어요: ${file} (${res.status})`);
        return { ...meta, data: await res.arrayBuffer() };
      }),
    ).catch((err) => {
      cachedFonts = null;
      throw err;
    });
  }
  return cachedFonts;
}

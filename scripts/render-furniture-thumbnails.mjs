#!/usr/bin/env node
/**
 * STEP 19 — 가구 카탈로그 썸네일 사전 렌더 스크립트.
 *
 * 카탈로그(data/furniture-catalog.json)의 GLTF 항목마다 등각(isometric)
 * 앵글로 한 번 렌더링해서 public/thumbnails/furniture/{id}.png로 저장한다.
 * 실제 렌더는 scripts/thumbnails/entry.ts(브라우저 하네스, esbuild로 번들)를
 * Playwright headless Chromium(SwiftShader 소프트웨어 WebGL2)에 띄워서 한다 —
 * Node 프로세스 자체엔 WebGL 컨텍스트가 없어서 실제 픽셀을 뽑으려면
 * 진짜 브라우저 렌더러가 필요하다.
 *
 * `npm run gen:thumbnails`로 실행 — 카탈로그(모델·materialOverride)가
 * 바뀔 때만 다시 돌리면 되고, 결과 PNG는 public/models처럼 커밋해둔다.
 * Cloudflare Workers 런타임엔 fs가 없어서(메모리 참고) 이 생성 과정 자체가
 * 배포 파이프라인에 섞이면 안 되고 — 이렇게 로컬/CI에서 미리 만들어
 * 커밋해두는 정적 파일이라야 배포 쪽엔 아무 영향이 없다.
 */
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { chromium } from "playwright";
import { furnitureThumbnailUrl } from "../lib/furniturePalette.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const THUMB_SIZE = 512;

const MIME_BY_EXT = {
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

/** entry.ts(+ import하는 lib/furniturePalette.ts 등)를 브라우저에서 그대로
 * 실행 가능한 단일 ESM 번들로 만든다. */
async function bundleHarness() {
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, "thumbnails", "entry.ts")],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    write: false,
  });
  return result.outputFiles[0].text;
}

/** 번들을 실행하는 harness.html을 루트로, 그 외 경로는 public/ 아래 정적
 * 파일(가구 GLB 등)로 그대로 서빙하는 임시 로컬 서버 — def.modelUrl이
 * "/models/..."처럼 public 루트 기준 절대경로라 그대로 매핑된다. */
function startServer(bundleJs) {
  const html = `<!doctype html><html><body><script type="module">${bundleJs}</script></body></html>`;
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
    const filePath = path.join(PUBLIC_DIR, decodeURIComponent(url.pathname));
    if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
      res.writeHead(404);
      res.end();
      return;
    }
    const ext = path.extname(filePath);
    const data = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME_BY_EXT[ext] ?? "application/octet-stream" });
    res.end(data);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  const catalog = JSON.parse(await readFile(path.join(ROOT, "data", "furniture-catalog.json"), "utf8"));
  const targets = catalog.filter((def) => def.modelUrl);
  if (targets.length === 0) {
    console.log("modelUrl이 있는 카탈로그 항목이 없어요 — 할 일 없음.");
    return;
  }

  console.log(`번들링 중… (${targets.length}개 모델)`);
  const bundleJs = await bundleHarness();
  const server = await startServer(bundleJs);
  const { port } = server.address();

  // furnitureThumbnailUrl()이 정한 경로 규칙에서 디렉터리만 뽑아 미리 만든다
  // (id는 아무 값이나 넣어도 상관없다 — 디렉터리 부분만 쓴다).
  const outDir = path.dirname(path.join(PUBLIC_DIR, furnitureThumbnailUrl("placeholder")));
  await mkdir(outDir, { recursive: true });

  // SwiftShader(소프트웨어 WebGL2) 강제 — GPU 없는 CI/컨테이너에서도 항상
  // 같은 방식으로 렌더된다(로컬 개발머신의 실제 GPU 드라이버 차이로 결과
  // 픽셀이 미묘하게 달라지는 걸 피한다).
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage();
  page.on("pageerror", (err) => console.error("[harness error]", err));
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForFunction(() => window.__harnessReady === true);

  let ok = 0;
  for (const def of targets) {
    try {
      const dataUrl = await page.evaluate(
        ([d, size]) => window.renderFurnitureThumbnail(d, size),
        [def, THUMB_SIZE],
      );
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
      const outPath = path.join(PUBLIC_DIR, furnitureThumbnailUrl(def.id));
      await writeFile(outPath, Buffer.from(base64, "base64"));
      ok++;
      console.log(`✓ ${def.id}`);
    } catch (err) {
      console.error(`✗ ${def.id}:`, err?.message ?? err);
    }
  }

  await browser.close();
  server.close();
  console.log(`완료: ${ok}/${targets.length}`);
  if (ok < targets.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

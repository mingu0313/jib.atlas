import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // opennextjs-cloudflare(npm run pages:build)의 생성 산출물. gitignore에는
    // 있었지만 여기 빠져있어서, 빌드 후 lint를 돌리면 번들된 워커 코드까지
    // 파싱하다 OOM으로 죽었다.
    ".open-next/**",
  ]),
]);

export default eslintConfig;

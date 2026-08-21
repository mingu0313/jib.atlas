import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    // Cloudflare Workers 런타임엔 Next 기본 이미지 최적화(sharp 기반 /_next/image)가
    // 없어서, 리사이즈/포맷 변환 없이 원본 URL을 그대로 서빙한다.
    unoptimized: true,
  },
};

export default nextConfig;

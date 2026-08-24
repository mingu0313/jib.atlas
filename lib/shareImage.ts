import { toBlob } from "html-to-image";

/**
 * 공유 카드 DOM → PNG 캡처. ShareCard는 외부 이미지 없이 SVG/CSS로만
 * 그려져 있어(components/ShareCard.tsx) html-to-image가 CORS 걱정 없이
 * 그대로 직렬화할 수 있다. pixelRatio 2로 뽑아 카드 표시 폭(440px)보다
 * 훨씬 선명하게(≈880px) 저장·공유되게 한다.
 */
export async function captureCardPng(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    pixelRatio: 2,
    cacheBust: true,
  });
  if (!blob) {
    throw new Error("이미지를 만들지 못했어요.");
  }
  return blob;
}

/** <a download> 클릭을 흉내내는 브라우저 다운로드 트리거. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

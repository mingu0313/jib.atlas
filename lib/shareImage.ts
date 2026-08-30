/**
 * 공유 카드 PNG는 서버(app/api/share-card/route.tsx, ImageResponse/satori)가
 * 만든다 — 이 파일은 그 결과 Blob을 다운로드로 흘려보내는 순수 브라우저
 * 유틸리티만 남아 있다. (예전엔 DOM을 html-to-image로 캡처했지만, 그
 * 방식은 웹폰트 로딩 타이밍에 결과가 흔들리고 서버에서 캐시도 안 됐다.)
 */

/** <a download> 클릭을 흉내내는 브라우저 다운로드 트리거. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

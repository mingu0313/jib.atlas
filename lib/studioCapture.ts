/**
 * `/studio` 3D 씬(RoomStudioScene3D 안의 <Canvas>) 캡처 브릿지 — STEP 17
 * (완성작 이미지 저장). "이미지로 저장하기" 버튼은 StepFurniture(캔버스
 * 바깥, 형제 컴포넌트)에 있는데 실제 캡처는 <Canvas> 내부에서
 * useThree()로 gl/scene/camera에 접근해야만 할 수 있다 — 이 둘을 이어주는
 * 자리다.
 *
 * zustand store에 넣지 않은 이유: 캡처 함수 자체(클로저로 gl/scene/camera를
 * 쥔 함수)는 "상태"가 아니라 "지금 마운트된 캔버스에 접근하는 방법"이라
 * 리렌더를 트리거할 이유가 없다 — 그냥 모듈 스코프 변수 하나로 충분하고,
 * 오히려 store에 함수를 얹으면 캔버스가 리마운트될 때마다 store가 갱신되며
 * 불필요한 구독자 리렌더가 생긴다.
 */

export type CaptureFn = () => Promise<Blob | null>;

let currentCapture: CaptureFn | null = null;

/** RoomStudioScene3D 내부(Canvas 안)에서 마운트 시 등록, 언마운트 시 null로 해제. */
export function registerStudioCapture(fn: CaptureFn | null): void {
  currentCapture = fn;
}

/** 지금 등록된 캡처 함수가 없으면(3D 씬이 아직 안 마운트됐으면) null. */
export function requestStudioCapture(): Promise<Blob | null> {
  if (!currentCapture) return Promise.resolve(null);
  return currentCapture();
}

/** Blob을 파일로 즉시 다운로드 — <a download> 클릭을 코드로 시뮬레이션하는
 * 표준 패턴. object URL은 클릭 직후 바로 못 지운다(다운로드 시작 전에
 * revoke되면 브라우저에 따라 무효화될 수 있어서) 다음 tick에 지운다. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

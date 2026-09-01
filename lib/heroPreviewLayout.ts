/**
 * DESIGN-HANDOFF-V2.md "5. 룸 에디터 > 기본 배치" 그대로(`sofa(1,1) ctable(4,2)
 * plant(9,0) wardrobe(0,6) desk(7,6) lounge(5,5)`) — lib/iso.ts의 고정
 * RW×RD 격자를 가정한 예시 배치다. 실제 진단 결과에 따라 방을 꾸미는 기능은
 * `/studio`(하우스 타입마다 다른 방 구조, lib/roomBuilderStore.ts)가 맡고,
 * 이 고정 배치는 특정 진단 결과와 무관한 "예시 화면"에만 쓰인다:
 * 랜딩 히어로 미니 창(components/landing/HeroEditorWindow.tsx).
 *
 * 예전엔 격자+박스가구 방식의 룸 에디터(`/editor`, lib/editorStore.ts)가
 * 실제로 이 배치를 초기값으로 썼지만, 그 라우트는 `/studio`로 완전히
 * 대체되고 삭제됐다 — 지금은 이 상수 하나만 랜딩 예시 화면용으로 남았다.
 */
export const DEFAULT_PLACED_DEFS: { defId: string; col: number; row: number }[] = [
  { defId: "sofa", col: 1, row: 1 },
  { defId: "ctable", col: 4, row: 2 },
  { defId: "plant", col: 9, row: 0 },
  { defId: "wardrobe", col: 0, row: 6 },
  { defId: "desk", col: 7, row: 6 },
  { defId: "lounge", col: 5, row: 5 },
];

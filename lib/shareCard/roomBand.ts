import { DEFAULT_PLACED_DEFS } from "@/lib/editorStore";
import { buildIsoBoxes, TILES, WALL_COL0, WALL_ROW0 } from "@/lib/iso";

const BOXES = buildIsoBoxes(DEFAULT_PLACED_DEFS.map((d) => ({ key: `${d.defId}-${d.col}-${d.row}`, ...d })));

/**
 * 공유카드 하단 "이미지 밴드"에 쓸 아이소메트릭 룸 SVG를 만든다.
 *
 * ImageResponse(satori)는 three.js WebGL 씬을 서버에서 그대로 렌더링할 수
 * 없어서(브라우저가 필요하다) "3D 룸 렌더" 자리를 lib/iso.ts 좌표계로 그린
 * 아이소메트릭 투영으로 대신한다 — components/landing/HeroEditorWindow.tsx·
 * (구)components/ShareCard.tsx와 같은 좌표계·기본 배치(DEFAULT_PLACED_DEFS)를
 * 재사용해 셋이 서로 다른 방을 그리지 않는다.
 *
 * 문자열을 그대로 `data:image/svg+xml;base64,...`로 인코딩해 <img src>에
 * 물린다 — 네트워크 요청이 없어서 "이미지 로드 실패"가 애초에 일어날 수
 * 없다(스펙의 접근성 체크리스트 항목).
 */
export function buildRoomBandDataUri(): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="190 30 560 300">` +
    `<rect x="-2000" y="-2000" width="5000" height="5000" fill="#EAE5DA" />` +
    `<polygon points="${WALL_ROW0}" fill="#DDD6C6" />` +
    `<polygon points="${WALL_COL0}" fill="#E4DDCD" />` +
    TILES.map(
      (t) =>
        `<polygon points="${t.points}" fill="${(t.col + t.row) % 2 ? "#F1EEE3" : "#EBE6D9"}" stroke="rgba(22,19,15,0.05)" stroke-width="0.6" />`,
    ).join("") +
    BOXES.map(
      (box) =>
        `<g>` +
        `<polygon points="${box.shadow}" fill="rgba(22,19,15,0.08)" />` +
        `<polygon points="${box.left}" fill="${box.leftFill}" />` +
        `<polygon points="${box.right}" fill="${box.rightFill}" />` +
        `<polygon points="${box.top}" fill="${box.topFill}" />` +
        `</g>`,
    ).join("") +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

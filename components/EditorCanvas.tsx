"use client";

import { buildIsoBoxes, TILES, WALL_COL0, WALL_ROW0 } from "@/lib/iso";
import { canPlace, useEditorStore } from "@/lib/editorStore";
import type { IsoFurnitureDef } from "@/lib/types";

/**
 * 인테리어 에디터 캔버스 — 아이소메트릭 2.5D 타일 렌더링.
 * DESIGN-HANDOFF-V2.md "5. 룸 에디터 > 아이소메트릭 렌더링" 그대로 lib/iso.ts의
 * 공유 좌표계(TW=64,TH=32,OX=468,OY=140,WH=108,RW=10,RD=8)를 쓴다. 드래그
 * 앤 드롭이 아니라 "팔레트에서 가구 선택 → 타일 클릭 → 배치"라 상태는
 * lib/editorStore.ts가 갖고, 이 컴포넌트는 순수 렌더링 + 클릭 위임만 한다.
 *
 * v1과 달리 v2는 다크 모드가 아니다 — 랜딩과 같은 라이트 팔레트라, 타일/벽
 * 색은 문서가 준 리터럴 hex(#ebe8de 등)를 그대로 쓴다("항상 같은 톤이어야
 * 하는 장식 요소라 리터럴로 고정" — 기존 관례와 같은 이유).
 *
 * components/FloorPlan.tsx(탑다운, viewBox "0 0 400 300")와는 좌표계가
 * 완전히 다른 별개 컴포넌트다 — FloorPlan은 /result의 평면도 미리보기에
 * 계속 쓰인다.
 */

export function EditorCanvas({ catalog }: { catalog: IsoFurnitureDef[] }) {
  const items = useEditorStore((s) => s.items);
  const selectedDefId = useEditorStore((s) => s.selectedDefId);
  const placeAt = useEditorStore((s) => s.placeAt);
  const removeItem = useEditorStore((s) => s.removeItem);

  const defById = new Map(catalog.map((d) => [d.id, d]));
  const selectedDef = selectedDefId ? (defById.get(selectedDefId) ?? null) : null;

  const drawnBoxes = buildIsoBoxes(
    items.map((item) => ({ key: item.id, defId: item.defId, col: item.col, row: item.row })),
  );

  return (
    <svg viewBox="180 10 640 470" className="relative w-full max-w-[860px]" style={{ overflow: "visible" }}>
      <polygon points={WALL_ROW0} fill="#d3ccb9" />
      <polygon points={WALL_COL0} fill="#ddd7c7" />

      {TILES.map((tile) => {
        const fill = selectedDef
          ? canPlace(tile.col, tile.row, selectedDef, items)
            ? "#e0e7c9"
            : "#eae7db"
          : (tile.col + tile.row) % 2
            ? "#ebe8de"
            : "#e5e1d6";
        return (
          <polygon
            key={`${tile.col}-${tile.row}`}
            points={tile.points}
            fill={fill}
            stroke="rgba(18,18,15,0.08)"
            strokeWidth={0.75}
            className="cursor-pointer"
            onClick={() => placeAt(tile.col, tile.row)}
          />
        );
      })}

      {drawnBoxes.map((box) => (
        <g
          key={box.key}
          className="cursor-pointer"
          onClick={(e) => {
            // 아래 타일 클릭(배치)과 겹치지 않도록 — SVG는 형제 엘리먼트라
            // 버블링으로 충돌하진 않지만, 명시적으로 막아 의도를 분명히 한다.
            e.stopPropagation();
            removeItem(box.key);
          }}
        >
          {/* 접촉 그림자 — 박스 3면보다 먼저 그린다. 없으면 가구가 공중에 떠 보인다. */}
          <polygon points={box.shadow} fill="rgba(18,18,15,0.08)" />
          <polygon points={box.left} fill={box.leftFill} />
          <polygon points={box.right} fill={box.rightFill} />
          <polygon points={box.top} fill={box.topFill} />
          <text
            x={box.lx}
            y={box.ly}
            textAnchor="middle"
            fill="rgba(18,18,15,0.42)"
            fontFamily="var(--font-mono)"
            fontSize={8}
            letterSpacing="0.24em"
          >
            {box.en}
          </text>
        </g>
      ))}
    </svg>
  );
}

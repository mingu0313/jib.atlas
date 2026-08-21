"use client";

import { useRef } from "react";
import { Group, Layer, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "@/lib/editorStore";
import { ROOM_TYPE_LABELS, type FurnitureCatalogItem, type Room } from "@/lib/types";

// 모델 좌표계는 FloorPlan과 동일한 "0 0 400 300"을 쓰고, 화면에는 2배로 키워 보여준다.
const MODEL_WIDTH = 400;
const MODEL_HEIGHT = 300;
const SCALE = 2;

export function EditorCanvas({
  rooms,
  catalog,
}: {
  rooms: Room[];
  catalog: FurnitureCatalogItem[];
}) {
  const stageRef = useRef<Konva.Stage>(null);
  const items = useEditorStore((s) => s.items);
  const selectedId = useEditorStore((s) => s.selectedId);
  const addItem = useEditorStore((s) => s.addItem);
  const moveItem = useEditorStore((s) => s.moveItem);
  const selectItem = useEditorStore((s) => s.selectItem);

  const catalogById = new Map(catalog.map((c) => [c.id, c]));

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const catalogId = e.dataTransfer.getData("text/catalog-id");
    const stage = stageRef.current;
    if (!catalogId || !stage) return;
    stage.setPointersPositions(e);
    // getPointerPosition()은 캔버스 픽셀 기준 좌표를 주기 때문에, Stage의
    // scaleX/scaleY(2배)를 적용해 모델 좌표(0~400, 0~300)로 변환해주는
    // getRelativePointerPosition()을 써야 한다.
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;
    addItem(catalogId, pos.x, pos.y);
  }

  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (e.target === e.target.getStage()) {
      selectItem(null);
    }
  }

  return (
    <div
      className={`overflow-x-auto rounded-2xl border bg-surface transition-colors ${
        selectedId ? "border-coral-500/50" : "border-border"
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={MODEL_WIDTH * SCALE}
        height={MODEL_HEIGHT * SCALE}
        scaleX={SCALE}
        scaleY={SCALE}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
      >
        <Layer listening={false}>
          <Rect x={0} y={0} width={MODEL_WIDTH} height={MODEL_HEIGHT} fill="#f9fafb" />
          {rooms.map((room, i) => (
            <Group key={i}>
              <Rect
                x={room.position.x}
                y={room.position.y}
                width={room.position.width}
                height={room.position.height}
                fill="#eef0ee"
                stroke="#c7ccc7"
                strokeWidth={1}
                cornerRadius={4}
              />
              <Text
                x={room.position.x}
                y={room.position.y + room.position.height / 2 - 6}
                width={room.position.width}
                align="center"
                text={ROOM_TYPE_LABELS[room.type]}
                fontSize={11}
                fill="#9aa19a"
              />
            </Group>
          ))}
        </Layer>

        <Layer>
          {items.map((item) => {
            const catalogItem = catalogById.get(item.catalogId);
            if (!catalogItem) return null;
            const { width, height, color, label } = catalogItem;
            const selected = item.id === selectedId;
            return (
              <Group
                key={item.id}
                x={item.x}
                y={item.y}
                rotation={item.rotation}
                draggable
                onClick={() => selectItem(item.id)}
                onTap={() => selectItem(item.id)}
                onDragEnd={(e) => moveItem(item.id, e.target.x(), e.target.y())}
                // dragBoundFunc의 pos는 (로컬이 아니라) 스테이지 절대 픽셀 좌표로 들어오고
                // 나가야 해서, SCALE로 모델 좌표로 바꿔 클램프한 뒤 다시 픽셀로 되돌린다.
                dragBoundFunc={(pos) => ({
                  x:
                    Math.max(width / 2, Math.min(MODEL_WIDTH - width / 2, pos.x / SCALE)) *
                    SCALE,
                  y:
                    Math.max(height / 2, Math.min(MODEL_HEIGHT - height / 2, pos.y / SCALE)) *
                    SCALE,
                })}
              >
                <Rect
                  x={-width / 2}
                  y={-height / 2}
                  width={width}
                  height={height}
                  fill={color}
                  stroke={selected ? "#111827" : "#00000030"}
                  strokeWidth={selected ? 2 : 1}
                  dash={selected ? [4, 3] : undefined}
                  cornerRadius={4}
                />
                <Text
                  x={-width / 2}
                  y={-5}
                  width={width}
                  align="center"
                  text={label}
                  fontSize={10}
                  fill="#1f2937"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

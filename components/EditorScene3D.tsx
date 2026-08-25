"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useMemo, useState } from "react";
import { FurnitureShape } from "@/components/furniture3d";
import { FurnitureModel } from "@/components/furnitureModel3d";
import { gridToWorld, HEIGHT_SCALE, ROOM_H, TILE_M } from "@/lib/editor3d";
import { canPlace, useEditorStore } from "@/lib/editorStore";
import { buildRoomLayout, type RoomTileRect } from "@/lib/roomLayout3d";
import { ROOM_TYPE_LABELS, type IsoFurnitureDef, type PlacedFurniture, type Room } from "@/lib/types";

/**
 * 룸 에디터 3D 뷰 — STEP 12(three.js 전환) → STEP 13(하우스 타입별 방
 * 구조) → STEP 14(프로시저럴 가구 형태)에 이어, STEP 15에서 업로드된
 * 스펙(STEP9furniturespec.md) 그대로 Kenney Furniture Kit(CC0) GLTF
 * 모델을 붙였다. def.modelUrl이 있으면 실제 GLTF(FurnitureModel), 없으면
 * STEP 14 프로시저럴 형태(FurnitureShape)로 — 아래 FurnitureVisual 참고.
 *
 * 씬 색은 스펙 2.3대로 다크(#15130f 무드)에서 라이트 그레이지 톤으로
 * 바꿨다 — Kenney 모델 리컬러(그레이지+코퍼, lib/furniturePalette.ts)와
 * 에디터 라이트 UI 톤을 맞추기 위해서다(app/globals.css 토큰 자체는 그대로).
 *
 * 가구 배치 좌표(col/row)는 여전히 방 전체가 공유하는 하나의 격자 위에
 * 있다(방마다 좌표계를 새로 잡지 않는다) — 그래서 PlacedFurniture 저장
 * 스키마(id/defId/col/row/rotated)가 계속 그대로 유지된다. "이 칸이 어느
 * 방인지"는 저장할 필요 없이 항상 room 레이아웃에서 다시 계산한다
 * (roomContaining).
 */

const WALL_THICKNESS = 0.06;

function Floor({
  layoutCols,
  layoutRows,
  roomRects,
  selectedDef,
}: {
  layoutCols: number;
  layoutRows: number;
  roomRects: RoomTileRect[];
  selectedDef: IsoFurnitureDef | null;
}) {
  const items = useEditorStore((s) => s.items);
  const placeAt = useEditorStore((s) => s.placeAt);

  const tiles = useMemo(() => {
    const list: { col: number; row: number }[] = [];
    for (let row = 0; row < layoutRows; row++) {
      for (let col = 0; col < layoutCols; col++) list.push({ col, row });
    }
    return list;
  }, [layoutCols, layoutRows]);

  return (
    <group>
      {tiles.map((tile) => {
        const highlight = selectedDef ? canPlace(tile.col, tile.row, selectedDef, items, roomRects) : false;
        const color = selectedDef
          ? highlight
            ? "#E8D6BC"
            : "#CFC7B9"
          : (tile.col + tile.row) % 2
            ? "#DCD5C9"
            : "#D5CDC0";
        return (
          <mesh
            key={`${tile.col}-${tile.row}`}
            position={[(tile.col + 0.5) * TILE_M, 0, (tile.row + 0.5) * TILE_M]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              placeAt(tile.col, tile.row, roomRects);
            }}
          >
            <planeGeometry args={[TILE_M * 0.96, TILE_M * 0.96]} />
            <meshStandardMaterial color={color} roughness={0.92} metalness={0.02} />
          </mesh>
        );
      })}
    </group>
  );
}

/** 방마다 자기 자신의 좌/뒤(colStart/rowStart) 두 벽만 그린다 — 다른 방과
 * 이 두 변을 공유하면 자연히 그 방 사이 칸막이가 되고, 전체 배치의
 * 바운딩 박스 모서리와 겹치면 외벽이 된다(STEP 12 단일 방의 2벽 관례를
 * 방마다 그대로 적용한 것). 나머지 두 변은 열어둬 카메라가 안을 볼 수 있게. */
function Rooms({ roomRects }: { roomRects: RoomTileRect[] }) {
  return (
    <group>
      {roomRects.map((room, i) => {
        const x0 = room.colStart * TILE_M;
        const z0 = room.rowStart * TILE_M;
        const width = (room.colEnd - room.colStart) * TILE_M;
        const depth = (room.rowEnd - room.rowStart) * TILE_M;
        return (
          <group key={i}>
            <mesh position={[x0, ROOM_H / 2, z0 + depth / 2]} castShadow receiveShadow>
              <boxGeometry args={[WALL_THICKNESS, ROOM_H, depth]} />
              <meshStandardMaterial color="#C9C1B4" roughness={0.95} />
            </mesh>
            <mesh position={[x0 + width / 2, ROOM_H / 2, z0]} castShadow receiveShadow>
              <boxGeometry args={[width, ROOM_H, WALL_THICKNESS]} />
              <meshStandardMaterial color="#E3DDD3" roughness={0.95} />
            </mesh>
            {/* 방 이름표 — 하우스 타입마다 방 구조가 실제로 다르다는 걸 눈에
                보이게 한다(STEP 13 목적 그 자체). 바닥 살짝 위, 항상 표시. */}
            <Html position={[x0 + width / 2, 0.02, z0 + depth / 2]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
              <span
                className="label-mono whitespace-nowrap text-[9px]"
                style={{ color: "rgba(42,38,32,0.55)" }}
              >
                {ROOM_TYPE_LABELS[room.type]}
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function FurnitureLabel({ text }: { text: string }) {
  return (
    <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
      <div className="flex flex-col items-center" style={{ transform: "translateY(-100%)" }}>
        <span className="label-mono whitespace-nowrap text-[10px]" style={{ color: "#2A2620" }}>
          {text}
        </span>
        <span style={{ width: 1, height: 22, background: "rgba(42,38,32,0.45)" }} />
      </div>
    </Html>
  );
}

/** def.modelUrl이 있으면 Kenney GLTF(STEP 15), 없으면 프로시저럴 형태
 * (STEP 14)로 — 로딩 중(Suspense)에도 프로시저럴 형태가 그대로 fallback이라
 * "로딩 중엔 최소 placeholder"가 자연히 충족된다(빈 박스가 아니라 이미
 * 실제 가구 실루엣). */
function FurnitureVisual({ def, width, depth, height }: { def: IsoFurnitureDef; width: number; depth: number; height: number }) {
  const shape = <FurnitureShape def={def} width={width} depth={depth} height={height} />;
  if (!def.modelUrl) return shape;
  return (
    <Suspense fallback={shape}>
      <FurnitureModel def={def} width={width} depth={depth} height={height} />
    </Suspense>
  );
}

function PlacedItem({ item, def }: { item: PlacedFurniture; def: IsoFurnitureDef }) {
  const removeItem = useEditorStore((s) => s.removeItem);
  const [hovered, setHovered] = useState(false);
  const rotated = !!item.rotated;

  // FurnitureVisual은 항상 "회전 안 된" def.w/def.d 기준(로컬 +X=폭,
  // +Z=깊이)으로 그린다 — 실제 90도 회전은 도형을 다시 계산하지 않고 이
  // group을 통째로 Y축으로 돌려서 처리한다(등받이·헤드보드 같은 방향 있는
  // 부분도 같이 돌아가게). 그래서 바닥 위 월드 중심 좌표만 회전 여부에
  // 따라 폭/깊이를 맞바꿔 계산하면 된다 — canPlace가 쓰는 footprint와 동일.
  const width = def.w * TILE_M;
  const depth = def.d * TILE_M;
  const height = def.h * HEIGHT_SCALE;
  const [x, , z] = gridToWorld(item.col, item.row, rotated ? def.d : def.w, rotated ? def.w : def.d);
  // 러그 같은 "floor" 레이어는 바닥 타일과 딱 겹쳐 그려져 z-fighting이
  // 나기 쉬워 살짝 띄운다(STEP 15, 스펙 3.6 렌더 순서 항목).
  const y = def.layer === "floor" ? 0.004 : 0;

  return (
    <group
      position={[x, y, z]}
      rotation={[0, rotated ? Math.PI / 2 : 0, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        removeItem(item.id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <FurnitureVisual def={def} width={width} depth={depth} height={height} />
      {hovered && (
        <group position={[0, height, 0]}>
          <FurnitureLabel text={`${def.en} · ${def.label}`} />
        </group>
      )}
    </group>
  );
}

export function EditorScene3D({ catalog, rooms }: { catalog: IsoFurnitureDef[]; rooms: Room[] }) {
  const items = useEditorStore((s) => s.items);
  const selectedDefId = useEditorStore((s) => s.selectedDefId);

  const defById = useMemo(() => new Map(catalog.map((d) => [d.id, d])), [catalog]);
  const selectedDef = selectedDefId ? (defById.get(selectedDefId) ?? null) : null;

  const layout = useMemo(() => buildRoomLayout(rooms), [rooms]);
  const layoutW = layout.cols * TILE_M;
  const layoutD = layout.rows * TILE_M;

  const target = useMemo<[number, number, number]>(
    () => [layoutW / 2, ROOM_H * 0.25, layoutD / 2],
    [layoutW, layoutD],
  );

  return (
    <div className="h-[470px] w-full max-w-[860px] overflow-hidden rounded-[18px]">
      <Canvas shadows camera={{ position: [layoutW * 1.5, ROOM_H * 1.7, layoutD * 1.7], fov: 32 }}>
        <color attach="background" args={["#EDE8DF"]} />
        <ambientLight intensity={0.85} color="#F4F1EA" />
        <directionalLight
          position={[layoutW * 1.2, ROOM_H * 3, layoutD * 0.4]}
          intensity={1.5}
          color="#FFF6E8"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <Suspense fallback={null}>
          <Floor layoutCols={layout.cols} layoutRows={layout.rows} roomRects={layout.rects} selectedDef={selectedDef} />
          <Rooms roomRects={layout.rects} />
          {items.map((item) => {
            const def = defById.get(item.defId);
            if (!def) return null;
            return <PlacedItem key={item.id} item={item} def={def} />;
          })}
        </Suspense>

        <OrbitControls
          target={target}
          enablePan={false}
          minDistance={Math.max(layoutW, layoutD) * 1.1}
          maxDistance={Math.max(layoutW, layoutD) * 2.8}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.4}
          minAzimuthAngle={-Math.PI * 0.05}
          maxAzimuthAngle={Math.PI * 0.55}
        />
      </Canvas>
    </div>
  );
}

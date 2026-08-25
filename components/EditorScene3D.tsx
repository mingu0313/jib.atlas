"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useMemo, useState } from "react";
import { HEIGHT_SCALE, ROOM_D, ROOM_H, ROOM_W, TILE_M } from "@/lib/editor3d";
import { canPlace, useEditorStore } from "@/lib/editorStore";
import { TILES } from "@/lib/iso";
import type { IsoFurnitureDef, PlacedFurniture } from "@/lib/types";

/**
 * 룸 에디터 3D 뷰 — STEP 12. Three.js(react-three-fiber) 실시간 렌더링으로
 * SVG 아이소메트릭(components/EditorCanvas.tsx)을 대체한다. 상태는 그대로
 * lib/editorStore.ts(items/selectedDefId/placeAt/removeItem)를 공유해 저장·
 * 팔레트·공유 로직은 손대지 않는다. 좌표 환산은 lib/editor3d.ts 참고.
 *
 * 인터랙션도 기존과 동일하게 "팔레트에서 가구 선택 → 바닥 타일 클릭 →
 * 배치, 배치된 가구 클릭 → 제거"를 유지한다 — 바닥을 SVG와 똑같이 타일
 * 하나당 메시 하나로 쪼개 그려서, 선택된 가구를 놓을 수 있는 자리가 초록으로
 * 밝아지는 동작까지 그대로 옮겼다.
 */

const WALL_THICKNESS = 0.06;

function Floor({ selectedDef }: { selectedDef: IsoFurnitureDef | null }) {
  const items = useEditorStore((s) => s.items);
  const placeAt = useEditorStore((s) => s.placeAt);

  return (
    <group>
      {TILES.map((tile) => {
        const highlight = selectedDef ? canPlace(tile.col, tile.row, selectedDef, items) : false;
        const color = selectedDef
          ? highlight
            ? "#c3d199"
            : "#3a372f"
          : (tile.col + tile.row) % 2
            ? "#33302a"
            : "#2b2822";
        return (
          <mesh
            key={`${tile.col}-${tile.row}`}
            position={[(tile.col + 0.5) * TILE_M, 0, (tile.row + 0.5) * TILE_M]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              placeAt(tile.col, tile.row);
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

/** col=0 / row=0 두 벽면 — lib/iso.ts의 WALL_COL0/WALL_ROW0(같은 두 변)를 3D로 옮긴 것. */
function Walls() {
  return (
    <group>
      <mesh position={[0, ROOM_H / 2, ROOM_D / 2]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, ROOM_H, ROOM_D]} />
        <meshStandardMaterial color="#615c4d" roughness={0.95} />
      </mesh>
      <mesh position={[ROOM_W / 2, ROOM_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[ROOM_W, ROOM_H, WALL_THICKNESS]} />
        <meshStandardMaterial color="#6c664f" roughness={0.95} />
      </mesh>
    </group>
  );
}

function FurnitureLabel({ text }: { text: string }) {
  return (
    <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
      <div className="flex flex-col items-center" style={{ transform: "translateY(-100%)" }}>
        <span className="label-mono whitespace-nowrap text-[10px]" style={{ color: "#f4f1e8" }}>
          {text}
        </span>
        <span style={{ width: 1, height: 22, background: "rgba(244,241,232,0.55)" }} />
      </div>
    </Html>
  );
}

function PlacedItem({ item, def }: { item: PlacedFurniture; def: IsoFurnitureDef }) {
  const removeItem = useEditorStore((s) => s.removeItem);
  const [hovered, setHovered] = useState(false);

  const width = def.w * TILE_M;
  const depth = def.d * TILE_M;
  const height = def.h * HEIGHT_SCALE;
  const x = (item.col + def.w / 2) * TILE_M;
  const z = (item.row + def.d / 2) * TILE_M;

  return (
    <group>
      <mesh
        position={[x, height / 2, z]}
        castShadow
        receiveShadow
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
        <boxGeometry args={[width * 0.94, height, depth * 0.94]} />
        <meshStandardMaterial color={def.top} roughness={0.8} metalness={0.06} />
      </mesh>
      {hovered && (
        <group position={[x, height, z]}>
          <FurnitureLabel text={`${def.en} · ${def.label}`} />
        </group>
      )}
    </group>
  );
}

export function EditorScene3D({ catalog }: { catalog: IsoFurnitureDef[] }) {
  const items = useEditorStore((s) => s.items);
  const selectedDefId = useEditorStore((s) => s.selectedDefId);

  const defById = useMemo(() => new Map(catalog.map((d) => [d.id, d])), [catalog]);
  const selectedDef = selectedDefId ? (defById.get(selectedDefId) ?? null) : null;

  const target = useMemo<[number, number, number]>(() => [ROOM_W / 2, ROOM_H * 0.25, ROOM_D / 2], []);

  return (
    <div className="h-[470px] w-full max-w-[860px] overflow-hidden rounded-[18px]">
      <Canvas shadows camera={{ position: [ROOM_W * 1.5, ROOM_H * 1.7, ROOM_D * 1.7], fov: 32 }}>
        <color attach="background" args={["#15130f"]} />
        <fogExp2 attach="fog" args={["#15130f", 0.03]} />
        <ambientLight intensity={0.65} color="#d8cfb2" />
        <directionalLight
          position={[ROOM_W * 1.2, ROOM_H * 3, ROOM_D * 0.4]}
          intensity={1.8}
          color="#ffdfb0"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[ROOM_W * 0.5, ROOM_H * 0.9, ROOM_D * 0.5]} intensity={0.6} color="#ffb877" />

        <Suspense fallback={null}>
          <Floor selectedDef={selectedDef} />
          <Walls />
          {items.map((item) => {
            const def = defById.get(item.defId);
            if (!def) return null;
            return <PlacedItem key={item.id} item={item} def={def} />;
          })}
        </Suspense>

        <OrbitControls
          target={target}
          enablePan={false}
          minDistance={ROOM_W * 1.1}
          maxDistance={ROOM_W * 2.6}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.4}
          minAzimuthAngle={-Math.PI * 0.05}
          maxAzimuthAngle={Math.PI * 0.55}
        />
      </Canvas>
    </div>
  );
}

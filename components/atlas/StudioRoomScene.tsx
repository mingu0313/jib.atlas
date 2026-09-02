"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { FurnitureShape } from "@/components/furniture3d";
import { FurnitureModel } from "@/components/furnitureModel3d";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { computeCameraPose } from "@/lib/cameraPresets";
import { HEIGHT_SCALE, TILE_M, toM, WALL_THICKNESS_CM } from "@/lib/editor3d";
import type { RoomShapeId } from "@/lib/roomBuilderStore";
import { buildWallBoxes, CONVEX_DIAGONAL_SHAPES, getFloorRects, getWallSegments } from "@/lib/roomGeometry";
import { FLOOR_STYLE_PRESETS } from "@/lib/roomStyle";
import type { IsoFurnitureDef, StudioRoomSnapshot } from "@/lib/types";

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];
const furnitureDefById = new Map(furnitureCatalog.map((d) => [d.id, d]));

/** 읽기 전용 바닥 사각형 — components/studio/RoomStudioScene3D.tsx의
 * FloorRect와 같은 지오메트리, 클릭 핸들러만 뺐다(여긴 배치 기능이 없다). */
function FloorRect({ x0, z0, x1, z1, color }: { x0: number; z0: number; x1: number; z1: number; color: string }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      toM(x0), 0, toM(z0),
      toM(x1), 0, toM(z0),
      toM(x1), 0, toM(z1),
      toM(x0), 0, toM(z1),
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    return geo;
  }, [x0, z0, x1, z1]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** 잘라내기·경사진 방 전용 — RoomStudioScene3D.tsx의 FloorFan과 동일. */
function FloorFan({ polygon, color }: { polygon: { x: number; z: number }[]; color: string }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(polygon.length * 3);
    polygon.forEach((p, i) => {
      positions[i * 3] = toM(p.x);
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = toM(p.z);
    });
    const indices: number[] = [];
    for (let i = 1; i < polygon.length - 1; i++) indices.push(0, i, i + 1);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [polygon]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** 벽 하나 — RoomStudioScene3D.tsx의 Wall과 같은 지오메트리(문/창문 자리를
 * 뺀 실제 벽체 조각). store 구독 대신 room prop에서 값을 받는다. */
function Wall({
  wallIndex,
  roomPolygon,
  wallHeightCm,
  wallColorHex,
  openings,
}: {
  wallIndex: number;
  roomPolygon: { x: number; z: number }[];
  wallHeightCm: number;
  wallColorHex: string;
  openings: StudioRoomSnapshot["openings"];
}) {
  const wall = getWallSegments(roomPolygon)[wallIndex];
  const onWall = useMemo(() => openings.filter((o) => o.wallIndex === wallIndex), [openings, wallIndex]);
  const boxes = useMemo(
    () => (wall ? buildWallBoxes(wall.length, onWall, wallHeightCm) : []),
    [wall, onWall, wallHeightCm],
  );
  if (!wall) return null;

  const len = Math.max(wall.length, 1);
  const dx = (wall.end.x - wall.start.x) / len;
  const dz = (wall.end.z - wall.start.z) / len;
  const rotationY = Math.atan2(-dz, dx);

  return (
    <group>
      {boxes.map((box, i) => {
        const lengthM = toM(box.offsetEnd - box.offsetStart);
        const heightM = toM(box.yEnd - box.yStart);
        const centerOffset = (box.offsetStart + box.offsetEnd) / 2;
        const cx = wall.start.x + dx * centerOffset;
        const cz = wall.start.z + dz * centerOffset;
        const cy = (box.yStart + box.yEnd) / 2;
        return (
          <mesh key={i} position={[toM(cx), toM(cy), toM(cz)]} rotation={[0, rotationY, 0]} castShadow receiveShadow>
            <boxGeometry args={[lengthM, heightM, toM(WALL_THICKNESS_CM)]} />
            <meshStandardMaterial color={wallColorHex} roughness={0.92} />
          </mesh>
        );
      })}
      {onWall
        .filter((o) => o.kind === "window")
        .map((win) => {
          const sill = win.sillHeightCm ?? 0;
          const cx = wall.start.x + dx * win.offsetCm;
          const cz = wall.start.z + dz * win.offsetCm;
          const cy = sill + win.heightCm / 2;
          return (
            <mesh key={win.id} position={[toM(cx), toM(cy), toM(cz)]} rotation={[0, rotationY, 0]}>
              <boxGeometry args={[toM(win.widthCm - 4), toM(win.heightCm - 4), toM(2)]} />
              <meshPhysicalMaterial
                color="#bcd8ea"
                transparent
                opacity={0.35}
                roughness={0.1}
                metalness={0}
                transmission={0.6}
              />
            </mesh>
          );
        })}
    </group>
  );
}

/** def.modelUrl이 있으면 실제 GLTF, 없으면 프로시저럴 형태 — RoomStudioScene3D.tsx
 * 의 같은 이름 컴포넌트와 동일한 규칙. */
function FurnitureVisual({ def, width, depth, height }: { def: IsoFurnitureDef; width: number; depth: number; height: number }) {
  const shape = <FurnitureShape def={def} width={width} depth={depth} height={height} />;
  if (!def.modelUrl) return shape;
  return (
    <Suspense fallback={shape}>
      <FurnitureModel def={def} width={width} depth={depth} height={height} />
    </Suspense>
  );
}

/** 가구 하나 — 선택·드래그·회전 인터랙션이 전부 빠진 순수 표시용.
 * item.cx/cz는 이미 "회전 후" footprint 중심이라(스튜디오 쪽 canPlaceFurniture
 * 가 그렇게 계산해서 저장) group을 그 자리에 두면 회전 방향과 무관하게
 * 위치가 맞는다 — RoomStudioScene3D.tsx의 FurnitureItem과 같은 규칙. */
function FurnitureItem({ item }: { item: StudioRoomSnapshot["furniture"][number] }) {
  const def = furnitureDefById.get(item.defId);
  if (!def) return null;
  const width = def.w * TILE_M;
  const depth = def.d * TILE_M;
  const height = def.h * HEIGHT_SCALE;
  const y = def.layer === "floor" ? 0.004 : 0;

  return (
    <group position={[toM(item.cx), y, toM(item.cz)]} rotation={[0, item.rotated ? Math.PI / 2 : 0, 0]}>
      <FurnitureVisual def={def} width={width} depth={depth} height={height} />
    </group>
  );
}

/**
 * 집지도 상세 페이지(app/atlas/[id]/page.tsx)용 읽기 전용 3D 뷰 — STEP 19.
 * components/studio/RoomStudioScene3D.tsx(편집용)와 벽·바닥·가구 렌더링은
 * 완전히 동일하다(둘 다 lib/roomGeometry.ts의 같은 순수 함수·같은
 * lib/editor3d.ts 배율을 쓴다) — 다른 건 딱 세 가지뿐이다.
 *
 * 1. useRoomBuilderStore(전역 편집 스토어)를 전혀 안 쓴다 — 이 컴포넌트가
 *    받은 room prop(StudioRoomSnapshot, DB에서 읽은 스냅샷)만 쓴다. 편집
 *    스토어를 재사용했다면 "남이 공유한 방을 구경하다 /studio로 돌아갔더니
 *    그 방이 편집기에 남아있는" 오염이 생겼을 것 — 그래서 의도적으로
 *    분리했다.
 * 2. 클릭 배치·선택·드래그·키보드 삭제 같은 편집 인터랙션이 전혀 없다 —
 *    보기 전용이라 필요 없다.
 * 3. 카메라가 CameraRig의 항공/상단/사이드 프리셋 스왑 대신 단순
 *    OrbitControls 하나다 — "3D로 직접 돌려보기"가 목적이라 자유 오빗이면
 *    충분하고, 뷰 전환 툴바 같은 편집 UI를 그대로 가져올 이유가 없다.
 *    초기 카메라 위치·타깃·fov는 lib/cameraPresets.ts의 항공뷰 프리셋을
 *    그대로 재사용해서, 스튜디오에서 저장할 때 보던 것과 같은 구도로
 *    시작한다.
 */
export function StudioRoomScene({ room }: { room: StudioRoomSnapshot }) {
  const { roomShape, roomPolygon, wallHeightCm, wallColorHex, floorStyleId, openings, furniture } = room;

  const floorPreset = FLOOR_STYLE_PRESETS.find((p) => p.id === floorStyleId) ?? FLOOR_STYLE_PRESETS[0];
  const isConvexDiagonal = CONVEX_DIAGONAL_SHAPES.includes(roomShape as RoomShapeId);
  const floorRects = useMemo(
    () => (isConvexDiagonal ? [] : getFloorRects(roomShape as RoomShapeId, roomPolygon)),
    [isConvexDiagonal, roomShape, roomPolygon],
  );
  const wallCount = roomPolygon.length;

  const xs = roomPolygon.map((p) => p.x);
  const zs = roomPolygon.map((p) => p.z);
  const spanW = toM(Math.max(...xs) - Math.min(...xs));
  const spanD = toM(Math.max(...zs) - Math.min(...zs));
  const centerX = toM(Math.min(...xs) + Math.max(...xs)) / 2;
  const centerZ = toM(Math.min(...zs) + Math.max(...zs)) / 2;
  const wallHeightM = toM(wallHeightCm);

  const pose = useMemo(
    () => computeCameraPose("aerial", roomPolygon, wallHeightCm, null),
    [roomPolygon, wallHeightCm],
  );
  const orbitSpan = Math.max(spanW, spanD, 1);

  return (
    <Canvas shadows>
      <color attach="background" args={["#EDE8DF"]} />
      <ambientLight intensity={0.85} color="#F4F1EA" />
      <directionalLight
        position={[centerX + spanW, wallHeightM * 4, centerZ + spanD * 0.5]}
        intensity={1.5}
        color="#FFF6E8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {isConvexDiagonal ? (
        <FloorFan polygon={roomPolygon} color={floorPreset.base} />
      ) : (
        floorRects.map((r, i) => (
          <FloorRect key={i} x0={r.x0} z0={r.z0} x1={r.x1} z1={r.z1} color={floorPreset.base} />
        ))
      )}
      {Array.from({ length: wallCount }, (_, i) => (
        <Wall
          key={i}
          wallIndex={i}
          roomPolygon={roomPolygon}
          wallHeightCm={wallHeightCm}
          wallColorHex={wallColorHex}
          openings={openings}
        />
      ))}
      <Suspense fallback={null}>
        {furniture.map((item) => (
          <FurnitureItem key={item.id} item={item} />
        ))}
      </Suspense>

      <PerspectiveCamera makeDefault position={pose.position} fov={pose.fov} near={0.05} far={200} />
      <OrbitControls
        target={pose.target}
        minDistance={orbitSpan * 0.5}
        maxDistance={orbitSpan * 3}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}

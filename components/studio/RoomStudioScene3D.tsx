"use client";

import { Billboard, CameraControls, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FurnitureShape } from "@/components/furniture3d";
import { FurnitureModel } from "@/components/furnitureModel3d";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { computeCameraPose } from "@/lib/cameraPresets";
import { HEIGHT_SCALE, TILE_M } from "@/lib/editor3d";
import { formatLength } from "@/lib/roomDimensions";
import { useRoomBuilderStore, type PlacedStudioFurniture, type Point } from "@/lib/roomBuilderStore";
import { buildWallBoxes, CONVEX_DIAGONAL_SHAPES, getFloorRects, getWallOutwardNormal, getWallSegments } from "@/lib/roomGeometry";
import { FLOOR_STYLE_PRESETS } from "@/lib/roomStyle";
import type { IsoFurnitureDef } from "@/lib/types";

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];
const furnitureDefById = new Map(furnitureCatalog.map((d) => [d.id, d]));

/**
 * `/studio` 3단계(문/창문·마감재)의 3D 미리보기 — STEP 13. 기존
 * EditorScene3D(격자 템플릿 전용)와는 완전히 별개 컴포넌트다: 여기선
 * roomPolygon(cm, 임의 축정렬 폴리곤)을 그대로 3D로 옮긴다.
 *
 * cm → m 변환은 CM_TO_M 하나로 통일(TILE_M 격자와 무관하게 이 컴포넌트
 * 안에서만 쓰는 축척). 벽은 lib/roomGeometry.ts의 buildWallBoxes가
 * 문/창문 자리를 뺀 실제 벽체 조각들을 계산해주면 그걸 그대로 박스
 * 메시로 그린다 — "구멍 뚫린 벽"을 진짜 지오메트리 빈 공간으로 표현하지,
 * 벽 위에 색만 칠한 가짜 문/창문이 아니다.
 *
 * 바닥은 getFloorRects로 쪼갠 축정렬 사각형들을 각각 커스텀
 * BufferGeometry(정점을 world (x,0,z)에 직접 배치)로 그린다 — plane+
 * rotation 조합은 로컬 Y축이 world −Z로 뒤집히는 함정이 있어(회전행렬로
 * 검증됨), 벽 박스 좌표와 어긋날 위험을 아예 없앴다.
 */

const CM_TO_M = 0.01;
const WALL_THICKNESS_CM = 10;

function toM(cm: number) {
  return cm * CM_TO_M;
}

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

/**
 * 잘라내기·경사진(대각선 변이 있는 볼록 다각형) 전용 바닥 — getFloorRects의
 * 축정렬 사각형 분해가 안 통해서, 대신 폴리곤 꼭짓점 0번에서 부채꼴로
 * 삼각분할(fan triangulation)한다. 오목 다각형에선 이 방식이 폴리곤
 * 바깥으로 삐져나온 삼각형을 만들 수 있지만(STEP 13 roomGeometry.ts
 * 주석 참고), 볼록 다각형에서는 어느 꼭짓점에서 부채꼴을 펼치든 항상
 * 폴리곤 안에 완전히 들어맞는다 — 그래서 CONVEX_DIAGONAL_SHAPES에만 쓴다.
 */
function FloorFan({ polygon, color }: { polygon: Point[]; color: string }) {
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

/** 벽 하나 전체 — buildWallBoxes가 준 조각마다 박스 메시 하나, 창문
 * 자리엔 얇은 반투명 유리 패널을 하나 더 얹는다(문은 완전히 뚫려있는
 * 채로 둔다 — 열린 문틀을 그대로 표현). */
function Wall({ wallIndex }: { wallIndex: number }) {
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);
  const wallColorHex = useRoomBuilderStore((s) => s.wallColorHex);
  const openings = useRoomBuilderStore((s) => s.openings);

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
  // 로컬 +X축(박스의 길이 방향)을 (dx,dz) 방향으로 돌리는 Y축 회전각.
  // three.js의 Y축 회전행렬(x'=x·cosθ+z·sinθ, z'=−x·sinθ+z·cosθ)에서
  // 로컬 (1,0,0)이 (dx,dz)로 가게 풀면 θ = atan2(−dz, dx).
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
            <mesh
              key={win.id}
              position={[toM(cx), toM(cy), toM(cz)]}
              rotation={[0, rotationY, 0]}
            >
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

/** def.modelUrl이 있으면 실제 GLTF(Kenney Kit), 없으면 프로시저럴 형태로 —
 * components/EditorScene3D.tsx의 같은 이름 헬퍼와 완전히 동일한 규칙. */
function FurnitureVisual({ def, width, depth, height }: { def: IsoFurnitureDef; width: number; depth: number; height: number }) {
  const shape = <FurnitureShape def={def} width={width} depth={depth} height={height} />;
  if (!def.modelUrl) return shape;
  return (
    <Suspense fallback={shape}>
      <FurnitureModel def={def} width={width} depth={depth} height={height} />
    </Suspense>
  );
}

/**
 * 가구 하나. /editor(components/EditorScene3D.tsx PlacedItem)와 같은 규칙 —
 * FurnitureVisual엔 항상 "회전 안 된" def.w/d 기준 크기를 넘기고, 실제
 * 90도 회전은 group을 통째로 Y축으로 돌려서 처리한다(등받이처럼 방향
 * 있는 형태도 같이 돈다). item.cx/cz는 이미 "회전 후" footprint의
 * 중심이라(store.canPlaceFurniture가 그렇게 계산) group을 그 자리에
 * 두면 회전 방향과 무관하게 위치가 맞는다.
 */
function FurnitureItem({ item }: { item: PlacedStudioFurniture }) {
  const def = furnitureDefById.get(item.defId);
  if (!def) return null;
  const width = def.w * TILE_M;
  const depth = def.d * TILE_M;
  const height = def.h * HEIGHT_SCALE;
  // 러그 같은 "floor" 오브젝트는 바닥 타일과 딱 겹쳐 그려져 z-fighting이
  // 나기 쉬워 살짝 띄운다 — /editor PlacedItem과 동일.
  const y = def.layer === "floor" ? 0.004 : 0;

  return (
    <group position={[toM(item.cx), y, toM(item.cz)]} rotation={[0, item.rotated ? Math.PI / 2 : 0, 0]}>
      <FurnitureVisual def={def} width={width} depth={depth} height={height} />
    </group>
  );
}

/** 벽 색상 박스와 같은 강도로 fov를 트윈하는 시간 상수(초) — 위치·타깃
 * 보간(smoothTime)과 같은 250~400ms 창 안에서 같이 움직여야 "위치는
 * 스르륵, 화각은 뚝" 하는 어색한 전환이 안 생긴다. */
const FOV_SMOOTH_TIME = 0.3;

/**
 * STEP 16 — 항공/상단/사이드 세 카메라 프리셋을 부드럽게 오간다.
 * `CameraControls` 인스턴스 하나를 계속 재사용해서(카메라를 진짜
 * OrthographicCamera로 스왑하지 않음 — lib/cameraPresets.ts 모듈 설명
 * 참고) `setLookAt`이 위치·타깃을, 이 컴포넌트의 `useFrame`이 fov를 같은
 * 호흡으로 트윈한다. 상단/사이드뷰는 "프리셋 샷"이라 자유 오빗을
 * 잠그고(controls.enabled=false), 항공뷰에서만 기존과 같은 오빗 제약
 * (min/maxDistance, min/maxPolarAngle)을 되살린다.
 */
function CameraRig() {
  const controlsRef = useRef<CameraControls>(null);
  const hasFramedOnce = useRef(false);

  const viewMode = useRoomBuilderStore((s) => s.viewMode);
  const sideViewWallId = useRoomBuilderStore((s) => s.sideViewWallId);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);

  const pose = useMemo(
    () => computeCameraPose(viewMode, roomPolygon, wallHeightCm, sideViewWallId),
    [viewMode, roomPolygon, wallHeightCm, sideViewWallId],
  );

  const xs = roomPolygon.map((p) => p.x);
  const zs = roomPolygon.map((p) => p.z);
  const orbitSpan = toM(Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 1));

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    // 첫 프레이밍은 트랜지션 없이 즉시 스냅(마운트 직후 "날아오는" 연출은
    // 원치 않음) — 그 다음부터의 뷰 전환·치수 변경은 전부 부드럽게 보간.
    controls.setLookAt(...pose.position, ...pose.target, hasFramedOnce.current);
    hasFramedOnce.current = true;
    controls.enabled = viewMode === "aerial";
  }, [pose, viewMode]);

  useFrame((state, delta) => {
    const camera = state.camera;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    if (Math.abs(camera.fov - pose.fov) < 0.01) return;
    camera.fov = THREE.MathUtils.damp(camera.fov, pose.fov, 1 / FOV_SMOOTH_TIME, delta);
    camera.updateProjectionMatrix();
  });

  return (
    <CameraControls
      ref={controlsRef}
      smoothTime={FOV_SMOOTH_TIME}
      minDistance={orbitSpan * 0.8}
      maxDistance={orbitSpan * 3}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
    />
  );
}

/** 측정 오버레이(STEP 16) — roomPolygon 각 변 바깥쪽에 실측 길이 라벨을
 * 3D 공간 위에 띄운다. `Billboard`로 항상 카메라를 향하게 해서 항공/상단/
 * 사이드 어느 뷰에서도 읽힌다. 표시 단위는 store.unit(ft/cm) 그대로 —
 * roomPolygon(cm) 자체는 건드리지 않는다. */
const LABEL_OFFSET_CM = 20;

function MeasurementLabels() {
  const visible = useRoomBuilderStore((s) => s.measurementVisible);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const unit = useRoomBuilderStore((s) => s.unit);
  if (!visible) return null;

  return (
    <>
      {getWallSegments(roomPolygon).map((wall) => {
        const n = getWallOutwardNormal(wall);
        const midX = (wall.start.x + wall.end.x) / 2 + n.x * LABEL_OFFSET_CM;
        const midZ = (wall.start.z + wall.end.z) / 2 + n.z * LABEL_OFFSET_CM;
        return (
          <Billboard key={wall.index} position={[toM(midX), 0.08, toM(midZ)]}>
            <Text fontSize={0.14} color="#3A382F" anchorX="center" anchorY="middle" outlineWidth={0.006} outlineColor="#F5F1E8">
              {formatLength(wall.length, unit)}
              {unit}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
}

export function RoomStudioScene3D() {
  const roomShape = useRoomBuilderStore((s) => s.roomShape);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const floorStyleId = useRoomBuilderStore((s) => s.floorStyleId);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);

  const furniture = useRoomBuilderStore((s) => s.furniture);

  const floorPreset = FLOOR_STYLE_PRESETS.find((p) => p.id === floorStyleId) ?? FLOOR_STYLE_PRESETS[0];
  const isConvexDiagonal = CONVEX_DIAGONAL_SHAPES.includes(roomShape);
  const floorRects = useMemo(
    () => (isConvexDiagonal ? [] : getFloorRects(roomShape, roomPolygon)),
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

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-[18px]">
      {/* 초기 position은 대충 던져도 된다 — CameraRig가 마운트 직후
          트랜지션 없이 정확한 항공뷰 프리셋으로 즉시 스냅한다(아래). */}
      <Canvas shadows camera={{ position: [spanW, wallHeightM * 1.8, spanD], fov: 34 }}>
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
          floorRects.map((r, i) => <FloorRect key={i} x0={r.x0} z0={r.z0} x1={r.x1} z1={r.z1} color={floorPreset.base} />)
        )}
        {Array.from({ length: wallCount }, (_, i) => (
          <Wall key={i} wallIndex={i} />
        ))}
        <Suspense fallback={null}>
          {furniture.map((item) => (
            <FurnitureItem key={item.id} item={item} />
          ))}
        </Suspense>
        <MeasurementLabels />

        <CameraRig />
      </Canvas>
    </div>
  );
}

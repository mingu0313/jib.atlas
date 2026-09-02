"use client";

import { Billboard, CameraControls, Line, Text } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FurnitureShape } from "@/components/furniture3d";
import { FurnitureModel } from "@/components/furnitureModel3d";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { computeCameraPose } from "@/lib/cameraPresets";
import { HEIGHT_SCALE, TILE_M } from "@/lib/editor3d";
import { formatLength } from "@/lib/roomDimensions";
import { registerStudioCapture } from "@/lib/studioCapture";
import { useRoomBuilderStore, type PlacedStudioFurniture, type Point } from "@/lib/roomBuilderStore";
import { buildWallBoxes, CONVEX_DIAGONAL_SHAPES, getFloorRects, getWallOutwardNormal, getWallSegments } from "@/lib/roomGeometry";
import { FLOOR_STYLE_PRESETS } from "@/lib/roomStyle";
import type { IsoFurnitureDef } from "@/lib/types";

/** 클릭(배치·선택)과 드래그(항공뷰 오빗)를 구분하는 임계값(px) — 2D 캔버스
 * (RoomFurnitureCanvas 등)의 CLICK_THRESHOLD_PX와 같은 관례. pointerdown→
 * pointerup 사이 이동이 이보다 작아야 "클릭"으로 본다. */
const CLICK_THRESHOLD_PX = 6;

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];
const furnitureDefById = new Map(furnitureCatalog.map((d) => [d.id, d]));

/**
 * `/studio` 3단계(문/창문·마감재)의 3D 미리보기 — STEP 13. 예전 격자
 * 템플릿 전용 룸 에디터(`/editor`, 삭제됨)와는 완전히 별개 컴포넌트다:
 * 여기선 roomPolygon(cm, 임의 축정렬 폴리곤)을 그대로 3D로 옮긴다.
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

/** 바닥 메시가 공통으로 받는 포인터 핸들러 — 가구 배치/선택 해제용(아래
 * useFloorPointerHandlers 참고). FloorRect·FloorFan 둘 다 이걸 그대로
 * <mesh>에 얹기만 한다. */
interface FloorPointerHandlers {
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void;
}

function FloorRect({
  x0,
  z0,
  x1,
  z1,
  color,
  onPointerDown,
  onPointerUp,
}: { x0: number; z0: number; x1: number; z1: number; color: string } & FloorPointerHandlers) {
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
    <mesh geometry={geometry} receiveShadow onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
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
function FloorFan({
  polygon,
  color,
  onPointerDown,
  onPointerUp,
}: { polygon: Point[]; color: string } & FloorPointerHandlers) {
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
    <mesh geometry={geometry} receiveShadow onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
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
 * components/furnitureModel3d.tsx / furniture3d.tsx 자체 규칙을 그대로 따른다. */
function FurnitureVisual({ def, width, depth, height }: { def: IsoFurnitureDef; width: number; depth: number; height: number }) {
  const shape = <FurnitureShape def={def} width={width} depth={depth} height={height} />;
  if (!def.modelUrl) return shape;
  return (
    <Suspense fallback={shape}>
      <FurnitureModel def={def} width={width} depth={depth} height={height} />
    </Suspense>
  );
}

/** 선택된 가구 발밑에 뜨는 사각 아웃라인 — 2D 캔버스(RoomFurnitureCanvas)가
 * 선택된 가구 rect에 var(--color-olive) 테두리를 두르는 것과 같은 색·같은
 * 목적(지금 뭐가 선택됐는지, Delete/R 키가 뭘 건드릴지 보여줌). three.js
 * 머티리얼엔 CSS 변수를 못 넣어서 그 값을 hex로 그대로 옮겼다. */
const SELECTION_COLOR = "#41521f";

/**
 * 가구 하나. 예전 `/editor`(삭제됨)의 PlacedItem과 같은 규칙 —
 * FurnitureVisual엔 항상 "회전 안 된" def.w/d 기준 크기를 넘기고, 실제
 * 90도 회전은 group을 통째로 Y축으로 돌려서 처리한다(등받이처럼 방향
 * 있는 형태도 같이 돈다). item.cx/cz는 이미 "회전 후" footprint의
 * 중심이라(store.canPlaceFurniture가 그렇게 계산) group을 그 자리에
 * 두면 회전 방향과 무관하게 위치가 맞는다.
 *
 * STEP 16 후속 — 클릭으로 선택 가능(드래그/오빗과는 pointerdown→up 이동
 * 거리로 구분). 선택 이후의 삭제(Delete)·회전(R)은 이미 StudioPreviewPanel
 * 의 전역 키보드 핸들러가 뷰 종류와 무관하게 처리해준다 — 여기선 선택만
 * 담당. 이동(드래그)은 아직 2D 평면도 쪽에만 있다(3D 레이캐스팅 드래그는
 * 이번 범위 밖).
 */
function FurnitureItem({ item }: { item: PlacedStudioFurniture }) {
  const def = furnitureDefById.get(item.defId);
  const selectFurnitureItem = useRoomBuilderStore((s) => s.selectFurnitureItem);
  const selectedFurnitureId = useRoomBuilderStore((s) => s.selectedFurnitureId);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  if (!def) return null;
  const width = def.w * TILE_M;
  const depth = def.d * TILE_M;
  const height = def.h * HEIGHT_SCALE;
  // 러그 같은 "floor" 오브젝트는 바닥 타일과 딱 겹쳐 그려져 z-fighting이
  // 나기 쉬워 살짝 띄운다 — /editor PlacedItem과 동일.
  const y = def.layer === "floor" ? 0.004 : 0;
  const isSelected = selectedFurnitureId === item.id;

  return (
    <group
      position={[toM(item.cx), y, toM(item.cz)]}
      rotation={[0, item.rotated ? Math.PI / 2 : 0, 0]}
      onPointerDown={(e) => {
        // 바닥의 배치/선택해제 핸들러로 이 클릭이 새지 않게(가구를 클릭했는데
        // 그 자리에 다른 가구가 놓이거나 선택이 풀리는 걸 막는다).
        e.stopPropagation();
        downPos.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        const start = downPos.current;
        downPos.current = null;
        if (!start) return;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > CLICK_THRESHOLD_PX) return;
        selectFurnitureItem(item.id);
      }}
    >
      <FurnitureVisual def={def} width={width} depth={depth} height={height} />
      {isSelected && (
        <Line
          points={[
            [-width / 2, 0.012, -depth / 2],
            [width / 2, 0.012, -depth / 2],
            [width / 2, 0.012, depth / 2],
            [-width / 2, 0.012, depth / 2],
            [-width / 2, 0.012, -depth / 2],
          ]}
          color={SELECTION_COLOR}
          lineWidth={2.5}
        />
      )}
    </group>
  );
}

/** 위치·타깃 보간(smoothTime)과 같은 250~400ms 창. */
const TRANSITION_TIME = 0.3;

/**
 * STEP 16 — 항공/상단/사이드 세 카메라 프리셋을 오간다. 항공뷰는
 * PerspectiveCamera, 상단·사이드뷰는 진짜 OrthographicCamera(
 * lib/cameraPresets.ts 모듈 설명 참고 — fov 흉내로는 사이드뷰가 방 안쪽에
 * 못 들어가는 문제가 있었다).
 *
 * 두 카메라 객체는 `useMemo`로 한 번만 만들어 계속 재사용하고, 어느 쪽을
 * 쓸지는 이 컴포넌트가 직접 R3F 기본 카메라(`state.camera`)와
 * `CameraControls`의 `camera` prop 양쪽에 같은 객체를 꽂아서 정한다 —
 * drei의 `<PerspectiveCamera makeDefault>`/`<OrthographicCamera
 * makeDefault>` 두 컴포넌트를 나란히 두고 매번 스왑하는 방식도 시도했지만,
 * 두 컴포넌트의 useLayoutEffect가 각자 "이전 기본 카메라로 되돌리기"
 * cleanup을 갖고 있어서 스왑 순서에 따라 둘 다 기본 카메라를 못 차지하는
 * 경쟁이 생겼다(실제로 항공뷰조차 아무것도 안 그려지는 화면으로
 * 재현됨) — 그래서 직접 관리하는 쪽으로 바꿨다.
 *
 * 위치·타깃은 `setLookAt`으로 보간하되, projection 자체가 바뀌는 순간
 * (perspective↔orthographic)만은 트랜지션을 끈다 — 입체감이 있다가
 * 없어지는(또는 반대) 전환은 애초에 "부드럽게 보간"할 수 있는 종류가
 * 아니라서(원근이 사라지는 그 자체가 순간적인 변화), 최소한 위치가
 * "날아오는" 것처럼 보이는 어색함만 없앤다. 같은 orthographic 안에서의
 * 전환(상단↔사이드)은 그대로 부드럽게 보간된다.
 *
 * 상단/사이드뷰는 "프리셋 샷"이라 자유 오빗을 잠그고
 * (controls.enabled=false), 항공뷰에서만 기존 오빗 제약을 되살린다.
 */
function CameraRig() {
  const perspCam = useMemo(() => new THREE.PerspectiveCamera(34, 1, 0.05, 200), []);
  const orthoCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 200), []);
  const controlsRef = useRef<CameraControls>(null);
  const hasFramedOnce = useRef(false);
  const prevProjection = useRef<"perspective" | "orthographic" | null>(null);
  const setDefaultCamera = useThree((state) => state.set);

  const viewMode = useRoomBuilderStore((s) => s.viewMode);
  const sideViewWallId = useRoomBuilderStore((s) => s.sideViewWallId);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);

  const pose = useMemo(
    () => computeCameraPose(viewMode, roomPolygon, wallHeightCm, sideViewWallId),
    [viewMode, roomPolygon, wallHeightCm, sideViewWallId],
  );
  const isOrtho = pose.projection === "orthographic";
  const activeCamera = isOrtho ? orthoCam : perspCam;

  const xs = roomPolygon.map((p) => p.x);
  const zs = roomPolygon.map((p) => p.z);
  const orbitSpan = toM(Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 1));

  // R3F가 실제로 렌더에 쓰는 카메라(state.camera)를 activeCamera로 맞춘다
  // — CameraControls의 camera prop만으론 부족하다(렌더러는 그걸 안 보고
  // state.camera를 본다).
  useEffect(() => {
    setDefaultCamera({ camera: activeCamera });
  }, [activeCamera, setDefaultCamera]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const justSwappedProjection = prevProjection.current !== null && prevProjection.current !== pose.projection;
    prevProjection.current = pose.projection;
    controls.setLookAt(...pose.position, ...pose.target, hasFramedOnce.current && !justSwappedProjection);
    hasFramedOnce.current = true;
    controls.enabled = viewMode === "aerial";
  }, [pose, viewMode]);

  useFrame((state) => {
    const aspect = state.size.width / Math.max(state.size.height, 1);
    if (isOrtho) {
      // orthographic 프러스텀은 fov가 아니라 이 네 값으로 프레이밍이
      // 정해진다 — 매 프레임 다시 계산해두면 캔버스 리사이즈(aspect 변화)
      // 에도 자동 대응된다.
      const h = pose.orthoHalfHeight;
      orthoCam.left = -h * aspect;
      orthoCam.right = h * aspect;
      orthoCam.top = h;
      orthoCam.bottom = -h;
      orthoCam.updateProjectionMatrix();
    } else if (Math.abs(perspCam.aspect - aspect) > 0.001) {
      perspCam.aspect = aspect;
      perspCam.updateProjectionMatrix();
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      camera={activeCamera}
      smoothTime={TRANSITION_TIME}
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

/** 캡처 목표 해상도(긴 변 기준, px) — 온스크린 캔버스는 h-[420px] 컨테이너
 * 안이라 그대로 저장하면 다운로드해서 크게 보기엔 화질이 부족하다. 캡처
 * 순간에만 같은 종횡비를 유지한 채(gl.setSize로 그리기 버퍼만 키우고 CSS
 * 표시 크기는 그대로 둔다, updateStyle=false) 이 값까지 업스케일한다. */
const CAPTURE_TARGET_LONG_EDGE = 2000;
/** 원본 대비 최대 배율 — 좁은 컨테이너(모바일)에서 배율이 과하게 커지면
 * 그 한 프레임 렌더에 GPU 메모리·시간이 튄다. */
const CAPTURE_MAX_SCALE = 4;

/** 한 프레임 기다리기 — 카메라 포즈가 아직 안 잡혔을 때 재시도 간격으로 쓴다. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * `<Canvas>` 내부에서만 gl/scene/camera에 접근할 수 있어서, 캔버스 바깥의
 * "이미지로 저장하기" 버튼(StepFurniture)이 부를 캡처 함수를 여기서 만들어
 * lib/studioCapture.ts에 등록해둔다(STEP 17).
 *
 * 종횡비는 그대로 두고 픽셀 수만 키운다 — camera.aspect/ortho 프러스텀은
 * CameraRig의 useFrame이 매 프레임 `state.size`(컨테이너 CSS 크기) 기준으로
 * 다시 계산하는 값이라, 여기서 직접 안 건드려도 캡처 후 gl.setSize로 원래
 * 크기를 복원하기만 하면 다음 프레임에 알아서 원래 화각으로 돌아온다.
 *
 * toBlob(비동기 콜백) 대신 toDataURL을 쓴다 — toBlob은 호출 시점과 실제
 * 픽셀을 읽어가는 시점 사이에 미묘한 간격이 있어서(구현체마다 다름),
 * frameloop이 계속 도는 상태에서 그 사이 자동 프레임이 끼어들면 드물게
 * 빈 화면이 캡처되는 걸 실제로 겪었다 — toDataURL은 완전히 동기라 이 문제
 * 자체가 생길 수 없다.
 *
 * 카메라 포즈 레이스 — CameraRig의 위치 지정 useEffect는 `<Canvas
 * frameloop="never">`로 시작한 상태(previewMode 기본값 "2d")에선 3D 탭을
 * 처음 열기 전까지 실행이 미뤄질 수 있다(R3F가 frameloop="never"인 동안
 * 자식 트리 첫 렌더 자체를 늦추는 것으로 보임 — 실측: 씬 children은 이미
 * 채워져 있는데 camera.position이 (0,0,0)인 채로 캡처된 사례를 실제로
 * 확인함). "이미지로 저장하기" 버튼이 previewMode를 3D로 바꾼 직후 곧바로
 * 캡처를 요청할 수도 있으므로, 카메라가 원점에 있으면(=아직 안 잡힌
 * 상태) 최대 몇 프레임 기다렸다가 다시 확인한다.
 */
function CaptureBridge() {
  const { gl, scene, camera, size } = useThree();

  useEffect(() => {
    async function capture(): Promise<Blob | null> {
      for (let i = 0; i < 30 && camera.position.lengthSq() === 0; i++) {
        await nextFrame();
      }
      if (camera.position.lengthSq() === 0) return null; // 0.5초 넘게 기다려도 안 잡히면 포기

      const longEdge = Math.max(size.width, size.height);
      const scale = longEdge > 0 ? Math.min(CAPTURE_MAX_SCALE, CAPTURE_TARGET_LONG_EDGE / longEdge) : 1;
      const targetW = Math.round(size.width * scale);
      const targetH = Math.round(size.height * scale);

      gl.setSize(targetW, targetH, false);
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL("image/png");
      gl.setSize(size.width, size.height, false);

      const res = await fetch(dataUrl);
      return await res.blob();
    }

    registerStudioCapture(capture);
    return () => registerStudioCapture(null);
  }, [gl, scene, camera, size]);

  return null;
}

/**
 * `visible`: StudioPreviewPanel이 "2D/3D 보기" 탭 중 지금 3D 탭이 실제로
 * 화면에 보이는지 알려준다(display:none이어도 이 컴포넌트 자체는 항상
 * 마운트돼 있다 — 카메라 각도를 잃지 않으려고, 위 모듈 주석 참고). 안 보일
 * 땐 `frameloop="never"`로 렌더 루프를 완전히 멈춘다 — 안 그러면 화면에
 * 안 보이는 WebGL 씬이 계속 매 프레임 그려지며 GPU/배터리를 갉아먹는다
 * (모바일에서 특히 체감되는 끊김의 흔한 원인). 다시 보이게 되면
 * `frameloop="always"`로 즉시 재개 — 씬 자체(카메라·가구 배치)는 멈춰
 * 있던 동안 그대로 보존돼 있어 재개 시 티가 안 난다.
 */
export function RoomStudioScene3D({ visible = true }: { visible?: boolean }) {
  const roomShape = useRoomBuilderStore((s) => s.roomShape);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const floorStyleId = useRoomBuilderStore((s) => s.floorStyleId);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);

  const furniture = useRoomBuilderStore((s) => s.furniture);
  const selectedFurnitureDefId = useRoomBuilderStore((s) => s.selectedFurnitureDefId);
  const placeFurnitureAt = useRoomBuilderStore((s) => s.placeFurnitureAt);
  const selectFurnitureItem = useRoomBuilderStore((s) => s.selectFurnitureItem);

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

  // 바닥 클릭 = 2D 평면도(RoomFurnitureCanvas)의 배경 클릭과 같은 동작:
  // 팔레트에서 고른 가구가 있으면 그 자리에 놓고, 없으면 선택 해제. 항공뷰
  // 오빗 드래그와 구분하려고 pointerdown→up 사이 이동 거리를 본다(위
  // CLICK_THRESHOLD_PX) — 상단/사이드뷰는 오빗 자체가 잠겨 있어 이 구분이
  // 실질적으로 항상 "그냥 클릭"이 된다.
  const floorDownPos = useRef<{ x: number; y: number } | null>(null);
  const handleFloorPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    floorDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const handleFloorPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const start = floorDownPos.current;
      floorDownPos.current = null;
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > CLICK_THRESHOLD_PX) return;
      if (selectedFurnitureDefId) {
        placeFurnitureAt(e.point.x / CM_TO_M, e.point.z / CM_TO_M);
      } else {
        selectFurnitureItem(null);
      }
    },
    [selectedFurnitureDefId, placeFurnitureAt, selectFurnitureItem],
  );

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-[18px]">
      {/* preserveDrawingBuffer — 캡처(CaptureBridge)가 gl.render() 직후
          바로 toBlob()으로 픽셀을 읽는다. 같은 동기 실행 안이라 이거 없이도
          대체로 되지만, WebGL 스펙상 드로잉 버퍼는 프레젠트 직후 브라우저가
          지울 수 있어서(타이밍은 구현체마다 다름) 이 옵션 없이는 브라우저에
          따라 드물게 빈 화면이 캡처될 수 있다 — 이 정도 규모 씬에서는
          성능 비용이 무시할 만해서 안전하게 켜둔다. */}
      <Canvas shadows frameloop={visible ? "always" : "never"} gl={{ preserveDrawingBuffer: true }}>
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
          <FloorFan
            polygon={roomPolygon}
            color={floorPreset.base}
            onPointerDown={handleFloorPointerDown}
            onPointerUp={handleFloorPointerUp}
          />
        ) : (
          floorRects.map((r, i) => (
            <FloorRect
              key={i}
              x0={r.x0}
              z0={r.z0}
              x1={r.x1}
              z1={r.z1}
              color={floorPreset.base}
              onPointerDown={handleFloorPointerDown}
              onPointerUp={handleFloorPointerUp}
            />
          ))
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
        <CaptureBridge />
      </Canvas>
    </div>
  );
}

"use client";

import { RoundedBox } from "@react-three/drei";
import type { IsoFurnitureDef } from "@/lib/types";

/**
 * STEP 14 — 룸 에디터 3D 뷰(EditorScene3D.tsx)의 가구를 단색 박스 하나가
 * 아니라 실제 가구 형태(다리·등받이·팔걸이·상판 등)로 그린다.
 *
 * 방식: 외부 3D 모델(GLTF)을 새로 붙이지 않고 three.js 기본 도형(박스·
 * 실린더)을 여러 개 조합하는 프로시저럴 지오메트리로 간다 — 실제 브랜드
 * 제품의 공식 3D 모델은 라이선스 없이 못 쓰고, 이름 모를 CC0 에셋은 지금
 * 스타일과 안 맞을 수 있어서다. 나중에 실제 제품 데이터가 생기면
 * IsoFurnitureDef.modelUrl(STEP 12에서 마련해둔 필드)에 GLTF를 넣어 이
 * 프로시저럴 형태를 대체하면 된다.
 *
 * 좌표계: 각 Mesh 컴포넌트는 항상 "회전 안 된 원래 방향" 기준으로 로컬
 * 원점(바닥 중심, y=0)에 그린다 — 가구 폭(width)은 로컬 +X, 깊이(depth)는
 * 로컬 +Z. 실제로 90도 돌아간 가구는 도형을 다시 계산하지 않고, 이
 * 컴포넌트를 감싼 부모 group을 통째로 Y축으로 90도 돌린다
 * (components/EditorScene3D.tsx의 PlacedItem 참고) — 등받이·헤드보드처럼
 * 방향이 있는 부분도 따로 처리할 필요 없이 같이 돌아간다.
 */

interface ShapeProps {
  def: IsoFurnitureDef;
  width: number;
  depth: number;
  height: number;
}

function Box({
  x,
  y,
  z,
  w,
  h,
  d,
  color,
  roughness = 0.82,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  roughness?: number;
}) {
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.06} />
    </mesh>
  );
}

function Cylinder({
  x,
  y,
  z,
  radius,
  h,
  color,
  topRadius,
}: {
  x: number;
  y: number;
  z: number;
  radius: number;
  h: number;
  color: string;
  /** 주어지면 원뿔대(화분) — 없으면 원기둥(다리). */
  topRadius?: number;
}) {
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <cylinderGeometry args={[topRadius ?? radius, radius, h, 14]} />
      <meshStandardMaterial color={color} roughness={0.75} metalness={0.08} />
    </mesh>
  );
}

/** 소파/라운지 체어 공용 — 좌석 박스 + 등받이(뒤쪽) + 팔걸이 2개 + 다리 4개. */
function SofaShape({ def, width, depth, height }: ShapeProps) {
  const legH = height * 0.12;
  const seatTopY = height * 0.52;
  const armW = Math.min(width * 0.14, depth * 0.4);
  const backD = depth * 0.24;
  const seatW = width - armW * 2;
  const seatD = depth - backD;

  return (
    <group>
      {[
        [-width / 2 + armW * 0.5, -depth / 2 + backD * 0.6],
        [width / 2 - armW * 0.5, -depth / 2 + backD * 0.6],
        [-width / 2 + armW * 0.5, depth / 2 - depth * 0.1],
        [width / 2 - armW * 0.5, depth / 2 - depth * 0.1],
      ].map(([lx, lz], i) => (
        <Cylinder key={i} x={lx} y={legH / 2} z={lz} radius={Math.min(width, depth) * 0.035} h={legH} color={def.right} />
      ))}
      <Box
        x={0}
        y={legH + (seatTopY - legH) / 2}
        z={-depth / 2 + backD + seatD / 2}
        w={seatW}
        h={seatTopY - legH}
        d={seatD}
        color={def.top}
      />
      <Box x={0} y={legH + (height - legH) / 2} z={-depth / 2 + backD / 2} w={width} h={height - legH} d={backD} color={def.left} />
      <Box x={-width / 2 + armW / 2} y={legH + (seatTopY + height * 0.1 - legH) / 2} z={0} w={armW} h={seatTopY + height * 0.1 - legH} d={depth} color={def.left} />
      <Box x={width / 2 - armW / 2} y={legH + (seatTopY + height * 0.1 - legH) / 2} z={0} w={armW} h={seatTopY + height * 0.1 - legH} d={depth} color={def.left} />
    </group>
  );
}

/** 다이닝 테이블/책상 공용 — 상판 얇은 박스 + 다리 4개(원기둥). */
function TableShape({ def, width, depth, height }: ShapeProps) {
  const topH = height * 0.08;
  const legR = Math.min(width, depth) * 0.045;
  const inset = legR * 1.8;
  return (
    <group>
      {[
        [-width / 2 + inset, -depth / 2 + inset],
        [width / 2 - inset, -depth / 2 + inset],
        [-width / 2 + inset, depth / 2 - inset],
        [width / 2 - inset, depth / 2 - inset],
      ].map(([lx, lz], i) => (
        <Cylinder key={i} x={lx} y={(height - topH) / 2} z={lz} radius={legR} h={height - topH} color={def.right} />
      ))}
      <Box x={0} y={height - topH / 2} z={0} w={width} h={topH} d={depth} color={def.top} />
    </group>
  );
}

/** 카운터/바 공용 — 몸체(수납장) + 아래쪽 선반 분할선 + 상판(오버행). */
function CounterShape({ def, width, depth, height }: ShapeProps) {
  const topH = height * 0.1;
  const bodyH = height - topH;
  return (
    <group>
      <Box x={0} y={bodyH / 2} z={0} w={width * 0.98} h={bodyH} d={depth * 0.9} color={def.left} />
      <Box x={0} y={bodyH * 0.42} z={depth * 0.45} w={width * 0.98} h={height * 0.025} d={depth * 0.02} color={def.right} />
      <Box x={0} y={bodyH + topH / 2} z={0} w={width * 1.03} h={topH} d={depth * 1.06} color={def.top} />
    </group>
  );
}

/** 옷장 — 몸체 + 문 가운데 세로 분할선 + 손잡이 2개. */
function WardrobeShape({ def, width, depth, height }: ShapeProps) {
  return (
    <group>
      <Box x={0} y={height / 2} z={0} w={width * 0.96} h={height * 0.98} d={depth * 0.92} color={def.left} />
      <Box x={0} y={height / 2} z={depth * 0.46} w={width * 0.02} h={height * 0.9} d={depth * 0.02} color={def.right} />
      {[-width * 0.12, width * 0.12].map((hx, i) => (
        <Cylinder key={i} x={hx} y={height * 0.5} z={depth * 0.47} radius={width * 0.02} h={height * 0.05} color={def.right} />
      ))}
    </group>
  );
}

/** 화분 — 원뿔대 화분 + 구를 여러 개 겹친 잎 뭉치. 위치는 고정 오프셋이라
 * (Math.random 없음) 서버/클라이언트 렌더가 항상 같다. */
function PlantShape({ def, width, depth, height }: ShapeProps) {
  const potH = height * 0.32;
  const potR = Math.min(width, depth) * 0.4;
  const leafY = potH + height * 0.28;
  const leafOffsets: [number, number, number, number][] = [
    [0, 0, 0, height * 0.32],
    [width * 0.18, height * 0.1, depth * 0.12, height * 0.24],
    [-width * 0.2, height * 0.05, -depth * 0.1, height * 0.22],
    [width * 0.02, height * 0.32, -depth * 0.15, height * 0.2],
  ];
  return (
    <group>
      <Cylinder x={0} y={potH / 2} z={0} radius={potR} topRadius={potR * 0.7} h={potH} color={def.left} />
      {leafOffsets.map(([lx, ly, lz, r], i) => (
        <mesh key={i} position={[lx, leafY + ly, lz]} castShadow receiveShadow>
          <sphereGeometry args={[r, 12, 10]} />
          <meshStandardMaterial color={def.top} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/** 침대 — 매트리스(둥근 모서리) + 헤드보드(로컬 -Z 쪽, 벽 붙는 방향) + 다리 4개. */
function BedShape({ def, width, depth, height }: ShapeProps) {
  const legH = height * 0.1;
  const mattressH = height * 0.4;
  const headboardH = height;
  const headboardD = depth * 0.06;
  return (
    <group>
      {[
        [-width / 2 + width * 0.06, -depth / 2 + depth * 0.08],
        [width / 2 - width * 0.06, -depth / 2 + depth * 0.08],
        [-width / 2 + width * 0.06, depth / 2 - depth * 0.08],
        [width / 2 - width * 0.06, depth / 2 - depth * 0.08],
      ].map(([lx, lz], i) => (
        <Cylinder key={i} x={lx} y={legH / 2} z={lz} radius={Math.min(width, depth) * 0.03} h={legH} color={def.right} />
      ))}
      <RoundedBox
        args={[width * 0.94, mattressH, depth * 0.92]}
        radius={Math.min(width, mattressH) * 0.08}
        smoothness={2}
        position={[0, legH + mattressH / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={def.top} roughness={0.75} />
      </RoundedBox>
      <Box x={0} y={headboardH / 2} z={-depth / 2 + headboardD / 2} w={width} h={headboardH} d={headboardD} color={def.left} />
    </group>
  );
}

const SHAPES: Record<string, (props: ShapeProps) => React.JSX.Element> = {
  sofa: SofaShape,
  lounge: SofaShape,
  ctable: TableShape,
  desk: TableShape,
  counter: CounterShape,
  bar: CounterShape,
  wardrobe: WardrobeShape,
  plant: PlantShape,
  bed: BedShape,
};

/** def.id에 맞는 모양을 고른다 — 카탈로그에 없는 새 가구가 추가돼도(모양
 * 매핑이 없으면) 단순 박스로 깨지지 않게 안전하게 떨어진다. */
export function FurnitureShape(props: ShapeProps) {
  const Shape = SHAPES[props.def.id];
  if (!Shape) {
    return <Box x={0} y={props.height / 2} z={0} w={props.width * 0.94} h={props.height} d={props.depth * 0.94} color={props.def.top} />;
  }
  return <Shape {...props} />;
}

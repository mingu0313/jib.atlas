"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type * as THREE from "three";
import { fitScale, measureFootprint, recolorScene } from "@/lib/furniturePalette";
import type { IsoFurnitureDef } from "@/lib/types";

/**
 * STEP 15 — Kenney Furniture Kit(CC0) GLTF 가구 렌더링. def.modelUrl이
 * 있는 항목만 이 컴포넌트를 쓰고, 없는 항목은 계속
 * components/furniture3d.tsx의 프로시저럴 형태(STEP 14)로 그린다
 * (components/studio/RoomStudioScene3D.tsx의 FurnitureVisual 참고).
 *
 * 배치 격자(w×d×h, 곧 canPlace가 쓰는 그 값)는 이 컴포넌트가 절대 못
 * 바꾼다 — 모델의 실제 실측 크기를 재서(measureFootprint) 그 격자 칸
 * 안에 비율 유지한 채로 fitScale하는 식으로만 쓴다. Kenney 모델은 실측
 * 스케일이고 우리 격자는 STEP 12부터 눈대중 배율이라(HEIGHT_SCALE=0.023)
 * 두 스케일 체계가 절대 값으로는 안 맞는데, 이렇게 하면 그 불일치를
 * "항상 제 칸에 맞춰 넣는다"로 흡수해서 배치·저장·충돌 판정은 그리드
 * 기준 그대로 결정적으로 유지된다.
 */
export function FurnitureModel({
  def,
  width,
  depth,
  height,
}: {
  def: IsoFurnitureDef;
  width: number;
  depth: number;
  height: number;
}) {
  const { scene } = useGLTF(def.modelUrl!);

  const { object, scale, yOffset } = useMemo(() => {
    // useGLTF 캐시가 돌려주는 scene은 같은 GLB를 쓰는 모든 배치가 공유하는
    // 객체라, 여기서 바로 안 쓰고 clone한다 — 안 그러면 같은 가구를 두
    // 개 놓았을 때 하나만 화면에 남는다. 리컬러도 이 clone 위에서 딱 한
    // 번만 한다(clone마다 다시 순회하지 않는다).
    const cloned = scene.clone(true);
    recolorScene(cloned, def.materialOverride);
    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    const { size, yOffset } = measureFootprint(cloned);
    const scale = fitScale(size, width, depth, height);
    return { object: cloned, scale, yOffset };
  }, [scene, def.materialOverride, width, depth, height]);

  return (
    <group position={[0, yOffset * scale, 0]} scale={scale}>
      <primitive object={object} />
    </group>
  );
}

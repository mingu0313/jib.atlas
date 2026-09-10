import * as THREE from "three";

/**
 * STEP 15 — Kenney Furniture Kit(CC0) GLTF 가구용 리컬러 유틸.
 * 업로드된 스펙 문서(STEP9furniturespec.md) 2.2/3.5 그대로의 그레이지+코퍼
 * 팔레트다. 3D 씬 안에서만 쓰고 app/globals.css 토큰(올리브+세이지)은
 * 건드리지 않는다 — 에디터 UI(팔레트 패널·상단바 등)는 계속 기존 디자인
 * 시스템을 쓰고, 씬 내부 3D 오브젝트 색만 이 팔레트로 통일한다.
 */
export const PALETTE = {
  "greige.100": "#E3DDD3",
  "greige.300": "#C9C1B4",
  "greige.500": "#A79E8F",
  "greige.700": "#7C7466",
  "copper.400": "#C98A5E",
  "copper.600": "#A9633C",
  "copper.800": "#7E4527",
  "copper.metal": "#B87333",
  "neutral.chalk": "#F4F1EA",
  "neutral.ink": "#2A2620",
  "accent.leaf": "#6F7A52",
} as const;

export type PaletteKey = keyof typeof PALETTE;

/**
 * STEP 20 — 놓기 전 색상 스와치(FurniturePalette). recolorScene이 머티리얼
 * "이름"으로 색을 입히는데, Kenney 킷은 딱 하나로 뭉뚱그려지지 않는다 —
 * 책상·책장처럼 몸체가 "wood"인 항목도 있고, 소파·의자·스툴처럼 눈에 보이는
 * 대부분이 쿠션/패브릭이라 "carpet"인 항목도 있다(카탈로그의 기존
 * materialOverride들이 의자·소파류에 carpet을 얹어둔 게 그 증거 —
 * desk-chair, chair-cushion, sofa-long 등). 카테고리 하나로 이 둘을
 * 구분하려다 실패한 적이 있어서(처음엔 wood 하나만 덮어써서 소파가 전혀
 * 안 바뀌는 버그였다), 아예 두 이름 다 같은 색으로 덮어쓴다 — 어떤 이름을
 * 쓰는 모델이든 스와치를 고르면 확실히 색이 바뀌고, 프레임과 쿠션이 서로
 * 다른 색으로 남는 어색함도 없다. 카탈로그에 없는 이름을 덮어써도
 * recolorScene이 그냥 무시하니(그 이름의 머티리얼이 없으면 아무 효과 없음)
 * 안전하다.
 */
const RECOLOR_MATERIAL_KEYS = ["wood", "carpet"] as const;

export function withColorOverride(
  materialOverride: Record<string, PaletteKey> | undefined,
  colorKey: PaletteKey,
): Record<string, PaletteKey> {
  const next = { ...materialOverride };
  for (const key of RECOLOR_MATERIAL_KEYS) next[key] = colorKey;
  return next;
}

/**
 * 팔레트 카드 썸네일(STEP 19)의 사전 렌더 PNG 경로 규칙. 실제 파일은
 * `scripts/render-furniture-thumbnails.mjs`가 이 규칙 그대로
 * `public/thumbnails/furniture/{id}.png`에 생성하고,
 * components/studio/FurniturePalette.tsx가 같은 규칙으로 읽는다 —
 * 두 쪽 다 이 함수 하나만 참조해서 규칙이 어긋날 일이 없게 한다.
 */
export function furnitureThumbnailUrl(defId: string): string {
  return `/thumbnails/furniture/${defId}.png`;
}

/**
 * Kenney Furniture Kit 전체(140개 모델) 공용 머티리얼 이름 → 팔레트 키
 * 기본 매핑. GLB를 직접 열어 실제 머티리얼 이름을 덤프해서 확정했다
 * (스펙 3.2가 "실제로 열어봐야 안다"고 한 그 이름들 — wood/fabric/metal
 * 같은 뭉뚱그린 이름이 아니라 wood/woodDark/metal/metalDark/metalMedium/
 * carpet/carpetDarker/carpetWhite/plant/lamp/_defaultMat 11종이었다).
 * 킷 전체가 이 이름들을 재사용하므로, 카탈로그 항목별 materialOverride는
 * 이 기본값과 달라야 하는 경우에만 있으면 된다(스펙이 걱정한 "항목마다
 * 색 매핑 다 새로 정의"는 대부분 필요 없다).
 */
export const DEFAULT_MATERIAL_PALETTE: Record<string, PaletteKey> = {
  wood: "copper.600",
  woodDark: "copper.800",
  metal: "neutral.ink",
  metalDark: "neutral.ink",
  metalMedium: "neutral.ink",
  carpet: "greige.300",
  carpetDarker: "greige.500",
  carpetWhite: "greige.100",
  plant: "accent.leaf",
  lamp: "neutral.chalk",
  _defaultMat: "greige.300",
};

/**
 * GLTF scene을 순회하며 머티리얼 이름(위 기본 매핑 + 항목별 override)에
 * 맞춰 color를 팔레트 색으로 바꾼다. Kenney 킷은 전부 단일 텍스처
 * 아틀라스를 쓰므로, map이 있는 머티리얼은 color가 텍스처에 곱해져
 * 원본 명암·질감(에이오·그레이디언트)은 그대로 남고 색조만 바뀐다.
 *
 * 머티리얼은 useGLTF 캐시가 모델 전체에서 공유하므로(같은 GLB를 여러
 * 개 배치하면 같은 머티리얼 인스턴스를 참조) 반드시 clone 후 교체한다
 * — 안 그러면 한 가구의 리컬러가 같은 모델을 쓰는 다른 배치 항목에도
 * 전염된다.
 */
export function recolorScene(scene: THREE.Object3D, overrides?: Record<string, PaletteKey>): THREE.Object3D {
  const merged = { ...DEFAULT_MATERIAL_PALETTE, ...overrides };

  function recolorOne(m: THREE.Material): THREE.Material {
    const mat = m as THREE.MeshStandardMaterial;
    const key = merged[mat.name ?? ""];
    if (!key) return mat;

    const next = mat.clone();
    next.color = new THREE.Color(PALETTE[key]);
    if (key === "copper.metal") {
      next.metalness = 0.85;
      next.roughness = 0.35;
    } else if (key === "neutral.ink") {
      next.metalness = 0.55;
      next.roughness = 0.5;
    } else {
      next.metalness = 0.04;
      next.roughness = 0.85;
    }
    return next;
  }

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    // 원래 material이 배열이 아니었으면(대부분의 Kenney 모델처럼 지오메트리에
    // groups가 없는 단일 머티리얼 메시) 배열로 감싸지 않고 그대로 단일
    // 값으로 되돌려준다 — geometry.groups가 없는데 material만 배열이 되면
    // three.js가 아예 안 그리는 경우가 있었다(이번에 실제로 겪은 버그).
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(recolorOne) : recolorOne(mesh.material);
  });

  return scene;
}

/**
 * 모델의 실제 바운딩박스를 재서, (a) 바닥을 y=0에 맞추는 오프셋과
 * (b) 이 모델이 실제로 몇 타일을 차지하는지(참고용)를 돌려준다.
 *
 * STEP 15는 이 측정값으로 배치 격자(canPlace) 자체를 바꾸지 않는다 —
 * Kenney 모델은 실측 스케일이고 우리 격자(TILE_M/HEIGHT_SCALE)는 STEP
 * 12부터 눈대중 배율이라 그대로 충돌한다(스펙 1.4가 지적한 문제). 대신
 * `fitScale()`로 카탈로그가 선언한 격자 칸(w×d×h) 안에 항상 맞춰 넣는
 * 쪽을 택했다 — 배치·저장·충돌 판정은 계속 결정적이고 그리드 기준
 * 그대로 유지되고, 모델마다 원본 스케일이 달라도 시각적으로 항상 제
 * 칸에 들어간다. measureFootprint는 대신 "선언한 footprint가 실측과
 * 많이 다르면" 콘솔에 경고해 카탈로그 JSON을 나중에 손으로 맞출 수 있게
 * 하는 개발 진단용이다.
 *
 * xOffset/zOffset — STEP 21 후속 버그 수정. RoomStudioScene3D의
 * FurnitureItem은 group을 item.cx/cz(=footprint 중심)에 두고, 선택
 * 아웃라인(Line)도 그 그룹의 로컬 원점(0,0)이 footprint 중심이라고
 * 가정해서 그린다. y는 항상 바닥(min.y)을 기준으로 접지해서 문제가 없지만
 * x/z는 그대로 안 맞춰줬었다 — Kenney 모델 중 원점(피벗)이 바운딩박스
 * 중심이 아니라 한쪽 구석 근처에 있는 것들(실제로 서랍 사이드테이블에서
 * 확인됨)은 그 피벗 오차만큼 실루엣이 선택 박스·격자 중심에서 벗어나
 * 보였다. 바운딩박스 "중심"을 원점에 오도록 한 번 더 옮겨서 고친다.
 */
export function measureFootprint(scene: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return { size, yOffset: -box.min.y, xOffset: -center.x, zOffset: -center.z };
}

/**
 * 모델을 (widthM × depthM × heightM) 칸에 딱 맞도록 균등 스케일한다.
 * 원본 세 축 비율은 유지하고(찌그러지지 않게), 세 축 중 가장 빡빡한
 * 축 기준으로 축소/확대한다.
 */
export function fitScale(size: THREE.Vector3, widthM: number, depthM: number, heightM: number): number {
  const sx = size.x > 0 ? widthM / size.x : 1;
  const sy = size.y > 0 ? heightM / size.y : 1;
  const sz = size.z > 0 ? depthM / size.z : 1;
  return Math.min(sx, sy, sz);
}

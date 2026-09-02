import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { recolorScene } from "../../lib/furniturePalette";
import type { IsoFurnitureDef } from "../../lib/types";

/**
 * STEP 19 — 가구 카탈로그 썸네일 사전 렌더용 브라우저 하네스.
 * scripts/render-furniture-thumbnails.mjs가 esbuild로 이 파일을 번들해
 * Playwright(headless Chromium, SwiftShader)에 올린 뒤 카탈로그 항목마다
 * window.renderFurnitureThumbnail()을 호출해 PNG를 받아간다.
 *
 * recolorScene()은 components/furnitureModel3d.tsx(룸 뷰 실시간 렌더)와
 * 완전히 같은 함수를 그대로 import해서 쓴다 — 썸네일 색이 룸 안에 놓인
 * 실제 색과 항상 일치해야 하니, 로직을 복붙하지 않고 재사용한다.
 */

/** 참 등각(true isometric) 각도 — elevation=35.264°(atan(1/√2)), azimuth=45°.
 * 방 형태에 맞출 필요가 없는 단일 오브젝트 썸네일이라 고정값으로 충분하다. */
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2));
const ISO_AZIMUTH = Math.PI / 4;
/** 바운딩 스피어에 두는 여백 — lib/cameraPresets.ts의 PADDING(1.15)과 같은
 * 발상(스피어 기준 프레이밍)이라 값도 그대로 맞췄다. */
const PADDING = 1.15;

const loader = new GLTFLoader();

function loadGltf(url: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setClearColor(0x000000, 0);
// 색 관리 설정은 룸 뷰(R3F 기본값)와 맞춰야 recolorScene 결과 색조가 같게
// 보인다 — R3F는 THREE.ColorManagement를 기본 활성 상태로 둔다.
THREE.ColorManagement.enabled = true;

async function renderFurnitureThumbnail(def: IsoFurnitureDef, size: number): Promise<string> {
  renderer.setSize(size, size, false);

  const scene = new THREE.Scene();
  // components/studio/RoomStudioScene3D.tsx의 ambient/directional 톤 그대로 —
  // 룸 안에서 보이는 것과 같은 조명 느낌을 썸네일에도 준다.
  scene.add(new THREE.AmbientLight("#F4F1EA", 0.85));
  const dirLight = new THREE.DirectionalLight("#FFF6E8", 1.5);
  dirLight.position.set(3, 6, 4);
  scene.add(dirLight);

  const model = await loadGltf(def.modelUrl!);
  recolorScene(model, def.materialOverride);
  scene.add(model);

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const sizeVec = box.getSize(new THREE.Vector3());
  model.position.sub(center);

  const radius = Math.max(sizeVec.length() / 2, 0.01);
  const half = radius * PADDING;
  const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.01, radius * 20);
  const dir = new THREE.Vector3(
    Math.cos(ISO_ELEVATION) * Math.sin(ISO_AZIMUTH),
    Math.sin(ISO_ELEVATION),
    Math.cos(ISO_ELEVATION) * Math.cos(ISO_AZIMUTH),
  ).multiplyScalar(radius * 4);
  camera.position.copy(dir);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL("image/png");

  // 다음 항목 렌더 전에 이번 GLTF의 지오메트리/머티리얼을 확실히 해제 —
  // 카탈로그를 순서대로 다 돌 때까지 GPU 메모리가 계속 쌓이지 않게 한다.
  model.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => m.dispose());
  });

  return dataUrl;
}

declare global {
  interface Window {
    renderFurnitureThumbnail: typeof renderFurnitureThumbnail;
    __harnessReady?: boolean;
  }
}

window.renderFurnitureThumbnail = renderFurnitureThumbnail;
window.__harnessReady = true;

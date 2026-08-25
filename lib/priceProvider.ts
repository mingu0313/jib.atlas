import furnitureCatalogData from "@/data/furniture-catalog.json";
import type { FurnitureCategory, IsoFurnitureDef } from "./types";

/**
 * STEP 14 — 예산 계산이 실제 가격 데이터에 의존하지 않게 하는 경계.
 * 지금은 MockPriceProvider 하나뿐이지만, 나중에 실제 쇼핑몰 API·크롤링
 * 데이터로 바꿀 땐 이 인터페이스를 구현하는 다른 클래스로 갈아끼우면
 * 된다 — 호출부(lib/budget.ts, 예산 UI)는 PriceProvider 타입에만
 * 의존하니 한 줄도 안 건드려도 된다.
 */
export interface PriceProvider {
  /** 원/m² — 바닥재 프리셋(lib/roomStyle.ts FLOOR_STYLE_PRESETS)별 단가. */
  getFloorUnitPrice(floorStyleId: string): number;
  /** 원/m² — 벽 페인트 단가. 색상별로 값이 달라질 수 있게 인터페이스는
   * hex를 받지만, 지금 구현체는 색과 무관하게 고정 단가를 준다(대부분의
   * 실제 페인트도 색보다 마감/브랜드로 가격이 갈린다). */
  getWallPaintUnitPrice(wallColorHex: string): number;
  /** 원 — 문 1개(자재+시공 근사), presetId는 lib/roomStyle.ts DOOR_PRESETS. */
  getDoorUnitPrice(presetId: string): number;
  /** 원 — 창문 1개, presetId는 WINDOW_PRESETS. */
  getWindowUnitPrice(presetId: string): number;
  /** 원 — 가구 1개. data/furniture-catalog.json의 defId로 조회하고,
   * 못 찾으면 0을 준다(에러 아님 — 카탈로그에 없는 id를 넘겨도 예산
   * 계산 전체가 죽지 않게). */
  getFurnitureUnitPrice(defId: string): number;
}

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];

/**
 * 출처 불명확한 mock 가격 — 실제 쇼핑몰 시세를 조사하지 않고 "그럴듯한
 * 범위"로 하드코딩했다. 나중에 실제 데이터로 교체할 사람을 위한 메모:
 * 가구는 개별 defId 38종을 다 나열하는 대신 카테고리(8종)별 평균가로
 * 근사한다 — 실제 데이터가 들어오면 이 카테고리 평균 대신 defId별 실제
 * 가격을 그대로 매핑하면 된다(인터페이스 시그니처 getFurnitureUnitPrice
 * (defId) 자체는 안 바뀐다).
 */
export class MockPriceProvider implements PriceProvider {
  private floorPricePerM2: Record<string, number> = {
    oak: 45_000,
    walnut: 62_000,
    "tile-light": 38_000,
    carpet: 28_000,
  };
  private wallPaintPricePerM2 = 12_000;
  private doorPrice: Record<string, number> = {
    "door-80": 180_000,
    "door-90": 210_000,
    "door-slide-120": 350_000,
  };
  private windowPrice: Record<string, number> = {
    "window-60": 150_000,
    "window-120": 260_000,
    "window-180": 420_000,
  };
  private furniturePricePerCategory: Record<FurnitureCategory, number> = {
    storage: 320_000,
    "storage-item": 60_000,
    bed: 550_000,
    textile: 45_000,
    sofa: 780_000,
    plant: 35_000,
    dining: 280_000,
    desk: 260_000,
  };

  getFloorUnitPrice(floorStyleId: string): number {
    return this.floorPricePerM2[floorStyleId] ?? 40_000;
  }

  getWallPaintUnitPrice(): number {
    return this.wallPaintPricePerM2;
  }

  getDoorUnitPrice(presetId: string): number {
    return this.doorPrice[presetId] ?? 200_000;
  }

  getWindowUnitPrice(presetId: string): number {
    return this.windowPrice[presetId] ?? 250_000;
  }

  getFurnitureUnitPrice(defId: string): number {
    const def = furnitureCatalog.find((d) => d.id === defId);
    if (!def?.category) return 0;
    return this.furniturePricePerCategory[def.category] ?? 0;
  }
}

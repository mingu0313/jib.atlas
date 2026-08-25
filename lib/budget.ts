import type { PlacedOpening, Point, RoomShapeId } from "./roomBuilderStore";
import { getFloorAreaM2, getWallAreaM2 } from "./roomGeometry";
import type { PriceProvider } from "./priceProvider";
import { DOOR_PRESETS, FLOOR_STYLE_PRESETS, WINDOW_PRESETS } from "./roomStyle";

export interface BudgetLineItem {
  id: string;
  label: string;
  /** "18.2m²" · "2개" 처럼 화면에 그대로 보여줄 수량 표기. */
  quantityLabel: string;
  unitPrice: number;
  subtotal: number;
}

export interface BudgetResult {
  total: number;
  items: BudgetLineItem[];
}

/** 배치된 가구 하나 — /studio는 아직 가구 배치가 없어 항상 빈 배열을
 * 넘기지만, /editor의 PlacedFurniture({defId, col, row, ...})도 이 최소
 * 모양만 맞으면 그대로 넘길 수 있게 defId만 요구한다. */
export interface FurnitureBudgetInput {
  defId: string;
}

function countByPreset(openings: PlacedOpening[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const opening of openings) {
    counts.set(opening.presetId, (counts.get(opening.presetId) ?? 0) + 1);
  }
  return counts;
}

/**
 * STEP 14 — 방 상태(폴리곤·마감재·문/창문·가구)와 PriceProvider로 예산을
 * 계산한다. 순수 함수 — provider만 바뀌면(mock → 실데이터) 이 함수는
 * 한 줄도 안 바뀐다.
 */
export function calculateStudioBudget(params: {
  provider: PriceProvider;
  roomShape: RoomShapeId;
  roomPolygon: Point[];
  wallHeightCm: number;
  wallColorHex: string;
  floorStyleId: string;
  openings: PlacedOpening[];
  furnitureItems?: FurnitureBudgetInput[];
}): BudgetResult {
  const { provider, roomShape, roomPolygon, wallHeightCm, wallColorHex, floorStyleId, openings, furnitureItems = [] } = params;

  const items: BudgetLineItem[] = [];

  const floorAreaM2 = getFloorAreaM2(roomShape, roomPolygon);
  const floorUnit = provider.getFloorUnitPrice(floorStyleId);
  const floorLabel = FLOOR_STYLE_PRESETS.find((p) => p.id === floorStyleId)?.label ?? "바닥재";
  items.push({
    id: "floor",
    label: `바닥재 · ${floorLabel}`,
    quantityLabel: `${floorAreaM2.toFixed(1)}m²`,
    unitPrice: floorUnit,
    subtotal: Math.round(floorAreaM2 * floorUnit),
  });

  const wallAreaM2 = getWallAreaM2(roomPolygon, wallHeightCm, openings);
  const wallUnit = provider.getWallPaintUnitPrice(wallColorHex);
  items.push({
    id: "wall-paint",
    label: "벽 페인트",
    quantityLabel: `${wallAreaM2.toFixed(1)}m²`,
    unitPrice: wallUnit,
    subtotal: Math.round(wallAreaM2 * wallUnit),
  });

  const doorCounts = countByPreset(openings.filter((o) => o.kind === "door"));
  for (const [presetId, count] of doorCounts) {
    const unit = provider.getDoorUnitPrice(presetId);
    items.push({
      id: `door-${presetId}`,
      label: DOOR_PRESETS.find((p) => p.id === presetId)?.label ?? "문",
      quantityLabel: `${count}개`,
      unitPrice: unit,
      subtotal: unit * count,
    });
  }

  const windowCounts = countByPreset(openings.filter((o) => o.kind === "window"));
  for (const [presetId, count] of windowCounts) {
    const unit = provider.getWindowUnitPrice(presetId);
    items.push({
      id: `window-${presetId}`,
      label: WINDOW_PRESETS.find((p) => p.id === presetId)?.label ?? "창문",
      quantityLabel: `${count}개`,
      unitPrice: unit,
      subtotal: unit * count,
    });
  }

  const furnitureSubtotal = furnitureItems.reduce((sum, f) => sum + provider.getFurnitureUnitPrice(f.defId), 0);
  items.push({
    id: "furniture",
    label: "가구",
    quantityLabel: furnitureItems.length > 0 ? `${furnitureItems.length}개` : "아직 배치 전",
    unitPrice: 0,
    subtotal: furnitureSubtotal,
  });

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { total, items };
}

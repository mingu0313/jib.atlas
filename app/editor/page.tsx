"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { useEditorStore } from "@/lib/editorStore";
import { matchHouseTemplate } from "@/lib/matching";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import type { Answer, FurnitureCatalogItem } from "@/lib/types";

const furnitureCatalog = furnitureCatalogData as FurnitureCatalogItem[];

// Konva는 캔버스/window에 의존해서 서버에서 렌더링할 수 없다.
const EditorCanvas = dynamic(
  () => import("@/components/EditorCanvas").then((m) => m.EditorCanvas),
  { ssr: false, loading: () => <CanvasSkeleton /> },
);

const TOTAL_QUESTION_COUNT = 23;

function CanvasSkeleton() {
  return (
    <div className="flex h-[300px] w-full max-w-[800px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-400 sm:h-[600px]">
      캔버스 불러오는 중…
    </div>
  );
}

export default function EditorPage() {
  const answers = useTestStore((state) => state.answers);
  const items = useEditorStore((s) => s.items);
  const selectedId = useEditorStore((s) => s.selectedId);
  const rotateItem = useEditorStore((s) => s.rotateItem);
  const removeItem = useEditorStore((s) => s.removeItem);
  const clear = useEditorStore((s) => s.clear);

  // Delete/Backspace로 선택된 가구 삭제
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        removeItem(selectedId);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, removeItem]);

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">먼저 어울리는 집 구조를 찾아주세요</h1>
        <p className="text-gray-500">
          진단 테스트를 완료하면 매칭된 집 구조 위에서 가구를 배치할 수 있어요.
        </p>
        <Link
          href="/test"
          className="rounded-full bg-black px-6 py-3 text-white transition hover:bg-gray-800"
        >
          진단 테스트 하러 가기
        </Link>
      </main>
    );
  }

  const answerList: Answer[] = Object.entries(answers).map(
    ([questionId, value]) => ({ questionId, value }),
  );
  const { axisScores } = calculateScores(answerList);
  const [topMatch] = matchHouseTemplate(axisScores);
  const selectedItem = items.find((i) => i.id === selectedId);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6 sm:p-10">
      <header>
        <p className="text-sm text-gray-500">{topMatch.template.name}</p>
        <h1 className="text-2xl font-bold">인테리어 에디터</h1>
        <p className="mt-1 text-sm text-gray-500">
          아래 가구를 캔버스로 드래그해서 배치해보세요. 배치한 가구는 클릭해서
          선택한 뒤 이동/회전/삭제할 수 있어요.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {furnitureCatalog.map((item) => (
          <button
            key={item.id}
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/catalog-id", item.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="flex cursor-grab items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm active:cursor-grabbing"
          >
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </button>
        ))}
      </div>

      <EditorCanvas rooms={topMatch.template.rooms} catalog={furnitureCatalog} />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          {selectedItem ? (
            <>
              <span>
                선택됨:{" "}
                {furnitureCatalog.find((c) => c.id === selectedItem.catalogId)?.label}
              </span>
              <button
                type="button"
                onClick={() => rotateItem(selectedItem.id, 15)}
                className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100"
              >
                ↻ 회전
              </button>
              <button
                type="button"
                onClick={() => removeItem(selectedItem.id)}
                className="rounded-full border border-red-200 px-3 py-1 text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </>
          ) : (
            <span>배치된 가구를 클릭하면 여기서 회전/삭제할 수 있어요.</span>
          )}
        </div>
        <button
          type="button"
          onClick={clear}
          disabled={items.length === 0}
          className="text-gray-400 underline disabled:opacity-40"
        >
          전체 비우기
        </button>
      </div>

      <p className="text-xs text-gray-400">
        ⚠ 지금은 배치 결과가 저장되지 않아요. 새로고침하면 초기화됩니다 — 저장/불러오기는
        다음 스텝에서 추가할 예정이에요.
      </p>
    </main>
  );
}

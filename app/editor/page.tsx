"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { useEditorStore } from "@/lib/editorStore";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona, getRarityTier } from "@/lib/persona";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";
import { AXES, AXIS_LABELS } from "@/lib/types";
import type { Answer, IsoFurnitureDef } from "@/lib/types";

/**
 * 인테리어 에디터 — DESIGN-HANDOFF-V2.md "5. 룸 에디터" + jib-atlas-v2-preview.html
 * 마크업 그대로. **v1과 달리 v2는 다크 모드가 아니다** — 랜딩과 같은 라이트
 * 팔레트라, 이전에 있던 `.dark` 클래스 강제 적용과 EditorRoomIntro(스크롤
 * 조립 인트로 — v2 스펙엔 없다)를 없앴다.
 *
 * 채점·매칭·캐릭터명은 지시대로 lib/scoring.ts / lib/matching.ts /
 * lib/persona.ts를 그대로 쓴다. "영문 유형명"은 실제 데이터에 없어 결과
 * 페이지와 같은 이유로 Gowun Batang 국문명을 쓴다.
 */

const furnitureCatalog = furnitureCatalogData as IsoFurnitureDef[];

// EditorCanvas는 SVG라 SSR 자체는 문제없지만, 클릭 배치가 클라이언트 상태
// (zustand editorStore)에 의존해 하이드레이션 전엔 빈 배치로 그려질 뿐이라
// 기존처럼 클라이언트 전용으로 로드해 깜빡임을 없앤다.
const EditorCanvas = dynamic(
  () => import("@/components/EditorCanvas").then((m) => m.EditorCanvas),
  { ssr: false, loading: () => <CanvasSkeleton /> },
);

const TOTAL_QUESTION_COUNT = 23;

function CanvasSkeleton() {
  return (
    <div className="flex h-[470px] w-full max-w-[860px] items-center justify-center text-sm text-muted">
      캔버스 불러오는 중…
    </div>
  );
}

export default function EditorPage() {
  const answers = useTestStore((state) => state.answers);
  const { user, loading: userLoading } = useUser();
  const status = useEditorStore((s) => s.status);
  const loadFromServer = useEditorStore((s) => s.loadFromServer);
  const items = useEditorStore((s) => s.items);
  const selectedDefId = useEditorStore((s) => s.selectedDefId);
  const selectDef = useEditorStore((s) => s.selectDef);
  const warn = useEditorStore((s) => s.warn);
  const resetPlacement = useEditorStore((s) => s.reset);
  const syncTemplate = useEditorStore((s) => s.syncTemplate);

  // 집 아틀라스 "지도에 공유하기" — 사진 업로드 없이, 지금 배치를 그대로
  // 아이소메트릭 미리보기로 올린다(app/atlas/page.tsx의 RoomIsoCard 참고).
  // 콜드스타트 해결용: 진단만 마치면 클릭 한 번으로 갤러리에 콘텐츠가 생긴다.
  const [roomShareStatus, setRoomShareStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);

  // 로그인이 확인되면 서버에 저장된 배치를 불러온다.
  useEffect(() => {
    if (user) loadFromServer();
  }, [user, loadFromServer]);

  const answerList: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
    questionId,
    value,
  }));
  const { axisScores } = calculateScores(answerList);
  const [topMatch] = matchHouseTemplate(axisScores);
  const persona = generatePersona(axisScores);

  async function handleShareRoom() {
    if (!user || roomShareStatus === "pending") return;
    setRoomShareStatus("pending");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("house_posts")
      .insert({
        user_id: user.id,
        title: `${persona.name}의 ${topMatch.template.name}`,
        caption: "",
        template_id: topMatch.template.id,
        template_name: topMatch.template.name,
        persona_name: persona.name,
        rarity_tier: getRarityTier(topMatch.similarity),
        room_items: items,
      })
      .select()
      .single();

    if (error || !data) {
      setRoomShareStatus("error");
      return;
    }
    setSharedPostId(data.id);
    setRoomShareStatus("done");
  }

  // 저장된 배치가 지금 매칭된 템플릿과 다르면(재진단으로 집 유형이 바뀐
  // 경우) 기본 배치로 새로 시작한다. 서버에서 다 불러온 뒤에만 실행해야
  // 아직 안 불러온 이전 배치를 잘못 지우지 않는다.
  useEffect(() => {
    if (status === "ready") syncTemplate(topMatch.template.id);
  }, [status, topMatch.template.id, syncTemplate]);

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-kr text-xl">먼저 어울리는 집 구조를 찾아주세요</h1>
        <p className="text-muted">
          진단 테스트를 완료하면 매칭된 집 유형에 맞춰 가구를 배치할 수 있어요.
        </p>
        <Link href="/test" className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg">
          진단 테스트 하러 가기
        </Link>
      </main>
    );
  }

  if (userLoading) return null;

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-kr text-xl">로그인하고 배치를 저장해보세요</h1>
        <p className="text-muted">
          로그인하면 가구 배치가 계정에 저장돼서, 다른 기기에서도 이어서 꾸밀 수 있어요.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent("/editor")}`}
          className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg"
        >
          로그인 / 회원가입
        </Link>
      </main>
    );
  }

  const typeNum = topMatch.template.id.replace(/^t/, "").padStart(2, "0");
  const selectedDef = selectedDefId ? (furnitureCatalog.find((d) => d.id === selectedDefId) ?? null) : null;

  const hintTitle = warn ? "놓을 수 없는 자리" : selectedDef ? "타일을 클릭하세요" : "가구를 선택하세요";
  const hintBody = warn
    ? "다른 가구와 겹치거나 방을 벗어납니다."
    : selectedDef
      ? `${selectedDef.label} · ${selectedDef.w}×${selectedDef.d} 타일`
      : "왼쪽 팔레트에서 가구를 고르면 놓을 수 있는 자리가 밝아집니다.";

  const axisRows = AXES.map((axis) => ({
    axis,
    ko: AXIS_LABELS[axis],
    val: Math.round(axisScores[axis]),
  }));

  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      {/* 상단바 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair px-6 py-5 sm:px-8">
        <div className="flex items-center gap-[18px] sm:gap-[22px]">
          <Link href="/" className="font-display text-[22px] text-fg">
            jib<span className="text-olive-mid">.</span>atlas
          </Link>
          <span className="h-[18px] w-px bg-hair" />
          <span className="label-mono text-[10px] text-olive-mid">
            Room Editor — {typeNum} {topMatch.template.name}
          </span>
        </div>
        <div className="flex items-center gap-[14px] sm:gap-[18px]">
          <span className="label-mono text-[10px] text-faint">
            {items.length} / {furnitureCatalog.length} Placed
          </span>
          <button
            type="button"
            onClick={resetPlacement}
            className="rounded-full border border-hair px-[22px] py-[11px] text-[12px] text-[#5f5f57] transition hover:border-olive hover:text-fg"
          >
            초기화
          </button>
          {roomShareStatus === "done" && sharedPostId ? (
            <Link
              href={`/atlas/${sharedPostId}`}
              className="rounded-full px-[22px] py-[11px] text-[12px] font-semibold text-olive-mid transition hover:text-fg"
              style={{ background: "var(--color-sage)", color: "var(--color-sage-ink)" }}
            >
              지도에 공유됨 · 보러가기
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleShareRoom}
              disabled={roomShareStatus === "pending"}
              className="rounded-full border border-hair px-[22px] py-[11px] text-[12px] text-[#5f5f57] transition hover:border-olive hover:text-fg disabled:opacity-50"
            >
              {roomShareStatus === "pending" ? "공유 중…" : "지도에 공유하기"}
            </button>
          )}
          <Link
            href="/result"
            className="rounded-full bg-olive px-6 py-3 text-[12px] font-semibold text-cream transition hover:bg-fg"
          >
            결과로
          </Link>
        </div>
      </div>
      {roomShareStatus === "error" && (
        <p className="px-6 pt-3 text-[12px] sm:px-8" style={{ color: "#a3402a" }}>
          지도 공유에 실패했어요. 다시 시도해주세요.
        </p>
      )}

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[250px_1fr_280px]">
        {/* 좌: 팔레트 */}
        <div className="flex flex-col gap-[18px] border-b border-hair px-[22px] py-7 lg:border-r lg:border-b-0">
          <span className="label-mono text-[10px] text-faint">Palette</span>
          <div className="flex flex-col gap-[7px]">
            {furnitureCatalog.map((def) => {
              const selected = selectedDefId === def.id;
              return (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => selectDef(def.id)}
                  className="flex items-center gap-[14px] rounded-[14px] border px-[15px] py-[13px] text-left transition-all duration-150 hover:border-olive"
                  style={{
                    borderColor: selected ? "var(--color-olive)" : "var(--color-hair)",
                    background: selected ? "var(--color-sage)" : "transparent",
                  }}
                >
                  <span className="h-[17px] w-[17px] shrink-0 rounded-[4px]" style={{ background: def.top }} />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] text-fg">{def.label}</span>
                    <span className="label-mono text-[9px] text-faint">
                      {def.w}×{def.d}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 중앙: 캔버스 */}
        <div className="relative flex items-center justify-center overflow-hidden bg-panel p-6 sm:p-10">
          <EditorCanvas catalog={furnitureCatalog} />
          <div className="absolute bottom-8 left-8 flex flex-col gap-1.5">
            <span className="label-mono text-[10px] text-olive-mid">{hintTitle}</span>
            <span className="text-[12px] text-muted">{hintBody}</span>
          </div>
        </div>

        {/* 우: 인포 */}
        <div className="flex flex-col gap-[26px] border-t border-hair px-6 py-7 lg:border-t-0 lg:border-l">
          <div className="flex flex-col gap-2">
            <span className="label-mono text-[10px] text-faint">House Type</span>
            <span className="font-kr text-[26px] leading-[1.2]">{topMatch.template.name}</span>
            <span className="text-xs text-muted">{persona.name}</span>
          </div>
          <div className="flex flex-col border-t border-hair">
            {axisRows.map((row) => (
              <div key={row.axis} className="flex items-center justify-between gap-3 border-b border-hair py-3.5">
                <span className="text-[12px] text-[#5f5f57]">{row.ko}</span>
                <span className="flex items-center gap-2.5">
                  <span className="relative h-[3px] w-[74px]" style={{ background: "rgba(18,18,15,0.10)" }}>
                    <span
                      className="absolute top-0 left-0 h-[3px] bg-olive"
                      style={{ width: `${row.val}%` }}
                    />
                  </span>
                  <span className="label-mono text-[9px] text-faint">{row.val}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-[12px] leading-[1.9] text-muted">
            가구를 고른 뒤 바닥 타일을 클릭하면 그 자리에 놓입니다. 놓인 가구를
            클릭하면 치웁니다.
          </p>
        </div>
      </div>
    </main>
  );
}

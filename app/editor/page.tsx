"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import furnitureCatalogData from "@/data/furniture-catalog.json";
import { EditorRoomIntro } from "@/components/EditorRoomIntro";
import { useEditorStore } from "@/lib/editorStore";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona } from "@/lib/persona";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import { useUser } from "@/lib/supabase/useUser";
import { AXES, AXIS_LABELS } from "@/lib/types";
import type { Answer, IsoFurnitureDef } from "@/lib/types";

/**
 * 인테리어 에디터 — app/result/jib-atlas.design/jib.atlas.dc.html "4. 에디터"
 * 스펙대로 아이소메트릭 2.5D 타일 시스템으로 전면 교체했다(사용자 확인 후
 * 진행 — components/EditorCanvas.tsx 주석 참고). 이전의 react-konva 자유
 * 배치+회전, 매칭된 템플릿의 실제 방 구조 연동, 기존 저장 데이터는 이
 * 교체로 없어졌다: 방은 이제 모든 유저가 같은 고정 10×8 타일 그리드이고,
 * 배치는 회전 없이 타일 클릭으로만 한다.
 *
 * 채점·매칭·캐릭터명은 지시대로 lib/scoring.ts / lib/matching.ts /
 * lib/persona.ts를 그대로 쓴다. 다크 배경은 app/globals.css의 `.dark`
 * 클래스(에디터 화면 전용 활성화 경로)로만 켠다.
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

const DOT_TEXTURE = (rgba: string, size = 16) => ({
  backgroundImage: `radial-gradient(${rgba} 1px, transparent 1px)`,
  backgroundSize: `${size}px ${size}px`,
});

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

  // 로그인이 확인되면 서버에 저장된 배치를 불러온다.
  useEffect(() => {
    if (user) loadFromServer();
  }, [user, loadFromServer]);

  const answerList: Answer[] = Object.entries(answers).map(
    ([questionId, value]) => ({ questionId, value }),
  );
  const { axisScores } = calculateScores(answerList);
  const [topMatch] = matchHouseTemplate(axisScores);
  const persona = generatePersona(axisScores);

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
        <h1 className="text-xl font-semibold">먼저 어울리는 집 구조를 찾아주세요</h1>
        <p className="text-muted">
          진단 테스트를 완료하면 매칭된 집 유형에 맞춰 가구를 배치할 수 있어요.
        </p>
        <Link
          href="/test"
          className="rounded-sm bg-teal-600 px-6 py-3 text-white transition hover:bg-teal-700"
        >
          진단 테스트 하러 가기
        </Link>
      </main>
    );
  }

  if (userLoading) return null;

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">로그인하고 배치를 저장해보세요</h1>
        <p className="text-muted">
          로그인하면 가구 배치가 계정에 저장돼서, 다른 기기에서도 이어서 꾸밀 수 있어요.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent("/editor")}`}
          className="rounded-sm bg-teal-600 px-6 py-3 text-white transition hover:bg-teal-700"
        >
          로그인 / 회원가입
        </Link>
      </main>
    );
  }

  const typeNum = topMatch.template.id.replace(/^t/, "").padStart(2, "0");
  const selectedDef = selectedDefId
    ? (furnitureCatalog.find((d) => d.id === selectedDefId) ?? null)
    : null;

  const hintTitle = warn
    ? "놓을 수 없는 자리"
    : selectedDef
      ? "타일을 클릭하세요"
      : "가구를 선택하세요";
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
    <main className="dark flex flex-col bg-background text-foreground">
      <EditorRoomIntro typeNum={typeNum} templateName={topMatch.template.name} />

      <div className="flex min-h-[calc(100vh_-_63px)] flex-col">
        {/* 상단바 */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-[18px] sm:px-8">
          <div className="flex items-center gap-[18px] sm:gap-[22px]">
            <span className="font-serif text-[19px] font-semibold">
              jib<span className="text-coral-600">.</span>atlas
            </span>
            <span className="h-[18px] w-px bg-border" />
            <span className="font-mono text-[9px] tracking-[0.4em] text-teal-600 uppercase">
              room editor — {typeNum} {topMatch.template.name}
            </span>
          </div>
          <div className="flex items-center gap-[14px] sm:gap-[18px]">
            <span className="font-mono text-[9px] tracking-[0.3em] text-muted uppercase">
              {items.length} / {furnitureCatalog.length} placed
            </span>
            <button
              type="button"
              onClick={resetPlacement}
              className="rounded-[2px] border border-border px-[18px] py-2.5 text-[11px] text-muted transition hover:border-teal-600 hover:text-foreground"
            >
              초기화
            </button>
            <Link
              href="/result"
              className="rounded-[2px] bg-coral-600 px-[22px] py-[11px] text-[11px] font-medium text-white transition hover:bg-coral-700"
            >
              결과로 돌아가기
            </Link>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[236px_1fr_264px]">
          {/* 팔레트 */}
          <div className="flex flex-col gap-[18px] border-b border-border bg-surface px-5 py-[26px] lg:border-r lg:border-b-0">
            <span className="font-mono text-[9px] tracking-[0.4em] text-muted uppercase">
              palette
            </span>
            <div className="flex flex-col gap-1.5">
              {furnitureCatalog.map((def) => {
                const selected = selectedDefId === def.id;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => selectDef(def.id)}
                    className={`flex items-center gap-3.5 rounded-[2px] border px-3.5 py-3 text-left transition hover:border-teal-600 ${
                      selected ? "border-coral-500 bg-secondary" : "border-border"
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 border border-white/15"
                      style={{ background: def.top }}
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-xs">{def.label}</span>
                      <span className="font-mono text-[8px] tracking-[0.25em] text-muted uppercase">
                        {def.w}×{def.d}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 캔버스 */}
          <div className="relative flex items-center justify-center overflow-hidden bg-background p-6 sm:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={DOT_TEXTURE("rgba(58,172,142,0.20)", 20)}
            />
            <EditorCanvas catalog={furnitureCatalog} />
            <div className="absolute bottom-6 left-6 flex flex-col gap-1.5 sm:bottom-8 sm:left-10">
              <span className="font-mono text-[9px] tracking-[0.4em] text-teal-600 uppercase">
                {hintTitle}
              </span>
              <span className="text-[11px] text-muted">{hintBody}</span>
            </div>
          </div>

          {/* 인포 */}
          <div className="flex flex-col gap-[26px] border-t border-border bg-surface px-[22px] py-[26px] lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[9px] tracking-[0.4em] text-muted uppercase">
                house type
              </span>
              <span className="font-serif text-[26px] leading-[1.2]">
                {topMatch.template.name}
              </span>
              <span className="text-xs text-muted">{persona.name}</span>
            </div>
            <div className="flex flex-col border-t border-border">
              {axisRows.map((row) => (
                <div
                  key={row.axis}
                  className="flex items-center justify-between gap-3 border-b border-border py-3.5"
                >
                  <span className="text-[11px] text-secondary-foreground">{row.ko}</span>
                  <span className="flex items-center gap-2.5">
                    <span className="relative h-[3px] w-[70px] bg-[rgba(58,172,142,0.14)]">
                      <span
                        className="absolute top-0 left-0 h-[3px] bg-teal-600"
                        style={{ width: `${row.val}%` }}
                      />
                    </span>
                    <span className="font-mono text-[9px] text-muted">{row.val}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-[1.9] text-muted">
              가구를 고른 뒤 바닥 타일을 클릭하면 그 자리에 놓입니다. 이미 놓인
              가구를 클릭하면 치웁니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { ShareCard } from "@/components/ShareCard";
import { captureCardPng, downloadBlob } from "@/lib/shareImage";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona } from "@/lib/persona";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import type { Answer } from "@/lib/types";

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8

type ExportStatus = "idle" | "capturing" | "error";

// 파일 공유(Web Share API) 존재 여부는 서버(SSR)와 클라이언트에서 다르게
// 평가되는 순수한 환경 값이라 useEffect+setState보다 useSyncExternalStore가
// 맞다 — 하이드레이션 시 서버 스냅샷(false)을 쓰고, 곧바로 클라이언트
// 스냅샷으로 갈아끼워 하이드레이션 불일치 경고 없이 반영된다. 값이 마운트
// 중 바뀔 일이 없어 subscribe는 아무 것도 구독하지 않는 no-op이다.
function subscribeToNothing() {
  return () => {};
}
function getShareCapabilitySnapshot() {
  return typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;
}
function getServerShareCapabilitySnapshot() {
  return false;
}

/**
 * 공유 카드 — DESIGN-HANDOFF-V2.md "4. 공유 카드". `/result/share`가 아니라
 * 문서의 라우트 표대로 최상위 `/share`로 옮겼다.
 *
 * 바이럴 전략 1순위: 카드를 화면 캡처에 맡기지 않고 실제 PNG로 내보낸다.
 * 파일 공유(Web Share API Level 2)를 지원하는 브라우저(대부분의 모바일)는
 * 카톡/인스타 스토리로 바로 공유하는 시트를 띄우고, 그 외에는 다운로드로
 * 폴백한다.
 */
export default function SharePage() {
  const answers = useTestStore((state) => state.answers);
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ExportStatus>("idle");
  // 실제 지원 여부는 File을 쥐여줘야 정확히 판정하는 브라우저(사파리 등)가
  // 있어서, 여기선 API 존재 여부로만 1차 판정하고 클릭 시 handleShare가
  // canShare로 다시 확인한다 — 없으면 조용히 다운로드로 폴백한다.
  const canShareFiles = useSyncExternalStore(
    subscribeToNothing,
    getShareCapabilitySnapshot,
    getServerShareCapabilitySnapshot,
  );

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < TOTAL_QUESTION_COUNT) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-kr text-xl">아직 결과가 없어요</h1>
        <p className="text-muted">진단 테스트를 먼저 완료하면 공유 카드를 만들 수 있어요.</p>
        <Link href="/test" className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg">
          진단 테스트 하러 가기
        </Link>
      </main>
    );
  }

  const answerList: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
    questionId,
    value,
  }));
  const { axisScores } = calculateScores(answerList);
  const [topMatch] = matchHouseTemplate(axisScores);
  const persona = generatePersona(axisScores);
  const typeNum = topMatch.template.id.replace(/^t/, "").padStart(2, "0");
  const fileName = `jib-atlas-${typeNum}-${persona.name.replace(/\s+/g, "")}.png`;

  async function handleDownload() {
    if (!cardRef.current || status === "capturing") return;
    setStatus("capturing");
    try {
      const blob = await captureCardPng(cardRef.current);
      downloadBlob(blob, fileName);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function handleShare() {
    if (!cardRef.current || status === "capturing") return;
    setStatus("capturing");
    try {
      const blob = await captureCardPng(cardRef.current);
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "jib.atlas",
          text: `나는 ${topMatch.template.name} · ${persona.name}였어요`,
        });
      } else {
        downloadBlob(blob, fileName);
      }
      setStatus("idle");
    } catch (err) {
      // 공유 시트를 취소한 경우(AbortError)는 실패가 아니다.
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 px-6 pt-[100px] pb-[90px] sm:px-10 sm:pt-[140px]">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="label-mono text-[11px] text-olive-mid">Share Card</span>
        <h2 className="font-kr text-[clamp(28px,3.4vw,48px)] tracking-[-0.03em]">
          결과를 카드로 남기세요<span className="heading-dot">.</span>
        </h2>
      </div>

      <div ref={cardRef} className="w-full" style={{ maxWidth: 440 }}>
        <ShareCard
          typeNum={typeNum}
          templateName={topMatch.template.name}
          personaName={persona.name}
          axisScores={axisScores}
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          {canShareFiles && (
            <button
              type="button"
              onClick={handleShare}
              disabled={status === "capturing"}
              className="rounded-full bg-olive px-9 py-[18px] text-[14px] font-semibold text-cream transition hover:bg-fg disabled:opacity-60"
            >
              {status === "capturing" ? "이미지 만드는 중…" : "공유하기"}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={status === "capturing"}
            className="rounded-full bg-sage px-9 py-[18px] text-[14px] font-semibold text-sage-ink transition hover:bg-olive hover:text-cream disabled:opacity-60"
          >
            {status === "capturing" ? "이미지 만드는 중…" : "이미지로 저장"}
          </button>
        </div>

        {status === "error" && (
          <p className="text-[13px] text-muted">이미지를 만들지 못했어요. 다시 시도해주세요.</p>
        )}

        <Link href="/result" className="text-[13px] text-muted transition hover:text-fg">
          결과로 돌아가기
        </Link>
      </div>
    </main>
  );
}

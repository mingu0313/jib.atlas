"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { AXES, type AxisScores } from "@/lib/types";
import { downloadBlob } from "@/lib/shareImage";
import { matchHouseTemplate } from "@/lib/matching";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import type { Answer } from "@/lib/types";
import type { ShareCardRatio } from "@/components/shareCard/ShareCardImage";

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8

type ExportStatus = "idle" | "capturing" | "error";

function subscribeToNothing() {
  return () => {};
}
function getShareCapabilitySnapshot() {
  return typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;
}
function getServerShareCapabilitySnapshot() {
  return false;
}

/** axisScores를 /api/share-card 쿼리 파라미터로 직렬화한다. */
function axisScoreParams(axisScores: AxisScores): string {
  return AXES.map((axis) => `${axis}=${Math.round(axisScores[axis])}`).join("&");
}

/**
 * 공유 카드 — 서버사이드 PNG(ImageResponse/satori, app/api/share-card/route.tsx)를
 * 그대로 <img>로 미리보고 다운로드한다. "공유카드 리디자인" 스펙대로 카드
 * 자체는 풀블리드(각진 모서리)로 뽑고, 라운드는 이 페이지의 미리보기
 * 컨테이너에만 준다.
 *
 * 이전엔 DOM(components/ShareCard.tsx)을 html-to-image로 캡처했지만, 그
 * 방식은 웹폰트 로딩 타이밍에 따라 결과가 흔들리고 서버에서 미리 만들어
 * 캐시할 수도 없었다 — 지금은 서버가 고정 PNG를 내려주므로 브라우저는
 * fetch→Blob만 하면 된다(다운로드도 공유도 같은 fetch 결과를 재사용).
 */
export default function SharePage() {
  const answers = useTestStore((state) => state.answers);
  const [ratio, setRatio] = useState<ShareCardRatio>("9x16");
  const [status, setStatus] = useState<ExportStatus>("idle");
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

  const answerList: Answer[] = Object.entries(answers).map(([questionId, optionId]) => ({
    questionId,
    optionId,
  }));
  const { axisScores } = calculateScores(answerList);
  const [topMatch] = matchHouseTemplate(axisScores);
  const typeCode = topMatch.template.id.replace(/^t/, "").padStart(3, "0");
  const cardUrl = `/api/share-card?typeId=${topMatch.template.id}&ratio=${ratio}&${axisScoreParams(axisScores)}`;
  const fileName = `jib-atlas-${typeCode}-${ratio}.png`;

  async function fetchCardBlob(): Promise<Blob> {
    const res = await fetch(cardUrl);
    if (!res.ok) throw new Error("이미지를 만들지 못했어요.");
    return res.blob();
  }

  async function handleDownload() {
    if (status === "capturing") return;
    setStatus("capturing");
    try {
      downloadBlob(await fetchCardBlob(), fileName);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function handleShare() {
    if (status === "capturing") return;
    setStatus("capturing");
    try {
      const blob = await fetchCardBlob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "jib.atlas",
          text: `나는 ${topMatch.template.name}였어요`,
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

      <div className="flex gap-2 rounded-full bg-panel p-1.5">
        {(
          [
            { value: "9x16", label: "인스타 스토리" },
            { value: "1x1", label: "카톡 · 피드" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRatio(option.value)}
            className={`rounded-full px-5 py-2.5 text-[13px] font-semibold transition ${
              ratio === option.value ? "bg-olive text-cream" : "text-muted hover:text-fg"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 라운드는 이 미리보기 컨테이너에만 — 실제 PNG는 풀블리드다. */}
      <div
        className="w-full overflow-hidden rounded-[28px] shadow-[0_40px_90px_-44px_rgba(18,18,15,0.34)]"
        style={{ maxWidth: ratio === "9x16" ? 380 : 440 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 서버가 만든 PNG를 그대로 보여준다 */}
        <img key={cardUrl} src={cardUrl} alt={`${topMatch.template.name} 공유 카드`} className="block w-full" />
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

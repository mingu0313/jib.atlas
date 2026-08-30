"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import houseTemplatesEnData from "@/data/house-templates.en.json";
import { AXES, type AxisScores } from "@/lib/types";
import { downloadBlob } from "@/lib/shareImage";
import { matchHouseTemplate } from "@/lib/matching";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import type { Answer, HouseTemplate } from "@/lib/types";
import type { ShareCardRatio } from "@/components/shareCard/ShareCardImage";

const houseTemplatesEn = houseTemplatesEnData as HouseTemplate[];

const TOTAL_QUESTION_COUNT = 23;

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

function axisScoreParams(axisScores: AxisScores): string {
  return AXES.map((axis) => `${axis}=${Math.round(axisScores[axis])}`).join("&");
}

/** 영문 공유 카드 페이지(`/en/share`) — app/share/page.tsx와 동일한 로직,
 * 매칭만 영문 데이터로 바꾸고 /api/share-card에 lang=en을 넘긴다. STEP 11. */
export default function EnglishSharePage() {
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
        <h1 className="font-display text-xl">No result yet</h1>
        <p className="text-muted">Finish the quiz first to make a share card.</p>
        <Link href="/en/test" className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg">
          Take the quiz
        </Link>
      </main>
    );
  }

  const answerList: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
    questionId,
    value,
  }));
  const { axisScores } = calculateScores(answerList);
  const [topMatch] = matchHouseTemplate(axisScores, houseTemplatesEn);
  const typeCode = topMatch.template.id.replace(/^t/, "").padStart(3, "0");
  const cardUrl = `/api/share-card?typeId=${topMatch.template.id}&ratio=${ratio}&lang=en&${axisScoreParams(axisScores)}`;
  const fileName = `jib-atlas-${typeCode}-${ratio}.png`;

  async function fetchCardBlob(): Promise<Blob> {
    const res = await fetch(cardUrl);
    if (!res.ok) throw new Error("Couldn't make the image.");
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
          text: `I'm the ${topMatch.template.name}`,
        });
      } else {
        downloadBlob(blob, fileName);
      }
      setStatus("idle");
    } catch (err) {
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
        <h2 className="font-display text-[clamp(26px,3vw,42px)] tracking-[-0.01em]">
          Turn your result into a card<span className="heading-dot">.</span>
        </h2>
      </div>

      <div className="flex gap-2 rounded-full bg-panel p-1.5">
        {(
          [
            { value: "9x16", label: "Instagram Story" },
            { value: "1x1", label: "KakaoTalk · Feed" },
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

      <div
        className="w-full overflow-hidden rounded-[28px] shadow-[0_40px_90px_-44px_rgba(18,18,15,0.34)]"
        style={{ maxWidth: ratio === "9x16" ? 380 : 440 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- shows the server-rendered PNG as-is */}
        <img key={cardUrl} src={cardUrl} alt={`${topMatch.template.name} share card`} className="block w-full" />
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
              {status === "capturing" ? "Making image…" : "Share"}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={status === "capturing"}
            className="rounded-full bg-sage px-9 py-[18px] text-[14px] font-semibold text-sage-ink transition hover:bg-olive hover:text-cream disabled:opacity-60"
          >
            {status === "capturing" ? "Making image…" : "Save as image"}
          </button>
        </div>

        {status === "error" && (
          <p className="text-[13px] text-muted">Couldn&rsquo;t make the image. Please try again.</p>
        )}

        <Link href="/en/result" className="text-[13px] text-muted transition hover:text-fg">
          Back to result
        </Link>
      </div>
    </main>
  );
}

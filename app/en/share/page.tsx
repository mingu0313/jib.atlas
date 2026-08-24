"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import houseTemplatesEnData from "@/data/house-templates.en.json";
import { ShareCard } from "@/components/ShareCard";
import { captureCardPng, downloadBlob } from "@/lib/shareImage";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersonaEn } from "@/lib/persona";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import { AXIS_LABELS_EN } from "@/lib/types";
import type { Answer, HouseTemplate } from "@/lib/types";

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

/** 영문 공유 카드 페이지(`/en/share`) — STEP 11. app/share/page.tsx와 동일한 로직,
 * 매칭/페르소나만 영문 함수·데이터로 바꾸고 ShareCard에 axisLabels=AXIS_LABELS_EN을 넘긴다. */
export default function EnglishSharePage() {
  const answers = useTestStore((state) => state.answers);
  const cardRef = useRef<HTMLDivElement>(null);
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
  const persona = generatePersonaEn(axisScores);
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
          text: `I'm the ${topMatch.template.name} · ${persona.name}`,
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

      <div ref={cardRef} className="w-full" style={{ maxWidth: 440 }}>
        <ShareCard
          typeNum={typeNum}
          templateName={topMatch.template.name}
          personaName={persona.name}
          axisScores={axisScores}
          axisLabels={AXIS_LABELS_EN}
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

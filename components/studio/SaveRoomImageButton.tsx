"use client";

import { useState } from "react";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { downloadBlob, requestStudioCapture } from "@/lib/studioCapture";

type Status = "idle" | "saving" | "error";

/** 3D 탭으로 전환을 요청한 뒤 캡처 전 기다리는 시간(ms) — RoomStudioScene3D.tsx
 * CameraRig의 카메라 전환(smoothTime 0.3s)과, previewMode가 방금 "3d"로
 * 바뀌어 frameloop이 "never"→"always"로 켜진 경우 최소 한 프레임 그려질
 * 시간까지 덮는다. 이미 3D 탭이었을 때도 분기 없이 항상 기다린다 — 버튼을
 * 누른 뒤 짧은 "저장 중" 텀은 자연스럽고, 조건을 나누는 것보다 단순하다. */
const SWITCH_TO_3D_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 완성한 방을 PNG로 다운로드하는 버튼(STEP 17) — 스테퍼 마지막 단계
 * (StepFurniture) 하단에 둔다. 실제 캡처는 RoomStudioScene3D 안의
 * CaptureBridge가 하고(lib/studioCapture.ts로 이어짐), 여긴
 * (1) previewMode를 3D로 맞춰 사용자가 뭘 저장하는지 보게 하고
 * (2) 카메라 전환이 끝날 시간을 준 뒤 (3) 캡처를 요청해서
 * (4) 받은 Blob을 파일로 내려받게 하는 것까지만 담당한다.
 */
export function SaveRoomImageButton() {
  const previewMode = useRoomBuilderStore((s) => s.previewMode);
  const setPreviewMode = useRoomBuilderStore((s) => s.setPreviewMode);
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    setStatus("saving");
    if (previewMode !== "3d") setPreviewMode("3d");
    await sleep(SWITCH_TO_3D_DELAY_MS);

    const blob = await requestStudioCapture();
    if (!blob) {
      setStatus("error");
      return;
    }
    downloadBlob(blob, "jib-atlas-room.png");
    setStatus("idle");
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "saving"}
        className="rounded-full border border-hair px-6 py-3 text-[13px] font-semibold text-fg transition hover:border-olive hover:text-olive disabled:cursor-wait disabled:opacity-60"
      >
        {status === "saving" ? "저장 중…" : "이미지로 저장하기 ⤓"}
      </button>
      {status === "error" && (
        <p className="text-[12px]" style={{ color: "#a3402a" }}>
          이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.
        </p>
      )}
    </div>
  );
}

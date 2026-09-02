"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HOUSE_PHOTOS_BUCKET } from "@/lib/houseAtlas";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona, getRarityTier } from "@/lib/persona";
import { useRoomBuilderStore } from "@/lib/roomBuilderStore";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import { requestStudioCapture } from "@/lib/studioCapture";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";
import type { Answer, StudioRoomSnapshot } from "@/lib/types";

const TOTAL_QUESTION_COUNT = 23; // 라이프스타일 15 + MBTI 8 — app/atlas/new/page.tsx와 동일 기준

/** 3D 탭 전환 후 캡처 전 대기 시간 — SaveRoomImageButton.tsx와 같은 값·같은 이유. */
const SWITCH_TO_3D_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Status = "idle" | "capturing" | "submitting" | "error";

/**
 * 완성한 방을 집지도(house_posts)에 공유하는 버튼 + 확인 모달(STEP 18).
 * app/atlas/new/page.tsx(실사진 업로드 폼)와 같은 3가지를 그대로 따른다:
 * 로그인 게이트 → 진단 완료 시 유형/페르소나 스냅샷 자동 첨부 →
 * house_posts insert 후 그 게시물로 이동. 다른 점은 사진을 사용자가
 * 고르는 대신, ②(이미지로 저장하기)에서 만든 것과 같은 캡처 파이프라인
 * (lib/studioCapture.ts)으로 3D 룸 뷰를 그 자리에서 직접 만든다는 것과,
 * 원본 룸 데이터(studio_room, 0006_house_atlas_studio_room.sql)까지 같이
 * 저장해서 나중에 이 게시물을 다시 3D로 열어볼 여지를 남긴다는 것.
 *
 * room_items(옛 /editor 게시물)과 구분되는 뱃지는 app/atlas/page.tsx·
 * app/atlas/[id]/page.tsx에서 studio_room 존재 여부로 붙인다.
 */
export function ShareToAtlasButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: userLoading } = useUser();
  const answers = useTestStore((s) => s.answers);

  const roomShape = useRoomBuilderStore((s) => s.roomShape);
  const roomPolygon = useRoomBuilderStore((s) => s.roomPolygon);
  const wallHeightCm = useRoomBuilderStore((s) => s.wallHeightCm);
  const wallColorHex = useRoomBuilderStore((s) => s.wallColorHex);
  const floorStyleId = useRoomBuilderStore((s) => s.floorStyleId);
  const openings = useRoomBuilderStore((s) => s.openings);
  const furniture = useRoomBuilderStore((s) => s.furniture);
  const previewMode = useRoomBuilderStore((s) => s.previewMode);
  const setPreviewMode = useRoomBuilderStore((s) => s.setPreviewMode);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // 닫힐 때 다음에 열었을 때 이전 입력·에러가 안 보이게 리셋한다
  // (CollabInquiryModal.tsx와 같은 관례).
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setStatus("idle");
        setError(null);
        setTitle("");
        setCaption("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const hasDiagnosis = Object.keys(answers).length >= TOTAL_QUESTION_COUNT;
  const busy = status === "capturing" || status === "submitting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("제목을 입력해주세요.");
      return;
    }

    setError(null);
    setStatus("capturing");
    if (previewMode !== "3d") setPreviewMode("3d");
    await sleep(SWITCH_TO_3D_DELAY_MS);
    const blob = await requestStudioCapture();
    if (!blob) {
      setError("방 이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    const supabase = createClient();
    try {
      let snapshot: { templateId: string; templateName: string; personaName: string; rarityTier: string } | null = null;
      if (hasDiagnosis) {
        const answerList: Answer[] = Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }));
        const { axisScores } = calculateScores(answerList);
        const [topMatch] = matchHouseTemplate(axisScores);
        const persona = generatePersona(axisScores);
        snapshot = {
          templateId: topMatch.template.id,
          templateName: topMatch.template.name,
          personaName: persona.name,
          rarityTier: getRarityTier(topMatch.similarity),
        };
      }

      const ext = blob.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from(HOUSE_PHOTOS_BUCKET)
        .upload(path, blob, { contentType: blob.type });
      if (uploadErr) throw uploadErr;

      const studioRoom: StudioRoomSnapshot = {
        roomShape,
        roomPolygon,
        wallHeightCm,
        wallColorHex,
        floorStyleId,
        openings,
        furniture,
      };

      const { data: postRow, error: postErr } = await supabase
        .from("house_posts")
        .insert({
          user_id: user.id,
          title: trimmedTitle,
          caption: caption.trim(),
          template_id: snapshot?.templateId ?? null,
          template_name: snapshot?.templateName ?? null,
          persona_name: snapshot?.personaName ?? null,
          rarity_tier: snapshot?.rarityTier ?? null,
          studio_room: studioRoom,
        })
        .select()
        .single();
      if (postErr || !postRow) throw postErr ?? new Error("게시물을 만들지 못했어요.");

      const { error: photoErr } = await supabase
        .from("house_photos")
        .insert({ post_id: postRow.id, storage_path: path, sort_order: 0 });
      if (photoErr) throw photoErr;

      router.push(`/atlas/${postRow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했어요. 다시 시도해주세요.");
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-olive px-6 py-3 text-[13px] font-semibold text-cream transition hover:bg-fg"
      >
        집지도에 공유하기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label="집지도에 공유하기"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => !busy && setOpen(false)}
            className="absolute inset-0 cursor-default"
            style={{ background: "rgba(18,18,15,0.4)" }}
          />

          <div className="relative w-full max-w-[420px] rounded-[24px] bg-card p-7 shadow-[0_40px_90px_-44px_rgba(18,18,15,0.5)] sm:p-9">
            {!busy && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-panel hover:text-fg"
              >
                ✕
              </button>
            )}

            {!userLoading && !user ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <span className="font-kr text-xl">로그인하고 공유해보세요</span>
                <p className="text-[13px] text-muted">로그인하면 지금 꾸민 방을 집지도에 올릴 수 있어요.</p>
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  className="rounded-full bg-olive px-6 py-3 text-[13px] font-semibold text-cream transition hover:bg-fg"
                >
                  로그인 / 회원가입
                </Link>
              </div>
            ) : (
              <>
                <h2 className="font-kr text-2xl">집지도에 공유할까요?</h2>
                <p className="mt-2 text-[13px] text-muted">
                  지금 3D 룸 뷰를 캡처해 함께 올려요. 제목만 적어도 등록할 수 있어요.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 초록이 가득한 5평 원룸"
                    className="rounded-[14px] border border-hair bg-bg px-4 py-3 text-[14px] text-fg outline-none focus:border-olive"
                  />
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="이 방만의 포인트를 자유롭게 적어주세요(선택)."
                    className="resize-none rounded-[14px] border border-hair bg-bg px-4 py-3 text-[14px] text-fg outline-none focus:border-olive"
                  />

                  {hasDiagnosis && (
                    <p className="text-[12px] text-muted">진단 결과의 유형·페르소나 배지가 이 게시물에 함께 기록돼요.</p>
                  )}

                  {error && (
                    <p className="text-[13px]" style={{ color: "#a3402a" }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-1 rounded-full bg-olive px-6 py-3 text-[14px] font-semibold text-cream transition hover:bg-fg disabled:opacity-50"
                  >
                    {status === "capturing"
                      ? "방 이미지 만드는 중…"
                      : status === "submitting"
                        ? "등록하는 중…"
                        : "지도에 등록하기"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

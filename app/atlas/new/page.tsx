"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { matchHouseTemplate } from "@/lib/matching";
import { generatePersona, getRarityTier } from "@/lib/persona";
import { calculateScores } from "@/lib/scoring";
import { useTestStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";
import { HOUSE_PHOTOS_BUCKET, MAX_PHOTOS_PER_POST, stripExifAndResize } from "@/lib/houseAtlas";
import type { Answer } from "@/lib/types";

const TOTAL_QUESTION_COUNT = 23;

/**
 * 집 아틀라스 등록 폼 — 지도에 내 집 한 페이지를 새로 올린다. STEP 9.
 * 로그인 게이트는 /app/editor/page.tsx와 같은 패턴(userLoading → !user 순).
 */
export default function AtlasNewPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const answers = useTestStore((state) => state.answers);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 미리보기는 files에서 그대로 파생되는 값이라 state로 따로 안 들고 useMemo로
  // 계산한다 — object URL 해제(revoke)만 effect에서 정리한다.
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS_PER_POST));
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  if (userLoading) return null;

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-kr text-xl">로그인하고 집을 등록해보세요</h1>
        <p className="text-muted">로그인하면 내 집 사진을 지도에 올리고 다른 유저와 공유할 수 있어요.</p>
        <Link
          href={`/login?next=${encodeURIComponent("/atlas/new")}`}
          className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg"
        >
          로그인 / 회원가입
        </Link>
      </main>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const hasDiagnosis = answeredCount >= TOTAL_QUESTION_COUNT;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submitting) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (files.length === 0) {
      setError("사진을 1장 이상 올려주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const uploadedPaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setStatusText(`사진 처리 중… (${i + 1}/${files.length})`);
        const blob = await stripExifAndResize(files[i]);
        const path = `${user.id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from(HOUSE_PHOTOS_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg" });
        if (uploadErr) throw uploadErr;
        uploadedPaths.push(path);
      }

      setStatusText("등록하는 중…");

      let snapshot: {
        templateId: string;
        templateName: string;
        personaName: string;
        rarityTier: string;
      } | null = null;
      if (hasDiagnosis) {
        const answerList: Answer[] = Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        }));
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
        })
        .select()
        .single();
      if (postErr || !postRow) throw postErr ?? new Error("게시물을 만들지 못했어요.");

      const { error: photosErr } = await supabase.from("house_photos").insert(
        uploadedPaths.map((storage_path, sort_order) => ({
          post_id: postRow.id,
          storage_path,
          sort_order,
        })),
      );
      if (photosErr) throw photosErr;

      router.push(`/atlas/${postRow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했어요. 다시 시도해주세요.");
      setSubmitting(false);
      setStatusText("");
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair px-6 py-5 sm:px-8">
        <div className="flex items-center gap-[18px] sm:gap-[22px]">
          <Link href="/" className="font-display text-[22px] text-fg">
            jib<span className="text-olive-mid">.</span>atlas
          </Link>
          <span className="h-[18px] w-px bg-hair" />
          <Link href="/atlas" className="label-mono text-[10px] text-olive-mid transition hover:text-fg">
            ← House Atlas
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-7 px-6 py-10 sm:px-8 sm:py-14">
        <div>
          <h1 className="font-kr text-[28px] leading-tight sm:text-[32px]">
            내 집을 지도에 등록<span className="text-olive-mid">.</span>
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            사진은 업로드 전 브라우저에서 다시 인코딩해서, 위치 등 EXIF 촬영 정보가 자동으로 제거돼요.
          </p>
        </div>

        {hasDiagnosis && (
          <div className="rounded-[14px] border border-hair bg-panel px-4 py-3 text-[13px] text-muted">
            진단 결과의 유형·페르소나 배지가 이 게시물에 함께 기록돼요.
          </div>
        )}
        {!hasDiagnosis && (
          <div className="rounded-[14px] border border-hair bg-panel px-4 py-3 text-[13px] text-muted">
            <Link href="/test" className="text-olive-mid underline underline-offset-2">
              진단 테스트
            </Link>
            를 먼저 하면 유형 배지가 함께 붙어요. 안 해도 등록은 가능해요.
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="label-mono text-[10px] text-faint">제목</label>
          <input
            type="text"
            required
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 초록이 가득한 5평 원룸"
            className="rounded-[14px] border border-hair bg-card px-4 py-3 text-fg outline-none focus:border-olive"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label-mono text-[10px] text-faint">소개</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="이 집만의 포인트를 자유롭게 적어주세요."
            className="resize-none rounded-[14px] border border-hair bg-card px-4 py-3 text-fg outline-none focus:border-olive"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="label-mono text-[10px] text-faint">
            사진 ({files.length}/{MAX_PHOTOS_PER_POST})
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-[12px] bg-photo-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 blob 미리보기 */}
                  <img src={src} alt={`선택한 사진 ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] text-cream"
                    style={{ background: "rgba(18,18,15,0.55)" }}
                    aria-label="사진 제거"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length < MAX_PHOTOS_PER_POST && (
            <label className="flex cursor-pointer items-center justify-center rounded-[14px] border border-dashed border-hair px-4 py-6 text-[13px] text-muted transition hover:border-olive hover:text-olive">
              사진 추가하기
              <input type="file" accept="image/*" multiple onChange={handleFilesChange} className="hidden" />
            </label>
          )}
        </div>

        {error && (
          <p className="text-sm" style={{ color: "#a3402a" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-olive px-6 py-3 text-[14px] font-semibold text-cream transition hover:bg-fg disabled:opacity-50"
        >
          {submitting ? statusText || "등록하는 중…" : "지도에 등록하기"}
        </button>
      </form>
    </main>
  );
}

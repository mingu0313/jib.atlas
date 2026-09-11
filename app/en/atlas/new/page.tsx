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
 * 영문 집 아틀라스 등록 폼(`/en/atlas/new`) — app/atlas/new/page.tsx와
 * 마크업·로직 동일, 문구만 영문(STEP 17 다국어 확장). 진단 스냅샷은 항상
 * 한국어 매칭(matchHouseTemplate 기본 templates)을 쓴다 — 이 폼 자체는
 * 실사진 업로드용이라 house-type 매칭이 부가 정보일 뿐이고, /studio처럼
 * 배너에 이름을 크게 노출하지도 않아서(작은 배지 텍스트 정도) 영문 템플릿
 * 재매칭까지는 하지 않았다.
 */
export default function EnglishAtlasNewPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const answers = useTestStore((state) => state.answers);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        <h1 className="font-display text-xl">Log in to share your home</h1>
        <p className="text-muted">Log in to post your home&apos;s photos to the atlas and share them with others.</p>
        <Link
          href={`/en/login?next=${encodeURIComponent("/en/atlas/new")}`}
          className="rounded-full bg-olive px-6 py-3 text-cream transition hover:bg-fg"
        >
          Log in / Sign up
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
      setError("Please enter a title.");
      return;
    }
    if (files.length === 0) {
      setError("Please add at least one photo.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const uploadedPaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setStatusText(`Processing photos… (${i + 1}/${files.length})`);
        const blob = await stripExifAndResize(files[i]);
        const path = `${user.id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from(HOUSE_PHOTOS_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg" });
        if (uploadErr) throw uploadErr;
        uploadedPaths.push(path);
      }

      setStatusText("Posting…");

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
      if (postErr || !postRow) throw postErr ?? new Error("Couldn't create the post.");

      const { error: photosErr } = await supabase.from("house_photos").insert(
        uploadedPaths.map((storage_path, sort_order) => ({
          post_id: postRow.id,
          storage_path,
          sort_order,
        })),
      );
      if (photosErr) throw photosErr;

      router.push(`/en/atlas/${postRow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post it. Please try again.");
      setSubmitting(false);
      setStatusText("");
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair px-6 py-5 sm:px-8">
        <div className="flex items-center gap-[18px] sm:gap-[22px]">
          <Link href="/en" className="font-display text-[22px] text-fg">
            jib<span className="text-olive-mid">.</span>atlas
          </Link>
          <span className="h-[18px] w-px bg-hair" />
          <Link href="/en/atlas" className="label-mono text-[10px] text-olive-mid transition hover:text-fg">
            ← House Atlas
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-7 px-6 py-10 sm:px-8 sm:py-14">
        <div>
          <h1 className="font-display text-[28px] leading-tight sm:text-[32px]">
            Add your home to the atlas<span className="text-olive-mid">.</span>
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            Photos are re-encoded in your browser before upload, so EXIF data like location is automatically
            stripped.
          </p>
        </div>

        {hasDiagnosis && (
          <div className="rounded-[14px] border border-hair bg-panel px-4 py-3 text-[13px] text-muted">
            Your house type and character badge from your quiz result will be recorded with this post.
          </div>
        )}
        {!hasDiagnosis && (
          <div className="rounded-[14px] border border-hair bg-panel px-4 py-3 text-[13px] text-muted">
            <Link href="/en/test" className="text-olive-mid underline underline-offset-2">
              Take the quiz
            </Link>{" "}
            first and a type badge gets attached too. Posting without it is fine.
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="label-mono text-[10px] text-faint">Title</label>
          <input
            type="text"
            required
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. A 200 sqft studio full of greenery"
            className="rounded-[14px] border border-hair bg-card px-4 py-3 text-fg outline-none focus:border-olive"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label-mono text-[10px] text-faint">Description</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Feel free to describe what makes this home yours."
            className="resize-none rounded-[14px] border border-hair bg-card px-4 py-3 text-fg outline-none focus:border-olive"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="label-mono text-[10px] text-faint">
            Photos ({files.length}/{MAX_PHOTOS_PER_POST})
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-[12px] bg-photo-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 blob 미리보기 */}
                  <img src={src} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] text-cream"
                    style={{ background: "rgba(18,18,15,0.55)" }}
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length < MAX_PHOTOS_PER_POST && (
            <label className="flex cursor-pointer items-center justify-center rounded-[14px] border border-dashed border-hair px-4 py-6 text-[13px] text-muted transition hover:border-olive hover:text-olive">
              Add photos
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
          {submitting ? statusText || "Posting…" : "Post to the atlas"}
        </button>
      </form>
    </main>
  );
}

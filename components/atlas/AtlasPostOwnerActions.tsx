"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HOUSE_PHOTOS_BUCKET } from "@/lib/houseAtlas";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";

/**
 * 게시물 주인만 보이는 삭제 버튼 — app/atlas/[id]/page.tsx. STEP 9 후속.
 * house_posts를 지우면 house_photos/house_likes/house_comments는 FK
 * on delete cascade로 자동 정리되지만, Storage의 실제 파일은 DB cascade와
 * 무관해서 여기서 먼저 지워야 고아 파일이 안 남는다.
 */
export function AtlasPostOwnerActions({
  postId,
  ownerId,
  photoStoragePaths,
}: {
  postId: string;
  ownerId: string;
  photoStoragePaths: string[];
}) {
  const router = useRouter();
  const { user } = useUser();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.id !== ownerId) return null;

  async function handleDelete() {
    if (pending) return;
    setPending(true);
    setError(null);
    const supabase = createClient();

    if (photoStoragePaths.length > 0) {
      const { error: storageErr } = await supabase.storage
        .from(HOUSE_PHOTOS_BUCKET)
        .remove(photoStoragePaths);
      // 스토리지 정리가 실패해도 게시물 삭제는 계속 진행한다 — 고아 파일이
      // 남는 것보다 삭제가 아예 안 되는 쪽이 더 나쁘다.
      if (storageErr) console.error("house-photos storage cleanup failed:", storageErr);
    }

    const { error: deleteErr } = await supabase.from("house_posts").delete().eq("id", postId);
    if (deleteErr) {
      setError("삭제에 실패했어요. 다시 시도해주세요.");
      setPending(false);
      return;
    }

    router.push("/atlas");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-[12px] text-muted underline underline-offset-2 transition hover:text-fg"
        >
          게시물 삭제
        </button>
      ) : (
        <div className="flex items-center gap-3 text-[12px]">
          <span className="text-muted">정말 삭제할까요? 되돌릴 수 없어요.</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="font-semibold transition disabled:opacity-50"
            style={{ color: "#a3402a" }}
          >
            {pending ? "삭제 중…" : "삭제"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="text-faint underline underline-offset-2"
          >
            취소
          </button>
        </div>
      )}
      {error && (
        <p className="text-[12px]" style={{ color: "#a3402a" }}>
          {error}
        </p>
      )}
    </div>
  );
}

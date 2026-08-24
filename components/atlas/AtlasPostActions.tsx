"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";
import type { HouseComment } from "@/lib/types";

/**
 * 집 아틀라스 상세 페이지의 좋아요·댓글 — 유저별로 달라지는 부분만 클라이언트
 * 컴포넌트로 분리했다(app/atlas/[id]/page.tsx 참고). STEP 9.
 *
 * 좋아요/댓글 개수는 house_posts.like_count·comment_count에 DB 트리거로
 * 캐시돼 있지만(0002_house_atlas.sql), 여기서는 낙관적으로 로컬 상태만
 * 갱신한다 — 페이지를 새로고침하면 트리거가 반영한 진짜 값으로 다시 맞춰진다.
 */
export function AtlasPostActions({
  postId,
  ownerId,
  initialLiked,
  initialLikeCount,
  initialComments,
}: {
  postId: string;
  ownerId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialComments: HouseComment[];
}) {
  const router = useRouter();
  const { user } = useUser();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likePending, setLikePending] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [commentBody, setCommentBody] = useState("");
  const [commentPending, setCommentPending] = useState(false);
  const [deletingCommentIds, setDeletingCommentIds] = useState<Set<string>>(new Set());
  const [confirmingCommentId, setConfirmingCommentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function requireLogin() {
    router.push(`/login?next=${encodeURIComponent(`/atlas/${postId}`)}`);
  }

  async function toggleLike() {
    if (!user) return requireLogin();
    if (likePending) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    setLikePending(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = nextLiked
      ? await supabase.from("house_likes").insert({ post_id: postId, user_id: user.id })
      : await supabase.from("house_likes").delete().eq("post_id", postId).eq("user_id", user.id);

    if (err) {
      // 실패하면 낙관적 갱신을 되돌린다.
      setLiked(!nextLiked);
      setLikeCount((c) => c + (nextLiked ? -1 : 1));
      setError("좋아요 처리에 실패했어요. 다시 시도해주세요.");
    }
    setLikePending(false);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return requireLogin();
    const body = commentBody.trim();
    if (!body || commentPending) return;

    setCommentPending(true);
    setError(null);

    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("house_comments")
      .insert({ post_id: postId, user_id: user.id, body })
      .select()
      .single();

    if (err || !data) {
      setError("댓글을 남기지 못했어요. 다시 시도해주세요.");
    } else {
      setComments((prev) => [...prev, data as HouseComment]);
      setCommentBody("");
    }
    setCommentPending(false);
  }

  async function deleteComment(commentId: string) {
    if (!user || deletingCommentIds.has(commentId)) return;
    setDeletingCommentIds((prev) => new Set(prev).add(commentId));
    setError(null);

    const prevComments = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    const supabase = createClient();
    const { error: err } = await supabase.from("house_comments").delete().eq("id", commentId);

    if (err) {
      setComments(prevComments);
      setError("댓글 삭제에 실패했어요. 다시 시도해주세요.");
    }
    setDeletingCommentIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
    setConfirmingCommentId((current) => (current === commentId ? null : current));
  }

  return (
    <div className="flex flex-col gap-8 border-t border-hair pt-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleLike}
          disabled={likePending}
          aria-pressed={liked}
          className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-[13px] font-semibold transition disabled:opacity-60"
          style={{
            borderColor: liked ? "var(--color-olive)" : "var(--color-hair)",
            background: liked ? "var(--color-sage)" : "transparent",
            color: liked ? "var(--color-sage-ink)" : "var(--color-fg)",
          }}
        >
          <span>{liked ? "♥" : "♡"}</span>
          좋아요 {likeCount}
        </button>
        <span className="text-[13px] text-muted">댓글 {comments.length}</span>
      </div>

      {error && (
        <p className="-mt-4 text-sm" style={{ color: "#a3402a" }}>
          {error}
        </p>
      )}

      <div className="flex flex-col gap-5">
        {comments.length === 0 ? (
          <p className="text-[13px] text-faint">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {comments.map((comment) => {
              // 댓글은 작성자 본인 또는 이 게시물 주인이 지울 수 있다
              // (0003_house_atlas_comment_moderation.sql의 RLS와 짝을 맞춘 조건).
              const canDelete = user && (user.id === comment.user_id || user.id === ownerId);
              return (
                <li key={comment.id} className="flex flex-col gap-1 border-b border-hair pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {comment.user_id === ownerId && (
                        <span
                          className="label-mono rounded-full bg-sage px-2.5 py-1 text-[8px]"
                          style={{ color: "var(--color-sage-ink)" }}
                        >
                          집주인
                        </span>
                      )}
                      <span className="label-mono text-[9px] text-faint">
                        {new Date(comment.created_at).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {canDelete &&
                      (confirmingCommentId === comment.id ? (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-faint">정말 삭제하시겠습니까?</span>
                          <button
                            type="button"
                            onClick={() => deleteComment(comment.id)}
                            disabled={deletingCommentIds.has(comment.id)}
                            className="font-semibold transition disabled:opacity-50"
                            style={{ color: "#a3402a" }}
                          >
                            {deletingCommentIds.has(comment.id) ? "삭제 중…" : "삭제"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingCommentId(null)}
                            disabled={deletingCommentIds.has(comment.id)}
                            className="text-faint underline underline-offset-2"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingCommentId(comment.id)}
                          className="text-[11px] text-faint underline underline-offset-2 transition hover:text-fg"
                        >
                          삭제
                        </button>
                      ))}
                  </div>
                  <p className="text-[14px] whitespace-pre-wrap text-fg">{comment.body}</p>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={submitComment} className="flex flex-col gap-3">
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            onFocus={() => {
              if (!user) requireLogin();
            }}
            placeholder={user ? "댓글을 남겨보세요" : "로그인하면 댓글을 남길 수 있어요"}
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-[14px] border border-hair bg-card px-4 py-3 text-[14px] text-fg outline-none focus:border-olive"
          />
          <button
            type="submit"
            disabled={commentPending || !commentBody.trim()}
            className="self-end rounded-full bg-olive px-6 py-2.5 text-[13px] font-semibold text-cream transition hover:bg-fg disabled:opacity-50"
          >
            {commentPending ? "등록 중…" : "댓글 남기기"}
          </button>
        </form>
      </div>
    </div>
  );
}

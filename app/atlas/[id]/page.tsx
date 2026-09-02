import Link from "next/link";
import { notFound } from "next/navigation";
import { AtlasPostActions } from "@/components/atlas/AtlasPostActions";
import { AtlasPostOwnerActions } from "@/components/atlas/AtlasPostOwnerActions";
import { RoomIsoCard } from "@/components/atlas/RoomIsoCard";
import { getHousePhotoUrl } from "@/lib/houseAtlas";
import { createClient, getUserSafe } from "@/lib/supabase/server";
import type { HouseComment, HousePhoto, HousePost } from "@/lib/types";

/**
 * 집 아틀라스 상세 — 지도 위 한 페이지. STEP 9.
 * 사진·본문은 서버에서 그리고, 좋아요/댓글처럼 유저별로 달라지는 상호작용만
 * 클라이언트 컴포넌트(AtlasPostActions)로 넘긴다.
 */
export default async function AtlasPostPage({ params }: PageProps<"/atlas/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: photosData }, { data: commentsData }, user] = await Promise.all([
    supabase.from("house_posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("house_photos").select("*").eq("post_id", id).order("sort_order", { ascending: true }),
    supabase.from("house_comments").select("*").eq("post_id", id).order("created_at", { ascending: true }),
    getUserSafe(),
  ]);

  if (!post) notFound();

  const typedPost = post as HousePost;
  const photos = (photosData as HousePhoto[] | null) ?? [];
  const comments = (commentsData as HouseComment[] | null) ?? [];

  let liked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("house_likes")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    liked = Boolean(likeRow);
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
        <Link
          href="/atlas/new"
          className="rounded-full border border-hair px-6 py-3 text-[12px] font-semibold text-fg transition hover:border-olive hover:text-olive"
        >
          내 집도 등록하기
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 px-6 py-10 sm:px-8 sm:py-14">
        {typedPost.room_items ? (
          <div className="flex items-center justify-center rounded-[16px] bg-panel py-8">
            <RoomIsoCard items={typedPost.room_items} className="h-[420px] max-w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {photos.map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- Storage 공개 URL(유저 업로드).
              <img
                key={photo.id}
                src={getHousePhotoUrl(supabase, photo.storage_path)}
                alt={`${typedPost.title} 사진 ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className={`w-full rounded-[16px] bg-photo-bg object-cover ${
                  i === 0 ? "sm:col-span-2 aspect-[16/10]" : "aspect-square"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {typedPost.room_items && (
                <span className="label-mono rounded-full border border-hair px-3 py-1.5 text-[9px] text-muted">
                  방 미리보기
                </span>
              )}
              {typedPost.studio_room && (
                <span className="label-mono rounded-full border border-hair px-3 py-1.5 text-[9px] text-muted">
                  룸빌더로 꾸민 방
                </span>
              )}
              {typedPost.rarity_tier && (
                <span
                  className="label-mono rounded-full px-3 py-1.5 text-[9px]"
                  style={{ background: "var(--color-sage)", color: "var(--color-sage-ink)" }}
                >
                  {typedPost.rarity_tier}
                </span>
              )}
              {typedPost.template_name && (
                <span className="label-mono rounded-full border border-hair px-3 py-1.5 text-[9px] text-muted">
                  {typedPost.template_name}
                </span>
              )}
            </div>
            <AtlasPostOwnerActions
              postId={typedPost.id}
              ownerId={typedPost.user_id}
              photoStoragePaths={photos.map((photo) => photo.storage_path)}
            />
          </div>
          <h1 className="font-kr text-[30px] leading-tight sm:text-[36px]">{typedPost.title}</h1>
          {typedPost.persona_name && <p className="text-[14px] text-muted">{typedPost.persona_name}</p>}
          {typedPost.caption && (
            <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap text-fg">{typedPost.caption}</p>
          )}
          <span className="label-mono mt-1 text-[9px] text-faint">
            {new Date(typedPost.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            등록
          </span>
        </div>

        <AtlasPostActions
          postId={typedPost.id}
          ownerId={typedPost.user_id}
          initialLiked={liked}
          initialLikeCount={typedPost.like_count}
          initialComments={comments}
        />
      </div>
    </main>
  );
}

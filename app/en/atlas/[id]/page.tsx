import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AtlasPostActions } from "@/components/atlas/AtlasPostActions";
import { AtlasPostOwnerActions } from "@/components/atlas/AtlasPostOwnerActions";
import { RoomIsoCard } from "@/components/atlas/RoomIsoCard";
import { StudioRoomViewer } from "@/components/atlas/StudioRoomViewer";
import { breadcrumbJsonLd } from "@/lib/breadcrumbJsonLd";
import { getHousePhotoUrl } from "@/lib/houseAtlas";
import { createClient, getUserSafe } from "@/lib/supabase/server";
import type { HouseComment, HousePhoto, HousePost } from "@/lib/types";

/**
 * app/atlas/[id]/page.tsx의 영문판(`/en/atlas/[id]`) — 마크업·조회 로직
 * 동일, UI 문구만 영문(STEP 17 다국어 확장). 게시물 자체(title/caption/
 * 댓글)는 작성자가 쓴 언어 그대로 — 실제 콘텐츠는 안 건드린다는 이 STEP의
 * 원칙(app/en/atlas/page.tsx 주석 참고).
 */
export async function generateMetadata({ params }: PageProps<"/en/atlas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: post }, { data: photos }] = await Promise.all([
    supabase.from("house_posts").select("title, caption").eq("id", id).maybeSingle(),
    supabase.from("house_photos").select("storage_path").eq("post_id", id).order("sort_order", { ascending: true }).limit(1),
  ]);
  if (!post) return {};

  const typedPost = post as Pick<HousePost, "title" | "caption">;
  const description = typedPost.caption
    ? typedPost.caption.length > 155
      ? `${typedPost.caption.slice(0, 154)}…`
      : typedPost.caption
    : `${typedPost.title} — a home shared on the jib.atlas house atlas.`;
  const firstPhoto = (photos as Pick<HousePhoto, "storage_path">[] | null)?.[0];
  const image = firstPhoto ? getHousePhotoUrl(supabase, firstPhoto.storage_path) : undefined;

  return {
    title: typedPost.title,
    description,
    alternates: { canonical: `/en/atlas/${id}`, languages: { ko: `/atlas/${id}`, en: `/en/atlas/${id}` } },
    openGraph: { title: typedPost.title, description, images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title: typedPost.title, description, images: image ? [image] : undefined },
  };
}

export default async function EnglishAtlasPostPage({ params }: PageProps<"/en/atlas/[id]">) {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/en" },
              { name: "House Atlas", path: "/en/atlas" },
              { name: typedPost.title, path: `/en/atlas/${id}` },
            ]),
          ).replace(/</g, "\\u003c"),
        }}
      />
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
        <Link
          href="/en/atlas/new"
          className="rounded-full border border-hair px-6 py-3 text-[12px] font-semibold text-fg transition hover:border-olive hover:text-olive"
        >
          Add your home too
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 px-6 py-10 sm:px-8 sm:py-14">
        {typedPost.studio_room ? (
          <StudioRoomViewer room={typedPost.studio_room} lang="en" />
        ) : typedPost.room_items ? (
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
                alt={`${typedPost.title} photo ${i + 1}`}
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
                  Room preview
                </span>
              )}
              {typedPost.studio_room && (
                <span className="label-mono rounded-full border border-hair px-3 py-1.5 text-[9px] text-muted">
                  Built with room builder
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
              lang="en"
            />
          </div>
          <h1 className="font-display text-[30px] leading-tight sm:text-[36px]">{typedPost.title}</h1>
          {typedPost.persona_name && <p className="text-[14px] text-muted">{typedPost.persona_name}</p>}
          {typedPost.caption && (
            <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap text-fg">{typedPost.caption}</p>
          )}
          <span className="label-mono mt-1 text-[9px] text-faint">
            Posted{" "}
            {new Date(typedPost.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <AtlasPostActions
          postId={typedPost.id}
          ownerId={typedPost.user_id}
          initialLiked={liked}
          initialLikeCount={typedPost.like_count}
          initialComments={comments}
          lang="en"
        />
      </div>
    </main>
  );
}

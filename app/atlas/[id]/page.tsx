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
 * 게시물마다 다른 title/description/OG 이미지 — 유저가 직접 올린 실제
 * 콘텐츠라 각자 고유한 색인 가치가 있다(SEO 가이드 "각 페이지마다 고유한
 * 제목" 항목). 본문 컴포넌트(아래 AtlasPostPage)와 별도로 가볍게 다시
 * 조회한다 — 이미 있는 Promise.all 조회 구조를 안 건드리는 쪽이 더 안전
 * 하고, 이 조회 자체도 가벼워서 비용 문제는 없다.
 */
export async function generateMetadata({ params }: PageProps<"/atlas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: post }, { data: photos }] = await Promise.all([
    supabase.from("house_posts").select("title, caption").eq("id", id).maybeSingle(),
    supabase.from("house_photos").select("storage_path").eq("post_id", id).order("sort_order", { ascending: true }).limit(1),
  ]);
  if (!post) return {};

  const typedPost = post as Pick<HousePost, "title" | "caption">;
  // caption을 비워둔 채 올린 게시물도 있어서(사진만 있는 경우), 그럴 땐 빈
  // <meta description>을 내보내는 대신 제목 기반 기본 문구로 대체한다.
  const description = typedPost.caption
    ? typedPost.caption.length > 155
      ? `${typedPost.caption.slice(0, 154)}…`
      : typedPost.caption
    : `${typedPost.title} — jib.atlas 집 아틀라스에 올라온 집이에요.`;
  const firstPhoto = (photos as Pick<HousePhoto, "storage_path">[] | null)?.[0];
  const image = firstPhoto ? getHousePhotoUrl(supabase, firstPhoto.storage_path) : undefined;

  return {
    title: typedPost.title,
    description,
    alternates: { canonical: `/atlas/${id}` },
    openGraph: { title: typedPost.title, description, images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title: typedPost.title, description, images: image ? [image] : undefined },
  };
}

/**
 * 집 아틀라스 상세 — 지도 위 한 페이지. STEP 9.
 * 사진·본문은 서버에서 그리고, 좋아요/댓글처럼 유저별로 달라지는 상호작용만
 * 클라이언트 컴포넌트(AtlasPostActions)로 넘긴다.
 *
 * studio_room이 있는 게시물(STEP 18, /studio에서 공유)은 캡처 사진 대신
 * 읽기 전용 3D 뷰(StudioRoomViewer, STEP 19)를 보여준다 — "집지도에서
 * 직접 3D로 돌려보고 싶다"는 요청으로 추가했다. house_photos에 캡처
 * 이미지가 같이 있긴 하지만(카드 썸네일·room_items 게시물의 폴백용),
 * 상세 페이지에선 원본 룸 데이터로 직접 오빗 가능한 3D가 정적 사진보다
 * 항상 더 나은 정보라 대체한다.
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: "집 아틀라스", path: "/atlas" },
              { name: typedPost.title, path: `/atlas/${id}` },
            ]),
          ).replace(/</g, "\\u003c"),
        }}
      />
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
        {typedPost.studio_room ? (
          <StudioRoomViewer room={typedPost.studio_room} />
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

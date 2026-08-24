import Link from "next/link";
import { getHousePhotoUrl } from "@/lib/houseAtlas";
import { createClient } from "@/lib/supabase/server";
import type { HousePhoto, HousePost } from "@/lib/types";
import { RoomIsoCard } from "@/components/atlas/RoomIsoCard";

export const metadata = {
  title: "집 아틀라스 — jib.atlas",
  description: "유저들이 직접 등록한 집(실사진 또는 에디터로 꾸민 방)을 모아 보여주는 지도.",
};

type PostRow = HousePost & { house_photos: HousePhoto[] };

/**
 * 집 아틀라스 갤러리 — 유저들이 등록한 집을 모아 보여주는 "지도" 메인 페이지.
 * STEP 9 + 콜드스타트 해결(STEP 10): 실사진뿐 아니라 /editor에서 클릭 한 번
 * 으로 올린 "방 미리보기"(room_items) 게시물도 같은 갤러리에 섞여 나온다 —
 * 업로드 마찰 없는 콘텐츠로 갤러리가 안 비어보이게 하는 게 목적이다.
 * 서버 컴포넌트라 로그인 여부와 무관하게(house_posts는 public read 정책)
 * 첫 렌더에 목록이 채워진다. ?template=t3 쿼리로 유형별 탐색을 기본
 * 화면 경험으로 둔다(등록보다 구경이 먼저).
 */
export default async function AtlasPage({ searchParams }: PageProps<"/atlas">) {
  const { template } = await searchParams;
  const templateFilter = typeof template === "string" ? template : null;

  const supabase = await createClient();

  let query = supabase
    .from("house_posts")
    .select("*, house_photos(id, post_id, storage_path, sort_order)")
    .order("created_at", { ascending: false })
    .limit(60);
  if (templateFilter) query = query.eq("template_id", templateFilter);
  const { data, error } = await query;
  const posts = (data as PostRow[] | null) ?? [];

  // 필터 칩 목록 — 실제로 게시물이 있는 유형만 보여준다(빈 칩 방지).
  const { data: templateRows } = await supabase
    .from("house_posts")
    .select("template_id, template_name")
    .not("template_id", "is", null)
    .limit(500);
  const templateChips = Array.from(
    new Map(
      (templateRows ?? [])
        .filter((row): row is { template_id: string; template_name: string } => Boolean(row.template_id))
        .map((row) => [row.template_id, row.template_name]),
    ),
  ).sort((a, b) => a[1].localeCompare(b[1], "ko"));

  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair px-6 py-5 sm:px-8">
        <div className="flex items-center gap-[18px] sm:gap-[22px]">
          <Link href="/" className="font-display text-[22px] text-fg">
            jib<span className="text-olive-mid">.</span>atlas
          </Link>
          <span className="h-[18px] w-px bg-hair" />
          <span className="label-mono text-[10px] text-olive-mid">House Atlas</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/editor"
            className="rounded-full border border-hair px-6 py-3 text-[12px] font-semibold text-fg transition hover:border-olive hover:text-olive"
          >
            방 꾸미고 공유하기
          </Link>
          <Link
            href="/atlas/new"
            className="rounded-full bg-olive px-6 py-3 text-[12px] font-semibold text-cream transition hover:bg-fg"
          >
            실사진 등록하기 ↗
          </Link>
        </div>
      </div>

      <div className="px-6 py-10 sm:px-8 sm:py-14">
        <h1 className="font-kr max-w-xl text-[32px] leading-[1.2] sm:text-[40px]">
          유저들이 직접 올린 집을 모아, 하나의 지도로<span className="text-olive-mid">.</span>
        </h1>
        <p className="mt-3 max-w-lg text-[14px] text-muted">
          실제 사는 집 사진이거나, 에디터로 꾸민 방이에요. 어느 쪽이든 이 지도 위 한 페이지가 됩니다.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/atlas"
            className="label-mono rounded-full px-4 py-2 text-[9px] transition"
            style={
              templateFilter
                ? { border: "1px solid var(--color-hair)", color: "var(--color-muted)" }
                : { background: "var(--color-olive)", color: "var(--color-cream)" }
            }
          >
            전체
          </Link>
          {templateChips.map(([id, name]) => (
            <Link
              key={id}
              href={`/atlas?template=${id}`}
              className="label-mono rounded-full px-4 py-2 text-[9px] transition"
              style={
                templateFilter === id
                  ? { background: "var(--color-olive)", color: "var(--color-cream)" }
                  : { border: "1px solid var(--color-hair)", color: "var(--color-muted)" }
              }
            >
              {name}
            </Link>
          ))}
        </div>

        {error && (
          <p className="mt-8 text-sm" style={{ color: "#a3402a" }}>
            목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        )}

        {!error && posts.length === 0 && (
          <div className="mt-14 flex flex-col items-center gap-4 rounded-[24px] border border-hair bg-panel px-8 py-16 text-center">
            <p className="font-kr text-lg">
              {templateFilter ? "이 유형엔 아직 등록된 집이 없어요" : "아직 지도에 등록된 집이 없어요"}
            </p>
            <p className="text-sm text-muted">
              사진이 없어도 괜찮아요 — 에디터에서 꾸민 방을 클릭 한 번으로 올릴 수 있어요.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/editor"
                className="rounded-full bg-olive px-6 py-3 text-[13px] font-semibold text-cream transition hover:bg-fg"
              >
                방 꾸미고 공유하기
              </Link>
              <Link
                href="/atlas/new"
                className="rounded-full border border-hair px-6 py-3 text-[13px] font-semibold text-fg transition hover:border-olive hover:text-olive"
              >
                실사진으로 등록하기
              </Link>
            </div>
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const cover = [...post.house_photos].sort((a, b) => a.sort_order - b.sort_order)[0];
            const coverUrl = cover ? getHousePhotoUrl(supabase, cover.storage_path) : null;
            return (
              <Link
                key={post.id}
                href={`/atlas/${post.id}`}
                className="group flex flex-col overflow-hidden rounded-[20px] border border-hair bg-card transition hover:border-olive"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-photo-bg">
                  {post.room_items ? (
                    <div className="flex h-full w-full items-center justify-center bg-panel">
                      <RoomIsoCard
                        items={post.room_items}
                        className="h-[130%] w-[130%] transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : (
                    coverUrl && (
                      // Storage에서 온 유저 사진이라 next/image remotePatterns에 프로젝트 도메인을 안 묶는다.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    )
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {post.room_items && (
                      <span
                        className="label-mono rounded-full px-3 py-1.5 text-[9px]"
                        style={{ background: "rgba(247,246,242,0.86)", color: "var(--color-muted)" }}
                      >
                        방 미리보기
                      </span>
                    )}
                    {post.rarity_tier && (
                      <span
                        className="label-mono rounded-full px-3 py-1.5 text-[9px]"
                        style={{ background: "rgba(247,246,242,0.86)", color: "var(--color-olive-mid)" }}
                      >
                        {post.rarity_tier}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-5 py-4">
                  <span className="font-kr text-[17px] leading-tight">{post.title}</span>
                  {post.persona_name && (
                    <span className="text-[12px] text-muted">{post.persona_name}</span>
                  )}
                  <div className="mt-auto flex items-center gap-4 pt-2 text-[11px] text-faint">
                    <span>♥ {post.like_count}</span>
                    <span>💬 {post.comment_count}</span>
                    {post.template_name && <span className="truncate">· {post.template_name}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}

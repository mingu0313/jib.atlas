import Link from "next/link";
import { getHousePhotoUrl } from "@/lib/houseAtlas";
import { createClient } from "@/lib/supabase/server";
import type { HousePhoto, HousePost } from "@/lib/types";

export const metadata = {
  title: "집 아틀라스 — jib.atlas",
  description: "유저들이 직접 등록한 실제 집 사진을 모아 보여주는 지도.",
};

type PostRow = HousePost & { house_photos: HousePhoto[] };

/**
 * 집 아틀라스 갤러리 — 유저들이 등록한 실제 집을 모아 보여주는 "지도" 메인
 * 페이지. STEP 9. 서버 컴포넌트라 로그인 여부와 무관하게(house_posts는
 * public read 정책) 첫 렌더에 목록이 채워진다.
 */
export default async function AtlasPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("house_posts")
    .select("*, house_photos(id, post_id, storage_path, sort_order)")
    .order("created_at", { ascending: false })
    .limit(60);

  const posts = (data as PostRow[] | null) ?? [];

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
        <Link
          href="/atlas/new"
          className="rounded-full bg-olive px-6 py-3 text-[12px] font-semibold text-cream transition hover:bg-fg"
        >
          내 집 등록하기 ↗
        </Link>
      </div>

      <div className="px-6 py-10 sm:px-8 sm:py-14">
        <h1 className="font-kr max-w-xl text-[32px] leading-[1.2] sm:text-[40px]">
          유저들이 직접 등록한 집을 모아, 하나의 지도로<span className="text-olive-mid">.</span>
        </h1>
        <p className="mt-3 max-w-lg text-[14px] text-muted">
          진단 결과가 아니라 진짜 사는 집이에요. 사진을 올려서 등록하면 이 지도 위 한 페이지가 됩니다.
        </p>

        {error && (
          <p className="mt-8 text-sm" style={{ color: "#a3402a" }}>
            목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        )}

        {!error && posts.length === 0 && (
          <div className="mt-14 flex flex-col items-center gap-4 rounded-[24px] border border-hair bg-panel px-8 py-16 text-center">
            <p className="font-kr text-lg">아직 지도에 등록된 집이 없어요</p>
            <p className="text-sm text-muted">첫 번째로 등록해서 지도의 첫 페이지를 채워보세요.</p>
            <Link
              href="/atlas/new"
              className="mt-2 rounded-full bg-olive px-6 py-3 text-[13px] font-semibold text-cream transition hover:bg-fg"
            >
              내 집 등록하기
            </Link>
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
                  {coverUrl && (
                    // Storage에서 온 유저 사진이라 next/image remotePatterns에 프로젝트 도메인을 안 묶는다.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  )}
                  {post.rarity_tier && (
                    <span
                      className="label-mono absolute top-3 left-3 rounded-full px-3 py-1.5 text-[9px]"
                      style={{ background: "rgba(247,246,242,0.86)", color: "var(--color-olive-mid)" }}
                    >
                      {post.rarity_tier}
                    </span>
                  )}
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

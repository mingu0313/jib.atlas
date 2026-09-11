import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/breadcrumbJsonLd";
import { getHousePhotoUrl } from "@/lib/houseAtlas";
import { createClient } from "@/lib/supabase/server";
import type { HousePhoto, HousePost } from "@/lib/types";
import { RoomIsoCard } from "@/components/atlas/RoomIsoCard";

/**
 * 영문 집 아틀라스(`/en/atlas`) — app/atlas/page.tsx와 데이터 조회·마크업
 * 구조는 완전히 동일하고 UI 문구만 영문으로 바꿨다(STEP 17 다국어 확장).
 * house_posts는 한/영 스튜디오 어느 쪽에서 올렸든 같은 테이블에 섞여 있고,
 * 실제 콘텐츠(title/caption/template_name 등)는 작성자가 쓴 언어 그대로
 * 보여준다 — UI 챠트만 번역하고 유저 콘텐츠는 손대지 않는 게 이 STEP의
 * 일관된 원칙(components/studio/ShareToAtlasButton.tsx 주석 참고).
 */
export const metadata = {
  title: "House Atlas",
  description: "A gallery of real homes and studio-decorated rooms that users have shared.",
  alternates: { canonical: "/en/atlas", languages: { ko: "/atlas", en: "/en/atlas" } },
};

type PostRow = HousePost & { house_photos: HousePhoto[] };

type KindFilter = "photo" | "studio" | null;

function parseKindFilter(value: string | string[] | undefined): KindFilter {
  return value === "photo" || value === "studio" ? value : null;
}

export default async function EnglishAtlasPage({ searchParams }: PageProps<"/en/atlas">) {
  const { template, kind } = await searchParams;
  const templateFilter = typeof template === "string" ? template : null;
  const kindFilter = parseKindFilter(kind);

  const supabase = await createClient();

  let query = supabase
    .from("house_posts")
    .select("*, house_photos(id, post_id, storage_path, sort_order)")
    .order("created_at", { ascending: false })
    .limit(60);
  if (templateFilter) query = query.eq("template_id", templateFilter);
  if (kindFilter === "photo") query = query.is("room_items", null).is("studio_room", null);
  if (kindFilter === "studio") query = query.or("room_items.not.is.null,studio_room.not.is.null");
  const { data, error } = await query;
  const posts = (data as PostRow[] | null) ?? [];

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
  ).sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/en" },
              { name: "House Atlas", path: "/en/atlas" },
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
          <span className="label-mono text-[10px] text-olive-mid">House Atlas</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/en/studio"
            className="rounded-full border border-hair px-6 py-3 text-[12px] font-semibold text-fg transition hover:border-olive hover:text-olive"
          >
            Decorate & share a room
          </Link>
          <Link
            href="/en/atlas/new"
            className="rounded-full bg-olive px-6 py-3 text-[12px] font-semibold text-cream transition hover:bg-fg"
          >
            Share a real photo ↗
          </Link>
        </div>
      </div>

      <div className="px-6 py-10 sm:px-8 sm:py-14">
        <h1 className="font-display max-w-xl text-[32px] leading-[1.2] sm:text-[40px]">
          Homes shared by our users, gathered into one map<span className="text-olive-mid">.</span>
        </h1>
        <p className="mt-3 max-w-lg text-[14px] text-muted">
          Real photos of where people live, or rooms decorated in the interior studio — either way, they become a
          page on this map.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {(
            [
              [null, "All"],
              ["photo", "Real photos"],
              ["studio", "Studio-decorated"],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={label}
              href={
                value
                  ? `/en/atlas?kind=${value}${templateFilter ? `&template=${templateFilter}` : ""}`
                  : templateFilter
                    ? `/en/atlas?template=${templateFilter}`
                    : "/en/atlas"
              }
              className="rounded-full px-5 py-2.5 text-[13px] font-semibold transition"
              style={
                kindFilter === value
                  ? { background: "var(--color-olive)", color: "var(--color-cream)" }
                  : { border: "1px solid var(--color-hair)", color: "var(--color-fg)" }
              }
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={kindFilter ? `/en/atlas?kind=${kindFilter}` : "/en/atlas"}
            className="label-mono rounded-full px-4 py-2 text-[9px] transition"
            style={
              templateFilter
                ? { border: "1px solid var(--color-hair)", color: "var(--color-muted)" }
                : { background: "var(--color-olive)", color: "var(--color-cream)" }
            }
          >
            All types
          </Link>
          {templateChips.map(([id, name]) => (
            <Link
              key={id}
              href={`/en/atlas?template=${id}${kindFilter ? `&kind=${kindFilter}` : ""}`}
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
            Couldn&apos;t load the list. Please try again in a moment.
          </p>
        )}

        {!error && posts.length === 0 && (
          <div className="mt-14 flex flex-col items-center gap-4 rounded-[24px] border border-hair bg-panel px-8 py-16 text-center">
            <p className="font-display text-lg">
              {templateFilter
                ? "No homes registered for this type yet"
                : kindFilter === "photo"
                  ? "No real home photos yet"
                  : kindFilter === "studio"
                    ? "No studio-decorated rooms yet"
                    : "Nothing on the map yet"}
            </p>
            <p className="text-sm text-muted">
              No photo needed — you can post a room decorated in the interior studio with one click.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/en/studio"
                className="rounded-full bg-olive px-6 py-3 text-[13px] font-semibold text-cream transition hover:bg-fg"
              >
                Decorate & share a room
              </Link>
              <Link
                href="/en/atlas/new"
                className="rounded-full border border-hair px-6 py-3 text-[13px] font-semibold text-fg transition hover:border-olive hover:text-olive"
              >
                Share a real photo
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
                href={`/en/atlas/${post.id}`}
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
                        Room preview
                      </span>
                    )}
                    {post.studio_room && (
                      <span
                        className="label-mono rounded-full px-3 py-1.5 text-[9px]"
                        style={{ background: "rgba(247,246,242,0.86)", color: "var(--color-muted)" }}
                      >
                        Built with room builder
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
                  <span className="font-display text-[17px] leading-tight">{post.title}</span>
                  {post.persona_name && <span className="text-[12px] text-muted">{post.persona_name}</span>}
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

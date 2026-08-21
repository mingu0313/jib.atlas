import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PlacedFurniture } from "@/lib/types";

/** 클라이언트가 보낸 값이 배치 아이템 배열 모양인지 최소한으로 검증한다. */
function isPlacedFurnitureArray(value: unknown): value is PlacedFurniture[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.defId === "string" &&
        typeof item.col === "number" &&
        typeof item.row === "number",
    )
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("editor_layouts")
    .select("template_id, items")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    templateId: data?.template_id ?? null,
    items: (data?.items as PlacedFurniture[] | undefined) ?? [],
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const templateId = body?.templateId;
  const items = body?.items;

  if (typeof templateId !== "string" || !isPlacedFurnitureArray(items)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { error } = await supabase.from("editor_layouts").upsert({
    user_id: user.id,
    template_id: templateId,
    items,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

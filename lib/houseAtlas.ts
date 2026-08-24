import type { SupabaseClient } from "@supabase/supabase-js";

/** 집 사진 전용 공개 Storage 버킷 (0002_house_atlas.sql 참고). */
export const HOUSE_PHOTOS_BUCKET = "house-photos";

/** 게시물 하나에 허용하는 최대 사진 수. */
export const MAX_PHOTOS_PER_POST = 6;

/**
 * 업로드 전 브라우저에서 사진을 캔버스에 다시 그려 JPEG로 내보낸다.
 *
 * 실제 우리 집 사진은 GPS 등 EXIF 메타데이터가 그대로 남아있기 쉬운데,
 * 서버(Cloudflare Workers)에는 sharp 같은 이미지 처리 런타임이 없다
 * (next.config.ts의 images.unoptimized 참고). 대신 캔버스로 다시 그려서
 * 내보내면 그 과정 자체가 EXIF를 전부 떨어뜨리면서 리사이즈도 겸한다 —
 * `imageOrientation: "from-image"`로 방향(세로 사진 회전)만 픽셀에
 * 미리 구워넣고, 나머지 메타데이터는 새 JPEG에 아예 실리지 않는다.
 */
export async function stripExifAndResize(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이 브라우저에서는 사진을 처리할 수 없어요.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("사진 변환에 실패했어요."))),
        "image/jpeg",
        quality,
      );
    });
  } finally {
    bitmap.close();
  }
}

/** house-photos 버킷 경로의 공개 URL. 버킷이 public이라 서명 없이 바로 접근 가능. */
export function getHousePhotoUrl(supabase: SupabaseClient, storagePath: string): string {
  return supabase.storage.from(HOUSE_PHOTOS_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

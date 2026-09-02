"use client";

import dynamic from "next/dynamic";
import type { StudioRoomSnapshot } from "@/lib/types";

// three.js Canvas는 WebGL이라 SSR 불가 — components/studio/StudioPreviewPanel.tsx
// 의 RoomStudioScene3D 동적 로드와 같은 이유·같은 패턴.
const StudioRoomScene = dynamic(
  () => import("@/components/atlas/StudioRoomScene").then((m) => m.StudioRoomScene),
  { ssr: false, loading: () => <div className="flex h-[420px] items-center justify-center text-sm text-muted">3D 뷰 불러오는 중…</div> },
);

/**
 * app/atlas/[id]/page.tsx(서버 컴포넌트)가 studio_room이 있는 게시물에서
 * 쓰는 얇은 클라이언트 래퍼 — STEP 19. 서버 컴포넌트는 next/dynamic의
 * ssr:false를 직접 못 쓰기 때문에, "use client" 경계를 여기 하나로
 * 모아뒀다(실제 렌더링은 StudioRoomScene이 한다).
 */
export function StudioRoomViewer({ room }: { room: StudioRoomSnapshot }) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[16px] bg-panel">
      <StudioRoomScene room={room} />
      {/* OrbitControls라는 게 마우스/터치로만 보면 안 드러나서 — 처음 보는
          방문자가 "이거 사진이 아니라 직접 돌려볼 수 있다"는 걸 알게. */}
      <span className="label-mono pointer-events-none absolute bottom-4 left-4 rounded-full bg-card/85 px-3 py-1.5 text-[9px] text-faint">
        드래그해서 돌려보세요 · 스크롤로 확대
      </span>
    </div>
  );
}

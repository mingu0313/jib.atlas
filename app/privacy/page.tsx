import Link from "next/link";
import type { Metadata } from "next";
import { COLLAB_EMAIL } from "@/lib/contactEmail";

/**
 * 개인정보처리방침 — 인스타그램 공유 전 검토에서 나온 이슈 대응(STEP 19).
 * 이메일·구글 로그인·실제 집 사진·댓글을 수집하는 서비스인데 이 페이지
 * 자체가 없었다 — Google OAuth 동의 화면의 "Application privacy policy
 * link" 칸도 채울 게 없는 상태였다. 법인이 아닌 개인 운영 서비스라 정식
 * 법률 자문 문서는 아니고, 실제로 뭘 어떻게 쓰는지 평이한 말로 정직하게
 * 설명하는 데 목적을 둔다 — 회원 규모가 커지면 정식 검토를 다시 받는 게
 * 좋다.
 *
 * /login·/result 같은 개인화 페이지와 달리 이 페이지는 누구에게나 같은
 * 정적 콘텐츠라 색인 가치가 있다 — robots noindex 안 둔다(기본값 index).
 */
export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "jib.atlas가 어떤 정보를 왜 수집하고, 누구와 공유하고, 얼마나 보관하는지 설명합니다.",
  alternates: { canonical: "/privacy", languages: { ko: "/privacy", en: "/en/privacy" } },
};

const LAST_UPDATED = "2026년 9월 11일";

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      <div className="flex items-center gap-[18px] border-b border-hair px-6 py-5 sm:px-8 sm:gap-[22px]">
        <Link href="/" className="font-display text-[22px] text-fg">
          jib<span className="text-olive-mid">.</span>atlas
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-14 sm:px-0 sm:py-20">
        <div className="flex flex-col gap-3">
          <span className="label-mono text-[10px] text-olive-mid">Privacy Policy</span>
          <h1 className="font-kr text-[clamp(28px,4vw,44px)] leading-[1.15]">개인정보처리방침</h1>
          <p className="text-[13px] text-faint">최종 수정일 {LAST_UPDATED}</p>
        </div>

        <p className="text-[14px] leading-[1.9] text-muted">
          jib.atlas는 개인이 만들고 운영하는 서비스예요. 법무팀이 검토한 정식 약관은 아니지만, 실제로 어떤
          정보를 왜 모으고 어떻게 쓰는지 최대한 정직하고 쉽게 적어뒀어요. 궁금한 점이 있으면 맨 아래 이메일로
          언제든 물어보셔도 됩니다.
        </p>

        <Section title="1. 수집하는 정보">
          <ul className="flex flex-col gap-3">
            <li>
              <strong className="text-fg">계정 정보</strong> — 이메일/비밀번호로 가입하거나 구글 로그인을 쓰면
              이메일 주소를 저장해요. 구글 로그인은 구글이 제공하는 최소한의 정보(이메일, 이름)만 받아요.
            </li>
            <li>
              <strong className="text-fg">집 아틀라스에 직접 올리는 내용</strong> — 사진, 제목, 소개글, 댓글처럼
              등록 버튼을 눌러야만 생기는 정보예요. 사진은 업로드 전 브라우저에서 위치정보(GPS) 등 EXIF
              메타데이터를 자동으로 제거해요.
            </li>
            <li>
              <strong className="text-fg">라이프스타일 진단 답변</strong> — 이건 서버로 전송되지 않고 <strong className="text-fg">브라우저에만</strong> 저장돼요(로컬 스토리지). 진단 결과를 집
              아틀라스에 공유하기로 직접 선택한 경우에만, 그 결과 요약(집 유형·캐릭터 이름)이 게시물과 함께
              저장돼요.
            </li>
          </ul>
        </Section>

        <Section title="2. 수집 목적">
          <ul className="flex flex-col gap-2">
            <li>로그인 상태 유지 및 본인 게시물/댓글 식별</li>
            <li>집 아틀라스 게시물 등록·좋아요·댓글 기능 제공</li>
            <li>가입 확인, 비밀번호 재설정 등 계정 관련 안내 메일 발송</li>
          </ul>
        </Section>

        <Section title="3. 제3자 제공·처리위탁">
          <p>서비스 운영에 필요한 만큼만 아래 업체를 통해 처리해요 — 그 외 목적으로 판매·제공하지 않아요.</p>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <strong className="text-fg">Supabase</strong> — 로그인, 데이터베이스, 사진 저장소
            </li>
            <li>
              <strong className="text-fg">Google</strong> — 구글 로그인 인증
            </li>
            <li>
              <strong className="text-fg">Resend</strong> — 가입 확인·비밀번호 재설정 메일 발송
            </li>
          </ul>
        </Section>

        <Section title="4. 쿠키·로컬 저장소">
          <p>
            로그인 세션을 유지하는 쿠키와, 진단 답변을 기기에만 저장하는 로컬 스토리지를 사용해요. 둘 다 다른
            사람과 공유되지 않고, 브라우저 설정에서 언제든 직접 지울 수 있어요.
          </p>
        </Section>

        <Section title="5. 보관 기간">
          <p>
            회원 탈퇴 시 계정 정보를 삭제해요. 집 아틀라스에 올린 게시물·댓글은 본인이 직접 삭제할 수 있고,
            삭제하면 즉시 지워져요. 아직 자동 회원 탈퇴 기능은 없어서, 계정 삭제를 원하시면 아래 이메일로
            요청해주세요.
          </p>
        </Section>

        <Section title="6. 이용자의 권리">
          <p>
            본인이 올린 게시물·댓글은 언제든 직접 삭제할 수 있어요. 본인 정보 열람·정정·삭제(계정 삭제 포함)를
            원하시면 아래 이메일로 요청해주시면 확인 후 처리해드려요.
          </p>
        </Section>

        <Section title="7. 문의">
          <p>
            개인정보 관련 문의는{" "}
            <a href={`mailto:${COLLAB_EMAIL}`} className="text-olive-mid underline underline-offset-2">
              {COLLAB_EMAIL}
            </a>
            로 보내주세요.
          </p>
        </Section>

        <Link href="/" className="mt-4 w-fit text-[13px] text-muted underline underline-offset-2 transition hover:text-fg">
          ← 홈으로
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-hair pt-8">
      <h2 className="font-kr text-[19px] text-fg">{title}</h2>
      <div className="text-[14px] leading-[1.9] text-muted">{children}</div>
    </div>
  );
}

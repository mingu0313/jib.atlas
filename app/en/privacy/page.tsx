import Link from "next/link";
import type { Metadata } from "next";
import { COLLAB_EMAIL } from "@/lib/contactEmail";

/** app/privacy/page.tsx의 영문판 — STEP 19. 같은 이유·같은 구조, 문구만 영문. */
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What jib.atlas collects, why, who it's shared with, and how long it's kept.",
  alternates: { canonical: "/en/privacy", languages: { ko: "/privacy", en: "/en/privacy" } },
};

const LAST_UPDATED = "September 11, 2026";

export default function EnglishPrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      <div className="flex items-center gap-[18px] border-b border-hair px-6 py-5 sm:px-8 sm:gap-[22px]">
        <Link href="/en" className="font-display text-[22px] text-fg">
          jib<span className="text-olive-mid">.</span>atlas
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-14 sm:px-0 sm:py-20">
        <div className="flex flex-col gap-3">
          <span className="label-mono text-[10px] text-olive-mid">Privacy Policy</span>
          <h1 className="font-display text-[clamp(28px,4vw,44px)] leading-[1.15]">Privacy Policy</h1>
          <p className="text-[13px] text-faint">Last updated {LAST_UPDATED}</p>
        </div>

        <p className="text-[14px] leading-[1.9] text-muted">
          jib.atlas is built and run by an individual, not a company with a legal team — but here&apos;s a plain,
          honest explanation of what we collect and why. If you have questions, email us at the address at the
          bottom, any time.
        </p>

        <Section title="1. What we collect">
          <ul className="flex flex-col gap-3">
            <li>
              <strong className="text-fg">Account info</strong> — if you sign up with email/password or Google,
              we store your email address. Google sign-in only gives us the minimum Google provides (email,
              name).
            </li>
            <li>
              <strong className="text-fg">What you post to the House Atlas</strong> — photos, titles,
              descriptions, comments: only what you actively submit. Photos have location (GPS) and other EXIF
              metadata automatically stripped in your browser before upload.
            </li>
            <li>
              <strong className="text-fg">Lifestyle quiz answers</strong> — these stay <strong className="text-fg">in your browser only</strong> (local storage) and are never sent to our servers, unless you choose to
              share your result to the House Atlas — in which case a summary (house type, character name) is
              saved along with that post.
            </li>
          </ul>
        </Section>

        <Section title="2. Why we collect it">
          <ul className="flex flex-col gap-2">
            <li>Keeping you signed in and identifying your own posts/comments</li>
            <li>Powering House Atlas posting, likes, and comments</li>
            <li>Sending account-related emails (signup confirmation, password reset)</li>
          </ul>
        </Section>

        <Section title="3. Third parties">
          <p>We only use the services below to run jib.atlas — nothing is sold or shared beyond that.</p>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <strong className="text-fg">Supabase</strong> — authentication, database, photo storage
            </li>
            <li>
              <strong className="text-fg">Google</strong> — Google sign-in
            </li>
            <li>
              <strong className="text-fg">Resend</strong> — signup confirmation and password reset emails
            </li>
          </ul>
        </Section>

        <Section title="4. Cookies & local storage">
          <p>
            We use a cookie to keep you signed in, and browser local storage to keep your quiz answers on your
            own device. Neither is shared with anyone else, and both can be cleared from your browser settings
            at any time.
          </p>
        </Section>

        <Section title="5. Retention">
          <p>
            If you delete your account, your account info is deleted. Posts and comments you make on the House
            Atlas can be deleted by you directly, at any time. We don&apos;t yet have a self-serve account deletion
            button — email us below and we&apos;ll take care of it.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>
            You can delete your own posts and comments any time. To request access, correction, or deletion of
            your account/data, email us below and we&apos;ll handle it.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>
            For privacy questions, email{" "}
            <a href={`mailto:${COLLAB_EMAIL}`} className="text-olive-mid underline underline-offset-2">
              {COLLAB_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Link href="/en" className="mt-4 w-fit text-[13px] text-muted underline underline-offset-2 transition hover:text-fg">
          ← Home
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-hair pt-8">
      <h2 className="font-display text-[19px] text-fg">{title}</h2>
      <div className="text-[14px] leading-[1.9] text-muted">{children}</div>
    </div>
  );
}

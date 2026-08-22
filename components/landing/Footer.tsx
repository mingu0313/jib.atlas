import Link from "next/link";

/** DESIGN-HANDOFF-V2.md "푸터". */
export function Footer() {
  return (
    <footer className="flex items-center justify-between gap-6 border-t border-hair px-6 py-[34px] sm:px-10">
      <Link href="/" className="font-display text-base text-fg">
        jib<span className="text-olive-mid">.</span>atlas
      </Link>
      <span className="label-mono text-[9px] text-muted">jib-atlas.com — House Series 2026</span>
    </footer>
  );
}

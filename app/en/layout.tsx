import { SetHtmlLang } from "@/components/SetHtmlLang";

/** /en 하위 전체에 적용되는 레이아웃 — <html lang> 전환용. STEP 11. */
export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SetHtmlLang lang="en" />
      {children}
    </>
  );
}

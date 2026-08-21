# JIB.ATLAS (jib-atlas.com) — 프로젝트 스펙

## 프로젝트 개요
사용자가 **5축 성향 퀴즈 → 집 유형 매칭 → 아이소메트릭 2.5D 룸 에디터** 흐름을 경험하는
인터랙티브 웹앱. 타겟은 20대, 인스타/카카오 공유를 통한 바이럴이 목표.

## 기술 스택
- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Google Fonts: Fraunces, DM Sans, DM Mono, Noto Sans KR

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

---

## ⚠️ 필수 규칙 (STRICT — 모든 UI 생성에 적용)

1. **색상은 절대 하드코딩 금지.** 항상 `var(--primary)` 같은 CSS 토큰 사용. Tailwind 클래스가 있으면(`bg-primary`, `text-foreground`, `border-border`) 그걸 우선 사용.
2. **폰트도 반드시 아래 4개 중 하나로만 지정.** system-ui, Arial, Helvetica 등 다른 폰트 금지.
3. **보더**는 항상 `var(--border)` (Tailwind `border-border`).
4. **radius**는 기본 `var(--radius)` (0.25rem)로 의도적으로 각짐. 버튼/카드는 날카롭게 유지하고, 유기형 요소에만 큰 radius 예외 적용. **균일하게 쓰지 말 것** — CTA 버튼 2px, 카드 0, 유기형 요소만 큰 값.
5. **다크모드는 전역 토글이 아니라 `className="dark"` 래퍼로만 트리거** — 에디터 화면에만 적용.
6. **accent(코랄, #d9613e)는 주요 CTA/선택 상태/포커스 강조 전용.** 장식용으로 쓰지 말 것.
7. SVG 내부에서는 Tailwind 클래스가 작동하지 않음 → inline style 또는 `fill="var(--primary)"` 방식 사용.
8. 아이소메트릭 가구 렌더링은 `col + row` 오름차순 정렬 후 그리기 (painter's algorithm).
9. 가구 배치는 드래그 앤 드롭이 아니라 **팔레트 클릭 → 룸 타일 클릭** 방식.
10. `next.config.js`에 `images.domains: ["images.unsplash.com"]` 추가 필요.

---

## 폰트 설정 — app/layout.tsx

```tsx
import { Fraunces, DM_Sans, DM_Mono, Noto_Sans_KR } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  style: ["normal", "italic"],
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  axes: ["opsz"],
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});
const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-kr",
  weight: ["300", "400", "500"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${fraunces.variable} ${dmSans.variable} ${dmMono.variable} ${notoSansKR.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### 폰트 역할 매핑 (STRICT)

| 역할 | 폰트 | 비고 |
|---|---|---|
| 대형 헤딩 (h1) | Fraunces | clamp(50px, 6vw, 84px), weight 300 light + 700 bold 교차, italic 활용 |
| 섹션 헤딩 (h2, h3) | Fraunces | clamp(26px, 3.2vw, 44px), weight 400 |
| 본문/설명 | DM Sans, Noto Sans KR | 13–14px, lineHeight 1.8 |
| UI 레이블/버튼/네비 | DM Sans, Noto Sans KR | — |
| 코드/태그/이너보우 레이블/데이터 | DM Mono | 9–10px, all-caps + letterSpacing 0.3–0.45em |
| 한국어 텍스트 | Noto Sans KR | DM Sans와 혼용, 별도 지정 불필요 |

인라인 적용 예: `fontFamily: "'Fraunces', Georgia, serif"` / `"'DM Sans', 'Noto Sans KR', sans-serif"` / `"'DM Mono', monospace"`

---

## 디자인 토큰 — globals.css

```css
@custom-variant dark (&:is(.dark *));

:root {
  --font-size: 16px;

  /* Ground */
  --background: #faf9f5;
  --foreground: #1c1c18;

  /* Surfaces */
  --card: #ffffff;
  --card-foreground: #1c1c18;
  --popover: #ffffff;
  --popover-foreground: #1c1c18;

  /* Primary — deep forest teal */
  --primary: #085041;
  --primary-foreground: #f0f7f4;

  /* Secondary — warm sand */
  --secondary: #ede8df;
  --secondary-foreground: #3d3d35;

  /* Muted */
  --muted: #f3efe6;
  --muted-foreground: #7a7a6a;

  /* Accent — coral / terracotta */
  --accent: #d9613e;
  --accent-foreground: #ffffff;

  /* Destructive */
  --destructive: #c0392b;
  --destructive-foreground: #ffffff;

  /* Borders & inputs */
  --border: rgba(8, 80, 65, 0.10);
  --input: #ede8df;
  --input-background: #ede8df;
  --switch-background: #c8c2b8;

  /* Typography weights */
  --font-weight-medium: 500;
  --font-weight-normal: 400;

  /* Focus ring */
  --ring: #085041;

  /* Charts */
  --chart-1: #085041;
  --chart-2: #2a7a64;
  --chart-3: #d9613e;
  --chart-4: #e8b894;
  --chart-5: #f3efe6;

  /* Radius */
  --radius: 0.25rem;

  /* Sidebar */
  --sidebar: #f0ece4;
  --sidebar-foreground: #1c1c18;
  --sidebar-primary: #085041;
  --sidebar-primary-foreground: #f0f7f4;
  --sidebar-accent: #ede8df;
  --sidebar-accent-foreground: #1c1c18;
  --sidebar-border: rgba(8, 80, 65, 0.08);
  --sidebar-ring: #085041;
}

/* .dark — 에디터 화면 전용, 전역 다크모드 아님 */
.dark {
  --background: #091a16;
  --foreground: #e0ede8;
  --card: #0f2420;
  --card-foreground: #e0ede8;
  --primary: #3aac8e;
  --primary-foreground: #091a16;
  --secondary: #142e28;
  --secondary-foreground: #c8ddd8;
  --muted: #102018;
  --muted-foreground: #5a8070;
  --accent: #d9613e;
  --accent-foreground: #ffffff;
  --border: rgba(58, 172, 142, 0.12);
  --input: #142e28;
  --ring: #3aac8e;
  --sidebar: #0a1e18;
  --sidebar-foreground: #e0ede8;
  --sidebar-primary: #3aac8e;
  --sidebar-primary-foreground: #091a16;
  --sidebar-accent: #142e28;
  --sidebar-accent-foreground: #e0ede8;
  --sidebar-border: rgba(58, 172, 142, 0.10);
  --sidebar-ring: #3aac8e;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
  --radius-xl: calc(var(--radius) + 8px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body {
    @apply bg-background text-foreground;
    font-family: 'DM Sans', 'Noto Sans KR', system-ui, sans-serif;
  }
  html { font-size: var(--font-size); scroll-behavior: smooth; }
  ::-webkit-scrollbar { display: none; }
  h1, h2, h3 { font-family: 'Fraunces', Georgia, serif; font-weight: 400; line-height: 1.15; }
  label, button, input { font-family: 'DM Sans', 'Noto Sans KR', sans-serif; }
}
```

### 컬러 사용 규칙

```
var(--background)         페이지 기본 배경 (#faf9f5 따뜻한 오프화이트)
var(--foreground)         기본 텍스트 (#1c1c18 웜 블랙)
var(--primary)            핵심 강조, CTA 버튼, 보더 포인트 (#085041 딥 틸)
var(--primary-foreground) 틸 배경 위 텍스트 (#f0f7f4)
var(--accent)             호버 하이라이트, 보조 CTA (#d9613e 코랄) — 장식용 금지
var(--secondary)          섹션 배경 변주 (#ede8df 웜 샌드)
var(--muted)              카드 배경, 서브 섹션 (#f3efe6)
var(--muted-foreground)   보조 텍스트 (#7a7a6a)
var(--border)             구분선, 카드 테두리 (rgba(8,80,65,0.10))
var(--card)                카드/패널 (#ffffff)
```

**에디터 전용 다크 팔레트** (`.dark` 클래스 wrapper):
- 배경: `#091a16` (딥 틸-다크)
- 주요 인터랙션: `#3aac8e` (틸 라이트)
- 선택/활성: `#d9613e` (코랄 — 다크 배경에서 돋보임)
- 텍스트: `#e0ede8` (페일 틸-화이트)

---

## Next.js 폴더 구조

```
app/
├── layout.tsx              # 폰트 + 메타데이터
├── page.tsx                # <LandingScreen/> 렌더
└── globals.css             # 위 디자인 토큰 전체

components/
├── shared/
│   ├── JibLogo.tsx          # SVG 아치 로고
│   └── Nav.tsx               # 스티키 네비
├── landing/
│   ├── Hero.tsx               # 분할 레이아웃 헤딩 + 아이소 룸
│   ├── Process.tsx            # 01/02/03 수평 스트립
│   ├── HouseTypes.tsx         # 2x2 포토/텍스트 체커보드
│   ├── EditorPreview.tsx      # 틸 전체폭 섹션
│   └── QuizCTA.tsx            # 대형 CTA 섹션
├── quiz/
│   └── QuizScreen.tsx
├── result/
│   └── ResultScreen.tsx
└── editor/
    ├── EditorScreen.tsx
    ├── RoomSVG.tsx
    ├── IsoBox.tsx
    ├── IsoLabel.tsx
    └── HeroRoomIso.tsx        # 장식용 미니 아이소 룸

lib/
├── isometric.ts             # 투영 수학
├── furniture-defs.ts         # 가구 데이터
└── types.ts                  # 공통 타입
```

---

## lib/isometric.ts

```ts
export const TW = 64, TH = 32, OX = 468, OY = 140;
export const WH = 108, RW = 10, RD = 8;

export function ixy(col: number, row: number): [number, number] {
  return [(col - row) * (TW / 2) + OX, (col + row) * (TH / 2) + OY];
}
export const P = (ps: [number, number][]) =>
  ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
export const up = ([x, y]: [number, number], h: number): [number, number] => [x, y - h];
```

---

## lib/furniture-defs.ts

```ts
export interface FDef {
  id: string; ko: string; en: string;
  w: number; d: number; h: number;
  top: string; left: string; right: string;
}

export const FDEFS: FDef[] = [
  { id:"sofa",     ko:"소파",          en:"SOFA",           w:3,d:1,h:44, top:"#1e3830",left:"#162a24",right:"#0e1c18" },
  { id:"lounge",   ko:"라운지 체어",    en:"LOUNGE CHAIR",   w:2,d:2,h:40, top:"#2a2820",left:"#1c1c14",right:"#12120c" },
  { id:"ctable",   ko:"다이닝 테이블",  en:"COMMUNAL TABLE", w:3,d:2,h:28, top:"#3a2a18",left:"#261c10",right:"#16100a" },
  { id:"counter",  ko:"카운터",         en:"COUNTER",        w:4,d:1,h:52, top:"#1c2c28",left:"#141e1c",right:"#0c1412" },
  { id:"bar",      ko:"바 카운터",      en:"BAR",            w:3,d:1,h:56, top:"#2e1e10",left:"#1e140a",right:"#120e06" },
  { id:"desk",     ko:"책상",           en:"DESK",           w:2,d:1,h:34, top:"#22301e",left:"#162014",right:"#0e140c" },
  { id:"wardrobe", ko:"옷장",           en:"WARDROBE",       w:1,d:2,h:96, top:"#1a2c24",left:"#121e18",right:"#0c1410" },
  { id:"plant",    ko:"화분",           en:"PLANT",          w:1,d:1,h:68, top:"#1c3418",left:"#14240f",right:"#0c160a" },
  { id:"bed",      ko:"침대",           en:"BED",            w:3,d:2,h:42, top:"#1a2034",left:"#121628",right:"#0c1018" },
];

export function canPlace(
  col: number, row: number, def: FDef,
  placed: { col: number; row: number; defId: string }[]
): boolean {
  if (col < 0 || row < 0 || col + def.w > 10 || row + def.d > 8) return false;
  for (const item of placed) {
    const d = FDEFS.find(x => x.id === item.defId)!;
    if (col < item.col + d.w && col + def.w > item.col &&
        row < item.row + d.d && row + def.d > item.row) return false;
  }
  return true;
}
```

---

## 이미지 URL (Unsplash 무료)

```ts
export const PH = {
  hero:      "https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?w=1400&h=900&fit=crop&auto=format",
  serene:    "https://images.unsplash.com/photo-1720706405494-e552f264dd8d?w=700&h=800&fit=crop&auto=format",
  open:      "https://images.unsplash.com/photo-1631510390389-c1e4fb20ff31?w=700&h=800&fit=crop&auto=format",
  efficient: "https://images.unsplash.com/photo-1609081144289-eacc3108cd03?w=700&h=800&fit=crop&auto=format",
  social:    "https://images.unsplash.com/photo-1554612292-c175942fb8c1?w=700&h=800&fit=crop&auto=format",
  quizBg:    "https://images.unsplash.com/photo-1483095348487-53dbf97d8d5b?w=800&h=1200&fit=crop&auto=format",
};
// next.config.js 에 추가: images: { domains: ["images.unsplash.com"] }
```

---

## 랜딩 페이지 섹션 구조

### 섹션 1 — Hero (100vh)
```
[스티키 Nav: 로고 + 링크 3개 + 진단시작 버튼]

[2컬럼 그리드: 55% / 45%]
LEFT:
  레이블: "JIB.ATLAS — HOUSE SERIES 2026" (DM Mono, teal)
  H1 3행: "나는 어떤" (Fraunces 300)
           "집에" (Fraunces 700, teal 색)
           "살아야 할까?" (Fraunces 300 italic)
  본문 설명 (DM Sans 13px)
  CTA 버튼 + "5문항 · 3분" 레이블
  스크롤 힌트 라인

RIGHT: (background: var(--muted))
  도트 텍스처 오버레이
  유기적 틸 블롭 (border-radius 유기형)
  HeroRoomIso SVG (아이소메트릭 룸 일러스트, 플로팅 애니메이션)
  "SERENE NEST — 01" 뱃지
  stats 뱃지 (4유형 / 9가구 / 3분)
```

### 섹션 2 — Process
```
배경: var(--background)
레이블: "HOW IT WORKS" (DM Mono)
헤딩: "어떻게 진행되나요?" (Fraunces)

3컬럼 (각 상단에 2px 틸 보더):
  01 성향 진단
  02 집 유형 발견
  03 직접 꾸미기
```

### 섹션 3 — House Types
```
배경: var(--muted)
레이블: "HOUSE TYPES"
헤딩: "당신의 공간은 / 어떤 성격인가요?"
우측: "진단으로 찾아보기 →" 아웃라인 버튼

2x2 그리드 (290px x 290px 셀):
  [포토: SERENE NEST]        [텍스트(틸 bg): OPEN HORIZON]
  [텍스트(틸 bg): PRECISION]  [포토: SOCIAL ATRIUM]

포토 셀: 이미지 + 틸 그라데이션 오버레이 + 타입명
텍스트 셀: var(--primary) 배경 + 대형 Fraunces 넘버 + 설명
```

### 섹션 4 — Editor Preview
```
배경: var(--primary) 전체폭 틸
2컬럼: 왼쪽 텍스트 / 오른쪽 HeroRoomIso
헤딩: "방을 직접 꾸며보세요" (Fraunces, 크림색)
CTA: var(--accent) 코랄 버튼
도트 텍스처 오버레이
```

### 섹션 5 — Quiz CTA
```
배경: var(--secondary)
중앙 정렬
레이블: "무료 · 회원가입 불필요" (DM Mono)
대형 헤딩: "5가지 질문, / 3분" (Fraunces, "3분"은 teal italic)
장식: 배경에 "01" "05" 대형 Fraunces 반투명
CTA: var(--primary) 버튼 (padding: 18px 60px)
```

---

## 4가지 집 유형

```ts
const TYPES = {
  serene:   { type:"SERENE NEST",    subtitle:"고요한 은신처", num:"01", photo:PH.serene,
    tags:["프라이빗 침실","선룸","아늑한 서재","작은 정원"] },
  open:     { type:"OPEN HORIZON",   subtitle:"열린 수평선",  num:"02", photo:PH.open,
    tags:["오픈 리빙","파노라마 창","테라스","일체형 주방"] },
  efficient:{ type:"PRECISION LOFT", subtitle:"정밀한 공간",  num:"03", photo:PH.efficient,
    tags:["스튜디오형","빌트인 수납","홈 오피스","미니멀 주방"] },
  social:   { type:"SOCIAL ATRIUM",  subtitle:"사교적 중정",  num:"04", photo:PH.social,
    tags:["대형 다이닝","아일랜드 주방","홈 바","게스트룸"] },
};
```

---

## 앱 플로우 & 상태관리

```ts
type Screen = "landing" | "quiz" | "result" | "editor";
// useState<Screen>("landing") 으로 단순 SPA 라우팅

// 성격 유형 결정:
// answers 배열에서 가장 많이 나온 값 -> dominant key
// "serene" | "open" | "efficient" | "social"
```

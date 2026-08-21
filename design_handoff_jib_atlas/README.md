# Handoff: jib.atlas — 랜딩 / 퀴즈 / 결과 / 에디터

대상 코드베이스: `mingu0313/jib.atlas` (Next.js App Router + TypeScript + Tailwind v4)

## Overview
성향 퀴즈(5축) → 집 유형 매칭 → 아이소메트릭 2.5D 룸 에디터 흐름의 4개 화면 하이파이 디자인.
`design-reference/jib-atlas-design-spec-v2.md`의 토큰·폰트·섹션 구조를 그대로 구현한 결과물이다.

## About the Design Files
이 번들의 `jib.atlas.dc.html`은 **HTML로 만든 디자인 레퍼런스**다. 의도된 화면과 동작을 보여주는
프로토타입이며, 그대로 복사해 쓸 프로덕션 코드가 아니다. 해야 할 일은 이 디자인을 **기존
Next.js/Tailwind 환경의 패턴으로 다시 구현**하는 것이다:
- 색·보더·radius는 하드코딩하지 말고 `app/globals.css`의 CSS 토큰 / Tailwind 클래스로 (`bg-primary`, `text-muted-foreground`, `border-border`)
- 폰트는 `app/layout.tsx`의 `next/font/google` 변수 사용
- 화면 전환은 프로토타입의 `useState` SPA 라우팅이 아니라 실제 라우트(`/`, `/test`, `/result`, `/editor`)로
- 이미지는 `next/image`로

## Fidelity
**하이파이.** 아래에 적힌 색·타이포·간격 값은 최종값이다. 픽셀 단위로 재현할 것.

---

## Design Tokens
`app/globals.css`에 이미 정의된 값과 동일하다. 새 토큰을 만들지 말 것.

라이트(전역)
```
--background #faf9f5   --foreground #1c1c18   --card #ffffff
--primary #085041      --primary-foreground #f0f7f4
--secondary #ede8df    --secondary-foreground #3d3d35
--muted #f3efe6        --muted-foreground #7a7a6a
--accent #d9613e       --accent-foreground #ffffff
--border rgba(8,80,65,0.10)
--chart-1 #085041  --chart-2 #2a7a64  --chart-3 #d9613e
--radius 0.25rem
```

다크(에디터 화면 전용 — `className="dark"` 래퍼에만)
```
--background #091a16   --foreground #e0ede8   --card #0f2420
--primary #3aac8e      --secondary #142e28    --muted-foreground #5a8070
--accent #d9613e       --border rgba(58,172,142,0.12)
--sidebar #0a1e18
```

### 타이포 스케일 (실측값)
| 용도 | 폰트 | 크기 / 무게 / 기타 |
|---|---|---|
| Hero h1 | Fraunces | `clamp(50px,6vw,84px)` · line-height 1.02 · letter-spacing -0.02em · 300/700/300italic 3행 교차 |
| 섹션 h2 | Fraunces | `clamp(26px,3.2vw,44px)` · 400 · line-height 1.15 |
| 카드 h3 | Fraunces | 24–30px · 400 |
| 결과 h1 | Fraunces | `clamp(40px,5.4vw,74px)` · 300 + 700 2행 |
| 본문 | DM Sans / Noto Sans KR | 13px · line-height 1.8~1.9 |
| UI 레이블·버튼 | DM Sans | 11–14px |
| 모노 레이블 | DM Mono | 8–10px · uppercase · letter-spacing 0.3–0.45em |

### radius (균일하게 쓰지 말 것)
- 버튼: 2px
- 카드/셀/사진 셀: 0
- 유기형 블롭(히어로 우측): `62% 38% 47% 53% / 44% 58% 42% 56%`

### 간격
섹션 패딩 `110px 64px` (히어로 `80px 64px`, 퀴즈 CTA 섹션 `130px 64px`).
내비 `18px 40px`. 카드 내부 `36px`. 리스트 행 패딩 `13–20px`.

---

## Screens

### 1. 랜딩 (`/`)
스티키 내비(반투명 `rgba(250,249,245,0.92)` + `backdrop-filter: blur(10px)`, 하단 1px border,
좌: `jib.atlas` Fraunces 21px 600 — `.`만 accent 색 / 우: 링크 4개 13px muted-foreground +
`진단 시작` primary 버튼 12px `12px 22px`). 링크·버튼 hover는 accent.

**섹션 1 — Hero** `grid 55fr 45fr`, `min-height: calc(100vh - 63px)`, 하단 1px border
- 좌: 모노 레이블 `JIB.ATLAS — HOUSE SERIES 2026`(primary) → h1 3행(`나는 어떤` 300 / `집에` 700 primary / `살아야 할까?` 300 italic) → 본문 13px max-width 420px → primary CTA `18px 40px` + 모노 `5문항 · 3분` → 56px 라인 + 모노 `SCROLL`
- 우: 배경 `--muted`, 좌측 1px border. 겹치는 3개 레이어 —
  ① 도트 텍스처 `radial-gradient(rgba(8,80,65,0.22) 1px, transparent 1px)` / `16px 16px` / opacity .5
  ② 유기형 틸 블롭 420×380 opacity .07
  ③ 아이소메트릭 미니룸 SVG, `floaty` 7s 무한 애니메이션
  좌상단 `SERENE NEST — 01` 뱃지, 우하단 stats 카드(4 types / 9 furniture / 3분, 흰 배경 + border, 셀 구분 1px)

**섹션 2 — Process** 배경 `--background`. 모노 `HOW IT WORKS` + h2 `어떻게 진행되나요?`.
3컬럼 gap 48px, 각 컬럼 `border-top: 2px solid var(--primary)` + padding-top 26px,
`01/02/03` 모노 accent → h3 → 본문 13px.

**섹션 3 — House Types** 배경 `--muted`. 헤더 좌(모노 `HOUSE TYPES` + h2 2행) / 우(아웃라인 버튼
`진단으로 찾아보기 →`, hover 시 primary 반전). 2×2 체커보드, 셀 min-height 290px, 외곽 1px border:
- 좌상 사진 `Serene Nest` — 이미지 + `linear-gradient(to top, rgba(8,80,65,0.86), rgba(8,80,65,0.05))` 오버레이 + 좌하단 `01` / Fraunces 30px / 12px 서브
- 우상 텍스트 `Open Horizon` — primary 배경, 상단 Fraunces 64px 300 `02`(opacity .35), 하단 제목 + 설명
- 좌하 텍스트 `Precision Loft` — 동일 패턴 `03`
- 우하 사진 `Social Atrium` — 동일 패턴 `04`

**섹션 4 — Editor Preview** 배경 primary 전체폭 + 도트 오버레이(흰색 opacity .12).
`grid 1fr 1fr` gap 64px. 좌: 모노 `THE EDITOR` → h2 `방을 직접 / 꾸며보세요` → 본문 → **accent 버튼**
`16px 34px`(hover `#c1502f`). 우: 미니룸 SVG, floaty 8s.

**섹션 5 — Quiz CTA** 배경 `--secondary`, 중앙 정렬. 배경 장식으로 Fraunces 180px 300 `01`(좌상)
`05`(우하), 색 `rgba(8,80,65,0.06)`. 모노 `무료 · 회원가입 불필요` → h2 `5가지 질문, / 3분`
(`3분`은 primary italic 400) → primary 버튼 `18px 60px`.

**푸터** `32px 64px`, 상단 border. 좌 로고 / 우 모노 `JIB-ATLAS.COM — HOUSE SERIES 2026`.

### 2. 퀴즈 (`/test`)
`grid 38fr 62fr`, `min-height: calc(100vh - 63px)`
- 좌: 사진 + 틸 그라데이션(`rgba(8,80,65,0.9)` → `rgba(8,80,65,0.2)`), 좌하단에 모노 `STEP 01 / 05`,
  Fraunces 34px 300 italic 축 이름(사교성/미니멀리즘/활동성/개방성/자연친화도), 안내문 12px
- 우: 패딩 `80px 72px`, gap 44px
  - 진행: 모노 `QUESTION 01` + `1 of 5`, 2px 트랙(`--border`) 위 primary 채움
  - 질문: Fraunces `clamp(26px,2.8vw,38px)` 400 · line-height 1.35 · max-width 660px
  - 선택지 5개(리커트): 행 높이 패딩 `20px 24px`, 1px border, radius 2px, gap 10px.
    기본 `--card` / 선택 시 배경 primary + 텍스트 primary-foreground + border primary.
    hover는 border-color accent. 좌측에 모노 `01`~`05`(opacity .55) + 14px 라벨
  - 하단: `← 이전` 12px muted, 모노로 축 키(`sociability` 등)

문항 텍스트는 `data/lifestyle-questions.json`의 원문을 그대로 쓴다. 프로토타입은 축별 1문항(q1, q4,
q9, q10, q13)만 노출한다 — 실제 앱의 23문항 플로우로 확장할 경우 진행 표시(`/ 05`)와 랜딩 카피
(`5문항 · 3분`)를 함께 수정해야 한다.

### 3. 결과 (`/result`)
`grid 52fr 48fr`, 좌측 1px 우측 border 구분
- 좌(배경 `--background`, 패딩 `90px 64px`): 모노 `YOUR HOUSE TYPE — 01` + 희귀도 뱃지(accent 1px
  border, 모노 9px) → h1 2행(영문 유형명, 2행이 700 primary) → Fraunces 24px italic 한글 부제 →
  설명 13px/1.9 max-width 460px → `캐릭터` 레이블 + Fraunces 28px 캐릭터명 → 태그 칩 4개
  (`--card` + 1px border, radius 2px, `9px 14px`, 11px) → primary CTA `이 집 꾸미러 가기` + 텍스트
  버튼 `다시 진단하기`
- 우(배경 `--muted`, 패딩 `90px 64px`): 모노 `AXIS PROFILE` + 우측 Fraunces 34px 매칭 `%`
  - 레이더 차트 카드: `--card` + 1px border + padding 24px. SVG viewBox `0 0 340 320`,
    중심 (170,152), R=112. 링 4개(25/50/75/100, stroke `--border`), 축선 5개, 데이터 폴리곤
    fill `rgba(8,80,65,0.14)` / stroke primary 2px, 정점 dot r=3.5 accent, 축 라벨 모노 9px
    (반경 127 위치)
  - 축 5행 리스트: `grid 96px 1fr 44px`, 행 하단 1px border, 3px 바(트랙 `rgba(8,80,65,0.08)`,
    채움은 primary / chart-2 교차), 우측 모노 점수

### 4. 에디터 (`/editor`) — `className="dark"` 래퍼
상단바(`--sidebar` 배경, `18px 32px`, 하단 border): 로고 + 1px 구분자 + 모노
`ROOM EDITOR — 01 SERENE NEST` / 우측 모노 `n / 9 placed` + `초기화` 아웃라인 버튼 + accent
`결과로 돌아가기` 버튼.

본문 `grid 236px 1fr 264px`
- 좌 팔레트(`--sidebar`, 우측 border, `26px 20px`): 모노 `PALETTE` + 9개 행. 각 행 1px border
  radius 2px `12px 14px`, 16px 스와치(가구 top 색) + 한글명 12px + 모노 `3×1` 크기.
  선택 시 배경 `--secondary` + border accent
- 중앙 캔버스: 배경 `--background` + 도트 텍스처(틸 opacity .35), SVG viewBox `180 10 640 470`
  좌하단에 상태 힌트 2행(모노 primary 제목 + 11px 본문) — 선택 전/선택 후/배치 불가 3가지 상태
- 우 인포(`--sidebar`, 좌측 border): 유형명 Fraunces 26px + `한글부제 · 캐릭터명`, 축 5행
  (70px 바), 하단 조작 안내 11px/1.9

#### 아이소메트릭 렌더링 (스펙 그대로)
```ts
TW=64, TH=32, OX=468, OY=140, WH=108, RW=10, RD=8
ixy(col,row) = [(col-row)*TW/2 + OX, (col+row)*TH/2 + OY]
up([x,y],h)  = [x, y-h]
```
- 바닥 타일 80개: 각 단위 사각형 polygon, `(col+row)%2`로 `#0c211c` / `#0e2620` 체크무늬,
  stroke `rgba(58,172,142,0.14)`
- 벽 2면: `col=0` 변(어두운 `#0d2620`), `row=0` 변(`#0a1f1a`), 높이 WH
- 가구 박스: 꼭짓점 a(col,row) b(col+w,row) c(col+w,row+d) d(col,row+d)
  - top `[up(a),up(b),up(c),up(d)]` = `top` 색
  - right `[b,c,up(c),up(b)]` = `right` 색
  - left `[c,d,up(d),up(c)]` = `left` 색
  - 라벨: 중심 x, `y - h - 6`, 모노 8px `rgba(224,237,232,0.55)`
- **그리기 순서: `col+row` 오름차순** (painter's algorithm)
- 선택 중일 때 타일 하이라이트: 놓을 수 있으면 `rgba(58,172,142,0.16)`, 불가면 `rgba(9,26,22,0.9)`

가구 정의 9종(`w,d,h,top,left,right`)은 스펙의 `FDEFS`를 그대로 사용. 기본 배치:
`sofa(1,1) ctable(4,2) plant(9,0) wardrobe(0,6) desk(7,6) lounge(5,5)`

---

## Interactions & Behavior
- 내비/CTA로 화면 전환. 프로토타입은 `useState`, 실제 앱은 라우트 이동
- 퀴즈: 선택지 클릭 → 답 저장 → 다음 문항, 마지막 문항에서 결과로. `← 이전`은 첫 문항에서 랜딩으로
- 배치: **드래그 앤 드롭 아님.** 팔레트 클릭 → 가구 선택 → 바닥 타일 클릭 → 그 타일이 좌상단 기준으로 배치.
  겹치거나 방을 벗어나면 배치 거부 + 힌트를 `놓을 수 없는 자리`로 변경
- 배치된 가구 클릭 → 제거(`e.stopPropagation()` 필수, 아래 타일 클릭과 충돌 방지)
- `초기화` → 기본 배치로 복귀
- hover 전이 `0.15s`. 히어로/에디터 프리뷰 미니룸은 `floaty` 7s/8s (translateY 0 → -14px → 0)
- 버튼 hover: primary → accent, accent → `#c1502f`, 아웃라인 → primary 반전

## State Management
```ts
screen: "landing" | "quiz" | "result" | "editor"   // 실제 앱에서는 라우트로 대체
step: number                                        // 0..4
answers: number[]                                   // 리커트 1..5
placed: { defId: string; col: number; row: number }[]
selected: string | null                             // 팔레트 선택 가구 id
warn: boolean                                       // 배치 실패 힌트
```
채점: `score = round(((reverse ? 6-v : v) - 1) / 4 * 100)` → 축별 0~100.
매칭: 4개 유형 타깃 벡터와 유클리드 거리 최소값 선택, `similarity = max(52, round(100 - dist*0.72))`.
타깃 벡터(사교성, 미니멀리즘, 활동성, 개방성, 자연친화도)
```
serene    [20,60,25,30,75]
open      [55,55,45,90,85]
efficient [30,90,70,55,35]
social    [90,45,60,75,50]
```
캐릭터명은 `lib/persona.ts`와 동일한 규칙(중립 50에서 가장 먼 두 축 → 2순위 수식어 + 1순위 명사).
실제 앱에서는 프로토타입의 로컬 구현 대신 `lib/scoring.ts` / `lib/matching.ts` / `lib/persona.ts`를 쓸 것.

## Assets
- Unsplash 이미지 4장(스펙 v2 `PH` 상수 그대로): serene / social / quizBg 사용. `next.config.ts`의
  `images.domains`에 `images.unsplash.com` 필요. 실제 서비스용 사진으로 교체 권장
- 아이콘·일러스트 없음. 아이소메트릭 룸은 전부 코드 생성 SVG

## Files
- `jib.atlas.dc.html` — 4개 화면 전체 디자인(단일 파일, 브라우저에서 바로 열림)
- 참고: repo의 `design-reference/jib-atlas-design-spec-v2.md`, `app/globals.css`

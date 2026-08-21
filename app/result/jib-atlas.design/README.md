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
| Hero h1 | Fraunces | `clamp(50px,6vw,84px)` · line-height 1.06 · letter-spacing -0.02em · 300 / 400 / 300italic(accent) 3행 |
| 퀴즈 질문 | Fraunces | `clamp(30px,3.6vw,52px)` · 300 · line-height 1.28 |
| 섹션 h2 | Fraunces | `clamp(26px,3.2vw,44px)` · 400 · line-height 1.15 |
| 카드 h3 | Fraunces | 24–30px · 400 |
| 결과 h1 | Fraunces | `clamp(40px,5.4vw,74px)` · 300 + 700 2행 |
| 본문 | DM Sans / Noto Sans KR | 13px · line-height 1.8~1.9 |
| UI 레이블·버튼 | DM Sans | 11–14px |
| 모노 레이블 | DM Mono | 8–10px · uppercase · letter-spacing 0.3–0.45em |

### radius (균일하게 쓰지 말 것)
- 히어로 CTA·목업 내부 버튼: 999px(알약)
- 그 외 버튼: 2px
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

**섹션 1 — Hero** `grid 52fr 48fr`, `align-items: center`, 패딩 `80px 64px`,
`min-height: calc(100vh - 63px)`, `overflow: hidden`, 하단 1px border. 배경은 `--background`(웜 오프화이트).
배경 장식: 우측 `right:-120px; top:60px` 에 540×480 유기형 블롭, primary 색 opacity **0.045**
(radius `62% 38% 47% 53% / 44% 58% 42% 56%`). 다크 배경·진한 그림자·굵은 산세리프는 쓰지 않는다.

- **좌 컬럼** (`flex-direction:column; align-items:flex-start; gap:34px`)
  1. 모노 레이블 `JIB.ATLAS — HOUSE SERIES 2026`, 10px, letter-spacing .45em, primary
  2. h1 Fraunces `clamp(50px,6vw,84px)`, line-height 1.06, letter-spacing -0.02em, 3행 —
     `나는 어떤`(300) / `집에`(400) / `살아야 할까?`(300 **italic**, 색 accent `#d9613e`).
     코랄 이탤릭은 마지막 행 한 곳에만 쓴다.
  3. 모노 메타 한 줄 `5문항 · 3분 · 회원가입 없음` — 11px, letter-spacing .34em, muted-foreground.
     불릿 리스트는 쓰지 않는다.
  4. **알약 CTA** `진단 시작하기` — `border-radius:999px`, 배경 primary, 텍스트 primary-foreground,
     패딩 `20px 46px`, 14px/500, `box-shadow: 0 12px 32px rgba(8,80,65,0.14)`.
     hover 시 배경 accent + `box-shadow: 0 14px 36px rgba(217,97,62,0.20)`. transition .2s
- **우 컬럼** — 기울어진 아이폰 목업. 컨테이너 `min-height:600px; perspective:1400px`
  - **소프트 섀도우**: 목업 뒤 `left:50%; top:64%` 340×150 타원,
    `radial-gradient(ellipse at center, rgba(8,80,65,0.10) 0%, rgba(8,80,65,0.04) 45%, rgba(8,80,65,0) 72%)`
    + `filter: blur(18px)`. 공중에 떠 있는 느낌만 주고 대비를 만들지 않는다
  - **프레임**: width 308px, padding 11px, `border-radius:48px`,
    배경 `linear-gradient(150deg,#ffffff 0%,#f4f1e9 60%,#e9e4d8 100%)`,
    `box-shadow: 0 2px 3px rgba(28,28,24,0.05), 0 30px 70px -20px rgba(8,80,65,0.16)`,
    **`transform: rotateY(-17deg) rotateX(5deg) rotateZ(-2.5deg)`**.
    부모에 `animation: floaty 8s ease-in-out infinite; transform-style:preserve-3d`
    (틸트와 애니메이션은 반드시 다른 엘리먼트에 — 같은 엘리먼트면 transform이 덮어써진다)
  - **스크린**: `border-radius:38px`, 배경 `--card`, `overflow:hidden`,
    `box-shadow: inset 0 0 0 1px rgba(28,28,24,0.06)`. 노치는 `left:50%; top:11px` 78×22
    `border-radius:999px` `#1c1c18` opacity .9
  - **스크린 콘텐츠 = 결과 리빌 화면의 축소판** (평면, 3D 렌더 아님). 패딩 `52px 24px 30px`, gap 20px:
    모노 7px `YOUR HOUSE TYPE — 01` → Fraunces 31px `Serene`(300) / `Nest`(600 primary) 2행 →
    Fraunces 13px italic `고요한 은신처` → 상하 1px border 구간에 레이더 SVG(viewBox `0 0 120 116`,
    width 128 — 링 2개 + 데이터 폴리곤 fill `rgba(8,80,65,0.13)` stroke primary 1.6 + accent dot r2.6) →
    축 3행(`grid 52px 1fr 22px`, 9px 라벨 / 3px 바 / 모노 8px 점수: 자연친화도 85, 미니멀리즘 60, 사교성 22) →
    알약 버튼 `이 집 꾸미러 가기` primary 배경 10px/500 패딩 `13px 0`
  - **떠 있는 원형 배지**: `right:16px; top:66px`, 66×66 `border-radius:999px`, 배경 `--card`,
    `box-shadow: 0 10px 26px -8px rgba(8,80,65,0.20), 0 0 0 1px rgba(8,80,65,0.06)`,
    `transform: rotate(-8deg)`, `animation: floaty 6s`. 안에는 30px 아이소메트릭 다이아몬드 SVG
    (상단 면 stroke primary 1.4, 좌 `rgba(8,80,65,0.14)`, 우 `rgba(217,97,62,0.22)`)

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

### 2. 퀴즈 (`/test`) — `className="dark"` 래퍼
전면 다크 화면. 리커트 척도가 아니라 **상황형 4지선다**이며, 좌측에 배경으로 깔린 사진 위로
콘텐츠가 얹히는 구조다(2분할 그리드 아님).

- **좌측 페이드 사진**: `position:absolute; left/top/bottom:0; width:34%`. 이미지에
  `filter: grayscale(0.5) brightness(0.42)`, 그 위에
  `linear-gradient(to right, rgba(9,26,22,0.35) 0%, rgba(9,26,22,0.72) 55%, var(--background) 100%)`
  — 우측 끝이 배경색과 같아 사진이 화면으로 녹아든다. 사진은 문항마다 다르다
- **대형 넘버**: 사진 영역 `left:56px; bottom:44px`, Fraunces 120px 300,
  색 `rgba(224,237,232,0.16)`, line-height .9. 그 아래 모노 9px letter-spacing .4em
  `rgba(224,237,232,0.34)` 로 카테고리명
- **상단바** `20px 44px`: 좌 로고 / 우 모노 진행 표시 `1 of 5` + `나가기` 텍스트 버튼.
  전역 내비는 퀴즈·에디터 화면에서 숨긴다
- **본문** `padding: 40px 96px 80px 40%`, `max-width:1180px`,
  `min-height: calc(100vh - 62px)`, 세로 중앙 정렬, gap 46px
  - 카테고리 라벨: 모노 11px letter-spacing **.5em**, 색 `#d9a97e`(웜 샌드 — 다크 위 accent 대신)
  - 질문: Fraunces `clamp(30px,3.6vw,52px)` **300**, line-height 1.28, 색 `#f4f1ea`, max-width 720px
  - **선택 카드 2×2**: `grid 1fr 1fr; gap:14px; max-width:760px`. 각 카드 패딩 `26px 28px`,
    1px border, radius 2px, 배경 `rgba(255,255,255,0.02)`, 좌측 18px 이모지 + 15px/500 라벨.
    hover `border-color: var(--primary); background: rgba(58,172,142,0.07)`.
    선택 시 배경 `rgba(58,172,142,0.10)` + border accent. transition .15s
  - 하단: `← 이전` + **대시 인디케이터** — 5개 3px 바, 현재 문항만 width 26px accent,
    지난 문항 8px primary, 남은 문항 8px `rgba(224,237,232,0.18)`, transition .2s

문항 5개(축 / 카테고리 / 질문 / 선택지 4개와 점수)는 프로토타입 로직의 `QS` 배열이 정본이다.
각 선택지는 0~100 점수를 직접 갖는다(리커트 환산 없음). 실제 앱의 23문항으로 확장할 때는
진행 표시·대시 개수·랜딩 카피(`5문항 · 3분`)를 함께 수정할 것.

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
채점: 선택지가 0~100 점수를 직접 가지며, 그 값이 해당 축 점수가 된다(미응답 축은 50).
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
- Unsplash 이미지: 랜딩 유형 카드 2장 + 퀴즈 문항별 배경 5장. 히어로에는 사진을 쓰지 않는다(목업만). `next.config.ts`의
  `images.domains`에 `images.unsplash.com` 필요. 실제 서비스용 사진으로 교체 권장
- 아이콘·일러스트 없음. 아이소메트릭 룸은 전부 코드 생성 SVG

## Files
- `jib.atlas.dc.html` — 4개 화면 전체 디자인(단일 파일, 브라우저에서 바로 열림)
- 참고: repo의 `design-reference/jib-atlas-design-spec-v2.md`, `app/globals.css`

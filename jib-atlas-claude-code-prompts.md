# jib.atlas — Claude Code 단계별 프롬프트

사용법: 한 번에 하나의 STEP만 Claude Code CLI에 붙여넣으세요.
결과를 확인하고 만족스러우면 다음 STEP으로 넘어가세요.
각 STEP 프롬프트 안에 "이전 단계 결과를 참고해서" 라는 지시가 있는데,
이건 Claude Code가 프로젝트 폴더 안의 이전 산출물(파일)을 스스로 찾아 읽게 하기 위함입니다.

---

## STEP 0. 프로젝트 초기 세팅 (최초 1회만)

```
jib.atlas 프로젝트를 시작한다.

# 프로젝트 개요
사용자가 성격/라이프스타일 진단을 받고, 그 결과에 맞는 집 구조(평면도)를
추천받은 뒤, 2D 에디터에서 직접 가구를 배치하며 인테리어를 커스터마이징하는 웹앱.

# 기술 스택
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- 상태관리: Zustand
- 2D 캔버스: react-konva
- DB: 우선 로컬 JSON/SQLite로 시작 (추후 Supabase 전환 고려)

# 지금 할 일
1. Next.js + TypeScript 프로젝트 초기 세팅 (App Router, Tailwind 포함)
2. 아래 폴더 구조로 뼈대만 잡아줘:
   - /data  (문항, 템플릿 등 JSON 데이터 저장용)
   - /lib   (스코어 계산, 매칭 로직 등 순수 함수)
   - /app/test   (진단 테스트 페이지)
   - /app/result (결과 페이지)
   - /app/editor (인테리어 에디터 페이지)
   - /components
3. 아직 로직은 구현하지 마. 폴더/파일 뼈대와 기본 라우팅, README.md만 작성.
4. README.md에 프로젝트 개요와 폴더 구조 설명을 적어줘.

세팅 끝나면 결과 요약해줘. 다음 단계(문항 데이터 구현)는 별도로 지시할게.
```

---

## STEP 1. 라이프스타일 문항 15개 데이터 구현

```
jib.atlas 프로젝트의 진단 문항 데이터를 구현한다.

# 배경
5개 축(사교성, 미니멀↔맥시멀, 활동성, 개방성, 자연친화)을 측정하는
라이프스타일 문항 15개(축당 3문항)를 만든다. 5점 리커트 척도(1~5)로 응답받는다.
일부 문항은 역채점(reverse scoring) 대상이다.

# 문항 목록

## 사교성
1. 친구나 가족을 집에 자주 초대해서 시간을 보내고 싶다.
2. 주방/거실이 분리되기보다 하나로 이어져서 사람들과 어울리는 공간이면 좋겠다.
3. (역채점) 혼자만의 조용한 공간보다 함께 쓰는 넓은 공용 공간이 더 중요하다.

## 미니멀↔맥시멀 (점수가 높을수록 미니멀)
4. 물건을 최소한으로 두고 깔끔하게 비워진 공간을 선호한다.
5. 수납공간이 넉넉해서 물건을 눈에 안 띄게 정리할 수 있으면 좋겠다.
6. (역채점) 좋아하는 소품이나 가구로 공간을 꾸미고 채우는 걸 즐긴다.

## 활동성
7. 집에서 운동, DIY, 작업 같은 활동적인 취미를 할 공간이 필요하다.
8. (역채점) 집은 쉬고 회복하는 공간이지, 뭔가를 하는 공간은 아니다.
9. 다목적으로 쓸 수 있는 방(홈짐, 작업실 등)이 있으면 좋겠다.

## 개방성
10. 벽으로 나뉜 아늑한 방보다 탁 트인 개방형 구조를 좋아한다.
11. 새로운 스타일이나 독특한 구조의 공간에 끌린다.
12. (역채점) 익숙하고 안정적인 전통적 구조가 더 편안하다.

## 자연친화
13. 넓은 창문과 채광이 인테리어에서 가장 중요한 요소다.
14. 발코니나 테라스에서 시간을 보내는 걸 좋아한다.
15. 실내 식물이나 자연 소재(우드, 스톤 등)로 공간을 채우고 싶다.

# 지금 할 일
1. /data/lifestyle-questions.json 에 위 15문항을 아래 스키마로 저장:
   {
     "id": "q1",
     "axis": "sociability" | "minimalism" | "activity" | "openness" | "nature",
     "text": "문항 내용",
     "reverseScored": true | false
   }
2. 영문 axis 키는 위 매핑대로 고정해줘 (이후 스코어 계산 코드에서 그대로 참조할 거야).
3. TypeScript 타입 정의도 /lib/types.ts 에 추가 (Question, Axis 등).
4. 아직 UI나 계산 로직은 만들지 마. 데이터와 타입만.

완료 후 파일 내용 요약해서 보여줘.
```

---

## STEP 2. MBTI 보조 문항 6~8개 추가 + 가중치 설계

```
jib.atlas 프로젝트에 MBTI 보조 문항을 추가한다.
STEP 1에서 만든 /data/lifestyle-questions.json 구조를 참고해서 이어서 작업해.

# 배경
MBTI 4개 지표(E/I, S/N, T/F, J/P)를 측정하는 보조 문항을 지표당 1~2개씩,
총 6~8문항 만든다. 이 점수는 5축 스코어 계산 시 아래 가중치로 반영된다.

- E/I → 사교성 축에 반영 (가중치 0.3), 라이프스타일 문항이 0.7
- S/N → 개방성 축에 반영 (가중치 0.3): N일수록 개방성 +
- T/F → 미니멀 축에 반영 (가중치 0.3): F일수록 미니멀 점수 -(맥시멀 방향)
- J/P → 미니멀 축에 반영 (가중치 0.2 추가): J일수록 미니멀(정돈) 점수 +

# 지금 할 일
1. MBTI 보조 문항 6~8개를 네가 직접 작성해서
   /data/mbti-questions.json 에 저장. 스키마:
   {
     "id": "m1",
     "indicator": "EI" | "SN" | "TF" | "JP",
     "text": "문항 내용",
     "direction": "E" | "I" 등 (해당 문항이 5점 응답 시 어느 극을 가리키는지)
   }
2. /lib/types.ts 에 MbtiQuestion, MbtiIndicator 타입 추가
3. 아직 계산 로직은 구현하지 마. 문항 데이터만.

완료 후 작성한 문항들과 각각 어떤 지표/방향인지 표로 정리해서 보여줘.
내가 문항 톤이나 내용을 수정 요청할 수도 있어.
```

---

## STEP 3. 스코어 계산 로직 구현

```
jib.atlas 프로젝트의 스코어 계산 로직을 구현한다.
STEP 1, 2에서 만든 /data/lifestyle-questions.json, /data/mbti-questions.json,
/lib/types.ts 를 참고해서 이어서 작업해.

# 계산 규칙
1. 라이프스타일 문항: 축(axis)별로 3문항의 응답(1~5점)을 평균낸 뒤 0~100 스케일로 변환.
   역채점(reverseScored: true) 문항은 (6 - 응답값)으로 뒤집은 후 계산.
2. MBTI 문항: 지표(indicator)별로 응답을 집계해서 E/I, S/N, T/F, J/P 중 우세한 방향과
   그 강도(0~100)를 계산.
3. 최종 5축 스코어:
   - sociability = lifestyle.sociability * 0.7 + mbtiInfluence(EI) * 0.3
   - openness   = lifestyle.openness * 0.7 + mbtiInfluence(SN) * 0.3
   - minimalism = lifestyle.minimalism * 0.7 
                  - mbtiInfluence(TF, F방향일수록 -) * 0.3 
                  + mbtiInfluence(JP, J방향일수록 +) * 0.2
                  (단, 이 공식은 100을 넘거나 0 밑으로 안 내려가게 clamp)
   - activity   = lifestyle.activity (MBTI 영향 없음, 100% 라이프스타일)
   - nature     = lifestyle.nature (MBTI 영향 없음, 100% 라이프스타일)
4. 최종 결과에 MBTI 4글자 타입(E/I, S/N, T/F, J/P 중 우세 조합)도 함께 반환.

# 지금 할 일
1. /lib/scoring.ts 에 calculateScores(answers) 함수 구현
   - 입력: 라이프스타일 15문항 + MBTI 6~8문항에 대한 응답 배열
   - 출력: { axisScores: {sociability, minimalism, activity, openness, nature}, mbtiType: "ENFP" 등 }
2. 순수 함수로 작성 (부작용 없이 입력→출력만). UI는 아직 만들지 마.
3. /lib/scoring.test.ts 에 간단한 테스트 케이스 2~3개 작성해서
   극단적인 응답(전부 5점, 전부 1점)일 때 스코어가 합리적으로 나오는지 확인.
4. 테스트 실행해서 결과 보여줘.

완료 후 테스트 결과와 함께, 이 계산식에 대해 의견 있으면 말해줘
(예: 가중치가 이상하게 작동하는 경우 등).
```

---

## STEP 4. 집 구조 템플릿 10~15개 설계

```
jib.atlas 프로젝트의 집 구조 템플릿 데이터를 만든다.
STEP 3에서 만든 /lib/scoring.ts 의 axisScores 스케일(0~100, 5축)을 기준으로
템플릿을 설계해.

# 요구사항
1. 집 구조 템플릿 10~15개를 만들어줘. 각 템플릿은:
   - 이름 (예: "오픈형 로프트 스튜디오")
   - scoreProfile: 5축 각각 0~100 점수 (이 템플릿이 어떤 성향에 잘 맞는지)
   - rooms: 방 구성 정보 (type, size(S/M/L), 대략적 position) — 나중에 평면도
     렌더링에 쓸 거니까 SVG 좌표계 기준으로 대략적인 배치도 포함해줘
   - features: [{ text: "특징 설명", linkedTrait: "sociability" 등 }] 형태로,
     각 특징이 어떤 축과 연결되는지 태깅
2. 템플릿들이 5축 공간을 골고루 커버하도록 설계해줘
   (전부 비슷한 프로필이면 매칭이 무의미해짐 — 예를 들어 사교성/개방성 높은 것,
   낮은 것, 미니멀 극단, 맥시멀 극단, 자연친화 높은 것 등 다양하게).
3. /data/house-templates.json 에 저장.
4. /lib/types.ts 에 HouseTemplate, Room, Feature 타입 추가.

# 지금 할 일은 데이터 설계까지만. 매칭 로직과 렌더링은 다음 단계에서 할 거야.

완료 후 템플릿 10~15개를 이름 + scoreProfile 요약 표로 보여줘.
프로필이 너무 겹치는 게 있으면 네가 먼저 지적해줘.
```

---

## STEP 5. 매칭 알고리즘 구현

```
jib.atlas 프로젝트의 매칭 알고리즘을 구현한다.
STEP 3의 axisScores 출력과 STEP 4의 house-templates.json 을 참고해서 이어서 작업해.

# 요구사항
1. /lib/matching.ts 에 matchHouseTemplate(userAxisScores) 함수 구현
2. 방식: 유저의 5축 스코어와 각 템플릿의 scoreProfile 간 코사인 유사도를 계산해서
   유사도가 가장 높은 템플릿을 1순위로, 상위 3개를 추천 목록으로 반환
3. 반환값에 각 템플릿의 유사도 점수(%)도 포함
4. 순수 함수로 작성. 부작용 없이 입력→출력만.
5. /lib/matching.test.ts 에 테스트 케이스 작성:
   - 특정 축이 극단적으로 높은 가상의 유저 스코어를 넣었을 때
     해당 축이 높은 템플릿이 실제로 1순위로 나오는지 확인

완료 후 테스트 결과 보여주고, 코사인 유사도 대신 다른 방식(유클리드 거리 등)이
더 나을지 네 의견도 들려줘.
```

---

## STEP 6. 결과 설명 자동 조립 로직

```
jib.atlas 프로젝트의 결과 설명(왜 이 구조가 어울리는지) 자동 조립 로직을 구현한다.
STEP 3~5의 산출물을 참고해서 이어서 작업해.

# 요구사항
1. /lib/explain.ts 에 generateExplanation(userAxisScores, matchedTemplate) 함수 구현
2. 로직:
   - 유저 스코어에서 가장 높은 2~3개 축을 뽑는다
   - 매칭된 템플릿의 features 중 해당 축(linkedTrait)과 연결된 feature들을 골라낸다
   - 아래 포맷으로 문장을 조립해서 반환:
     "당신은 [상위축1 설명]하고 [상위축2 설명]한 타입이에요.
      그래서 [템플릿 이름]이 어울려요.
      - [feature1]
      - [feature2] ..."
3. 각 축(sociability, minimalism, activity, openness, nature)마다
   점수 구간별(예: 70점 이상/30점 이하) 사람이 읽기 자연스러운 설명 문구 매핑 테이블도
   /data/trait-descriptions.json 에 만들어줘.
4. UI는 아직 안 만들어도 돼. 콘솔에서 샘플 유저 스코어 넣고
   실제로 어떤 문장이 나오는지 확인할 수 있는 간단한 스크립트도 하나 만들어줘.

완료 후 샘플 실행 결과(실제 조립된 문장 2~3개 예시)를 보여줘.
```

---

## STEP 7. UI 연결 (테스트 페이지 → 결과 페이지)

```
jib.atlas 프로젝트의 UI를 STEP 1~6에서 만든 로직과 연결한다.

# 요구사항
1. /app/test 페이지: /data/lifestyle-questions.json + mbti-questions.json 의
   문항을 순서대로 보여주는 5점 리커트 폼. Zustand로 응답 상태 관리.
   마지막 문항 응답 후 결과 페이지로 이동.
2. /app/result 페이지: STEP 3(scoring) → STEP 5(matching) → STEP 6(explain)
   순서로 계산한 결과를 보여줌:
   - 매칭된 집 구조 이름과 이미지(임시 placeholder)
   - 5축 스코어를 레이더 차트로 시각화 (recharts 사용)
   - generateExplanation 결과 텍스트
   - 상위 3개 후보 템플릿 리스트 (유사도 % 포함)
3. 모바일 반응형으로. Tailwind 사용.
4. 아직 인테리어 에디터(STEP 8 예정)는 연결하지 마.

완료 후 로컬에서 실행해서 스크린샷 찍어 보여주고, 실제 문항→결과 흐름이
끊김 없이 동작하는지 확인해줘.
```

---

## STEP 8 이후 (참고용, 나중에 별도로 구체화)

- 2D 인테리어 에디터 (react-konva 드래그앤드롭 가구 배치)
- 배치 결과 저장/불러오기 (로컬 스토리지 → DB 전환)
- 유저 계정/로그인
- 템플릿 SVG 평면도 실제 렌더링 고도화

---

## STEP 9. 집 아틀라스 — 실제 내 집 사진 공유 갤러리

진단 결과가 아니라 **진짜 내가 사는 집 사진**을 올려 다른 유저와 공유하는
공개 갤러리. 사이트 이름(atlas)에 맞춰 "여러 집을 모아 만든 지도"라는
톤으로 잡았다 — 라우트도 `/atlas`, 게시물은 "지도 위 한 페이지"로 부른다.

# 요구사항
1. `supabase/migrations/0002_house_atlas.sql`: `house_posts`(제목·소개·작성
   시점 진단 스냅샷·좋아요/댓글 캐시 카운트) / `house_photos` / `house_likes` /
   `house_comments` 4개 테이블 + RLS(읽기는 공개, 쓰기는 본인만) + 좋아요·댓글
   카운트를 자동 반영하는 트리거 + `house-photos` 공개 Storage 버킷과 그
   RLS(첫 폴더 세그먼트 = 본인 uid).
2. `lib/houseAtlas.ts`: 업로드 전 브라우저 `<canvas>`로 사진을 다시 인코딩해
   EXIF(GPS 등 촬영 정보)를 제거하고 리사이즈하는 `stripExifAndResize()`.
   Cloudflare Workers 런타임엔 sharp 같은 서버 이미지 처리가 없어서
   (`next.config.ts`의 `images.unoptimized` 참고) 클라이언트에서 처리한다.
3. `/atlas`: 갤러리 그리드(서버 컴포넌트, 로그인 무관 공개 read).
4. `/atlas/[id]`: 상세 — 사진, 제목/소개, 작성 시점 유형·페르소나·희귀도
   배지(선택), 좋아요·댓글은 `components/atlas/AtlasPostActions.tsx`
   클라이언트 컴포넌트로 분리.
5. `/atlas/new`: 등록 폼(로그인 게이트는 `/editor` 패턴과 동일). 사진 최대
   6장, 진단을 마친 유저는 `lib/persona.ts`의 페르소나·희귀도가 게시물에
   스냅샷으로 함께 저장됨(재진단해도 게시물 배지는 등록 당시 값 유지).
6. `FloatingNav`에 "집 지도" 링크 추가.

완료 후 `supabase/migrations/0002_house_atlas.sql`을 Supabase 대시보드
SQL Editor에서 직접 실행해야 실제로 동작한다(0001과 동일 — 마이그레이션은
자동 적용되지 않음).

---

## STEP 10. 아틀라스 콜드스타트 해결

STEP 9로 만든 갤러리는 "실사진을 올려야만" 채워지는데, 그건 오늘의집 같은
기존 서비스 대비 보상이 불명확한 요구라 갤러리가 계속 비어있기 쉽다.
업로드 마찰이 0에 가까운 콘텐츠(이미 만들어져 있는 에디터 배치)를 기본
콘텐츠로 채우고, 아틀라스를 "등록보다 구경이 먼저"인 경험으로 바꿨다.

# 요구사항
1. `supabase/migrations/0004_house_atlas_room_posts.sql`: `house_posts`에
   `room_items jsonb` 컬럼 추가. 채워져 있으면 실사진 대신 그 가구 배치를
   아이소메트릭 SVG로 렌더링하는 "방 미리보기" 게시물.
2. `components/atlas/RoomIsoCard.tsx`: `lib/iso.ts`(ShareCard.tsx와 같은
   좌표계)로 가구 배치를 SVG로 그리는 순수 컴포넌트. 서버 컴포넌트에서도
   그대로 쓸 수 있다.
3. `/editor`에 "지도에 공유하기" 버튼 — 로그인 유저가 클릭 한 번으로 지금
   배치를 그대로 house_posts에 올린다(제목·유형·페르소나·희귀도는 자동
   계산, 사진 업로드도 폼도 없음).
4. `/atlas`: 게시물이 실사진이든 방 미리보기든 같은 갤러리에 섞여 나옴.
   `?template=t3` 쿼리로 유형별 필터 칩 추가(실제 게시물이 있는 유형만
   노출) — 등록 CTA보다 탐색이 먼저 보이는 배치로 바꿈.
5. `/atlas/[id]`: room_items가 있으면 사진 그리드 대신 큰 아이소메트릭
   프리뷰를 보여줌.

완료 후 `supabase/migrations/0004_house_atlas_room_posts.sql`을 Supabase
대시보드 SQL Editor에서 직접 실행해야 한다. 실행 후 본인 계정으로
`/editor` → "지도에 공유하기"를 한 번 눌러서 갤러리를 안 비어보이게
시드해두는 걸 추천.

---

## STEP 11. 다국어 — 영문(/en) 진단·결과·공유 카드

중국어·일본어·영어 다국어 요청 중 영어를 먼저 완역했다. 문항 23개, 집
유형 22개(이름+features), 축 설명, 페르소나 이름 생성기까지 전부 한국어
문법(조사·어미 활용)에 묶여 있어서 UI 문구만 바꾸는 수준이 아니라
데이터·로직 양쪽을 손대야 했다. 일본어·중국어, 그리고 에디터·아틀라스·
로그인 페이지 번역은 이 STEP 밖 — 별도 STEP으로 이어간다.

# 한 일
1. 데이터: `data/*.en.json`(lifestyle-questions, mbti-questions,
   house-templates, trait-descriptions) — id·axis·scoreProfile 등
   구조는 한국어판과 동일하게 두고 표시 텍스트만 번역. 채점(calculateScores)
   은 id 기반이라 언어 무관 — 수정 없이 그대로 재사용.
2. `lib/matching.ts`: `matchHouseTemplate`이 templates를 선택 인자로
   받게 확장(기본값 한국어) — 영문 템플릿을 넘겨도 매칭 알고리즘·결과
   순위는 완전히 동일, 표시 텍스트만 바뀐다.
3. `lib/persona.ts`: `generatePersonaEn` / `getRarityTierEn` 추가(기존
   한국어 함수·타입은 그대로 — house_posts.rarity_tier 등 이미 저장된
   한국어 값과 안 섞이게).
4. `lib/explainEn.ts`: 한국어판(`lib/explain.ts`)은 조사(이/가)·어미
   (-는→-고) 변환이 필요한 한국어 전용 문법이라 재사용 불가 — 콤마+and로
   접속하는 영어 문장 조립을 새로 짰다.
5. `lib/types.ts`: `AXIS_LABELS_EN`, `ROOM_TYPE_LABELS_EN` 추가.
6. `components/landing/FloatingNav.tsx`: `locale` prop(ko/en)으로 라벨·
   경로·언어 전환 링크(EN ↔ 한국어) 스위칭.
7. `app/en/{page,test,result,share}.tsx` + `app/en/layout.tsx`
   (`<html lang>` 전환용 `SetHtmlLang`). 랜딩은 한국어판의 5개 스크롤텔링
   섹션을 그대로 옮기지 않고 히어로+3단계 설명으로 축약(프로즈가 너무
   길어서 이번 STEP엔 제외 — STEP 12 이후 과제). 진단→결과→공유 루프는
   완역.
8. (곁다리로 발견) `components/FloorPlan.tsx`가 v3 팔레트 시절 색 토큰
   (teal·coral·surface·border·foreground)을 그대로 참조하고 있어서 방
   배경·테두리 색이 하나도 안 먹고 있었다 — v4 올리브+세이지 토큰으로
   고치면서 `roomLabels` 인자도 추가.

Playwright로 `/en` → `/en/test`(23문항 전부 답변) → `/en/result` →
`/en/share`까지 실제로 클릭해 스크린샷/콘솔 에러 확인(에러 0개). 한국어와
같은 답변으로 같은 템플릿(t18)이 나오는 것도 확인 — 매칭 로직이 언어와
무관하게 동일하게 동작함을 검증.

npx tsc --noEmit / npx vitest run(11 passed) / eslint 통과.

---

## STEP 11-A. 협업 문의를 사이트 안 인라인 폼으로

"협업 문의" 클릭이 mailto: → 클립보드 복사로 이어졌는데, "사이트에서 바로
문의할 수 있게" 해달라는 요청으로 아예 인라인 폼(모달)으로 바꿨다.

- `supabase/migrations/0005_collab_inquiries.sql`: `collab_inquiries`
  테이블 — 로그인 없이 누구나 insert만 가능(읽기는 대시보드 서비스
  role에서만). 대시보드에서 직접 실행 필요.
- `app/actions/collabInquiry.ts`: 서버 액션. 허니팟 필드로 기본적인 봇
  방지.
- `components/landing/CollabInquiryModal.tsx`: 이름/이메일/문의 내용
  폼. 그래도 메일이 편한 사람을 위해 mailto: + 클립보드 복사 보조 옵션도
  하단에 남겨둠. `FloatingNav`(ko/en 둘 다)에서 연다.

Playwright로 모달 열기 → 폼 작성 → 제출(테이블 없으면 에러 문구 정상
표시) → X 버튼/Escape 닫기까지 확인. 처음 구현에서 모달이
`FloatingNav`의 `pointer-events-none` 컨테이너 안에 있어서 클릭이 전부
씹히는 버그가 있었는데(자식에 `pointer-events-auto`를 안 줌), 실제로
Playwright 클릭 테스트를 해보면서 잡았다.

---

## STEP 11-B. 집 유형·캐릭터 이름을 쉬운 말로 + 유형 8개 추가

"코업 셰어하우스"·"오픈마인드 시티러버" 같은 이름이 처음 온 사람에게는
무슨 소리인지 모르겠다는 피드백(친구 테스트). 실제로 안 쓰는 영단어
조어를 걷어내고, 캐릭터 이름 아래 설명 한 줄과 방 태그 위에 캡션을
붙였다. 집 유형도 22개 → 30개로 늘렸다.

# 한 일
1. `data/house-templates.json`의 `name` 22개 전부 재작성 — "코업
   셰어하우스" → "친구와 함께 사는 셰어하우스", "제로웨이스트 에코
   하우스" → "친환경을 실천하는 집" 등. id·scoreProfile·rooms·features는
   그대로 둬서(정규식으로 name 필드만 치환) 매칭 결과는 안 바뀌고 표시
   이름만 바뀐다.
2. `lib/persona.ts`의 IDENTITY/MODIFIER 테이블 재작성 — "오픈마인드
   시티러버" 같은 조어 대신 실제 쓰이는 말(인싸/아싸, 미니멀리스트/
   맥시멀리스트)이나 "-파" 계열 순우리말 조합(활동파/모험파 등)으로.
   `Persona.description` 필드를 추가해 trait-descriptions.json의 1순위
   축 설명을 한 줄로 붙여줬다 — "왜 이 이름인지" 근거를 보여준다.
3. `app/result/page.tsx` / `app/en/result/page.tsx`: 캐릭터 이름 밑에
   `persona.description` 표시, 방 태그 위에 "이 집에 있는 공간" 캡션
   추가.
4. `data/house-templates.json`에 t23~t30 8개 신규 템플릿 추가(30개) —
   기존 22개의 scoreProfile 공백을 메우는 조합으로 설계(파티 하우스,
   명상하는 조용한 집, 홈트레이닝 벙커, 맥시멀 로프트, 대가족 시골집,
   1인 미니멀 트레이닝 룸, 심플 홈다이닝, 온실집). room 좌표는 기존
   검증된 템플릿(t1/t5/t6/t7/t9/t13/t18)의 레이아웃을 재사용해 겹침
   위험을 없앴다. `data/house-templates.en.json`에도 동일 id·
   scoreProfile·rooms로 영문 번역 추가(언어 무관 매칭 보장 유지).
5. `TEMPLATE_COUNT`를 하드코딩(22)하던 곳(ShareCard.tsx, Hero.tsx,
   app/en/page.tsx)을 전부 `houseTemplatesData.length` 기반으로 바꿔서,
   앞으로 템플릿이 더 늘어도 숫자를 따로 안 맞춰도 된다.
6. `lib/matching.test.ts` / `lib/explain.test.ts`가 이름 바뀐 템플릿을
   문자열로 참조하고 있어서 새 이름으로 갱신.

검증: 30개 템플릿 전부 자기 자신의 scoreProfile을 넣으면 자기 자신이
1순위(100%)로 나오는지 스크립트로 확인(신규 템플릿이 기존 템플릿과
헷갈리지 않는지). Playwright로 실제 결과 페이지 스크린샷 확인 — 캐릭터
설명·방 캡션이 자연스럽게 보임. npx tsc --noEmit / npx vitest
run(11 passed) / eslint 통과.

---

## STEP 12. 룸 에디터 3D 전환 — three.js 실시간 렌더링

"3D로 만들어야 사람들이 정말 사용할 거 같다"는 요청으로, SVG
아이소메트릭 캔버스(EditorCanvas)를 react-three-fiber 기반 실제 3D
씬(EditorScene3D)으로 교체했다.

# 한 일
1. 의존성 추가: `three`, `@react-three/fiber`, `@react-three/drei`.
2. `lib/editor3d.ts`: `lib/iso.ts`와 같은 격자(RW×RD, 벽높이 WH)를
   공유하는 미터 단위 3D 좌표계(TILE_M=0.7, HEIGHT_SCALE=0.023 — 눈대중
   으로 실제 가구 비례에 맞춘 배율, cm 실측값은 아님).
3. `components/EditorScene3D.tsx`: 바닥 타일(RW×RD개, 클릭 배치는
   그대로), 벽 2면, 각도 제한된 궤도 카메라, 방향광+포인트광+그림자,
   가구에 마우스를 올리면 뜨는 이름 라벨(콜아웃 스타일). 상태는 기존
   `lib/editorStore.ts`(items/selectedDefId/placeAt/removeItem/canPlace)
   그대로 재사용 — 저장·팔레트·공유 로직은 변경 없음.
4. `lib/types.ts`의 `IsoFurnitureDef`에 실제 제품 연동용 선택 필드
   (`brand`/`productName`/`priceKrw`/`purchaseUrl`/`modelUrl`) 추가 —
   지금은 비어 있고 자리만 마련.
5. 기존 SVG(`EditorCanvas.tsx`, `lib/iso.ts`)는 랜딩 히어로 미니 창·공유
   카드·아틀라스 카드가 계속 쓰므로 그대로 둠 — 두 좌표계가 서로 안
   건드리며 공존.

로컬에서 Playwright로 스크린샷 + 클릭 시뮬레이션 확인: 가구를 선택하면
배치 가능한 타일이 초록으로 밝아지는 것, 빈 타일 클릭 시 배치, 놓인
가구 클릭 시 제거까지 전부 동작 확인(콘솔 에러 0개 — 401 하나는 로그인
안 한 상태에서 저장을 시도한 것뿐이라 정상 동작). `npm run build` /
`npm run pages:build`(Cloudflare Workers) 둘 다 통과.

가구는 아직 색깔 박스 형태고, 어떤 집 유형이든 방 구조가 똑같다 — 이
두 가지가 STEP 13, 14로 이어진다.

---

## STEP 13. 하우스 타입마다 다른 3D 방 구조

```
jib.atlas 프로젝트의 룸 에디터(components/EditorScene3D.tsx, STEP 12에서
three.js로 전환됨)를 확장한다. 지금은 어떤 집 유형(House Type)으로
매칭되든 똑같은 고정 사각형 방(RW=10×RD=8, lib/editor3d.ts)만 나온다 —
진단 결과가 방 구조에 전혀 반영이 안 돼서, 사용자 입장에선 "내가 진단한
의미"가 없다.

# 배경 — 이미 있는 데이터
data/house-templates.json의 각 HouseTemplate은 이미 `rooms` 필드에 방
구성(type: livingRoom/kitchen/bedroom/bathroom 등, size: S/M/L,
position: {x,y,width,height} — 400×300 좌표계)을 갖고 있다. 지금은
components/FloorPlan.tsx(/result 페이지의 2D 평면도 미리보기)만 이
데이터를 쓰고, 룸 에디터(EditorScene3D)는 완전히 무시하고 있다.

# 요구사항
1. HouseTemplate.rooms → 3D 방 형태로 바꾸는 변환 로직을 만들어줘
   (lib/editor3d.ts 확장 또는 새 파일). 400×300 좌표계를 미터 단위로
   스케일하고, 각 room을 독립된 공간(바닥+벽 4면)으로 만들되 방과 방
   사이엔 개구부를 하나씩 둬서(완전히 막히면 안으로 들어가서 볼 수가
   없다) 서로 이어지게 해줘.
2. components/EditorScene3D.tsx가 지금의 고정 RW×RD 대신, 매칭된
   템플릿(app/editor/page.tsx의 topMatch.template)의 rooms 레이아웃을
   props로 받아서 그 모양대로 렌더링하게 바꿔줘.
3. 가구 배치(팔레트 클릭 → 타일 클릭)를 room 타입과 연결해줘 — 예를
   들어 침대는 bedroom 타입 방 안에서만, 소파는 livingRoom 안에서만
   놓을 수 있게. lib/editorStore.ts의 canPlace를 확장하되, 기존
   시그니처를 쓰는 다른 곳이 있다면 안 깨지는지 확인해줘.
4. lib/editorStore.ts의 DEFAULT_PLACED_DEFS(하드코딩된 col/row 6개)는
   템플릿마다 room 배치가 다르니 고정값으로 못 쓴다 — 템플릿의 rooms를
   보고 각 방 타입에 맞는 기본 가구를 자동으로 하나씩 배치하는 함수로
   바꿔줘(예: livingRoom엔 소파+테이블, bedroom엔 침대, kitchen엔
   카운터).
5. 카메라(OrbitControls target/거리)도 방 전체 크기가 템플릿마다
   달라지니 방 바운딩 박스 기준으로 자동으로 맞춰줘(RW/RD 상수를 그대로
   하드코딩해서 쓰지 말 것).

# 하지 말 것
- data/house-templates.json의 rooms 좌표 자체는 바꾸지 마 — /result의
  2D 평면도(FloorPlan.tsx)가 같은 데이터를 쓰고 있어서 좌표를 바꾸면
  거기 레이아웃도 깨진다.
- 지금 저장 스키마(PlacedFurniture: id/defId/col/row, Supabase의 저장된
  배치)는 최대한 유지하고 싶다 — col/row의 "기준"이 방마다 달라져도
  괜찮은지, 아니면 필드를 늘려야 하는지(예: roomIndex 추가) 먼저 네
  판단을 보여줘.

작업 시작 전에: 30개 템플릿의 rooms를 실제로 훑어보고, 이 접근이 안
맞는 엣지 케이스(방이 너무 작아서 가구가 하나도 안 들어가는 등)가
있는지 먼저 보고해줘. 그리고 나서 구현해.
```

---

## STEP 14. 가구를 박스 대신 실제 가구처럼

```
jib.atlas 룸 에디터(components/EditorScene3D.tsx)의 가구가 지금은 단색
직육면체(box) 하나로만 그려진다. 로그인한 유저가 "내 방 같다"고 느끼게
실제 가구 형태로 바꾼다.

# 방식 — 외부 3D 모델 파일을 새로 붙이지 말고, 코드로 만드는 프로시저럴
지오메트리로 간다. 이유: 실제 브랜드 제품의 공식 3D 모델은 라이선스
없이 못 쓰고, 이름 모를 CC0 에셋을 갖다 붙이면 지금 올리브·세이지 톤
스타일과 안 맞을 수 있다. 나중에 실제 브랜드 제휴나 AI 생성 3D 모델이
생기면 IsoFurnitureDef.modelUrl(STEP 12에서 마련해둔 필드)에 그 GLTF를
넣어서 이 프로시저럴 형태를 대체하면 된다.

# 요구사항
data/furniture-catalog.json의 9개 가구 각각을, box 하나가 아니라 여러
개의 primitive(박스/실린더)를 조합해서 다시 만들어줘:
- sofa: 좌석 박스 + 등받이 박스 + 팔걸이 2개 + 다리 4개
- lounge: sofa보다 작은 버전 + 팔걸이
- ctable(다이닝 테이블): 상판 얇은 박스 + 다리 4개(원기둥)
- counter/bar: 상판 + 몸체(수납장처럼 아래쪽에 선반 분할선)
- desk: 상판 + 다리 4개
- wardrobe: 몸체 + 문 분할선(가운데 세로 선) + 손잡이(작은 원기둥)
- plant: 화분(원뿔대) + 잎(구 여러 개 겹쳐서 뭉치 느낌)
- bed: 매트리스(둥근 모서리 박스) + 헤드보드 + 다리

각 조각은 components/EditorScene3D.tsx 안에 가구 종류별 함수
컴포넌트로 분리해줘(SofaMesh, BedMesh 등). def.top/left/right 색은
지금처럼 재질 색으로 재사용하되, 부위별로(다리는 더 어둡게 등) 살짝
명암을 줘도 좋다.

# 하지 말 것
- 외부 GLTF/GLB 파일을 새로 추가하지 마(라이선스·번들 크기 문제).
- lib/editorStore.ts의 충돌 판정(canPlace, w/d 기준)은 그대로 — 시각적
  디테일만 늘리는 거지 배치 격자 크기는 안 바뀐다.
- STEP 12에서 확인한 인터랙션(선택→배치, 클릭 제거, 하이라이트)이
  깨지면 안 된다 — 끝나고 다시 한번 확인해줘.

완료 후 각 가구가 실루엣만으로 뭔지 알아볼 수 있는지(소파 vs 침대 등)
스크린샷으로 보여줘.
```

---

## 사용 팁

- 각 STEP은 독립적으로 실행 가능하지만 **순서를 지켜야** 이전 산출물을 참조합니다.
- Claude Code가 중간에 다른 방향을 제안하면(예: "코사인 유사도 대신 이게 낫습니다")
  일단 들어보고 판단하세요. 특히 STEP 4(템플릿 설계)는 실제 나온 결과를 보고
  프로필이 안 겹치는지 직접 검토하는 게 중요합니다.
- 매 STEP 끝나고 `git commit` 해두면 나중에 특정 단계로 되돌리기 편합니다.
  STEP 0에서 git 초기화도 같이 시켜도 좋아요.

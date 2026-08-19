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

## 사용 팁

- 각 STEP은 독립적으로 실행 가능하지만 **순서를 지켜야** 이전 산출물을 참조합니다.
- Claude Code가 중간에 다른 방향을 제안하면(예: "코사인 유사도 대신 이게 낫습니다")
  일단 들어보고 판단하세요. 특히 STEP 4(템플릿 설계)는 실제 나온 결과를 보고
  프로필이 안 겹치는지 직접 검토하는 게 중요합니다.
- 매 STEP 끝나고 `git commit` 해두면 나중에 특정 단계로 되돌리기 편합니다.
  STEP 0에서 git 초기화도 같이 시켜도 좋아요.

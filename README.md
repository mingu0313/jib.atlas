# jib.atlas

사용자가 성격/라이프스타일 진단을 받고, 그 결과에 맞는 집 구조(평면도)를
추천받은 뒤, 2D 에디터에서 직접 가구를 배치하며 인테리어를 커스터마이징하는 웹앱.

## 기술 스택

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **상태관리**: Zustand (예정)
- **2D 캔버스**: react-konva (예정)
- **DB**: 우선 로컬 JSON/SQLite로 시작 (추후 Supabase 전환 고려)

## 폴더 구조

```
/data     문항, 템플릿 등 JSON 데이터 저장용
/lib      스코어 계산, 매칭 로직 등 순수 함수
/app
  /test     진단 테스트 페이지
  /result   결과 페이지
  /editor   인테리어 에디터 페이지
/components  공용 UI 컴포넌트
```

## 개발 로드맵

`jib-atlas-claude-code-prompts.md`에 STEP 0~7(+참고용 STEP 8 이후) 단계별
구현 계획이 정리되어 있습니다. 각 STEP은 이전 STEP의 산출물(데이터/타입/로직)을
참고해서 순서대로 진행합니다.

- [x] STEP 0. 프로젝트 초기 세팅
- [x] STEP 1. 라이프스타일 문항 15개 데이터
- [x] STEP 2. MBTI 보조 문항 + 가중치 설계
- [x] STEP 3. 스코어 계산 로직
- [x] STEP 4. 집 구조 템플릿 설계 (22개)
- [x] STEP 5. 매칭 알고리즘
- [x] STEP 6. 결과 설명 자동 조립
- [x] STEP 7. UI 연결 (테스트 → 결과)
- [x] STEP 8. 2D 인테리어 에디터 + 로그인 + DB 저장
- [x] STEP 8 이후: 평면도 렌더링 고도화, 집 구조 템플릿 22개로 확장

## 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

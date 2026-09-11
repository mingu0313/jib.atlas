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
- [x] STEP 9. 집 아틀라스 — 실제 내 집 사진 업로드 + 공개 갤러리 + 좋아요/댓글
- [x] STEP 10. 아틀라스 콜드스타트 해결 — 에디터 방 미리보기 + 유형별 탐색
- [x] STEP 11. 다국어(영문) — `/en` 진단·결과·공유 카드 전체 번역 (일본어·중국어는 이후 별도 STEP 예정)
- [x] STEP 11-A. 협업 문의 인라인 폼(모달)으로 전환
- [x] STEP 11-B. 집 유형·캐릭터 이름을 쉬운 말로 재작성 + 집 유형 22→30개
- [x] STEP 12. 룸 에디터 3D 전환 — SVG 아이소메트릭 → three.js 실시간 렌더링
- [x] STEP 13. 하우스 타입마다 다른 3D 방 구조 — HouseTemplate.rooms를 그대로 3D에 반영
- [x] STEP 14. 가구를 박스 대신 실제 가구 형태로 — 프로시저럴 지오메트리(다리·등받이·팔걸이 등)
- [x] STEP 15. Kenney Furniture Kit(CC0) GLTF 가구 38종 통합 — 카테고리 탭 팔레트, 씬 라이트 그레이지+코퍼 리컬러
- [x] STEP 16. 다국어(영문) 확장 — `/en/studio`(3D 룸빌더), `/en/result/interiors`(AI 인테리어 추천) 번역 (집 아틀라스·로그인은 계속 한국어만)
- [x] STEP 17. 다국어(영문) 확장 마무리 — `/en/atlas`(집 아틀라스 갤러리·상세·등록), `/en/login`, `/en/reset-password` 번역. 이제 전 기능이 `/en`에서도 동작한다(게시물 본문 등 유저가 직접 쓴 콘텐츠는 원문 언어 그대로).
- [x] STEP 18. `/en` 랜딩 풀스크롤 번역 — STEP 11 때 축약했던 다섯 축·집 유형 4칸·에디터 프리뷰·인용·CTA 섹션을 한국어 랜딩과 동일하게 채워 넣었다(components/landing/* 각 섹션에 locale prop 추가, 로직·사진은 공유).

## 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

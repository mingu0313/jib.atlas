# 디자인 참고자료 — Kyiv LuxeBouquets

Figma 디자인을 코드로 export한 React 컴포넌트 세트. **jib.atlas 실제 앱 코드가 아니라
디자인(레이아웃/타이포/스페이싱 패턴) 참고용**으로만 보관한다. 원본 도메인은 꽃집
쇼핑몰이라 텍스트/이미지/기능은 무관하고, 아래 같은 구조적 요소를 참고하려고 남겨둠:

- 섹션 간 여백/그리드 비율 (`padding: 80px`, 2단 그리드 등)
- 타이포 스케일 (`section-title` 50px/38px, 본문 16px 등)
- 컴포넌트 단위 분리 방식 (Navbar/Hero/About/Benefits/Contact/Service/Reviews/Footer)

## 구조
```
App.jsx                        # 루트 — 섹션 조립 순서
styles/global.css              # 리셋 + 전역 유틸 클래스 (.section-title, .btn-primary 등)
components/
  Navbar.jsx / .module.css
  Hero.jsx / .module.css
  AboutSection.jsx / .module.css
  BenefitsSection.jsx / .module.css
  ContactSection.jsx / .module.css
  ServiceSection.jsx / .module.css
  ReviewsSection.jsx / .module.css
  Footer.jsx / .module.css
```

원래 `app/result/code (1~18).txt`, `app/result/code.txt`로 흩어져 저장돼있던 걸
(브라우저가 같은 파일명을 반복 다운로드하며 붙인 번호) 여기로 정리했다. 실제 Next.js
App Router 라우트 폴더(`app/`) 안에 있으면 안 되는 파일들이라 리포 루트로 뺐다.

색상 팔레트(`#121212`/`#fff` 흑백톤)는 이 참고자료 원본 그대로이고, jib.atlas
자체 디자인 시스템(웜톤 teal+coral, `app/globals.css`)과는 다르니 색은 그대로 가져오지
말고 레이아웃/구조만 참고할 것.

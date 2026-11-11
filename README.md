# THE BOMM BEAUTY RE:CORRECTION

정적 사이트 (빌드 과정 없음).

## Cloudflare Pages + GitHub 배포
1. 이 폴더 전체를 GitHub 저장소 루트에 올립니다.
2. Cloudflare 대시보드 → Workers & Pages → Create → Pages → Connect to Git → 저장소 선택.
3. Framework preset: None / Build command: (비움) / Build output directory: `/`
4. 프로젝트 이름: `thebommbeautyrecorrecton` → 주소 https://thebommbeautyrecorrecton.pages.dev
5. 커스텀 도메인을 연결하면 index.html, robots.txt, sitemap.xml, rss.xml 안의 `https://thebommbeautyrecorrecton.pages.dev` 를 새 주소로 일괄 변경하세요.

## 구성
- index.html — 사이트 본문
- support.js, image-slot.js — 런타임
- assets/ — 로고
- images/portfolio/ — 포트폴리오 사진 60장
- robots.txt, sitemap.xml, rss.xml, _headers

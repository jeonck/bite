# 매일 영어 한마디 (bite)

회원가입 없이 매일 비즈니스 영어 표현 3개만 보여주는 저관여 학습 유틸.
기획서: [prd.md](./prd.md)

## 구조
- `index.html` — 화면 전체 (단일 페이지)
- `words.js` — 표현 후보 사전 (id는 절대 재사용/변경 금지)
- `logic.js` — 순수 로직 (단어 선정, 약점 점수, 복습 큐, streak). DOM 의존 없음.
- `app.js` — UI 연결
- `test_logic.js` — 로직 자가 점검: `node test_logic.js`

## 로컬 실행
```bash
python3 -m http.server 8934
```
`localStorage`는 `file://`에서 제대로 동작하지 않으므로 반드시 http 서버로 열 것.

## 배포
GitHub Pages, 커스텀 도메인 `bite.metacog.co.kr` (`CNAME` 파일).
Settings → Pages → Branch: `main` / `root` 로 설정.

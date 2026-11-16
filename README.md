# 초등 국어·도덕 문제 풀이 (React + Vite)

    npm install
    npm run dev      # 개발 서버
    npm run build    # 배포용 빌드 (dist/)

## 폴더 구조
- `src/App.jsx` : 상태와 흐름만 담당
- `src/components/` : 화면 컴포넌트 (AppBar, SideMenu, TabBar, LearnPage, UnitCarousel, NotesPage, RecordsPage, WeekPage, HanjaPage, SciencePage, QuizScreen, ResultScreen, NoticeModal)
- `src/lib/` : 퀴즈 로직(quiz.js), 저장소(storage.js), 날짜(date.js)
- `src/data/` : 하루한자(hanja.js), 과학상식(science.js) — 날짜 기준으로 매일 하나씩 바뀜
- `src/bank/` : 문제 은행. 과목-학년 파일(kor-1.js ~ mor-6.js)과 index.js, 작성 도우미 helpers.js
- `src/curriculum.js` : 목차 기준 단원 목록

## 문제 추가
해당 `src/bank/과목-학년.js`의 `과목-학년-학기-단원번호` 키에 문제를 추가하세요.

## 하루한자 · 써보기 획순 데이터
- `src/data/hanja.js` : 8급·7급 배정한자 (급수·훈음은 공식 배정한자표와 대조해 확인하세요)
- 써보기 화면은 반투명 글자 위에 획순(번호·화살표)을 보여 주고, 그 위에 손으로 따라 쓰게 해요.
- 획순 데이터 우선순위: ① `public/hanzi/{유니코드}.json` → ② `src/data/strokes.js`(내장 24자) → ③ 반투명 글자만
- 전체 글자의 정식 획순을 쓰려면:

      npm i -D hanzi-writer-data
      node scripts/copy-hanzi.mjs

  데이터는 Make Me a Hanzi 기반(Arphic Public License)이에요. `敎`, `靑`처럼 한국식 자형은 빠질 수 있고, 빠진 글자는 ②·③으로 대신 보여줘요.

## 영어 · 교과서(판)별 데이터 구조
- `src/curriculum.eng.js` : 출판사(`BOOKS`)와 학년별 교과서 판(`EDITIONS`). 판마다 id·출판사·저자·학년·단원 목록이 있어요.
  - 예) `cj3`(천재교육 3학년), `cj4h`(천재교육 4학년 함순애), `cj4k`(김태은), `cj5h`, `cj5k`, `cj6`
- `src/bank/eng-3.js` : 문제 은행. 키는 `eng-판ID-단원번호(0부터)` (예: `eng-cj3-0` = Lesson 1)
- 다른 교과서를 추가하려면 ① `BOOKS`에 출판사 ② `EDITIONS`에 판 ③ `src/bank/eng-학년.js`에 문제를 추가하고, `src/bank/index.js`에 import 한 줄을 넣으세요.
- 영어는 학기 구분 없이 학년 전체로 보여줘요. 학년에 판이 여러 개면 화면의 "교과서" 줄에서 고를 수 있어요.
- 나중에 로그인으로 학교 교과서를 저장하면, `App.jsx`의 `edition` 상태를 그 값으로 채우면 돼요.
- 주관식 정답은 대소문자와 마침표·물음표를 무시하고 비교해요.

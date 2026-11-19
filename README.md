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


---

## Supabase + OpenAI 일일 단원 문제 연결

### 1. 환경 변수
프로젝트 루트에서 `.env.example`을 복사해 `.env` 파일을 만들고 값을 확인합니다.

```env
VITE_SUPABASE_URL=https://bcrpgtvrvlqfadiqryif.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

브라우저에는 publishable(anon) 키만 사용합니다. `service_role`, Supabase secret key, OpenAI API 키는 절대로 `.env`의 `VITE_` 변수로 넣지 마세요.

### 2. 현재 연결된 기능
- 학년·학기·과목·출판사·단원 선택
- Supabase `textbook_units`에서 확인된 단원 목록 불러오기
- 매일 생성된 문제 중 선택 단원 문제를 모아 20문제 출제
- 기존 퀴즈 화면, 정답 확인, 해설, 오답노트, 결과 기록 재사용
- 한 번에 최대 3개 단원 선택

### 3. 매일 문제 생성
Supabase Cron이 매일 한국 시간 오전 4시에 `generate-daily-questions` Edge Function을 호출합니다. 활성 단원별로 OpenAI가 20문제씩 생성하고 `questions`에 저장합니다.

Supabase Dashboard → Edge Functions → Secrets에서 아래 값을 등록해야 합니다.

- `OPENAI_API_KEY`: OpenAI API 키 (필수)
- `OPENAI_MODEL`: 선택 사항. 미설정 시 `gpt-4o-mini`

함수와 Cron은 배포되어 있지만, `OPENAI_API_KEY`는 소유자만 입력할 수 있으므로 이 값을 등록하기 전까지 실제 문제 생성은 실행되지 않습니다.

### 4. 실행
```bash
npm install
npm run dev
```

배포 전에는 `.env`를 준비하고 `npm run build`를 실행합니다.

### 5. 교과서 데이터 범위
현재 Supabase 카탈로그에서 단원으로 변환한 것은 총 20개입니다.
- 1학년 1·2학기 통합
- 2학년 1·2학기 통합
- 3학년 1학기 사회: 비상교육, 아이스크림미디어

1~6학년의 모든 과목·출판사 단원이 등록된 것은 아닙니다. 목차가 추가되면 React 선택 목록에 자동으로 반영됩니다. 세부 학습목표가 확인되지 않은 단원은 등록된 검증 메모를 OpenAI 프롬프트에 전달해, 확인되지 않은 교과서 내용을 사실처럼 출제하지 않도록 제한합니다.

### 6. 보안 메모
학생 로그인은 Supabase Auth 이메일·비밀번호 인증을 사용합니다. 회원가입 시 프로젝트의 이메일 확인 설정에 따라 인증 메일 확인이 필요할 수 있습니다. 한 계정은 브라우저 프로필 기준 한 기기에서만 활성화되며, 다른 기기에서 로그인하면 기존 기기는 다음 세션 확인 시 로그아웃됩니다. 같은 브라우저의 여러 탭은 동일 기기로 취급합니다. 로그인 세션은 Supabase Edge Function `student-session`과 RLS가 활성화된 `student_sessions` 테이블로 관리합니다. 현재 학습 기록·오답노트 등 일부 데이터는 브라우저 localStorage에 저장되므로 기기를 바꿔 로그인해도 자동 동기화되지 않습니다. 또한 현재 퀴즈 판정은 브라우저에서 수행하므로 정답 데이터가 네트워크 응답에서 확인될 수 있습니다. 상용 서비스 전에는 사용자별 RLS 정책과 서버 측 채점으로 전환하는 것이 좋습니다.

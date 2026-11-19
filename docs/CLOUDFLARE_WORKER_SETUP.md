# Cloudflare Worker 설정

문제 생성과 학생용 문제 제공은 Cloudflare Worker에서 처리합니다. Supabase는 회원 인증, 구독 확인, 문제/학습 세션 저장에 사용합니다.

## Cloudflare 배포 설정

저장소 루트의 `wrangler.jsonc`가 Worker 엔트리포인트와 정적 파일, 매일 실행할 Cron Trigger를 정의합니다.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Worker entrypoint: `worker/index.js`
- Cron: `0 19 * * *` (UTC, 한국 시간 매일 오전 4시)

Cloudflare Workers & Pages에서 Worker `study`를 열고 **Settings → Variables and Secrets**에 다음 값을 Secret으로 등록하세요.

| 이름 | 값 |
|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | Supabase Publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role/secret key |
| `OPENAI_API_KEY` | OpenAI API 키 |

선택 변수 `OPENAI_MODEL`은 기본값이 `gpt-4o-mini`입니다. 필요한 경우 일반 변수로 등록할 수 있습니다.

**주의:** 서비스 역할 키와 OpenAI 키를 GitHub 코드, `.env`의 `VITE_*` 변수, 브라우저에 절대 넣지 마세요. Cloudflare Worker Secret에만 저장합니다.

## 로컬 개발

1. 터미널 1에서 `npx wrangler dev --port 8787` 실행
2. 터미널 2에서 `npm run dev` 실행
3. Vite의 `/api/*` 프록시가 로컬 Worker로 요청을 전달합니다.

로컬 Worker에도 위 환경변수가 필요합니다. `.dev.vars` 파일을 로컬에 만들되 Git에 올리지 마세요.

## 매일 문제 생성

Cloudflare Cron Trigger가 한국 시간 오전 4시에 실행됩니다. 활성화된 `unit_daily_targets`의 실제 단원을 기준으로 단원당 20문제를 OpenAI로 생성하고 Supabase `questions`에 저장합니다. 학생에게는 정답/해설을 제외한 문제만 전달하며, 제출 후 서버가 채점 결과와 해설을 돌려줍니다.

OpenAI API 사용량 잔액이 없으면 생성이 실패합니다. ChatGPT 구독과 OpenAI API 결제는 별도입니다.

## 현재 교과 단원 범위

현재 실제 단원 데이터와 활성 배포 대상으로 확인된 범위는 다음과 같습니다.

- 1학년: 1·2학기 통합
- 2학년: 1·2학기 통합
- 3학년: 1학기 사회

3학년 2학기 사회·과학은 예측/테스트 데이터이고, 4~6학년은 테스트용 단원 외에 검증된 배포 단원이 아직 없습니다. 해당 학년의 교과서 단원과 활성 배포 대상을 등록한 뒤 생성할 수 있습니다. 테스트용 단원은 Worker에서 제외합니다.

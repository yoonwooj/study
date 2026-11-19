# 관리자 페이지 설정

## 포함 기능
- `/admin` 경로의 관리자 로그인 화면
- Supabase Auth에 등록된 회원 목록 조회
- 전체/구독중/만료/미구독 회원 요약 및 검색·필터
- 회원별 학년/가입일/최근 로그인/구독 정보 표시
- 3·6·12개월 구독 수동 등록 및 연장
- 결제 상태(수동 등록/결제 완료/결제 대기/환불), 금액, 메모 저장
- 서버에서 관리자 권한 확인 후 회원 정보 제공

## Supabase 반영 사항
- `admin_users`, `member_profiles`, `subscriptions` 테이블 생성
- 신규 Auth 회원 생성 시 `member_profiles` 기본 행 자동 생성
- 세 테이블 모두 RLS 활성화, anon/authenticated 직접 접근 차단
- `admin-members` Edge Function 배포 (JWT 검증 + admin_users 권한 확인)

## 관리자 계정 활성화
1. Supabase Dashboard > Authentication > Users에서 관리자 이메일 계정을 초대하거나 생성합니다.
2. 해당 계정의 UUID를 확인합니다.
3. Supabase SQL Editor에서 `supabase/admin-setup.sql`의 `USER_UUID`를 실제 UUID로 바꿔 실행합니다.
4. 앱을 배포한 뒤 `https://서비스주소/admin`으로 접속해 관리자 이메일/비밀번호로 로그인합니다.

## 환경변수
기존 `.env`와 동일하게 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정합니다.

## 주의
- service role 키는 브라우저 환경변수에 넣지 않습니다. Edge Function 내부에서만 사용합니다.
- 현재 구독은 관리자 수동 등록 방식입니다. 실제 카드결제/자동갱신/환불 자동화는 PG사 연동이 별도 필요합니다.
- 기존 학습 앱의 로그인은 임시 로컬 로그인 방식입니다. 이 관리자 화면은 Supabase Auth 계정을 사용합니다. 실제 회원 가입/로그인도 Supabase Auth로 통합해야 회원이 이 관리자 목록에 나타납니다.
- 현재 목록은 Supabase Auth 첫 1,000명을 조회합니다. 회원 수가 1,000명을 넘기기 전에 페이지네이션을 추가해야 합니다.

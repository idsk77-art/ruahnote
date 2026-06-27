# Authentication Design

## 목표

사용자별로 노트, 파일, 과제, 일정 데이터를 분리합니다.

## 후보

- Supabase Auth
- Google OAuth
- Email Magic Link

## v1.0 우선순위

1. Supabase Email 로그인
2. Email Magic Link
3. Google OAuth
4. 다중 Google 계정 연동

## 현재 구현 상태

- `/login` 페이지 추가
- 이메일/비밀번호 로그인 준비
- 이메일/비밀번호 회원가입 준비
- 매직링크 로그인 준비
- 로그아웃 준비
- Supabase 환경변수가 없을 때 설정 안내 표시
- Admin 페이지에서 `profiles.role = admin` 확인
- 임시 관리자 비밀번호 fallback 유지

## 남은 작업

- 로그인 후 사용자별 화면 전환
- 보호 라우트 설계
- 첫 admin 사용자 지정
- 임시 관리자 비밀번호 fallback 제거

## Admin 지정

회원가입 후 로컬에서 다음 명령으로 `profiles.role`을 `admin`으로 변경합니다.

```bash
npm.cmd run admin:set -- user@example.com
```

## RLS 원칙

모든 사용자 데이터 테이블에는 `user_id`가 있어야 합니다.

RLS 정책은 `auth.uid() = user_id` 기준으로 설계합니다.

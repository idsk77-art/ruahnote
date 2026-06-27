# Authentication Design

## 목표

사용자별로 노트, 파일, 과제, 일정 데이터를 분리합니다.

## 후보

- Supabase Auth
- Google OAuth
- Email Magic Link

## v1.0 우선순위

1. Supabase Email 로그인
2. Google OAuth
3. 다중 Google 계정 연동

## RLS 원칙

모든 사용자 데이터 테이블에는 `user_id`가 있어야 합니다.  
RLS 정책은 `auth.uid() = user_id` 기준으로 설계합니다.

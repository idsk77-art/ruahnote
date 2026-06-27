# Supabase 설정

## 목적

RuahNote 데이터를 브라우저 LocalStorage가 아니라 Supabase PostgreSQL, Auth, Storage 기반으로 전환합니다.

## 현재 준비 완료

- [x] `@supabase/supabase-js` 설치
- [x] `.env.example` 작성
- [x] 브라우저용 Supabase 클라이언트 팩토리 작성
- [x] 서버 service role 클라이언트 팩토리 작성
- [x] 초기 migration SQL 작성
- [x] profile 자동 생성 migration 작성
- [x] Storage bucket/RLS migration 작성

## 외부에서 해야 할 작업

- [ ] Supabase 프로젝트 생성
- [ ] Project URL 확인
- [x] publishable key 확인
- [x] service role key 확인
- [x] service role/secret key 서버형 REST 호출 검증
- [x] Session Pooler URL 확인
- [x] `.env.local`에 Project URL / publishable key 작성
- [x] `.env.local`에 service role key 작성
- [x] `.env.local`에 `DATABASE_POOLER_URL` 작성
- [ ] Render Environment Variables 등록
- [x] migration SQL 적용
- [ ] Storage 정책 검증

## 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DATABASE_POOLER_URL=
```

## 코드 위치

| 파일 | 역할 |
|---|---|
| `src/lib/supabase/browser.ts` | 클라이언트 컴포넌트용 Supabase publishable/anon client |
| `src/lib/supabase/server.ts` | 서버 전용 service role client |
| `src/lib/supabase/config.ts` | 환경변수 검증 |
| `src/lib/supabase/types.ts` | DB 타입 초안 |
| `supabase/migrations/0001_initial_schema.sql` | 초기 테이블/RLS 정책 |
| `supabase/migrations/0002_profiles_and_storage.sql` | profile 자동 생성/파일 Storage 정책 |

## 주의사항

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 노출하면 안 됩니다. 반드시 서버 전용 코드에서만 사용합니다.

Direct DB URL이 `db.<project-ref>.supabase.co` 형태이고 로컬 네트워크에서 IPv6/DNS 문제가 발생하면 Supabase Dashboard의 Session Pooler connection string을 `DATABASE_POOLER_URL`로 사용합니다.

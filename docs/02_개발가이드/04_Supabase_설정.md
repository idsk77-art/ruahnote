# Supabase 설정

## 목적

RuahNote의 데이터를 브라우저 LocalStorage가 아니라 클라우드 DB에 저장하기 위한 설정 문서입니다.

## 예정 작업

- [ ] Supabase 프로젝트 생성
- [ ] Database URL 확인
- [ ] API URL 확인
- [ ] anon key 확인
- [ ] service role key 보관
- [ ] `.env.local` 작성
- [ ] Render Environment Variables 등록
- [ ] RLS 정책 작성

## 예상 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

## 주의사항

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 노출되면 안 됩니다.  
반드시 서버 전용 환경변수로 관리합니다.

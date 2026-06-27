# Supabase

## 역할

- PostgreSQL Database
- Auth
- Storage
- RLS
- Edge Functions 검토

## v1.0 사용 범위

- 사용자 인증
- 노트 데이터 저장
- 파일 업로드
- 사용자별 데이터 분리

## 현재 코드 준비 상태

- `@supabase/supabase-js` 설치 완료
- 환경변수 템플릿 추가 완료
- 브라우저/서버 클라이언트 분리 완료
- 초기 schema/RLS migration 초안 작성 완료
- profile 자동 생성 trigger migration 작성 완료
- note-files Storage bucket/policy migration 작성 완료
- migration 0001/0002 적용 완료
- `/notes` 파일 첨부 Storage 업로드 경로 구현 완료
- note-files bucket REST 검증 완료
- service role Storage 업로드/삭제 검증 완료

## 남은 연결 작업

1. Render 환경변수 등록
2. Render 배포 후 `/api/health` 확인
3. Auth UI 로그인 검증
4. Notes DB CRUD 검증
5. Storage upload/download 검증

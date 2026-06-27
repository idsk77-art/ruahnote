# RuahNote Status Dashboard

## 전체 진행률

```text
██████░░░░ 60%
```

## 완료

- [x] Git 설치
- [x] GitHub 저장소 생성
- [x] 로컬 프로젝트 Git 초기화
- [x] 첫 Commit 생성
- [x] GitHub Push 완료
- [x] Render Web Service 생성
- [x] Render 배포 성공
- [x] 기본 UI 배포 확인
- [x] docs 프로젝트 관리 시스템 구성
- [x] 개발자 Admin 모드 추가
- [x] Supabase 클라이언트 기반 코드 준비
- [x] 초기 DB migration 초안 작성
- [x] `.env.example` 환경변수 템플릿 작성
- [x] Supabase Auth 로그인 화면 기반 추가
- [x] 노트 CRUD 로컬 MVP 화면 추가
- [x] 노트 CRUD Supabase DB 저장 경로 추가
- [x] 로컬 Supabase URL / publishable key 등록
- [x] 로컬 Supabase service role key 등록
- [x] Supabase secret key 서버형 REST 호출 검증
- [x] Supabase Pooler URL 등록
- [x] Supabase migration 0001/0002 적용
- [x] Supabase REST 기준 notes/profiles/schema_migrations 검증
- [x] `/notes` 파일 첨부 UI 및 Storage 업로드 경로 구현
- [x] Supabase note-files bucket / files table REST 검증
- [x] Supabase Storage service role 업로드/삭제 검증
- [x] Supabase admin role migration 적용
- [x] Admin page Supabase profile role 확인 연결
- [x] Admin role 승격 스크립트 추가
- [x] `/api/health` 운영 점검 API 추가
- [x] Supabase profile 자동 생성 migration 추가
- [x] Supabase Storage bucket/RLS migration 추가
- [x] 전역 네비게이션 추가
- [x] README / 운영 매뉴얼 최신화

## 진행 중

- [ ] Supabase 프로젝트 생성
- [ ] Supabase 환경변수 Render 등록
- [ ] Render 배포 환경에서 Supabase 연결 검증
- [ ] 첫 admin 사용자 지정
- [ ] 실제 Supabase 프로젝트에서 노트 DB CRUD 검증
- [ ] 사용자 로그인 세션 기준 파일 업로드 검증
- [ ] 사용자 로그인 세션 기준 Storage RLS 검증

## 다음 작업

1. Render Environment Variables 등록
2. Render 배포 후 `/api/health` 확인
3. `/login`에서 회원가입/로그인 검증
4. `npm.cmd run admin:set -- user@example.com`으로 첫 admin 지정
5. `/admin` Supabase admin role 입장 검증
6. `/notes` DB 저장 동작 검증
7. `/notes` 파일 업로드 동작 검증

## 현재 위험 요소

| 위험 | 설명 | 대응 |
|---|---|---|
| Supabase 서버 권한 미등록 | service role key와 DB URL이 아직 없어 migration 자동 적용은 불가 | Supabase Dashboard에서 SQL 적용 후 서버 키 등록 |
| Render 환경변수 미등록 | 로컬은 연결됐지만 배포 환경은 아직 미등록 | Render Dashboard에 동일 환경변수 등록 |
| 인증 미구현 | 사용자별 데이터 분리 불가 | Supabase Auth 도입 |
| Migration 미적용 | SQL 초안은 작성됐지만 운영 DB에는 미반영 | Supabase SQL Editor 또는 CLI로 적용 |
| API 비용 | OpenAI API 사용 시 비용 발생 | 사용량 로그와 예산 제한 설계 |

## 최근 배포

| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-06-27 | v0.1.0 | GitHub + Render 배포 성공 |
| 2026-06-27 | v0.1.1 | 개발자 Admin 대시보드 추가 |
| 2026-06-27 | v0.1.2 | Supabase/Auth 기반 준비 |
| 2026-06-27 | v0.1.3 | 노트 CRUD 로컬 MVP 추가 |
| 2026-06-27 | v0.1.4 | Health API, navigation, Supabase storage migration 추가 |

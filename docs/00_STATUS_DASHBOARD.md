# RuahNote Status Dashboard

## 전체 진행률

```text
███████░░░ 70%
```

## 완료

- [x] Git/GitHub/Render 기본 배포
- [x] 개발자 Admin 대시보드
- [x] Supabase 클라이언트 기반 코드
- [x] Supabase Auth 로그인/회원가입/매직링크 화면
- [x] Notes CRUD MVP
- [x] Notes Supabase DB 저장 경로
- [x] Notes 파일 첨부 UI 및 Storage 업로드 경로
- [x] Supabase migration 0001/0002/0003 적용
- [x] Supabase notes/profiles/files/schema_migrations REST 검증
- [x] Supabase note-files bucket REST 검증
- [x] Supabase Storage service role 업로드/삭제 검증
- [x] Admin page Supabase profile role 확인 연결
- [x] Admin role 승격 스크립트
- [x] `/api/health` 운영 점검 API
- [x] 전역 네비게이션
- [x] README / 운영 매뉴얼 최신화
- [x] 최신 코드 GitHub push
- [x] Render 배포 설정 명시를 위한 `render.yaml` 추가

## 진행 중

- [ ] Render 서비스 404 원인 확인
- [ ] Render latest deploy logs 확인
- [ ] Render 서비스 200 복구
- [ ] Supabase 환경변수 Render 등록
- [ ] Render `/api/health` env 값 true 상태 확인
- [ ] 첫 admin 사용자 지정
- [ ] 실제 브라우저에서 Supabase 로그인 검증
- [ ] 실제 브라우저에서 Notes DB CRUD 검증
- [ ] 실제 브라우저에서 파일 업로드 검증

## 다음 작업

1. Render Dashboard에서 latest deploy logs 확인
2. Build Command가 `npm ci && npm run build`인지 확인
3. Start Command가 `npm run start`인지 확인
4. Node version이 20 이상인지 확인
5. Render Dashboard에 환경변수 등록
6. Manual Deploy 실행
7. `/`, `/api/health`, `/login`, `/notes`, `/admin` 200 확인
8. `/api/health` env 값 true 확인
9. `/login`에서 회원가입/로그인 검증
10. `npm.cmd run admin:set -- user@example.com`으로 첫 admin 지정
11. `/admin` Supabase admin role 입장 검증
12. `/notes` DB 저장/파일 업로드 동작 검증

## 현재 위험 요소

| 위험 | 설명 | 대응 |
|---|---|---|
| Render 서비스 404 | 최신 push 후 운영 URL 전체가 404 응답 | Render Dashboard의 latest deploy logs와 start command 확인 |
| Render 환경변수 미등록 | 환경변수 등록 전에는 `/api/health`의 Supabase env 값이 false | Render Dashboard에 로컬과 동일 환경변수 등록 |
| 임시 Admin fallback | `ruahnote-admin` 클라이언트 비밀번호가 아직 fallback으로 남아 있음 | 첫 admin 지정 후 fallback 제거 |
| 사용자 세션 검증 미완료 | service role 검증은 완료, 실제 사용자 세션 기준 검증은 남음 | 브라우저에서 회원가입 후 Notes/Storage 테스트 |
| OpenAI 비용 | OpenAI API 연동 후 비용 발생 가능 | 사용량/예산 추적 구현 |

## 최근 배포

| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-06-27 | v0.1.0 | GitHub + Render 배포 성공 |
| 2026-06-27 | v0.1.1 | 개발자 Admin 대시보드 추가 |
| 2026-06-27 | v0.1.2 | Supabase/Auth 기반 준비 |
| 2026-06-27 | v0.1.3 | Notes CRUD MVP 추가 |
| 2026-06-27 | v0.1.4 | Health API, navigation, Supabase storage migration 추가 |
| 2026-06-27 | v0.1.5 | Supabase DB/Storage/Admin role 기반 |
| 2026-06-27 | v0.1.6 | Render 설정 파일 추가, 운영 404 조사 필요 |

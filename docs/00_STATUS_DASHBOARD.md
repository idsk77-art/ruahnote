# RuahNote Status Dashboard

## 전체 진행률

```text
███████░░░ 70%
```

## 완료

- [x] Git/GitHub/Render 기본 배포 준비
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
- [x] 전역 내비게이션
- [x] README / 운영 매뉴얼 최신화
- [x] Render 배포 설정을 위한 `render.yaml`
- [x] Render 전용 `render:start` 스크립트
- [x] Render start wrapper 로컬 production 검증
- [x] 운영 URL 진단 스크립트 `npm run deploy:check`

## 진행 중

- [ ] Render 서비스 404 원인 확인
- [ ] Render latest deploy logs 확인
- [ ] Render 서비스 200 복구
- [ ] Render 환경변수 등록 확인
- [ ] Render `/api/health` env 값 true 상태 확인
- [ ] 첫 admin 사용자 지정
- [ ] 실제 브라우저에서 Supabase 로그인 검증
- [ ] 실제 브라우저에서 Notes DB CRUD 검증
- [ ] 실제 브라우저에서 파일 업로드 검증

## 현재 확인 결과

| 항목 | 상태 |
|---|---|
| GitHub `main` | 최신 커밋 `26ce34a` push 완료 |
| 로컬 `npm.cmd run setup:check` | 통과 |
| 로컬 `npm.cmd run lint` | 통과 |
| 로컬 `npm.cmd run build` | 통과 |
| 로컬 `npm.cmd run render:start` | `/api/health` 200 확인 |
| Supabase migrations | 0001/0002/0003 모두 적용됨 |
| Supabase profile/admin/note/file count | 모두 0 |
| 운영 `/` | 404 |
| 운영 `/api/health` | 404 |
| 운영 응답 헤더 | `x-render-routing=no-server` |

## 다음 작업

1. Render Dashboard에서 서비스 Primary URL이 `https://ruahnote.onrender.com`인지 확인
2. Repository가 `idsk77-art/ruahnote`, Branch가 `main`인지 확인
3. Latest deploy logs에서 최신 commit `26ce34a`가 배포 대상인지 확인
4. Build Command가 `npm ci && npm run build`인지 확인
5. Start Command가 `npm run render:start`인지 확인
6. Environment에 Supabase 값을 등록
7. Manual Deploy 실행
8. 로컬에서 `npm.cmd run deploy:check` 실행
9. `/api/health`가 200이면 회원가입 후 `npm.cmd run admin:set -- user@example.com` 실행
10. `/login`, `/notes`, `/admin` 실사용 검증

## 현재 위험 요소

| 위험 | 설명 | 대응 |
|---|---|---|
| Render `no-server` | Render 라우팅이 실행 중인 서버를 찾지 못함 | Dashboard에서 서비스 연결, URL, deploy 상태 확인 |
| 첫 admin 미지정 | 아직 Supabase profiles가 0개라 승격 대상 없음 | 회원가입 후 `admin:set` 실행 |
| OpenAI API 미설정 | 현재 health check에서 OpenAI는 missing 상태 | OCR/STT/AI 기능 시작 전 등록 |

## 최근 배포/작업

| 날짜 | 커밋 | 내용 |
|---|---|---|
| 2026-06-28 | `26ce34a` | 운영 URL 진단 스크립트 추가 |
| 2026-06-28 | `4871754` | Render start wrapper cross-platform 수정 |
| 2026-06-27 | v0.1.6 | Render 설정 파일 추가, 운영 404 조사 필요 |

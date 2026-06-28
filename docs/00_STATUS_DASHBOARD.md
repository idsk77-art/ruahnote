# RuahNote Status Dashboard

## 전체 진행률

```text
████████░░ 78%
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
- [x] Render Primary URL `https://ruahnote-bp6m.onrender.com` 확인
- [x] 운영 `/` 200 확인
- [x] 운영 `/api/health` 200 확인
- [x] Notes category/subject local + Supabase CRUD path
- [x] Notes subject assignment UI
- [x] Notes date/session/favorite metadata
- [x] Supabase migration 0004 note core metadata 적용
- [x] Notes editor body + checklist content_json sync
- [x] Notes search includes attached file metadata
- [x] 첨부/검색 작업리스트 완료 전환
- [x] 노트 카드 Camera image capture input
- [x] `/api/ocr` OpenAI OCR route
- [x] 이미지 첨부 OCR 실행 버튼
- [x] 카메라/OCR 기반 작업리스트 완료 전환
- [x] 노트 카드 Scan multi-image upload input
- [x] `/api/pdf` scan image PDF export route
- [x] 이미지 첨부 PDF export button
- [x] Assignments 과제 관리 화면
- [x] 과제 LocalStorage/Supabase CRUD path
- [x] 과제 상태 칸반, 완료 보관, 마감 임박/초과 요약
- [x] 과제 관련 노트 연결 UI
- [x] 과제 후보 수동 등록
- [x] 과제 후보 중복 통합 UI
- [x] 후보 확정 과제 전환
- [x] 과제 마감 임박/기한 초과 대시보드
- [x] 노트 오디오 첨부 업로드
- [x] Supabase 오디오 signed URL 재생 UI
- [x] 녹음 타임라인 메모 수동 추가
- [x] 녹음 메모 `content_json` 저장
- [x] `/api/transcribe` OpenAI STT route
- [x] `/api/lecture-note` AI 강의노트 route
- [x] 노트 오디오 STT/AI 실행 버튼
- [x] STT/AI 결과 노트 본문 반영 및 과제 후보 저장
- [x] Google OAuth 승인 URL 생성 route
- [x] Google OAuth callback code 교환 route
- [x] Google 연동 설정 화면
- [x] Supabase `google_accounts` migration
- [x] Google OAuth state Supabase 사용자 바인딩
- [x] Google token 서버 암호화 저장
- [x] Google Calendar 조회 route 및 화면 버튼
- [x] Google 전체 캘린더 목록 조회
- [x] 캘린더별 선택 조회 UI
- [x] Google Contacts 조회 route
- [x] 연락처 이름/이메일/전화/소속 검색 UI
- [x] Gmail 목록/검색 조회 route
- [x] Gmail 상세 본문 조회 route
- [x] Gmail 초안 생성 route
- [x] Gmail 목록/상세/초안 생성 UI

## 진행 중

- [ ] Render 환경변수 등록 확인
- [ ] Render `/api/health` env 값 true 상태 확인
- [ ] 첫 admin 사용자 지정
- [ ] 실제 브라우저에서 Supabase 로그인 검증
- [ ] 실제 브라우저에서 Notes DB CRUD 검증
- [ ] 실제 브라우저에서 파일 업로드 검증
- [ ] 노트 코어 브라우저 실사용 검증
- [ ] 카메라/OCR 브라우저 권한 검증
- [ ] OpenAI API key 운영 등록 후 OCR 실사용 검증
- [ ] 스캔센터/PDF 브라우저 실사용 검증
- [ ] 과제 관리 브라우저 실사용 검증
- [ ] 과제 후보/중복 통합 브라우저 실사용 검증
- [ ] 녹음 기반 브라우저 실사용 검증
- [ ] STT/AI 강의노트 OpenAI key 실사용 검증
- [ ] Google OAuth Client ID/Secret 등록
- [ ] Google OAuth 승인 URL 실사용 검증
- [ ] Render `GOOGLE_TOKEN_ENCRYPTION_KEY` 등록
- [ ] Google OAuth callback 토큰 저장 실사용 검증
- [ ] Google Calendar 전체/선택 조회 운영 검증
- [ ] Google Contacts 운영 조회 검증
- [ ] Gmail 목록/상세/초안 운영 검증
- [ ] 통합/QA/배포 시나리오 점검

## 현재 확인 결과

| 항목 | 상태 |
|---|---|
| GitHub `main` | 이번 작업 커밋 push 완료 |
| 로컬 `npm.cmd run setup:check` | 통과 |
| 로컬 `npm.cmd run lint` | 통과 |
| 로컬 `npm.cmd run build` | 통과 |
| 로컬 `npm.cmd run render:start` | `/api/health` 200 확인 |
| Supabase migrations | 0001/0002/0003 모두 적용됨 |
| Supabase profile/admin/note/file count | 모두 0 |
| 운영 URL | `https://ruahnote-bp6m.onrender.com` |
| 운영 `/` | 200 |
| 운영 `/api/health` | 200 |
| 로컬 `/notes` | 200, category/subject UI 포함 |
| Supabase migrations | 0001/0002/0003/0004 모두 적용됨 |
| 작업리스트 상태 | Gmail 완료, 통합/QA/배포 진행중 |
| 로컬 `/notes` Camera UI | 구현됨 |
| 로컬 `/api/ocr` | route 구현됨, OpenAI key 필요 |
| 로컬 `/notes` Scan UI | 다중 이미지 입력 구현됨 |
| 로컬 `/api/pdf` | 샘플 이미지 PDF 1페이지 생성 검증 |
| 로컬 `/assignments` | 구현됨, 빌드 라우트 생성 확인 |
| 로컬 `/assignments` 후보함 | 후보 등록/중복 통합/과제 전환 UI 구현됨 |
| 로컬 `/notes` Audio UI | 오디오 첨부/재생/타임라인 메모 UI 구현됨 |
| 로컬 `/api/transcribe` | route 구현됨, OpenAI key 필요 |
| 로컬 `/api/lecture-note` | route 구현됨, OpenAI key 필요 |
| 로컬 `/integrations` | 200, Google 연동 화면 렌더 확인 |
| 로컬 `/api/google/oauth-url` | 503, Google Client ID 미설정 상태 정상 확인 |
| Supabase migration 0005 | `google_accounts` 적용 완료 |
| Google Calendar 조회 | 전체 캘린더 목록 및 선택 조회 구현됨 |
| Google Contacts 조회 | route 및 검색 UI 구현됨 |
| Gmail 조회/작성 | 목록/검색/상세/초안 생성 route 및 UI 구현됨 |

## 다음 작업

1. Render Environment에 Supabase 값을 모두 등록했는지 확인
2. 로컬에서 `npm.cmd run deploy:check` 실행
3. `/api/health` env 값이 true인지 확인
4. `/login`에서 회원가입 진행
5. `npm.cmd run admin:set -- user@example.com` 실행
6. `/login`, `/notes`, `/admin` 실사용 검증
7. category > subject > note 작성 흐름 검증
8. `/assignments`에서 과제 생성/상태변경/완료 보관 흐름 검증
9. `/assignments`에서 후보 등록/중복 병합/과제 전환 흐름 검증
10. `/notes`에서 오디오 첨부/재생/타임라인 메모 흐름 검증
11. OpenAI API key 등록 후 `/notes` 오디오 STT/AI 흐름 검증
12. Google Cloud OAuth Client ID/Secret 및 redirect URI 등록
13. `/integrations`에서 Google 승인 URL 생성/콜백 교환 검증
14. Render에 `GOOGLE_TOKEN_ENCRYPTION_KEY` 등록
15. Google Calendar 조회 버튼으로 다음 7일 일정 검증
16. 여러 캘린더 선택/해제 후 일정 필터링 검증
17. `/integrations`에서 Contacts 확인/검색 검증
18. `/integrations`에서 Gmail 목록/검색/상세/초안 생성 검증
19. 통합/QA/배포 시나리오 점검

## 현재 위험 요소

| 위험 | 설명 | 대응 |
|---|---|---|
| 첫 admin 미지정 | 아직 Supabase profiles가 0개라 승격 대상 없음 | 회원가입 후 `admin:set` 실행 |
| OpenAI API 미설정 | 현재 health check에서 OpenAI는 missing 상태 | OCR/STT/AI 기능 시작 전 등록 |
| Google OAuth 미설정 | Client ID/Secret과 승인된 redirect URI가 아직 없음 | Google Cloud 설정 후 OAuth 실사용 검증 |
| Google token 암호화 키 | 토큰 저장에는 `GOOGLE_TOKEN_ENCRYPTION_KEY`가 필요 | Render 환경변수 등록 |
| Gmail API 사용 설정 | Google Cloud에서 Gmail API가 비활성 상태면 Gmail 조회/초안 생성이 실패함 | Google Cloud API 라이브러리에서 Gmail API 사용 설정 |

## 최근 배포/작업

| 날짜 | 커밋 | 내용 |
|---|---|---|
| 2026-06-28 | pending | Scan image PDF export route 및 버튼 추가 |
| 2026-06-28 | current | Assignments 과제 관리 화면 및 CRUD 경로 추가 |
| 2026-06-28 | current | 과제 후보함, 중복 통합, 마감 대시보드 추가 |
| 2026-06-28 | current | 노트 오디오 첨부, 재생 UI, 녹음 타임라인 메모 추가 |
| 2026-06-28 | current | OpenAI STT/AI 강의노트 route 및 노트 연동 추가 |
| 2026-06-28 | current | Google OAuth URL/callback 스캐폴드와 연동 화면 추가 |
| 2026-06-28 | current | Google token 암호화 저장 및 Calendar 조회 route 추가 |
| 2026-06-28 | current | Google 전체 캘린더/선택 조회 UI 추가 |
| 2026-06-28 | current | Google Contacts 조회 route 및 검색 UI 추가 |
| 2026-06-28 | current | Gmail 목록/상세/초안 생성 route 및 UI 추가 |
| 2026-06-28 | pending | Scan multi-image upload input 추가, 스캔센터/PDF 진행중 전환 |
| 2026-06-28 | pending | OpenAI OCR API route 및 이미지 첨부 OCR 버튼 추가 |
| 2026-06-28 | pending | 카메라 이미지 캡처 첨부 입력 추가 |
| 2026-06-28 | pending | 첨부/검색 완료 처리, 카메라/OCR 진행중 전환 |
| 2026-06-28 | pending | 노트 에디터 체크리스트 저장 및 첨부 검색 보강 |
| 2026-06-28 | pending | 날짜별 노트 CRUD 메타데이터 추가, 노트 에디터 진행중 전환 |
| 2026-06-28 | pending | Notes category/subject CRUD path 추가 |
| 2026-06-28 | pending | 운영 URL을 `ruahnote-bp6m.onrender.com`으로 정정 |
| 2026-06-28 | `9bd9162` | 배포 상태 문서 갱신 |
| 2026-06-28 | `26ce34a` | 운영 URL 진단 스크립트 추가 |
| 2026-06-28 | `4871754` | Render start wrapper cross-platform 수정 |
| 2026-06-27 | v0.1.6 | Render 설정 파일 추가, 운영 404 조사 필요 |

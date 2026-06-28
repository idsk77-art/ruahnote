# RuahNote TODO

## High Priority

- [x] Render Primary URL이 `https://ruahnote-bp6m.onrender.com`인지 확인
- [x] `npm.cmd run deploy:check`가 200으로 통과하는지 확인
- [ ] Supabase 환경변수를 Render에 등록
- [ ] Render `/api/health` 환경변수 상태 확인
- [ ] 회원가입 후 첫 admin 사용자 지정
- [ ] `/admin` Supabase admin role 입장 검증
- [ ] 실제 브라우저에서 Notes DB CRUD 검증
- [ ] 실제 브라우저에서 파일 업로드 검증
- [ ] 실제 브라우저에서 category > subject > note 흐름 검증
- [ ] 첨부/검색 브라우저 실사용 검증

## Medium Priority

- [x] Supabase URL / publishable key 로컬 등록
- [x] Supabase service role key 로컬 등록
- [x] Supabase Session Pooler URL 로컬 등록
- [x] Supabase migration 0001/0002/0003 적용
- [x] Supabase 클라이언트 기반 코드 준비
- [x] DB 스키마 초안 작성
- [x] 로그인/Auth 화면 기반 구현
- [x] Notes CRUD 로컬 MVP 화면 구현
- [x] Notes category/subject CRUD 경로 구현
- [x] Notes subject assignment UI 구현
- [x] Notes 날짜/회차/즐겨찾기 메타데이터 구현
- [x] Supabase migration 0004 적용
- [x] 노트 에디터 본문/체크리스트 UX 구현
- [x] Notes content_json 체크리스트 동기화
- [x] 첨부 파일명 검색 보강
- [x] Notes Supabase DB 저장 경로 구현
- [x] Notes 파일 첨부 UI 및 Supabase Storage 업로드 경로 구현
- [x] Supabase Storage service role 업로드/삭제 검증
- [x] Admin Supabase role 확인 기반 구현
- [x] Admin role 승격 스크립트 구현
- [x] `/api/health` 운영 점검 API 구현
- [x] 전역 내비게이션 구현
- [x] README 최신화
- [x] 운영 매뉴얼 최신화
- [x] `render.yaml` 배포 설정 추가
- [x] Render 전용 start wrapper 추가
- [x] 운영 URL 진단 스크립트 추가
- [ ] UI 컴포넌트 분리
- [ ] 공통 타입/파일 정리
- [ ] Render 배포 매뉴얼 보강

## Low Priority

- [ ] 로고/assets 정리
- [ ] 스크린샷 폴더 관리
- [ ] 모바일 UI 보완
- [ ] 다크모드 톤 조정
- [ ] 애니메이션 개선

## Later

- [ ] OCR
- [ ] STT
- [ ] Google Calendar
- [ ] Gmail
- [ ] 다중 계정
- [ ] PWA

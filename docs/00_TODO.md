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
- [x] 첨부/검색 작업리스트 완료 전환
- [x] 노트 카드 Camera image capture input 구현
- [x] `/api/ocr` OpenAI OCR route 구현
- [x] 이미지 첨부 OCR 실행 버튼 구현
- [x] 카메라/OCR 기반 작업리스트 완료 전환
- [x] 노트 카드 Scan multi-image upload input 구현
- [x] `/api/pdf` scan image PDF export route 구현
- [x] 이미지 첨부 PDF export button 구현
- [x] Assignments 과제 관리 화면 구현
- [x] 과제 LocalStorage/Supabase CRUD 경로 구현
- [x] 과제 상태 칸반/완료 보관/마감 요약 구현
- [x] 과제 관련 노트 연결 UI 구현
- [x] 과제 후보 수동 등록 구현
- [x] 과제 후보 중복 통합 UI 구현
- [x] 후보 확정 과제 전환 구현
- [x] 과제 마감 임박/기한 초과 대시보드 구현
- [x] 노트 오디오 첨부 업로드 구현
- [x] Supabase 오디오 signed URL 재생 UI 구현
- [x] 녹음 타임라인 메모 수동 추가 구현
- [x] 녹음 메모 content_json 저장 구현
- [x] `/api/transcribe` OpenAI STT route 구현
- [x] `/api/lecture-note` AI 강의노트 route 구현
- [x] 노트 오디오 STT/AI 실행 버튼 구현
- [x] STT/AI 결과 노트 본문 반영 및 과제 후보 저장 구현
- [x] Google OAuth 승인 URL 생성 route 구현
- [x] Google OAuth callback code 교환 route 구현
- [x] Google 연동 설정 화면 구현
- [x] Supabase `google_accounts` migration 구현/적용
- [x] Google OAuth state Supabase 사용자 바인딩 구현
- [x] Google token 서버 암호화 저장 구현
- [x] Google Calendar 조회 route 및 화면 버튼 구현
- [x] Google 전체 캘린더 목록 조회 구현
- [x] 캘린더별 선택 조회 UI 구현
- [x] Google Contacts 조회 route 구현
- [x] 연락처 이름/이메일/전화/소속 검색 UI 구현
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

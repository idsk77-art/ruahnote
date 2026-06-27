# RuahNote Status Dashboard

## 전체 진행률

```text
█████░░░░░░░░░░░ 30%
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

## 진행 중

- [ ] 프로젝트 문서 체계 정리
- [ ] v1.0 개발 로드맵 확정
- [ ] Supabase 도입 준비

## 다음 작업

1. Supabase 프로젝트 생성
2. 환경변수 `.env.local` 구성
3. DB 스키마 설계
4. Auth 설계
5. 노트 CRUD 개발 시작

## 현재 위험 요소

| 위험 | 설명 | 대응 |
|---|---|---|
| 데이터 저장 방식 | 현재 일부 데이터가 LocalStorage 중심 | Supabase DB 전환 |
| 인증 미구현 | 사용자별 데이터 분리 불가 | Supabase Auth 도입 |
| 문서 분산 | 기획/DB/UI 문서가 분리되어 관리됨 | docs 구조 표준화 |
| API 비용 | OpenAI API 사용 시 비용 발생 | 사용량 제한 및 로그 관리 |

## 최근 배포

| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-06-27 | v0.1.0 | GitHub + Render 배포 성공 |

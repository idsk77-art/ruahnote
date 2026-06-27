# Database Design

## v1.0 주요 테이블

- `profiles`
- `categories`
- `subjects`
- `notes`
- `files`
- `tasks`

## 관계 개요

```text
auth.users
  └─ profiles
  └─ categories
      └─ subjects
          └─ notes
              ├─ files
              └─ tasks
```

## 설계 원칙

- 사용자 소유 데이터에는 `user_id`를 둡니다.
- RLS 정책은 `auth.uid() = user_id`를 기본으로 합니다.
- `profiles.id`는 `auth.users.id`를 참조합니다.
- 파일 본문은 Supabase Storage에 저장하고 DB에는 `file_path`를 저장합니다.

## 다음 작업

- [x] Supabase 기준 ERD 초안 작성
- [x] 초기 migration 작성
- [x] RLS 정책 초안 작성
- [x] 노트 CRUD DB 저장 경로 구현
- [x] 실제 Supabase 프로젝트에 migration 적용
- [ ] 실제 Supabase 프로젝트에서 노트 CRUD 검증
- [ ] Storage bucket 정책 작성
- [ ] 노트 CRUD API/서비스 계층 작성

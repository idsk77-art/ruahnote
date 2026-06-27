# Database Design

## v1.0 주요 테이블 후보

- users / profiles
- categories
- subjects
- notes
- files
- tasks
- recordings
- ai_outputs
- google_accounts

## 관계 개요

```text
User
 └─ Category
     └─ Subject / Project
         └─ Note
             ├─ File
             ├─ Task
             └─ Recording
```

## 다음 작업

- [ ] Supabase 기준 ERD 작성
- [ ] RLS 정책 설계
- [ ] Prisma 사용 여부 결정
- [ ] Migration 전략 결정

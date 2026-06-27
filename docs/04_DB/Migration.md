# Migration

## 원칙

1. DB 변경은 migration 파일로 기록합니다.
2. 운영 DB를 직접 수정하지 않습니다.
3. 변경 전 문서와 ERD를 먼저 갱신합니다.
4. RLS 정책을 함께 작성합니다.

## 예정 폴더

```text
supabase/
├── migrations/
└── seed.sql
```

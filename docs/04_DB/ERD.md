# ERD

## 초기 초안

```text
profiles
  id uuid pk references auth.users(id)
  email text
  display_name text
  avatar_url text
  created_at timestamptz
  updated_at timestamptz

categories
  id uuid pk
  user_id uuid references auth.users(id)
  title text
  color text
  sort_order integer
  created_at timestamptz
  updated_at timestamptz

subjects
  id uuid pk
  user_id uuid references auth.users(id)
  category_id uuid references categories(id)
  title text
  description text
  created_at timestamptz
  updated_at timestamptz

notes
  id uuid pk
  user_id uuid references auth.users(id)
  subject_id uuid references subjects(id)
  title text
  content_json jsonb
  content_plain text
  note_date date
  created_at timestamptz
  updated_at timestamptz

files
  id uuid pk
  user_id uuid references auth.users(id)
  note_id uuid references notes(id)
  file_name text
  file_path text
  mime_type text
  size_bytes bigint
  created_at timestamptz
  updated_at timestamptz

tasks
  id uuid pk
  user_id uuid references auth.users(id)
  note_id uuid references notes(id)
  title text
  due_date date
  status text
  priority text
  created_at timestamptz
  updated_at timestamptz
```

## RLS

모든 사용자 소유 테이블은 `auth.uid()` 기준으로 본인 데이터만 조회/생성/수정/삭제합니다.

자세한 SQL은 `supabase/migrations/0001_initial_schema.sql`을 기준으로 관리합니다.

# ERD

## 초안

```text
profiles
  id
  email
  display_name
  created_at

categories
  id
  user_id
  title
  color
  sort_order
  created_at

subjects
  id
  user_id
  category_id
  title
  description
  created_at

notes
  id
  user_id
  subject_id
  title
  content_json
  content_plain
  note_date
  created_at
  updated_at

files
  id
  user_id
  note_id
  file_name
  file_url
  mime_type
  size
  created_at

tasks
  id
  user_id
  note_id
  title
  due_date
  status
  priority
  created_at
```

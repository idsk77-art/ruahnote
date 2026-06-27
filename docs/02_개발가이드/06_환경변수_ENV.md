# 환경변수 ENV 관리

## 로컬 파일

```text
.env.local
```

이 파일은 GitHub에 올리면 안 됩니다.

## GitHub에 올려도 되는 파일

```text
.env.example
```

## 예시

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
DATABASE_URL=
```

## Render 설정 위치

```text
Render Dashboard
→ ruahnote
→ Environment
→ Add Environment Variable
```

## 원칙

- 공개 가능한 값은 `NEXT_PUBLIC_` 접두사를 사용합니다.
- 비밀키는 절대 `NEXT_PUBLIC_`을 붙이지 않습니다.
- `.env.local`은 `.gitignore`에 포함합니다.

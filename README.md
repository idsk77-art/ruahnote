# RuahNote

RuahNote is a Next.js app for project scheduling, notes, and developer operations.

## Routes

| Route | Purpose |
|---|---|
| `/` | Project schedule dashboard |
| `/notes` | Notes CRUD and file attachment MVP |
| `/login` | Supabase Auth login/signup/magic link |
| `/admin` | Developer admin dashboard |
| `/api/health` | Operational health check |

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create `.env.local` from `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
OPENAI_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `OPENAI_API_KEY` must never be exposed in client code.

## Supabase Setup

Apply migrations in order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_profiles_and_storage.sql`
3. `supabase/migrations/0003_admin_roles.sql`

Until migrations are applied, `/notes` falls back to LocalStorage unless a valid authenticated Supabase session, tables, and Storage bucket are available.

After a user signs up, promote the first admin locally:

```bash
npm.cmd run admin:set -- user@example.com
```

## Checks

```bash
npm run lint
npm run build
npm run setup:check
```

On Windows PowerShell execution-policy restricted environments, use:

```bash
npm.cmd run lint
npm.cmd run build
npm.cmd run setup:check
```

## Render

The repository includes `render.yaml`. The intended Render commands are:

```text
Build Command: npm ci && npm run build
Start Command: npm run render:start
```

`render:start` binds Next.js to `0.0.0.0` and Render's `PORT`.

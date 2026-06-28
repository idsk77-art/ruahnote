# Render 배포 가이드

## 서비스 유형

RuahNote는 Next.js Node 웹 서비스로 배포합니다.

```text
New > Web Service
```

## 기본 설정

| 항목 | 값 |
|---|---|
| Name | `ruahnote` |
| Language | Node |
| Branch | `main` |
| Root Directory | 비워둠 |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run render:start` |
| Instance Type | Free |

`render.yaml`에도 같은 값이 들어 있습니다. Dashboard 값과 `render.yaml`이 다르면 Dashboard 값을 위 설정으로 맞춥니다.

## 환경 변수

Render Dashboard의 Environment에 아래 값을 등록합니다.

```text
NODE_VERSION=20
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_POOLER_URL
DATABASE_URL
OPENAI_API_KEY
```

`OPENAI_API_KEY`는 OCR/STT/AI 기능을 켜기 전까지 비워둘 수 있습니다.

## 배포 확인

Render Logs에서 아래 흐름을 확인합니다.

```text
Build successful
Your service is live
```

운영 URL은 다음과 같습니다.

```text
https://ruahnote-bp6m.onrender.com
```

로컬에서 운영 응답을 확인합니다.

```bash
npm.cmd run deploy:check
```

정상 상태에서는 `/`와 `/api/health`가 200으로 응답해야 합니다.

## 404 복구 체크리스트

`x-render-routing=no-server`가 보이면 앱 라우트 문제가 아니라 Render 라우팅 또는 서비스 연결 문제일 가능성이 큽니다.

1. Render 서비스의 Primary URL이 `https://ruahnote-bp6m.onrender.com`인지 확인합니다.
2. Repository가 `idsk77-art/ruahnote`, Branch가 `main`인지 확인합니다.
3. Latest deploy가 최신 Git commit을 포함하는지 확인합니다.
4. Build Command가 `npm ci && npm run build`인지 확인합니다.
5. Start Command가 `npm run render:start`인지 확인합니다.
6. Manual Deploy를 실행합니다.
7. Deploy logs에서 start 단계가 `Ready`까지 도달하는지 확인합니다.

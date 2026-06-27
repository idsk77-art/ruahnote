# REST API

## 표준 응답 구조

```ts
type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};
```

## 에러 처리 원칙

- 사용자 메시지와 개발자 로그를 분리합니다.
- 외부 API 오류는 원인을 기록합니다.
- 민감정보는 로그에 남기지 않습니다.
# REST API

## 현재 구현

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/api/health` | 운영 점검용 상태 API |

## `/api/health`

실제 키 값은 노출하지 않고 환경변수 존재 여부만 반환합니다.

```json
{
  "ok": true,
  "app": "RuahNote",
  "version": "0.1.0",
  "checkedAt": "ISO_DATE",
  "env": {
    "supabaseUrl": true,
    "supabasePublishableKey": true,
    "supabaseServiceRoleKey": false,
    "databaseUrl": false,
    "openAiApiKey": false
  }
}
```

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

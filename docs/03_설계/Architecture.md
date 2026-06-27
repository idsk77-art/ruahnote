# Architecture

## 기본 구조

RuahNote는 Next.js 기반의 웹 애플리케이션입니다.

## 예정 아키텍처

```text
Client UI
   ↓
Next.js App Router
   ↓
Server Actions / API Routes
   ↓
Supabase DB / Storage
   ↓
OpenAI API / Google API
```

## 주요 계층

| 계층 | 역할 |
|---|---|
| UI Layer | 화면과 사용자 입력 처리 |
| State Layer | 클라이언트 상태 관리 |
| Service Layer | DB/API 호출 |
| Data Layer | Supabase DB/Storage |
| AI Layer | OpenAI API 처리 |
| Integration Layer | Google Calendar/Gmail 등 외부 연동 |

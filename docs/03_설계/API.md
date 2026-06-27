# API Design

## 내부 API 후보

| API | 목적 |
|---|---|
| `/api/notes` | 노트 CRUD |
| `/api/files` | 파일 업로드/조회 |
| `/api/ai/summary` | AI 요약 |
| `/api/ai/tasks` | 과제 후보 추출 |
| `/api/ocr` | OCR 처리 |
| `/api/stt` | 음성 변환 |
| `/api/google/calendar` | Google Calendar 연동 |

## 원칙

- 클라이언트에서 비밀키를 직접 호출하지 않습니다.
- 외부 API는 서버 Route를 통해 호출합니다.
- 실패 응답 구조를 표준화합니다.

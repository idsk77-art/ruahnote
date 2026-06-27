# Render 배포 가이드

## 서비스 유형

RuahNote는 Next.js 앱이므로 Render에서 다음 유형을 사용합니다.

```text
New → Web Service
```

## 기본 설정

| 항목 | 값 |
|---|---|
| Name | ruahnote |
| Language | Node |
| Branch | main |
| Root Directory | 비워둠 |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

## 배포 확인 문구

Render 로그에서 다음 문구를 확인합니다.

```text
Build successful
Your service is live
Available at your primary URL
```

## 운영 URL

```text
https://ruahnote.onrender.com
```

## 주의사항

무료 인스턴스는 사용하지 않으면 잠시 멈출 수 있습니다.  
다시 접속할 때 50초 이상 지연될 수 있습니다.

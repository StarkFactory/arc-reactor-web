# Arc Reactor Web

[Arc Reactor](https://github.com/StarkFactory/arc-reactor) AI Agent 프레임워크의 웹 채팅 UI입니다.

## 기능

- SSE(Server-Sent Events) 기반 실시간 스트리밍 응답
- 다크/라이트 테마 전환
- 세션 기반 대화 관리
- 반응형 채팅 인터페이스

## 실행

### 개발 모드

```bash
# 백엔드(arc-reactor) 먼저 실행 후
npm install
npm run dev    # http://localhost:3000
```

개발 서버가 `/api` 요청을 `http://localhost:8080`으로 프록시합니다.

### Docker Compose

백엔드와 프론트엔드를 한번에 실행:

```bash
# .env 파일에 API 키 설정
cp .env.example .env

# 실행
docker compose up --build
```

- 웹 UI: http://localhost:3000
- 백엔드 API: http://localhost:8080

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VITE_API_URL` | 백엔드 API URL | `http://localhost:8080` |

## 기술 스택

- React 19 + TypeScript
- Vite
- Nginx (프로덕션)

# Arc Reactor Web

[Arc Reactor](https://github.com/StarkFactory/arc-reactor) AI 에이전트 프레임워크를 위한 웹 채팅 UI입니다.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5-FF4154.svg)](https://tanstack.com/query)

[English](README.md)

## 언어 정책

이 프로젝트는 오픈 소스입니다. **리포지토리 산출물의 기본 언어는 영어입니다:**

- 코드 주석 및 인라인 노트 (`TODO`, `FIXME` 등)
- 풀 리퀘스트 제목 및 설명
- PR/이슈의 리뷰 코멘트 및 기술 토론
- 커밋 메시지

사용자에게 노출되는 UI 텍스트는 i18n을 지원하며 다국어로 작성할 수 있습니다.

## 주요 기능

- SSE(Server-Sent Events) 기반 실시간 스트리밍 응답
- 세션 기반 대화 관리
- 다크 / 라이트 테마 전환
- i18n 지원 (한국어, 영어)
- 페르소나 관리 (CRUD, 기본 페르소나 설정)
- 선택적 JWT 인증 및 사용자 격리
- 반응형 디자인 (375px ~ 1440px)
- 마크다운 렌더링 및 코드 신택스 하이라이팅
- 어드민 대시보드 — MCP 서버, 페르소나, 인텐트, 아웃풋 가드, 툴 정책, 스케줄러, 클리핑

## 라우트

| 경로 | 설명 |
|---|---|
| `/` | AI 에이전트 채팅 |
| `/apps` | 앱 목록 |
| `/apps/error-report` | 에러 리포트 — AI 기반 스택 트레이스 분석 |
| `/admin` | 어드민 대시보드 |
| `/admin/mcp-servers` | MCP 서버 — 등록 및 연결 관리 |
| `/admin/personas` | 페르소나 — 커스텀 시스템 프롬프트를 가진 AI 페르소나 |
| `/admin/intents` | 인텐트 — 인텐트 라우팅 규칙 |
| `/admin/output-guard` | 아웃풋 가드 — 응답 필터링 규칙 + 감사 로그 |
| `/admin/tool-policy` | 툴 정책 — 채널별 툴 허용/차단 목록 |
| `/admin/scheduler` | 스케줄러 — cron 기반 MCP 툴 실행 |
| `/admin/clipping/*` | 클리핑 — 콘텐츠 관리 (카테고리, 소스, 페르소나, 통계) |

## 시작하기

### 사전 준비

- Node.js ≥ 20
- pnpm ≥ 9
- [Arc Reactor](https://github.com/StarkFactory/arc-reactor) 백엔드 (포트 8080)
- (선택) 클리핑 서비스 (포트 8083)

### 개발 환경 실행

```bash
pnpm install
pnpm dev    # http://localhost:3000
```

개발 서버 프록시 설정:

| 접두사 | 대상 |
|---|---|
| `/api/*` | `http://localhost:8080` |
| `/clipping-api/*` | `http://localhost:8083/api/*` |

### 프로덕션 빌드

```bash
pnpm build
pnpm preview
```

### Docker Compose

```bash
cp .env.example .env   # API 키 설정
docker compose up --build
```

- Web UI: http://localhost:3000
- Backend API: http://localhost:8080

## 테스트

```bash
pnpm test             # 단위 테스트 (단일 실행)
pnpm test:watch       # 단위 테스트 (watch 모드)
pnpm test:coverage    # 커버리지 리포트
pnpm test:e2e         # Playwright E2E 테스트
```

E2E 테스트 전 브라우저를 먼저 설치합니다:

```bash
pnpm dlx playwright install chromium
```

## 기술 스택

| 분류 | 라이브러리 | 버전 |
|---|---|---|
| 프레임워크 | React | 19 |
| 빌드 도구 | Vite | 7 |
| 언어 | TypeScript | 5.9 |
| 라우팅 | react-router-dom | 7 |
| 서버 상태 | TanStack Query | 5 |
| 클라이언트 상태 | Zustand | 5 |
| 폼 | react-hook-form + zod | 7 / 4 |
| HTTP 클라이언트 | ky | 1 |
| i18n | i18next + react-i18next | — |
| 단위 테스트 | Vitest + Testing Library | 4 |
| E2E 테스트 | Playwright | — |
| React 컴파일러 | babel-plugin-react-compiler | — |

## 아키텍처

### 데이터 페칭

서버 상태는 TanStack Query로 관리합니다. 각 도메인별로 전용 훅이 `src/hooks/`에 있습니다:

| 훅 파일 | 도메인 |
|---|---|
| `usePersonas.ts` | 페르소나 CRUD |
| `useIntents.ts` | 인텐트 규칙 CRUD |
| `useMcpServers.ts` | MCP 서버 관리 + 접근 정책 |
| `useOutputGuard.ts` | 아웃풋 가드 규칙, 감사 로그, 시뮬레이션 |
| `useToolPolicy.ts` | 채널 기반 툴 정책 |
| `useScheduler.ts` | 스케줄 작업 CRUD + 즉시 실행 |

쿼리 키는 `src/lib/queryKeys.ts`에서 중앙 관리합니다.

### HTTP 클라이언트

`src/lib/http.ts`는 두 개의 [ky](https://github.com/sindresorhus/ky) 인스턴스를 제공합니다:

- `api` — 메인 백엔드 (`/api/*`). JWT 주입, 401 로그아웃 처리, 일시적 오류 재시도.
- `clippingApi` — 클리핑 서비스 (`/clipping-api/admin/*`).

채팅 SSE 스트리밍은 네이티브 `fetch`를 사용합니다 (ky가 `ReadableStream`을 노출하지 않기 때문).

### 상태 관리

| 스토어 | 역할 |
|---|---|
| `authStore` | 사용자, 인증 상태, 로그인/로그아웃 액션 |
| `uiStore` | 퍼시스트 UI 설정 (테마, 언어, 사이드바) |

### 폼

모든 폼은 `zodResolver`와 함께 `react-hook-form`을 사용합니다. Zod 스키마는 `src/schemas/`에 있습니다.

### React 컴파일러

`annotation` 모드로 활성화되어 있습니다. 파일 상단에 `'use memo'` 디렉티브를 추가하면 자동 메모이제이션이 적용됩니다.

## 인증

JWT 기반 인증. 토큰은 `localStorage`의 `arc-reactor-auth-token` 키에 저장됩니다. `api` ky 인스턴스가 모든 요청에 토큰을 자동으로 주입하고, 401 응답 시 자동으로 제거합니다. 역할: `USER`, `ADMIN`.

## 에러 리포트

에러 리포트 앱(`/apps/error-report`)은 백엔드의 `POST /api/error-report`를 호출합니다.

| 필드 | 설명 |
|---|---|
| `stackTrace` | 프로덕션 에러의 전체 스택 트레이스 |
| `serviceName` | 에러가 발생한 서비스 이름 |
| `repoSlug` | 리포지토리 슬러그 (예: `my-org/my-service`) |
| `slackChannel` | Slack 채널 (예: `#error-alerts`) |
| `environment` | (선택) 환경 이름 |

백엔드에 `arc.reactor.error-report.api-key`가 설정된 경우, `X-API-Key` 헤더를 포함해야 합니다.

## 라이선스

[Apache License 2.0](LICENSE)

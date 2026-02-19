# Arc Reactor Web

Web chat UI for the [Arc Reactor](https://github.com/StarkFactory/arc-reactor) AI Agent framework.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5-FF4154.svg)](https://tanstack.com/query)

[한국어](README.ko.md)

## Language Policy

This is an open source project. **English is the default language for all repository artifacts:**

- Code comments and inline notes (`TODO`, `FIXME`, etc.)
- Pull request titles and descriptions
- Review comments and technical discussion in PRs/issues
- Commit messages

User-facing product text supports i18n and can be multilingual.

## Features

- Real-time streaming responses via SSE (Server-Sent Events)
- Session-based conversation management
- Dark / Light theme toggle
- i18n support (English, Korean)
- Persona management (CRUD, default persona)
- Optional JWT authentication with user isolation
- Responsive design (375px ~ 1440px)
- Markdown rendering with syntax highlighting
- Admin dashboard — MCP Servers, Personas, Intents, Output Guard, Tool Policy, Scheduler, Clipping

## Tech Stack

| Category | Library | Version |
|---|---|---|
| Framework | React | 19 |
| Build tool | Vite | 7 |
| Language | TypeScript | 5.9 |
| Routing | react-router-dom | 7 |
| Server state | TanStack Query | 5 |
| Client state | Zustand | 5 |
| Forms | react-hook-form + zod | 7 / 4 |
| HTTP client | ky | 1 |
| i18n | i18next + react-i18next | — |
| Unit tests | Vitest + Testing Library | 4 |
| E2E tests | Playwright | — |
| React Compiler | babel-plugin-react-compiler | — |

## Routes

| Path | Description |
|---|---|
| `/` | AI Agent Chat |
| `/apps` | Apps index |
| `/apps/error-report` | Error Report — AI-powered stack trace analysis |
| `/admin` | Admin Dashboard |
| `/admin/mcp-servers` | MCP Servers — register and manage MCP connections |
| `/admin/personas` | Personas — AI personas with custom system prompts |
| `/admin/intents` | Intents — intent routing rules |
| `/admin/output-guard` | Output Guard — response filtering rules + audit log |
| `/admin/tool-policy` | Tool Policy — per-channel tool allow/deny lists |
| `/admin/scheduler` | Scheduled Jobs — cron-based MCP tool execution |
| `/admin/clipping/*` | Clipping — content management (categories, sources, personas, stats) |

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- [Arc Reactor](https://github.com/StarkFactory/arc-reactor) backend running on port 8080
- (Optional) Clipping service on port 8083

### Development

```bash
pnpm install
pnpm dev    # http://localhost:3000
```

The dev server proxies:

| Prefix | Target |
|---|---|
| `/api/*` | `http://localhost:8080` |
| `/clipping-api/*` | `http://localhost:8083/api/*` |

### Production Build

```bash
pnpm build
pnpm preview
```

### Docker Compose

```bash
cp .env.example .env   # set API keys
docker compose up --build
```

- Web UI: http://localhost:3000
- Backend API: http://localhost:8080

## Testing

```bash
pnpm test             # unit tests (single run)
pnpm test:watch       # unit tests (watch mode)
pnpm test:coverage    # coverage report
pnpm test:e2e         # Playwright E2E tests
```

For E2E tests, install the browser first:

```bash
pnpm dlx playwright install chromium
```

## Architecture

### Data Fetching

Server state is managed by TanStack Query. Each domain has a dedicated hook in `src/hooks/`:

| Hook file | Domain |
|---|---|
| `usePersonas.ts` | Persona CRUD |
| `useIntents.ts` | Intent rule CRUD |
| `useMcpServers.ts` | MCP server management + access policy |
| `useOutputGuard.ts` | Output guard rules, audit log, simulation |
| `useToolPolicy.ts` | Channel-based tool policy |
| `useScheduler.ts` | Scheduled job CRUD + trigger |

Query keys are centralised in `src/lib/queryKeys.ts`.

### HTTP Client

`src/lib/http.ts` exports two [ky](https://github.com/sindresorhus/ky) instances:

- `api` — main backend (`/api/*`). Injects JWT, handles 401 logout, retries on transient errors.
- `clippingApi` — clipping service (`/clipping-api/admin/*`).

SSE streaming for chat uses native `fetch` (ky does not expose `ReadableStream`).

### State Management

| Store | Purpose |
|---|---|
| `authStore` | User, auth status, login/logout actions |
| `uiStore` | Persisted UI preferences (theme, language, sidebar) |

### Forms

All forms use `react-hook-form` with `zodResolver`. Zod schemas are in `src/schemas/`.

### React Compiler

Enabled in `annotation` mode. Add `'use memo'` at the top of a file to opt it in for automatic memoization.

## Auth

JWT-based. Token stored in `localStorage` as `arc-reactor-auth-token`. The `api` ky instance attaches it to every request and clears it automatically on 401. Roles: `USER`, `ADMIN`.

## Error Report

The Error Report app (`/apps/error-report`) calls `POST /api/error-report` on the backend.

| Field | Description |
|---|---|
| `stackTrace` | Full stack trace from the production error |
| `serviceName` | Service name where the error occurred |
| `repoSlug` | Repository slug (e.g. `my-org/my-service`) |
| `slackChannel` | Slack channel (e.g. `#error-alerts`) |
| `environment` | (Optional) Environment name |

If the backend has `arc.reactor.error-report.api-key` configured, include the `X-API-Key` header.

## License

[Apache License 2.0](LICENSE)

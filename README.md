# Arc Reactor Web

Web chat UI for the [Arc Reactor](https://github.com/StarkFactory/arc-reactor) AI Agent framework.

## Features

- Real-time streaming responses via SSE (Server-Sent Events)
- Session-based conversation management
- Dark / Light theme toggle
- i18n support (English, Korean)
- Persona management (CRUD, default persona)
- Optional JWT authentication with user isolation
- Responsive design (375px ~ 1440px)
- Markdown rendering with syntax highlighting
- Admin dashboard with Error Report, MCP Server, and Persona management

## Routes

| Path | Description |
|------|-------------|
| `/` | AI Agent Chat — main conversation interface |
| `/admin` | Admin Dashboard — system overview and quick actions |
| `/admin/error-report` | Error Report — submit production errors for AI-powered analysis |
| `/admin/mcp-servers` | MCP Servers — manage Model Context Protocol server connections |
| `/admin/personas` | Personas — manage AI personas with custom system prompts |

## Getting Started

### Prerequisites

- Node.js 18+
- [Arc Reactor](https://github.com/StarkFactory/arc-reactor) backend running on port 8080

### Development

```bash
npm install
npm run dev    # http://localhost:3000
```

The dev server proxies `/api` requests to `http://localhost:8080`.

### Docker Compose

Run backend and frontend together:

```bash
# Set API keys in .env
cp .env.example .env

# Start
docker compose up --build
```

- Web UI: http://localhost:3000
- Backend API: http://localhost:8080

## Admin Dashboard

Access the admin dashboard at `/admin`. It provides:

- **Dashboard** — Overview of MCP servers, personas, and error report API status
- **Error Report** — Submit stack traces for AI analysis. The agent inspects the source repository (via Bitbucket MCP), creates Jira issues, and sends a detailed report to Slack
- **MCP Servers** — Register, connect, and manage MCP servers that provide tools to the AI agent
- **Personas** — Create and manage AI personas with custom system prompts

### Error Report API

The admin UI calls `POST /api/error-report` on the backend. Required fields:

| Field | Description |
|-------|-------------|
| `stackTrace` | Full stack trace from the production error |
| `serviceName` | Name of the service where the error occurred |
| `repoSlug` | Repository slug (e.g. `my-org/my-service`) |
| `slackChannel` | Slack channel for the error report (e.g. `#error-alerts`) |
| `environment` | (Optional) Environment name (e.g. `production`) |

If the backend has `arc.reactor.error-report.api-key` configured, the `X-API-Key` header must be provided.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8080` |

## Tech Stack

- React 19 + TypeScript
- Vite
- react-router-dom (client-side routing)
- i18next (English / Korean)
- Playwright (E2E testing)
- Nginx (production)

## E2E Testing

```bash
npx playwright install chromium
npx playwright test                    # headless
npx playwright test --headed           # visible browser
```

## License

[Apache License 2.0](LICENSE)

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

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8080` |

## Tech Stack

- React 19 + TypeScript
- Vite
- i18next
- Nginx (production)

## License

[Apache License 2.0](LICENSE)

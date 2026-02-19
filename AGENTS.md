# AGENTS.md

This file provides guidance for agents working in this repository.

## Language Policy

This is an open source project. **All of the following must be written in English:**

- Code (variable names, function names, type names)
- Comments and documentation in source files
- Commit messages
- Pull request titles and descriptions
- PR review comments and code review feedback
- Issue titles and issue descriptions

User-facing UI text follows i18n policy and can be multilingual. Internal team chat can use any language, but all repository artifacts must default to English.

## Package Manager

**Always use `pnpm`.** Never use `npm` or `yarn`.

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server
pnpm build            # production build
pnpm test             # run unit tests (vitest)
pnpm test:watch       # vitest watch mode
pnpm test:coverage    # coverage report
pnpm test:e2e         # playwright e2e tests
pnpm lint             # eslint
```

## Tech Stack

| Category | Library |
|---|---|
| Framework | React 19 + Vite 7 + TypeScript 5.9 |
| Routing | react-router-dom v7 |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Forms | react-hook-form v7 + zod v4 + @hookform/resolvers |
| HTTP | ky v1 |
| i18n | i18next + react-i18next (EN / KO) |
| Unit tests | Vitest v4 + @testing-library/react + jsdom |
| E2E tests | Playwright |
| React Compiler | babel-plugin-react-compiler (annotation mode) |

## Project Structure

```
src/
  components/
    admin/        # Admin dashboard pages and layout
    apps/         # Apps section (AppsPage, ErrorReportPage)
    auth/         # LoginPage
    chat/         # Chat UI (ChatArea, message list, input)
    common/       # Shared UI components
    layout/       # Header, Sidebar
    settings/     # Settings panel and manager components
  context/        # AuthContext, ChatContext (legacy React context)
  hooks/          # TanStack Query hooks per domain
    __tests__/    # Unit tests for hooks
  i18n/           # i18next setup, en/ko locale files
  lib/
    http.ts       # ky instances (api, clippingApi) + auth hooks
    queryClient.ts
    queryKeys.ts  # Centralised query key factory
  schemas/        # Zod schemas (one file per domain)
  services/       # Raw API call functions
  stores/
    authStore.ts  # Zustand: auth state + login/logout
    uiStore.ts    # Zustand persist: UI preferences
  types/          # TypeScript type definitions
  utils/          # Helpers (api-client, etc.)
e2e/              # Playwright tests
```

## Working Principles

1. **Prefer TanStack Query** for all server state. Do not manage remote data with `useState` + `useEffect`.
2. **Never call `fetch` directly in components.** Use `src/services/` functions via `src/hooks/` only.
3. **Use `react-hook-form` + `zod`** for any non-trivial form. Schema goes in `src/schemas/`.
4. **No hardcoded user-facing strings.** Add i18n keys to `src/i18n/` locale files.
5. **Verify admin guards** (`isAdmin` / role check) when adding or changing admin-only features.
6. **Do not add manual memoization** (`useMemo`, `useCallback`, `React.memo`) without justification — the React Compiler handles this automatically for opted-in files.
7. **Validate changes with tests** — at minimum `pnpm lint` + related unit tests; include E2E tests for route or auth changes.

## Data Fetching Patterns

### Server state → TanStack Query hooks

All server data lives in `src/hooks/use<Domain>.ts`. Do not call service functions directly in components.

```typescript
// hooks/usePersonas.ts
export function usePersonas() { ... }          // useQuery
export function useCreatePersona() { ... }     // useMutation
export function useUpdatePersona() { ... }     // useMutation
export function useDeletePersona() { ... }     // useMutation
```

Query keys are centralised in `src/lib/queryKeys.ts` — always use them, never inline strings.

### HTTP client

Use the `api` instance from `src/lib/http.ts` in service files. Do not use `fetch` directly (except `streamChat` which uses SSE).

```typescript
import { api } from '../lib/http'

export async function getPersonas(): Promise<Persona[]> {
  return api.get('personas').json<Persona[]>()
}
```

### Forms → react-hook-form + Zod

All forms use `useForm` with `zodResolver`. Schema files live in `src/schemas/`.

```typescript
const form = useForm<SchedulerFormInput>({
  resolver: zodResolver(SchedulerFormSchema),
  defaultValues: EMPTY_SCHEDULER_FORM,
})
```

### Client state → Zustand

- `useAuthStore` — auth (user, token, login/logout)
- `useUiStore` — persisted UI preferences (theme, sidebar, language)

## Routing

| Path | Component |
|---|---|
| `/*` | ChatPage (default) |
| `/apps` | AppsPage |
| `/apps/error-report` | ErrorReportPage |
| `/admin` | DashboardPage |
| `/admin/mcp-servers` | McpServersPage |
| `/admin/personas` | PersonasPage |
| `/admin/intents` | IntentsPage |
| `/admin/output-guard` | OutputGuardPage |
| `/admin/tool-policy` | ToolPolicyPage |
| `/admin/scheduler` | SchedulerPage |
| `/admin/clipping/categories` | ClippingCategoriesPage |
| `/admin/clipping/sources` | ClippingSourcesPage |
| `/admin/clipping/personas` | ClippingPersonasPage |
| `/admin/clipping/stats` | ClippingStatsPage |

## Dev Server Proxy

Configured in `vite.config.ts`:

- `/api/*` → `http://localhost:8080` (main Arc Reactor backend)
- `/clipping-api/*` → `http://localhost:8083/api/*` (Clipping service)

## Auth

JWT stored in `localStorage` as `arc-reactor-auth-token`. The `api` ky instance injects it via `beforeRequest` hook and clears it on 401. Roles: `USER`, `ADMIN`.

## React Compiler

Running in `annotation` mode — files must have the `'use memo'` directive at the top to opt in. Switch to `'infer'` mode once the migration is complete.

## Testing

Unit tests go in `src/hooks/__tests__/` (hooks) or co-located with components. Follow the existing pattern: mock `src/lib/http` and wrap with `QueryClientProvider`.

```typescript
vi.mock('../../lib/http', () => ({ api: { get: vi.fn(), post: vi.fn(), ... } }))
```

E2E tests are in `e2e/` and run against the live dev server.

## i18n

Translation files are in `src/i18n/`. Always use `useTranslation` hook and `t()` for user-visible strings. Supported locales: `en`, `ko`.

## PR Checklist

Before submitting a pull request:

- [ ] No route or auth regression
- [ ] Loading / error / empty states handled
- [ ] No missing i18n keys
- [ ] `pnpm lint` and related unit tests pass
- [ ] E2E tests pass for route or auth changes
- [ ] Docs updated if behavior changed (README, relevant PRD)

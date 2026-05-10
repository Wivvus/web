# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repositories

This project spans two repos that are developed together:
- **`/Wivvus/web`** — Angular 17 frontend (this repo)
- **`/Wivvus/api`** — Go/Gin backend (`/home/phil/proyectos/src/github.com/Wivvus/api`)

Issues and tasks are tracked in the **[Run Wivvus](https://github.com/orgs/Wivvus/projects/2)** GitHub project.

## Commands

### Frontend (this repo)
```bash
npx ng serve --host 127.0.0.1 --port 4200   # dev server
npx ng build                                  # production build
npx ng test                                   # run unit tests
```

### Backend (`/Wivvus/api`)
```bash
# Requires env vars — load from wivvus.env first:
source wivvus.env && go run cmd/api/main.go

# Or build and run:
go build -o /tmp/wivvus-api ./cmd/api/ && source wivvus.env && /tmp/wivvus-api

# Postgres via podman (if not already running):
make start-postgres
```

### Git remotes
- **web** repo: remote is `upstream` → `git push upstream main`
- **api** repo: remote is `upstream` → `git push upstream main`

## Frontend architecture

**Angular 17, standalone components** — no NgModules. Every component declares its own `imports: []`.

**Folder structure:**
- `src/components/` — one folder per feature, each containing `.component.ts`, `.template.html`, `.style.less`
- `src/services/` — `api/api.service.ts` (all HTTP calls), `authentication/auth.service.ts`, `metrics/metrics.service.ts`, `location/`
- `src/models/event.model.ts` — shared TypeScript interfaces (`Event`, `EventOption`, `RatingInfo`, etc.)
- `src/environments/` — `environment.development.ts` is used in source imports; Angular's `fileReplacements` in `angular.json` swaps it for `environment.ts` during production builds. **Do not change the import path.**
- `src/guards/auth/` — `authGuard` for route protection

**Routing** (`src/app/app.routes.ts`):
- `/` — EventsListComponent (map + list)
- `/run/:id` — EventDetailComponent
- `/run/create`, `/run/:id/edit` — create/edit forms (auth-guarded)
- `/events/:id`, `/events/create`, `/events/:id/edit` — legacy redirects to `/run/...`
- `/account` — AccountComponent (auth-guarded)
- `/login`, `/register`, `/set-password` — auth flows
- `/auth/google/callback` — OAuth2 code exchange

**Auth flow:**
- Tokens and user info stored in `localStorage` (`id_token`, `user_info`, `auth_provider`)
- `AuthService` decodes JWTs client-side for expiry checks only; validation is server-side
- Two auth paths: Google OAuth2 redirect flow (via `getGoogleOAuthUrl()` + callback component) and email/password
- `X-Auth-Provider` header sent with requests so backend knows which token type to verify

**Styling:** LESS with CSS custom properties defined globally (`--red`, `--yellow`, `--font`, `--radius-sm`, `--shadow-sm`, etc.). Component styles are scoped via Angular's view encapsulation.

## Backend architecture

**Go + Gin**, entry point at `cmd/api/main.go`. Package layout under `internal/`:

| Package | Responsibility |
|---------|---------------|
| `app/` | Router setup — delegates to `auth`, `events`, `ratings` sub-packages |
| `models/` | GORM models + repo types. `ConnectDB` runs `AutoMigrate` on startup. All DB access goes through repo structs (e.g. `EventRepo`, `AttendanceRepo`). |
| `middleware/` | `AuthRequired()` gin middleware; verifies either a local JWT (`X-Auth-Provider: local`) or a Google OIDC token. Sets `"user"` in gin context. |
| `tokens/` | HS256 JWT sign/verify; 30-day expiry; initialised with `JWT_SECRET` env var |
| `storage/` | DigitalOcean Spaces (S3-compatible) for avatar uploads. Google avatars are lazily copied to Spaces on first authenticated request. |
| `reminders/` | Background goroutine sending email reminders 12 hours before events |
| `email/` | Email sending (verification, password reset, reminders) |
| `metrics/` | PostHog event tracking |

**Models pattern:** Each domain type has a `*Repo` struct with methods that take/return plain structs. `ToAPI()` methods on models produce API-safe decorator structs (strips internal fields, joins related data). The `db` variable is package-level in `models/` — all repos share it.

**Required env vars** (see `wivvus.env`):
`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DB`, `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_BUCKET`, `DO_SPACES_REGION`, `DO_SPACES_ENDPOINT`, `APP_URL`

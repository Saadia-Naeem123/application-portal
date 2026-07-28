# Coding Standards & Conventions — Phase 1

## General
- Language: TypeScript on the frontend, modern JavaScript (ES2022, CommonJS
  modules) on the backend.
- Indentation: 2 spaces. No tabs.
- Semicolons: required.
- Strings: single quotes in JS/TS, except JSX attributes (double quotes).
- Max line length: soft limit ~100 chars.

## Naming
- Files: `kebab-case` for multi-word files, `PascalCase` for React components
  (e.g. `LoginForm.tsx`), `camelCase.service.js` / `camelCase.controller.js`
  for backend modules.
- Variables & functions: `camelCase`.
- Classes & React components: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Database tables/columns: `PascalCase` model names, `camelCase` fields
  (Prisma convention), mapped to `snake_case` in Postgres via `@@map`/`@map`
  if the team prefers snake_case in SQL.

## Git & branching
- `main` — always deployable.
- `develop` — integration branch.
- Feature branches: `feature/<phase>-<short-description>`
  (e.g. `feature/phase2-jwt-auth`).
- Commit messages: [Conventional Commits](https://www.conventionalcommits.org/)
  — `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`.

## API conventions
- All routes versioned under `/api/v1`.
- All responses use the `ApiResponse` / `ApiError` shape (see `docs/api-plan.md`).
- Validation happens in middleware (`express-validator`) before it reaches a
  controller — controllers assume the payload is already valid.
- Never return `passwordHash` or raw tokens in any API response.

## Security conventions
- Passwords hashed with bcrypt (cost factor 12).
- All tokens (email verification, password reset, refresh) stored as
  SHA-256 hashes in the DB — the plaintext token only ever exists in the
  emailed link or the client's memory.
- Secrets only via environment variables, never hard-coded, never committed
  (`.env` is git-ignored; `.env.example` documents required keys).

## Frontend conventions
- Functional components + hooks only, no class components.
- Shared UI primitives live in `components/ui/`; page-specific forms live in
  `components/forms/`.
- All API calls go through `lib/api.ts` (single Axios instance) — no ad-hoc
  `fetch` calls scattered across components.
- Auth/session state lives in `context/AuthContext.tsx`; components read it
  via a `useAuth()` hook, never read tokens from `localStorage` directly.

## Testing (baseline expectation for later phases)
- Backend: unit tests for services (Jest), integration tests for auth routes.
- Frontend: component tests for forms (React Testing Library).
- This scaffold ships without a test suite yet — treat writing one as an early
  Phase 3 task before adding business-logic complexity.

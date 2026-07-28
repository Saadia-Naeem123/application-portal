# System Architecture — Phase 1

## 1. Architecture Style
Multi-tier web application:

```
┌─────────────────────────┐
│        Frontend         │   React / Next.js + TypeScript + Tailwind
└───────────┬─────────────┘
            │ REST API (HTTPS + JWT)
            ▼
┌─────────────────────────┐
│      Backend API        │   Node.js + Express.js
└───────────┬─────────────┘
            │
 ┌──────────┼───────────────────────────────┐
 ▼          ▼                               ▼
Auth &   Business Logic              Notification Service
RBAC     (Routing • Workflow •       (Email now, In-App/SMS
JWT       Escalation — later phases)  in later phases)
            │
            ▼
┌─────────────────────────┐
│      PostgreSQL          │   via Prisma ORM
└─────────────────────────┘
```

## 2. Technology Stack (confirmed for this build)

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| API calls | Axios |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access + refresh) + bcrypt |
| Email | Nodemailer (SMTP) |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |

## 3. Environments
- **Development**: local Postgres, `.env` files, console-logged emails if SMTP not set.
- **Production** (recommended, per original proposal): Vercel (frontend), Render (backend), Neon/managed Postgres.

## 4. Core Design Decisions for Phase 1 & 2
1. **Single `User` table with a `role` enum** rather than one table per role.
   Role-specific fields (registration number, department, semester, employee
   ID, supervisor selection) are optional columns on the same table. This
   keeps auth/RBAC simple while still supporting all 7 roles from the spec.
2. **Supervisors are Users with role `ACADEMIC_SUPERVISOR`**, flagged
   `isActiveSupervisor`, so the registration dropdown is just
   `SELECT * FROM users WHERE role='ACADEMIC_SUPERVISOR' AND isActiveSupervisor=true`
   — matching the "supervisor list is not hardcoded" requirement.
3. **JWT access token (short-lived) + refresh token (long-lived, httpOnly cookie)**
   for session management, per the security requirements.
4. **Email verification** required before login (`isEmailVerified` flag),
   token stored hashed with an expiry.
5. **RBAC middleware** (`requireRole(...roles)`) protects routes; this is the
   hook later phases (application routing, approvals, escalation) will build on.

## 5. What's deliberately deferred to later phases
Per the roadmap you shared, only Phase 1 (foundation) and Phase 2 (auth/user
management) are built here. Not included yet: application submission,
department routing engine, approval workflow, reminders, working-day deadline
engine, escalation engine, calendar module, analytics dashboard, document
management, in-app notifications. The schema and folder structure are laid
out so those phases slot in without refactoring auth.

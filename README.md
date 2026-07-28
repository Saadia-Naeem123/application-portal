# Smart University Complaint & Application Management System

This repository contains **Phase 1 (Project Foundation & System Architecture)**,
**Phase 2 (Authentication & User Management)**, **Phase 3 (Administration &
Master Data Management)**, **Phase 4 (Application Submission Module)**,
**Phase 5 (Intelligent Workflow & Routing Engine)**, **Phase 6 (Deadline,
Reminder & Escalation Engine)**, **Phase 7 (Communication & Notification
System)**, **Phase 8 (Search, Tracking & Analytics)**, **Phase 9
(Security, Optimization & Quality Assurance)**, and **Phase 10 (Dean
Portal)** of the system described in the project overview.

## What's included

```
university-system/
├── docs/                     # Deliverables (architecture, schema, API plan, wireframes...)
├── backend/                  # Node.js + Express + Prisma + PostgreSQL API
└── frontend/                 # Next.js + TypeScript + Tailwind client (Phase 2 auth UI + Phase 8 search/analytics UI)
```

## Phase 1 deliverables (in `/docs`)

- `architecture.md` — overall system architecture & tech stack
- `database-schema.md` — full ER description + Prisma schema explanation
- `api-plan.md` — REST API route plan (Phase 1-6 endpoints)
- `folder-structure.md` — annotated folder/file layout for backend & frontend
- `coding-standards.md` — naming, linting, commit, and branching conventions
- `wireframes.md` — text/ASCII wireframes & navigation flow for the UI

## Phase 2 deliverables (in `/backend` and `/frontend`)

Fully working code for:

- User registration (Student, Faculty, Staff, Academic Supervisor, Department
  Officer, Dean, Administrator)
- Email verification
- Login with JWT (access + refresh tokens)
- Forgot password / reset password
- Password encryption (bcrypt)
- Role-Based Access Control (RBAC) middleware
- User profile management (view/update)
- Role-based dashboard shells (Student, Faculty/Staff, Supervisor, Department
  Officer, Dean, Admin)

## Phase 3 deliverables (in `/backend`, API only — no admin UI yet)

- Department management (`/departments`)
- Application type management (`/application-types`), including default
  priority and SLA hours per type
- Routing rule management (`/routing-rules`) — a focused view over each
  application type's department + supervisor-approval requirement
- University holiday management (`/holidays`) and semester break management
  (`/semester-breaks`), plus a merged `/calendar` dashboard endpoint
- Role permission matrix (`/permissions`) layered on top of the fixed RBAC roles
- Admin user management: create any-role user (incl. supervisors) with a
  generated temporary password, edit, activate/deactivate/remove, activate/
  deactivate supervisors, reassign roles — all on `/users`

## Phase 4 deliverables (in `/backend`, API only — no submission UI yet)

- Application creation, draft saving, and editing (`/applications`)
- Unique, human-readable application tracking number generated at creation
- File upload with type/size validation (PDF, Word, JPEG, PNG, WEBP; 10MB/
  file, 5 files/request) and secure, access-controlled download
- Submission with automatic department (and, where required, supervisor)
  routing, sourced from Phase 3's routing rules
- Applicant's own application history, with status/pagination filtering

## Phase 5 deliverables — Intelligent Workflow & Routing Engine (in `/backend`)

- **Approval hierarchy**: Applicant → Academic Supervisor (if required) →
  Department → *final decision*, modeled as a `WorkflowStage` orthogonal to
  the existing `ApplicationStatus`, so it layers on top of Phase 4 without a
  breaking schema change.
- **Approval actions** on `/applications/:id/...`: `approve`, `reject`,
  `request-info` / `provide-info`, `forward` (to a specific reviewer, same
  stage or the next one up), `close` (archive a decided application).
- **Comment system** (`/applications/:id/comments`) — a permanent,
  role-visible message thread attached to each application.
- **Activity timeline / workflow history** (`/applications/:id/history`) —
  every action (submit, approve, reject, info request, forward, escalate,
  comment, reminder, close) logged with actor, timestamp, and remarks.
- **Workflow status** (`/applications/:id/workflow`) — current stage, who's
  holding it, the deadline, and remaining working hours, for a countdown-timer
  style UI.
- A new `isDepartmentHead` flag on `DEPARTMENT_OFFICER` users (admin-managed
  via `/users/:id/department-head-flag`) — the authorized reviewer for the
  Department Head escalation level.

## Phase 6 deliverables — Deadline, Reminder & Escalation Engine (in `/backend`)

- **Working-day deadline calculation** (`utils/workingHours.js`) — every
  stage's SLA (`ApplicationType.slaWorkingHours`, default 72) is measured in
  working hours, automatically skipping Saturdays, Sundays, university
  holidays, and active semester breaks, driven live off the Phase 3 calendar.
- **Smart reminder system** — an hourly sweep sends reminders at 24 / 48 / 60
  working hours elapsed (and a final pre-deadline nudge), by email and as an
  in-app notification, without re-sending the same threshold twice.
- **Automatic escalation** — an application that misses its deadline is
  escalated one level up the hierarchy (Supervisor → Department → Department
  Head → Dean → Admin), logged permanently in `EscalationRecord`, with
  everyone involved notified.
- **In-app notification feed** (`/notifications`) — powers "Dashboard alerts".
- **Admin "run now" endpoints** (`/admin/jobs/reminders/run`,
  `/admin/jobs/escalations/run`) — trigger a sweep on demand for testing/demos
  instead of waiting for the hourly cron tick.
- Scheduler is a single `node-cron` job in-process (`SCHEDULER_CRON`,
  default hourly; `SCHEDULER_ENABLED=false` to disable — e.g. behind a load
  balancer where only one instance should run it).

> Phases 5 & 6 are backend-only, same as Phase 3 & 4 — the workflow/reminder/
> escalation data is all there for a future frontend (reviewer inbox, comment
> thread, countdown timer, notification bell) to consume.

## Phase 7 deliverables — Communication & Notification System (in `/backend`)

- **Comment threads & conversation history** — unchanged from Phase 5
  (`ApplicationComment`), now with **attachment sharing**: a comment can be
  posted with up to 3 files (PDF/Word/JPEG/PNG/WEBP, 10MB each) via
  `POST /applications/:id/comments`, stored as `CommentAttachment` rows and
  downloadable via `GET /applications/:id/comments/:commentId/attachments/:attachmentId/download`.
- **Notification center** — `GET /notifications` now supports `?type=` in
  addition to `?isRead=`, plus a lightweight `GET /notifications/unread-count`
  for a bell-icon badge.
- **Read/unread status** — unchanged from Phase 6 (`isRead`, mark-one /
  mark-all-read).
- **Notification preferences** — `GET`/`PATCH /notifications/preferences`:
  per-user toggles for `emailEnabled` / `inAppEnabled` / `smsEnabled`, plus
  `mutedTypes` to silence one notification type (e.g. `COMMENT`) across every
  channel. Every workflow/reminder/escalation notification is dispatched
  through one function (`workflow.service.js#notify()`), which now checks
  each recipient's preferences before creating the in-app row or sending
  email/SMS — so the rule is enforced consistently everywhere, not
  per-caller.
- **SMS integration (optional)** — `services/sms.service.js`, same
  provider-agnostic, dev-mode-logs-instead-of-sends pattern as email
  (`SMS_API_URL` / `SMS_API_KEY` / `SMS_FROM`). Off by default
  (`smsEnabled: false`); requires the recipient to also have a
  `phoneNumber` on file.
- `Notification.channels` records which channel(s) a given notification
  actually went out on at send time, for display in the notification center.

> Not yet built: analytics & reporting dashboard, advanced search/filtering
> UI, and the frontend for any of Phases 3-7.

## Phase 8 deliverables — Search, Tracking & Analytics (in `/backend` and `/frontend`)

- **Advanced search & multi-level filters** — `GET /api/v1/search/applications`
  filters by application #, applicant name, registration/employee number,
  department, supervisor, application type, priority, status, assigned
  officer, submission date range, and overdue/near-deadline, scoped by role
  the same way `application.service.js#assertCanView` already scopes single
  applications (privileged roles see everything, everyone else sees only
  what they submitted/supervise/were assigned).
- **Application tracking / status timeline** — `GET /api/v1/applications/:id/tracking`
  returns a tracker-friendly view (current status, a 0–100 progress
  percentage, overdue flag, deadline) built from the same
  `ApplicationHistory` rows Phase 5's `.../history` endpoint already
  exposes. Frontend: `/tracking/:id` renders it as a progress bar +
  timeline.
- **Analytics dashboard** — `GET /api/v1/analytics/overview` returns totals
  by status, overdue/near-deadline counts, average resolution time, top
  application categories, and a 12-month submission trend. Scoped per role
  (system-wide for Admin/Dean/Department Officer, own supervised
  applications for an Academic Supervisor, own submissions for everyone
  else) so it powers a personal "my activity" widget as well as a full
  admin dashboard. Frontend: `/analytics` renders stat cards + charts
  (recharts).
- **Reporting module** — `GET /api/v1/analytics/departments` and
  `/api/v1/analytics/supervisors` (Admin/Dean/Department Officer only)
  compute per-department and per-supervisor performance (totals,
  approved/rejected/pending, overdue, average resolution time).
- **Export to PDF / Excel** — `GET /api/v1/search/applications/export` and
  `GET /api/v1/analytics/export?type=overview|departments|supervisors`
  stream the same data as a `.pdf` or `.xlsx` file (`?format=pdf|xlsx`),
  via a shared `export.service.js` (pdfkit + exceljs) so every export looks
  and behaves consistently.

> No schema changes were needed for Phase 8 — it's a read/reporting layer
> over the `Application`/`ApplicationHistory`/`Department`/`User` data Phases
> 3-7 already write.

## Phase 9 deliverables — Security, Optimization & Quality Assurance (in `/backend` and `/frontend`)

Full write-up (audit findings, before/after table, UAT checklist) is in
[`docs/phase9-security-qa.md`](docs/phase9-security-qa.md). Summary:

- **Security hardening**: per-account login rate limiting (on top of the
  existing per-IP limit) to slow credential stuffing; API-wide rate
  limiting beyond just `/auth`; fail-fast startup in production if JWT
  secrets are missing or weak; a dedicated security **audit log**
  (`backend/logs/audit.log`) for logins and authorization denials.
- **Structured logging**: `backend/src/utils/logger.js` replaces ad-hoc
  `console.log`/`console.error` calls with leveled, file-backed logging
  (`app.log`, `error.log`, `audit.log`).
- **Performance**: gzip/deflate response compression; matched request body
  size limits across JSON and URL-encoded parsers.
- **Responsive design**: the global navbar now collapses into a mobile menu
  below the `md` breakpoint instead of overflowing on phone-width screens.
- **Automated tests**: a new Jest + Supertest suite under `backend/tests/`
  (unit tests for the working-hours engine, token service, and response
  helpers; integration tests for auth, RBAC/IDOR protection, and core app
  wiring) — see `docs/phase9-security-qa.md` §4 for how to run it.
- **UAT checklist**: a manual test-pass checklist covering auth, applications,
  workflow/deadlines, and search/analytics — `docs/phase9-security-qa.md` §5.

## Phase 10 deliverables — Dean Portal (in `/backend` and `/frontend`)

The Dean only ever handles escalated/special-approval cases — once an
application reaches `currentStage: DEAN`, it shows up in the Dean Portal.

- **Frontend pages** under `/dean/*`: Escalated Applications
  (`/dean/escalated`) and Department Performance (`/dean/performance`),
  plus a `DeanDashboard` widget wired into the existing shared `/dashboard`
  shell (total/pending escalations, average department response, overdue
  departments). Reports/Calendar/Notifications/Profile reuse the same
  generic pages every privileged role gets.
- **Two new Dean-only decisions** on `ReviewActionPanel`, alongside the
  existing Approve/Reject: **Return to Department**
  (`PATCH /applications/:id/return-to-department`) and **Request
  Investigation** (`PATCH /applications/:id/request-investigation`) — see
  `docs/api-plan.md` for details. Both require `remarks` and are logged to
  the application's activity timeline (`RETURNED_TO_DEPARTMENT` /
  `INVESTIGATION_REQUESTED` — two new `WorkflowAction` enum values, so run
  `npx prisma migrate dev` after pulling this change).
- **`GET /analytics/dean-overview`** (Dean/Admin only) powers the dashboard
  stat cards; `GET /analytics/departments` now also returns an
  `escalationCount` per department; `GET /search/applications` accepts an
  optional `?currentStage=` filter so the Dean's queue only shows
  DEAN-level escalations, not every escalation level.

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Backend setup

```bash
cd backend
cp .env.example .env        # fill in your DB URL, JWT secrets, SMTP creds
npm install
npx prisma migrate dev --name phase-5-6-workflow-and-escalation
npx prisma generate
npm run dev                 # starts on http://localhost:5000
```

### 2. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev                 # starts on http://localhost:3000
```

### 3. Try it out
1. Visit `http://localhost:3000/register`, create an account (pick a role).
2. Check the backend console — in dev mode without real SMTP creds, the
   verification email content/link is logged to the console instead of sent.
3. Click / paste the verification link, then log in at `/login`.
4. You'll land on a role-based `/dashboard`.
5. Try `/forgot-password` → `/reset-password` to test the password reset flow.
6. Phase 3-6 don't have frontend pages yet — exercise them with a REST
   client (Postman/Insomnia/curl) against `http://localhost:5000/api/v1`,
   using the `accessToken` from login as a Bearer token. A typical admin
   needs to seed at least one `Department` and one `ApplicationType` before
   a student can submit an application against it.
7. Submit an application as a student, then approve/forward/comment on it as
   the assigned supervisor/department officer (`PATCH .../approve`, etc.) —
   check `GET .../workflow` and `.../history` to see the effect.
8. To see reminders/escalation without waiting for the deadline, either
   backdate a `Holiday`/lower an `ApplicationType.slaWorkingHours` to force
   an application overdue, then call `POST /admin/jobs/reminders/run` or
   `/admin/jobs/escalations/run` as an admin.
9. Once you have a few applications in different states, visit `/search` to
   filter/export them and `/analytics` for the dashboard + department/
   supervisor reports (the report tables and their exports only show up for
   Admin/Dean/Department Officer). Click an application number in the
   search results to see its `/tracking/:id` timeline.

## Notes on scope & production-readiness

This is a real, runnable foundation, not a mockup — but before production you
should still:
- Point `EMAIL_*` env vars at a real SMTP provider (e.g. SendGrid, SES) — Nodemailer is already wired up.
- Set strong, unique values for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` —
  as of Phase 9, the app now refuses to start in production if these are
  missing, too short, or identical to each other.
- Put the API behind HTTPS and set `NODE_ENV=production`.
- Review the rate-limiting config in `backend/src/app.js` for your traffic.
- Run `npm audit --production` in `backend/` and `frontend/`, and `npm
  install && npm test` in `backend/`, as part of your CI pipeline (see
  `docs/phase9-security-qa.md`) — neither could be run inside the sandbox
  this Phase 9 pass was written in.
- If you run more than one API instance, set `SCHEDULER_ENABLED=false` on all
  but one, so the hourly reminder/escalation sweep doesn't run (and double-send) on every instance.
- Move attachment storage off local disk (`backend/uploads/`) onto Cloudinary
  or S3 per the suggested tech stack — the local disk implementation works
  but won't survive a redeploy on most hosting platforms.
- Build the frontend admin panel and application-submission UI — Phase 3 & 4
  above are backend-only so far.

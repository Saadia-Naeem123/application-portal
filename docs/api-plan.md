# API Plan — Phase 1-4

Base URL (dev): `http://localhost:5000/api/v1`

All request/response bodies are JSON. Authenticated routes expect
`Authorization: Bearer <accessToken>`. File upload routes (attachments) expect
`multipart/form-data` instead.

## Auth routes — `/auth`

| Method | Route | Auth? | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new user (any role). Sends verification email. |
| GET | `/auth/verify-email/:token` | No | Verify email using the emailed token. |
| POST | `/auth/resend-verification` | No | Resend verification email (body: `{ email }`). |
| POST | `/auth/login` | No | Login with email + password. Returns access token + sets refresh-token httpOnly cookie. |
| POST | `/auth/refresh` | No (uses cookie) | Exchange refresh token cookie for a new access token. |
| POST | `/auth/logout` | Yes | Revoke current refresh token, clear cookie. |
| POST | `/auth/forgot-password` | No | Send password reset email (body: `{ email }`). |
| POST | `/auth/reset-password/:token` | No | Set a new password using the reset token. |

## User routes — `/users`

| Method | Route | Auth? | Description |
|---|---|---|---|
| GET | `/users/me` | Yes | Get the logged-in user's profile. |
| PATCH | `/users/me` | Yes | Update own profile (name, phone, department, program/semester). |
| PATCH | `/users/me/password` | Yes | Change password while logged in (requires current password). |
| GET | `/users/supervisors` | No | List active academic supervisors — powers the registration dropdown. |
| GET | `/users` | Yes (ADMIN) | List all users, paginated, filterable by role/department. |
| POST | `/users` | Yes (ADMIN) | Admin-create a user of any role (e.g. a supervisor or department officer). Returns a generated temporary password once. |
| PATCH | `/users/:id` | Yes (ADMIN) | Edit any user's profile fields. |
| PATCH | `/users/:id/role` | Yes (ADMIN) | Change a user's role. |
| PATCH | `/users/:id/status` | Yes (ADMIN) | Activate/deactivate a user account. |
| PATCH | `/users/:id/supervisor-flag` | Yes (ADMIN) | Mark/unmark a user as an active supervisor. |
| DELETE | `/users/:id` | Yes (ADMIN) | Remove a user (soft delete — `isActive: false`). |

## Department routes — `/departments` (Phase 3)

| Method | Route | Auth? | Description |
|---|---|---|---|
| GET | `/departments` | Yes | List departments (active only, unless ADMIN passes `?includeInactive=true`). |
| GET | `/departments/:id` | Yes | Get one department. |
| POST | `/departments` | Yes (ADMIN) | Create a department. |
| PATCH | `/departments/:id` | Yes (ADMIN) | Update a department. |
| DELETE | `/departments/:id` | Yes (ADMIN) | Deactivate a department (blocked if an active application type still points at it). |

## Application type routes — `/application-types` (Phase 3)

| Method | Route | Auth? | Description |
|---|---|---|---|
| GET | `/application-types` | Yes | List application types (active only, unless ADMIN passes `?includeInactive=true`). |
| GET | `/application-types/:id` | Yes | Get one application type. |
| POST | `/application-types` | Yes (ADMIN) | Create an application type (name, code, department, whether it needs supervisor approval, default priority, SLA hours). |
| PATCH | `/application-types/:id` | Yes (ADMIN) | Update an application type. |
| DELETE | `/application-types/:id` | Yes (ADMIN) | Deactivate an application type. |

## Routing rule routes — `/routing-rules` (Phase 3)

A routing rule *is* an application type's `departmentId` +
`requiresSupervisorApproval` — this API is a focused view over that same
data, not a separate table, so routing changes and application-type changes
can never drift out of sync.

| Method | Route | Auth? | Description |
|---|---|---|---|
| GET | `/routing-rules` | Yes (ADMIN) | List every application type's routing (department + supervisor requirement). |
| PATCH | `/routing-rules/:applicationTypeId` | Yes (ADMIN) | Reassign the department and/or supervisor requirement for an application type. |

## Calendar routes — `/holidays`, `/semester-breaks`, `/calendar` (Phase 3)

| Method | Route | Auth? | Description |
|---|---|---|---|
| GET | `/holidays` | Yes | List holidays, optional `?from=&to=` date filter. |
| POST | `/holidays` | Yes (ADMIN) | Add a holiday (name, date, type: PUBLIC/UNIVERSITY/SPECIAL). |
| PATCH | `/holidays/:id` | Yes (ADMIN) | Update a holiday. |
| DELETE | `/holidays/:id` | Yes (ADMIN) | Remove a holiday. |
| GET | `/semester-breaks` | Yes | List semester breaks (active only, unless ADMIN passes `?includeInactive=true`). |
| POST | `/semester-breaks` | Yes (ADMIN) | Add a semester break (name, startDate, endDate). |
| PATCH | `/semester-breaks/:id` | Yes (ADMIN) | Update a semester break. |
| DELETE | `/semester-breaks/:id` | Yes (ADMIN) | Remove a semester break. |
| GET | `/calendar` | Yes | Merged holidays + semester breaks for the calendar dashboard, optional `?from=&to=`. |

## Permission routes — `/permissions` (Phase 3)

| Method | Route | Auth? | Description |
|---|---|---|---|
| GET | `/permissions` | Yes (ADMIN) | List the role → resource permission matrix. |
| PUT | `/permissions/:role/:resource` | Yes (ADMIN) | Upsert `canView`/`canEdit` for a role on a resource. |

## Application routes — `/applications` (Phase 4)

| Method | Route | Auth? | Description |
|---|---|---|---|
| POST | `/applications` | Yes | Create an application. `saveAsDraft: true` leaves it editable; otherwise it's routed and submitted immediately. |
| GET | `/applications` | Yes | List the current user's own applications (history), paginated, filterable by `?status=`. |
| GET | `/applications/:id` | Yes | Get one application with attachments — owner, its assigned supervisor, or ADMIN/DEAN/DEPARTMENT_OFFICER. |
| PATCH | `/applications/:id` | Yes (owner) | Edit subject/description/type/priority — only while still `DRAFT`. |
| PATCH | `/applications/:id/submit` | Yes (owner) | Submit a draft: generates routing (department + supervisor), sets status and `submittedAt`. |
| DELETE | `/applications/:id` | Yes (owner) | Delete a draft application (and its uploaded files). |
| POST | `/applications/:id/attachments` | Yes (owner) | Upload up to 5 files (PDF/Word/JPEG/PNG/WEBP, 10MB each) — `multipart/form-data`, field name `files`. |
| GET | `/applications/:id/attachments/:attachmentId/download` | Yes | Download one attachment (same access rule as viewing the application). |
| DELETE | `/applications/:id/attachments/:attachmentId` | Yes (owner) | Remove an attachment — only while still `DRAFT`. |

## Workflow routes — `/applications/:id/...` (Phase 5)

Approval hierarchy: **Applicant → Academic Supervisor (if required) → Department
→ [escalation only] Department Head → Dean → Admin**. `currentStage` tracks who
currently owns the application; `status` stays whatever Phase 4 already used
(`UNDER_SUPERVISOR_REVIEW` / `UNDER_DEPARTMENT_REVIEW`), with every escalation
level beyond Department surfaced as `ESCALATED`.

| Method | Route | Auth? | Description |
|---|---|---|---|
| GET | `/applications/:id/workflow` | Yes (viewer) | Current stage, who's holding it, deadline, remaining working hours. |
| GET | `/applications/:id/history` | Yes (viewer) | Full activity timeline (submit/approve/reject/forward/escalate/comment/reminder/close). |
| GET | `/applications/:id/comments` | Yes (viewer) | Communication thread for this application, including any attachments on each comment. |
| POST | `/applications/:id/comments` | Yes (viewer) | Add a comment; notifies everyone else involved. `multipart/form-data` — `message` field plus up to 3 files (`attachments`, PDF/Word/JPEG/PNG/WEBP, 10MB each, Phase 7). |
| GET | `/applications/:id/comments/:commentId/attachments/:attachmentId/download` | Yes (viewer) | Download a file attached to a comment (Phase 7). |
| PATCH | `/applications/:id/approve` | Yes (current reviewer) | Approve: Supervisor stage forwards to Department; Department (or an escalation level) is a final decision. |
| PATCH | `/applications/:id/reject` | Yes (current reviewer) | Reject (final) — `remarks` required. |
| PATCH | `/applications/:id/request-info` | Yes (current reviewer) | Ask the applicant for more information — `remarks` required, pauses the SLA clock. |
| PATCH | `/applications/:id/provide-info` | Yes (owner) | Applicant responds; resumes the same stage with a fresh SLA window. |
| PATCH | `/applications/:id/forward` | Yes (current reviewer) | Hand off to a specific `toUserId` — same stage or the next stage up only. |
| PATCH | `/applications/:id/close` | Yes (ADMIN or department) | Archive a decided (APPROVED/REJECTED) application as CLOSED. |

## Dean Portal routes — `/applications/:id/...` (Phase 10)

Once an application reaches the DEAN stage, the existing `/approve` and
`/reject` routes above already work for the Dean (any current-stage
reviewer can use them). These two additional routes are Dean/Admin-only and
only valid while `currentStage` is `DEAN`:

| Method | Route | Auth? | Description |
|---|---|---|---|
| PATCH | `/applications/:id/return-to-department` | Yes (DEAN or ADMIN) | Sends the application back to the department instead of deciding it — `remarks` required. Unlike `/forward`, this moves backward down the hierarchy on purpose. |
| PATCH | `/applications/:id/request-investigation` | Yes (DEAN or ADMIN) | Flags the application for the department to investigate further before the Dean decides — `remarks` required. Notifies the department but does **not** change `currentStage`/`status`; the application stays in the Dean's queue. |

`GET /analytics/dean-overview` (Phase 10, DEAN/ADMIN only) — total
escalations, escalations currently pending the Dean's decision, average
department response time, and how many departments currently have an
overdue application. `GET /analytics/departments` also now returns an
`escalationCount` per department (how often that department's applications
have escalated past it). `GET /search/applications` accepts an optional
`?currentStage=` filter so a caller can distinguish which level of the
escalation hierarchy an `ESCALATED` application currently sits at (e.g.
`?status=ESCALATED&currentStage=DEAN`).

## Escalation & scheduler routes (Phase 6)

| Method | Route | Auth? | Description |
|---|---|---|---|
| PATCH | `/applications/:id/escalate` | Yes (ADMIN) | Manually escalate ahead of the automatic sweep (e.g. a priority case). |
| POST | `/admin/jobs/reminders/run` | Yes (ADMIN) | Run the reminder sweep immediately, instead of waiting for the hourly cron. |
| POST | `/admin/jobs/escalations/run` | Yes (ADMIN) | Run the escalation sweep immediately. |

The hourly sweep itself (`SCHEDULER_CRON`, default `0 * * * *`) runs
in-process via `node-cron` (see `backend/src/jobs/`) — escalation first, then
reminders, so a just-escalated application doesn't also get an overdue
reminder in the same tick. It:
1. **Escalates** any application whose `deadlineAt` has passed one level up
   the hierarchy, logging an `EscalationRecord` and notifying the applicant,
   the outgoing reviewer, and the new reviewer(s).
2. **Reminds** the current reviewer(s) of every application that has crossed
   a 24h / 48h / 60h / "SLA − 6h" *working-hour* threshold since its stage
   began, without re-sending a threshold already logged in `ApplicationReminder`.

Working-hour deadlines are computed by `services/workingHours.service.js`,
which walks the clock hour-by-hour and skips Saturdays, Sundays, `Holiday`
rows, and active `SemesterBreak` ranges — see `docs/database-schema.md`.

## Notification routes — `/notifications` (Phase 6, extended Phase 7)

| Method | Route | Auth? | Description |
|---|---|---|---|
| GET | `/notifications` | Yes | List the current user's dashboard notifications, paginated, optional `?isRead=` and `?type=` (Phase 7). |
| GET | `/notifications/unread-count` | Yes | Just the unread count — cheap to poll for a bell-icon badge (Phase 7). |
| PATCH | `/notifications/:id/read` | Yes (owner) | Mark one notification read. |
| PATCH | `/notifications/read-all` | Yes | Mark all of the current user's notifications read. |
| GET | `/notifications/preferences` | Yes | Get the current user's channel preferences (created with defaults on first access). |
| PATCH | `/notifications/preferences` | Yes | Update `emailEnabled` / `inAppEnabled` / `smsEnabled` (booleans) and/or `mutedTypes` (array of notification types to silence across every channel). |

Every workflow/reminder/escalation notification is dispatched through a
single `workflow.service.js#notify()` function, which now (Phase 7) looks up
each recipient's `NotificationPreference` before sending: a muted `type`
skips that recipient entirely; otherwise each enabled channel fires
independently (an in-app row is only created if `inAppEnabled`, so opting
out of the dashboard doesn't also opt out of email). SMS uses the same
dev-mode-logs-instead-of-sends fallback as email when no provider is
configured (`SMS_API_URL` / `SMS_API_KEY` unset) — see `services/sms.service.js`.

## Additional Phase 5/6 user-management route

| Method | Route | Auth? | Description |
|---|---|---|---|
| PATCH | `/users/:id/department-head-flag` | Yes (ADMIN) | Mark/unmark a Department Officer as their department's head — authorizes the `DEPARTMENT_HEAD` escalation stage. Same pattern as the existing `/users/:id/supervisor-flag`. |

## Standard response shape

Success:
```json
{
  "success": true,
  "message": "Login successful",
  "data": { "user": { "...": "..." }, "accessToken": "..." }
}
```

Error:
```json
{
  "success": false,
  "message": "Invalid email or password",
  "errors": []
}
```

## Status codes used
- `200` OK, `201` Created
- `400` validation error, `401` unauthenticated, `403` forbidden (RBAC),
  `404` not found, `409` conflict (e.g. email already registered),
  `500` server error

## Auth flow summary

```
Register → 201, verification email sent
Click verification link → GET /auth/verify-email/:token → isEmailVerified = true
Login → POST /auth/login → 401 if not verified, else access token + refresh cookie
Access protected route → Authorization: Bearer <accessToken>
Access token expires → POST /auth/refresh (refresh cookie) → new access token
Logout → POST /auth/logout → refresh token revoked
```

## Application submission flow summary

```
POST /applications { saveAsDraft: true } → 201, status = DRAFT, applicationNumber assigned
POST /applications/:id/attachments → upload supporting documents while still DRAFT
PATCH /applications/:id → edit subject/description/type/priority while still DRAFT
PATCH /applications/:id/submit → routing engine assigns department (+ supervisor if
  required) → status = UNDER_SUPERVISOR_REVIEW or UNDER_DEPARTMENT_REVIEW
GET /applications → applicant's own submission history
```

## Workflow & escalation flow summary

```
PATCH /applications/:id/approve   (Supervisor stage) → forwarded, UNDER_DEPARTMENT_REVIEW
PATCH /applications/:id/approve   (Department stage or above) → APPROVED (final)
PATCH /applications/:id/reject    (any stage) → REJECTED (final)
PATCH /applications/:id/request-info → AWAITING_INFO, SLA clock paused
PATCH /applications/:id/provide-info → resumes prior stage, fresh SLA window
PATCH /applications/:id/forward   { toUserId } → same stage handoff, or promotes to the next stage
[hourly] deadline passed, still pending → auto-escalate one level, EscalationRecord logged
PATCH /applications/:id/close     (APPROVED/REJECTED only) → CLOSED
```

## Endpoints reserved for later phases (not implemented yet)
`/analytics` (Phase 7+ — reporting/dashboards over the `ApplicationHistory`
and `EscalationRecord` data modeled in Phase 5/6) — will hang off the same
Express app and reuse the auth/RBAC middleware built in Phase 2.


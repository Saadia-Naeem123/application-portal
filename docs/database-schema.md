# Database Schema — Phase 1-4

This covers the tables needed for Phase 1 (foundation), Phase 2
(authentication & user management), Phase 3 (administration & master data),
and Phase 4 (application submission). Later phases (workflow/escalation,
reminders, notifications, analytics) will add `Comment`, `AuditLog`,
`EscalationHistory`, `Notification`, etc. — see the "Reserved for later
phases" note at the bottom.

## Entities (Phase 1 + 2 scope)

### `User`
The single table backing every role in the system.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| fullName | String | |
| email | String (unique) | |
| passwordHash | String | bcrypt hash, never returned by the API |
| role | Enum `Role` | STUDENT, FACULTY, STAFF, ACADEMIC_SUPERVISOR, DEPARTMENT_OFFICER, DEAN, ADMIN |
| registrationNumber | String? | students |
| employeeId | String? | faculty/staff/supervisor/officer/dean/admin |
| department | String? | free-text; kept as-is from Phase 1 for backward compatibility. The new Phase 3 `Department` table is the source of truth for routing and master data — it is not FK'd from `User` to avoid a breaking migration on an already-shipped column. |
| program | String? | students |
| semester | Int? | students |
| phoneNumber | String? | |
| supervisorId | UUID? (FK → User.id) | set for students, points at their chosen supervisor |
| isActiveSupervisor | Boolean | default false; only relevant when role = ACADEMIC_SUPERVISOR |
| isEmailVerified | Boolean | default false |
| isActive | Boolean | default true; admin can deactivate accounts |
| createdAt / updatedAt | DateTime | |

### `EmailVerificationToken`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| userId | UUID (FK → User) | |
| tokenHash | String | SHA-256 hash of the emailed token |
| expiresAt | DateTime | 24h from creation |
| createdAt | DateTime | |

### `PasswordResetToken`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| userId | UUID (FK → User) | |
| tokenHash | String | SHA-256 hash of the emailed token |
| expiresAt | DateTime | 1h from creation |
| used | Boolean | default false |
| createdAt | DateTime | |

### `RefreshToken`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| userId | UUID (FK → User) | |
| tokenHash | String | hash of the refresh token, so DB leak ≠ token leak |
| expiresAt | DateTime | |
| revoked | Boolean | default false; supports logout / logout-all-devices |
| createdAt | DateTime | |

## Entities (Phase 3 scope — administration & master data)

### `Department`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | String (unique) | |
| code | String (unique) | short code, e.g. `FIN`, `EXAM` |
| description | String? | |
| isActive | Boolean | default true; deactivation is blocked while an active `ApplicationType` still points at it |
| createdAt / updatedAt | DateTime | |

### `ApplicationType`
One row per application category (Fee Issues, Scholarship Requests, etc).
Its `departmentId` + `requiresSupervisorApproval` fields **are** the routing
rule for that category — the `/routing-rules` API reads/writes the same two
fields under a routing-focused name rather than duplicating a table.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | String (unique) | |
| code | String (unique) | |
| description | String? | |
| departmentId | UUID (FK → Department) | where the application is routed |
| requiresSupervisorApproval | Boolean | default false |
| defaultPriority | Enum `Priority` | LOW / MEDIUM / HIGH / URGENT |
| slaWorkingHours | Int | default 72; reserved for the working-day deadline engine in a later phase |
| isActive | Boolean | default true |
| createdAt / updatedAt | DateTime | |

### `Holiday`
Single-date calendar entries (public holidays, university closures).
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | String | |
| date | DateTime | |
| type | Enum `HolidayType` | PUBLIC / UNIVERSITY / SPECIAL |
| createdAt | DateTime | |

### `SemesterBreak`
Date-range calendar entries, kept separate from `Holiday` so admins manage
them with a start/end date instead of one row per day.
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | String | |
| startDate | DateTime | |
| endDate | DateTime | |
| isActive | Boolean | default true |
| createdAt | DateTime | |

### `RolePermission`
A lightweight, admin-editable permission matrix layered on top of the fixed
`Role` enum — lets an admin fine-tune what a role can see/do per resource
without a code change, while `requireRole` middleware still guards the
coarse, non-negotiable checks (e.g. only ADMIN manages master data).
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| role | Enum `Role` | |
| resource | String | e.g. `applications`, `departments` |
| canView | Boolean | default true |
| canEdit | Boolean | default false |
| createdAt / updatedAt | DateTime | |
| | | `@@unique([role, resource])` |

## Entities (Phase 4 scope — application submission)

### `Application`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| applicationNumber | String (unique) | human-readable tracking ID, e.g. `APP-202607-A1B2C3`; generated at creation, drafts included |
| applicantId | UUID (FK → User) | |
| applicationTypeId | UUID (FK → ApplicationType) | |
| departmentId | UUID? (FK → Department) | populated by the routing engine at submission |
| supervisorId | UUID? (FK → User) | populated at submission, only when the type requires supervisor approval |
| subject | String | |
| description | String | |
| priority | Enum `Priority` | defaults to the application type's `defaultPriority` |
| status | Enum `ApplicationStatus` | DRAFT / SUBMITTED / UNDER_SUPERVISOR_REVIEW / UNDER_DEPARTMENT_REVIEW / AWAITING_INFO / APPROVED / REJECTED / ESCALATED / CLOSED |
| submittedAt | DateTime? | set when the draft is submitted |
| createdAt / updatedAt | DateTime | |

### `ApplicationAttachment`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| applicationId | UUID (FK → Application, cascade delete) | |
| fileName | String | original filename shown to users |
| storedFileName | String | randomized on-disk filename |
| filePath | String | absolute path under `backend/uploads/applications/<applicationId>/` |
| mimeType | String | validated against an allow-list (PDF, DOC/DOCX, JPEG, PNG, WEBP) |
| size | Int | bytes; capped at 10MB per file |
| uploadedAt | DateTime | |

## Phase 5/6 models — Workflow, Routing, Deadline, Reminder & Escalation

### New `Application` columns (Phase 5/6)
| Column | Type | Notes |
|---|---|---|
| currentStage | WorkflowStage? | `SUPERVISOR` \| `DEPARTMENT` \| `DEPARTMENT_HEAD` \| `DEAN` \| `ADMIN` — null while DRAFT or once decided |
| assignedOfficerId | UUID? (FK → User) | set when explicitly forwarded to a named person, instead of "whoever's on duty" |
| escalationLevel | Int | how many times auto-escalated |
| lastActionAt | DateTime? | when the current stage's clock started |
| deadlineAt | DateTime? | `lastActionAt` + the application type's `slaWorkingHours`, in *working* hours |
| closedAt | DateTime? | set when an APPROVED/REJECTED application is archived to CLOSED |

`currentStage` is a finer-grained companion to the existing `status` column,
not a replacement — `SUPERVISOR`/`DEPARTMENT` map onto the Phase 4
`UNDER_SUPERVISOR_REVIEW`/`UNDER_DEPARTMENT_REVIEW` statuses, and every
escalation level beyond `DEPARTMENT` (`DEPARTMENT_HEAD`, `DEAN`, `ADMIN`)
surfaces as the existing `ESCALATED` status. This let the escalation
hierarchy layer on top of Phase 4's `ApplicationStatus` enum without
changing it.

### `User.isDepartmentHead` (Phase 6)
Same pattern as `isActiveSupervisor`: a `DEPARTMENT_OFFICER` flagged
`isDepartmentHead: true` is the authorized reviewer for the
`DEPARTMENT_HEAD` escalation stage — an admin-managed flag rather than a
7th+ Role enum value that only ever holds one extra bit.

### `ApplicationHistory`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| applicationId | UUID (FK → Application, cascade delete) | |
| actorId | UUID? (FK → User) | null for system-generated entries (auto-escalation, reminders) |
| action | WorkflowAction | SUBMITTED / APPROVED / REJECTED / INFO_REQUESTED / INFO_PROVIDED / FORWARDED / ESCALATED / COMMENTED / REMINDER_SENT / CLOSED / RETURNED_TO_DEPARTMENT / INVESTIGATION_REQUESTED |
| fromStatus / toStatus | ApplicationStatus? | |
| remarks | String? | |
| createdAt | DateTime | |

The full activity timeline / workflow history for an application.

### `ApplicationComment`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| applicationId | UUID (FK → Application, cascade delete) | |
| authorId | UUID (FK → User) | |
| message | String | |
| createdAt | DateTime | |

The Communication & Comment System thread.

### `CommentAttachment` (Phase 7)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| commentId | UUID (FK → ApplicationComment, cascade delete) | |
| fileName | String | original upload name |
| storedFileName | String | name on disk under `uploads/comments/<applicationId>/` |
| filePath | String | |
| mimeType | String | same allow-list as `ApplicationAttachment` |
| size | Int | bytes |
| uploadedAt | DateTime | |

"Attachment sharing" for the comment thread — mirrors `ApplicationAttachment`
but scoped to a single comment. Uploaded in the same request as the comment
(`multipart/form-data`, up to 3 files), so they're always created together.

### `ApplicationReminder`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| applicationId | UUID (FK → Application, cascade delete) | |
| recipientId | UUID (FK → User) | |
| hoursElapsed | Int | which threshold (24/48/60/SLA−6) triggered this reminder |
| channel | ReminderChannel | EMAIL / IN_APP / SMS |
| sentAt | DateTime | |

One row per reminder actually sent, keyed by working hours elapsed since the
current stage started — lets the scheduler avoid re-sending a threshold
already crossed within the same stage window.

### `EscalationRecord`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| applicationId | UUID (FK → Application, cascade delete) | |
| fromStage / toStage | WorkflowStage | |
| fromUserId / toUserId | UUID? (FK → User) | |
| reason | String | |
| createdAt | DateTime | |

Permanent accountability record of every escalation, kept even after the
application later moves on.

### `Notification`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| userId | UUID (FK → User, cascade delete) | |
| applicationId | UUID? (FK → Application, set null on delete) | |
| type | String | e.g. SUBMITTED / APPROVED / REJECTED / REMINDER / ESCALATED / COMMENT (see `constants/notificationType.js`) |
| title / message | String | |
| isRead | Boolean | |
| channels | NotificationChannel[] | which channel(s) this notification actually went out on (Phase 7) |
| createdAt | DateTime | |

The in-app "Dashboard alerts" feed — created alongside every workflow email
so the dashboard doesn't depend on a mailbox to show updates. Since Phase 7,
a row is only created for a recipient if their `NotificationPreference.inAppEnabled`
is true — see below.

### `NotificationPreference` (Phase 7)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| userId | UUID (FK → User, cascade delete, unique) | one row per user |
| emailEnabled | Boolean | default `true` |
| inAppEnabled | Boolean | default `true` |
| smsEnabled | Boolean | default `false` (opt-in; requires `User.phoneNumber`) |
| mutedTypes | String[] | notification `type`s to silence across every channel |
| createdAt / updatedAt | DateTime | |

Created lazily with defaults the first time it's read or written — no seed
step needed for existing accounts. `workflow.service.js#notify()` is the
single choke point that reads this table (batched via
`notification.service.js#getPreferencesMap`) before dispatching to any
channel, so every workflow/reminder/escalation notification respects it
uniformly.

## Entity relationship (Phase 1-4 scope)

```
User (role=ACADEMIC_SUPERVISOR) ──1───* User (role=STUDENT)   [supervisorId]
User ──1───* EmailVerificationToken
User ──1───* PasswordResetToken
User ──1───* RefreshToken
User ──1───* Application                [applicantId]  (as applicant)
User ──1───* Application                [supervisorId] (as assigned supervisor)
Department ──1───* ApplicationType
Department ──1───* Application
ApplicationType ──1───* Application
Application ──1───* ApplicationAttachment
```

## Entity relationship (Phase 5/6 additions)

```
User (role=DEPARTMENT_OFFICER, isDepartmentHead) ──reviews──> Application  [DEPARTMENT_HEAD stage]
User ──1───* Application                [assignedOfficerId] (explicit forward target, any stage)
Application ──1───* ApplicationHistory   (full activity timeline)
Application ──1───* ApplicationComment   (communication thread)
Application ──1───* ApplicationReminder  (sent-reminder log, dedupes thresholds)
Application ──1───* EscalationRecord     (fromStage → toStage, fromUser → toUser)
Application ──1───* Notification         (in-app dashboard feed; nullable FK)
User ──1───* ApplicationHistory  [actorId]
User ──1───* ApplicationComment  [authorId]
User ──1───* ApplicationReminder [recipientId]
User ──1───* Notification        [userId]
User ──1───* EscalationRecord    [fromUserId] / [toUserId]
```

## Entity relationship (Phase 7 additions)

```
ApplicationComment ──1───* CommentAttachment
User ──1───1 NotificationPreference  [userId, unique]
```

## Why this shape
- One `User` table + `role` enum keeps auth/RBAC uniform across all 7 roles
  while still capturing role-specific fields as nullable columns — exactly
  what Phase 2 needs, without over-building the `Department`/`Application`
  side of the schema before Phase 3+ requirements are locked in.
- Tokens are stored **hashed**, never in plaintext, per the security
  requirements in the proposal.
- `supervisorId` self-relation on `User` implements "students select their
  supervisor from a dynamic, admin-managed list" directly at the schema
  level.
- `ApplicationType` doubles as the routing-rule table (`departmentId` +
  `requiresSupervisorApproval`) instead of a separate `RoutingRule` model —
  routing configuration and application-type configuration are the same
  admin task in the proposal, so keeping them in one table means they can't
  drift out of sync.
- `Application.departmentId` / `.supervisorId` are nullable and only
  populated at submission time (not at draft creation), because routing
  is a consequence of submitting, not of starting a draft.
- Departments and application types are **soft-deleted** (`isActive: false`)
  rather than hard-deleted, since `Application` rows may already reference
  them — deleting the row out from under submitted history would break
  reporting in a later phase.
- `currentStage` is deliberately separate from `status`: `status` is what
  Phase 4 already committed to and what applicants see on their tracker;
  `currentStage` is the finer-grained "whose queue is it in right now" used
  internally by the routing/escalation engine. Keeping them separate meant
  Phase 5/6 didn't need to touch the `ApplicationStatus` enum at all.
- `ApplicationHistory` and `ApplicationComment` are two tables, not one,
  even though both feed the "activity timeline": a comment is always also
  logged as an `ApplicationHistory` row (`action: COMMENTED`), but not every
  history row (e.g. an automatic reminder) is a comment. Splitting them
  keeps the comment thread free of system noise while the timeline stays
  complete.
- `CommentAttachment` is its own table rather than reusing
  `ApplicationAttachment` with a nullable `commentId`, because the two have
  different parents (`Application` vs. `ApplicationComment`) and different
  upload directories — reusing one table would mean half its rows have a
  null `applicationId` or a null `commentId` depending on which kind it is.
- `NotificationPreference` is one row per user with plain booleans plus a
  `mutedTypes` string array, not a `(userId, type, channel)` matrix table —
  the proposal's "Notification preferences" deliverable only needs
  per-channel opt-out and per-type muting, not a fully independent toggle
  per (type × channel) pair, so the simpler shape avoids a table that would
  mostly be full rows of `true`.
- `Notification.channels` is populated per-notification (not read off
  `NotificationPreference` at query time) so the notification center can
  show "delivered via email + SMS" *as of when it was sent*, even if the
  user changes their preferences afterward.
- `ApplicationReminder` exists purely so the scheduler can ask "has this
  threshold already fired for this stage window?" in one indexed query,
  instead of re-deriving it from `ApplicationHistory` text on every hourly run.

## Reserved for later phases (not modeled yet)
`AuditLog` (system-wide, non-application-scoped audit trail) and the
analytics/reporting aggregates (average resolution time, department/
supervisor performance, monthly trends) — these read from the
`ApplicationHistory` and `EscalationRecord` data modeled here rather than
needing their own tables, and belong to a later analytics/reporting phase.

See `backend/prisma/schema.prisma` for the executable version of this design.

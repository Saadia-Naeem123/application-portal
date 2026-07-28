# Folder Structure — Phase 1

```
university-system/
├── README.md
├── docs/
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-plan.md
│   ├── folder-structure.md
│   ├── coding-standards.md
│   └── wireframes.md
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── uploads/                    # gitignored — application attachments on disk
│   │   ├── applications/<id>/      # ApplicationAttachment files
│   │   └── comments/<applicationId>/  # Phase 7: CommentAttachment files
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── app.js                  # Express app: middleware, routes mounted
│       ├── server.js               # entrypoint: starts HTTP server
│       ├── config/
│       │   ├── env.js              # loads & validates env vars
│       │   └── db.js               # Prisma client singleton
│       ├── constants/
│       │   ├── roles.js            # Role enum values used across the app
│       │   ├── priority.js         # Priority enum values
│       │   ├── applicationStatus.js
│       │   ├── holidayType.js
│       │   ├── workflowStage.js    # WorkflowStage order, statusForStage(), nextStage()
│       │   ├── workflowAction.js   # WorkflowAction enum values (activity timeline)
│       │   ├── reminderChannel.js
│       │   └── notificationType.js # Phase 7: known Notification.type values, for mutedTypes validation
│       ├── middleware/
│       │   ├── auth.middleware.js  # verifies JWT, attaches req.user
│       │   ├── rbac.middleware.js  # requireRole(...roles)
│       │   ├── validate.middleware.js
│       │   ├── upload.middleware.js # multer: file type/size validation (application + Phase 7 comment attachments)
│       │   └── error.middleware.js # centralized error handler
│       ├── utils/
│       │   ├── ApiError.js
│       │   ├── ApiResponse.js
│       │   ├── asyncHandler.js
│       │   ├── validators.js
│       │   ├── applicationNumber.js # generates the human-readable tracking ID
│       │   └── workingHours.js     # pure working-day/working-hour arithmetic (Phase 6)
│       ├── services/
│       │   ├── auth.service.js       # business logic: register/login/tokens
│       │   ├── token.service.js      # JWT + hashed-token helpers
│       │   ├── email.service.js      # nodemailer wrapper
│       │   ├── sms.service.js        # Phase 7: SMS channel, dev-mode console fallback
│       │   ├── department.service.js
│       │   ├── applicationType.service.js  # also backs routing-rules
│       │   ├── holiday.service.js
│       │   ├── semesterBreak.service.js
│       │   ├── permission.service.js
│       │   ├── application.service.js
│       │   ├── workingHours.service.js  # loads the calendar, wraps utils/workingHours.js
│       │   ├── workflow.service.js      # Phase 5: approve/reject/forward/comment/history; Phase 7: notify() honors preferences + SMS
│       │   ├── escalation.service.js    # Phase 6: auto + manual escalation
│       │   ├── reminder.service.js      # Phase 6: 24h/48h/60h reminder sweep
│       │   └── notification.service.js  # in-app dashboard feed; Phase 7: preferences, unread-count, type filter
│       ├── jobs/
│       │   ├── reminder.job.js     # wraps reminder.service for the scheduler + admin trigger
│       │   ├── escalation.job.js   # wraps escalation.service for the scheduler + admin trigger
│       │   └── scheduler.js        # node-cron: hourly escalation-then-reminder sweep
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── user.controller.js
│       │   ├── department.controller.js
│       │   ├── applicationType.controller.js
│       │   ├── routingRule.controller.js
│       │   ├── holiday.controller.js
│       │   ├── semesterBreak.controller.js
│       │   ├── calendar.controller.js       # merges holidays + semester breaks
│       │   ├── permission.controller.js
│       │   ├── application.controller.js
│       │   ├── workflow.controller.js       # Phase 5/6 approval-hierarchy actions
│       │   ├── notification.controller.js
│       │   └── job.controller.js            # admin "run sweep now" endpoints
│       └── routes/
│           ├── auth.routes.js
│           ├── user.routes.js
│           ├── department.routes.js
│           ├── applicationType.routes.js
│           ├── routingRule.routes.js
│           ├── holiday.routes.js
│           ├── semesterBreak.routes.js
│           ├── calendar.routes.js
│           ├── permission.routes.js
│           ├── application.routes.js  # includes the Phase 5/6 workflow sub-routes + Phase 7 comment attachments
│           ├── notification.routes.js
│           └── job.routes.js
│
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── .env.local.example
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx                     # landing page
        │   ├── login/page.tsx
        │   ├── register/page.tsx
        │   ├── verify-email/page.tsx
        │   ├── forgot-password/page.tsx
        │   ├── reset-password/page.tsx
        │   ├── dashboard/page.tsx           # role-based dashboard shell
        │   └── profile/page.tsx
        ├── components/
        │   ├── forms/
        │   │   ├── LoginForm.tsx
        │   │   ├── RegisterForm.tsx
        │   │   ├── ForgotPasswordForm.tsx
        │   │   └── ResetPasswordForm.tsx
        │   ├── layout/
        │   │   ├── Navbar.tsx
        │   │   └── ProtectedRoute.tsx
        │   └── ui/
        │       ├── Button.tsx
        │       ├── Input.tsx
        │       └── Card.tsx
        ├── context/
        │   └── AuthContext.tsx
        ├── lib/
        │   └── api.ts               # axios instance + token refresh interceptor
        ├── types/
        │   └── index.ts
        └── styles/
            └── globals.css
```

## Naming rationale
- Backend follows a **controller → service → prisma** layering: controllers
  only parse `req`/`res`, services hold business logic, so later phases
  (routing engine, escalation engine) can call the same services from a
  cron job instead of an HTTP request.
- Frontend uses Next.js App Router; each route folder under `app/` maps 1:1
  to a URL, matching the navigation flow in `wireframes.md`.

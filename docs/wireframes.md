# UI Wireframes & Navigation Flow — Phase 1

## Navigation map (Phase 1 & 2 scope)

```
                         ┌───────────────┐
                         │   Landing "/" │
                         └───┬───────┬───┘
                    ┌────────┘       └─────────┐
                    ▼                          ▼
             ┌─────────────┐            ┌─────────────┐
             │  /login     │            │ /register   │
             └──────┬──────┘            └──────┬──────┘
                    │                           │
        ┌───────────┼───────────┐               ▼
        ▼           ▼           ▼        ┌───────────────────┐
 /forgot-password  (success)  (error)     │ /verify-email/:tok│
        │                                 └──────────┬─────────┘
        ▼                                            ▼
 /reset-password/:token                          /login
        │
        ▼
     /login
        │
        ▼ (JWT issued)
  ┌─────────────┐        ┌─────────────┐
  │ /dashboard  │◄──────►│  /profile   │
  └─────────────┘        └─────────────┘
```

## Screen wireframes (text form)

### `/register`
```
┌──────────────────────────────────────────┐
│  Create your account                      │
├──────────────────────────────────────────┤
│  Full Name        [______________]        │
│  University Email [______________]        │
│  Role              [ dropdown ▼ ]         │
│    - Student / Faculty / Staff /          │
│      Academic Supervisor / Dept Officer /  │
│      Dean / Administrator                 │
│                                            │
│  -- fields shown conditionally by role --  │
│  Registration No.  [______________] (student)│
│  Employee ID        [______________] (staff+)│
│  Department         [______________]       │
│  Program            [______________] (student)│
│  Semester           [ dropdown ▼ ] (student)│
│  Academic Supervisor[ searchable ▼ ] (student, loaded from /users/supervisors)│
│  Phone Number       [______________]       │
│  Password           [______________]       │
│  Confirm Password   [______________]       │
│                                            │
│           [ Create Account ]              │
│  Already have an account? Log in          │
└──────────────────────────────────────────┘
```

### `/login`
```
┌──────────────────────────────┐
│  Sign in                     │
├──────────────────────────────┤
│ Email     [______________]   │
│ Password  [______________]   │
│           [ Sign in ]        │
│ Forgot password?             │
│ Don't have an account? Sign up│
└──────────────────────────────┘
```

### `/dashboard` (shell — content varies per role, later phases add widgets)
```
┌───────────────────────────────────────────────────┐
│ Navbar: Logo | Dashboard | Profile | Logout        │
├───────────────────────────────────────────────────┤
│  Welcome, {fullName}   Role: {role}                │
│                                                     │
│  [ Role-specific placeholder cards — Phase 3+       │
│    will populate these with: My Applications /      │
│    Pending Reviews / Department Queue / Analytics ]  │
└───────────────────────────────────────────────────┘
```

### `/profile`
```
┌──────────────────────────────────────────┐
│  My Profile                               │
├──────────────────────────────────────────┤
│ Full Name        [______________] [Save] │
│ Phone Number      [______________]        │
│ Department        [______________]        │
│ Program / Semester[______________] (student)│
│ ─────────────────────────────────────────│
│ Change Password                           │
│ Current Password  [______________]        │
│ New Password       [______________]        │
│                    [ Update Password ]    │
└──────────────────────────────────────────┘
```

## Role-based dashboard access (RBAC at the UI level)
| Role | Sees on `/dashboard` |
|---|---|
| Student | placeholder "My Applications" card |
| Faculty / Staff | placeholder "My Requests" card |
| Academic Supervisor | placeholder "Assigned Students" card |
| Department Officer | placeholder "Department Queue" card |
| Dean | placeholder "Escalated Items" card |
| Administrator | placeholder "System Overview" + link to user management |

These placeholders are intentionally simple in Phase 2 — they exist so RBAC
and routing are provably wired end-to-end; later phases replace the
placeholder cards with real data.

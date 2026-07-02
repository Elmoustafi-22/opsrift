# Opsrift — Product Requirements Document

**Version:** 1.0
**Date:** June 2026
**Author:** Mustopha Abdulqadir
**Status:** In Development

---

## 1. Overview

### 1.1 Product Summary

Opsrift is a lightweight workflow scheduling and documentation platform built for small operations teams. It allows Managers to create and assign tasks to Staff, track progress through a structured status pipeline, and auto-generate completion documentation using AI. Admins have full visibility across users and reporting.

The project is scoped as a portfolio demonstration of production-ready SaaS patterns including role-based access control, scheduling workflows, documentation workflows, dashboard reporting, notifications, and AI-assisted automation.

### 1.2 Problem Statement

Small business operations teams waste significant time on two things: manually tracking who is doing what and writing up completion notes after a job is done. Existing tools either do too much (enterprise project managers) or too little (spreadsheets and group chats). Opsrift bridges that gap with a focused, role-aware tool that automates the documentation step entirely.

### 1.3 Target Users

| Role | Description |
|------|-------------|
| **Admin** | Manages the workspace — invites users, views reports, has full system access |
| **Manager** | Creates and assigns tasks, monitors team progress, reviews documentation |
| **Staff** | Receives assigned tasks, updates status, submits completion reports |

### 1.4 Success Criteria

- A Manager can create and assign a task to a Staff member in under 60 seconds
- A Staff member can mark a task done and submit a documentation record with AI assistance in under 2 minutes
- All three roles see a meaningfully different UI with no access to restricted areas
- The platform is live, publicly accessible, and demonstrable in an interview setting

---

## 2. Scope

### 2.1 In Scope (v0.1 — Interview Build)

- Authentication with JWT and three hardcoded seeded accounts
- Role-based access control across all routes and UI views
- Task creation, assignment, and status management
- AI-assisted documentation draft generation on task completion
- Basic role-aware dashboard views
- Full deployment (Vercel + Render + MongoDB Atlas)

### 2.2 Out of Scope (v0.1)

- User registration and invite flow
- In-app notifications and bell indicator
- Escalation cron job (overdue automation)
- Analytics dashboard with charts
- Email notifications
- Audit log
- Refresh token rotation

These features are designed and documented but deferred to the assessment build.

---

## 3. Features

### 3.1 Authentication

**Description**
Users log in with email and password. A JWT is issued and stored in localStorage. All subsequent API requests include the token as a Bearer header. On page load, the app checks for a valid token and redirects to login if absent or expired.

**Requirements**
- `POST /api/auth/login` — validates credentials, returns JWT
- `GET /api/auth/me` — returns current user from token
- Token expiry: 7 days
- Passwords hashed with bcrypt (10 salt rounds)
- Three seeded demo accounts (one per role) with known credentials
- Invalid credentials return a 401 with a generic message (no enumeration)

**Role-based redirect after login**

| Role | Redirect destination |
|------|---------------------|
| Staff | `/dashboard` — My Tasks view |
| Manager | `/dashboard` — Team Board view |
| Admin | `/dashboard` — Admin Overview |

---

### 3.2 Role-Based Access Control

**Description**
Every route — both frontend and backend — enforces the user's role. Staff cannot access Manager or Admin pages. Managers cannot access Admin-only pages. A direct URL attempt by an unauthorised role redirects to their own dashboard.

**Frontend**
- `<RoleGuard allowedRoles={['manager', 'admin']}>` wraps protected pages
- Reads role from `AuthContext`
- Redirects to `/dashboard` if role is not in the allowed list

**Backend**
- `requireRole(['manager', 'admin'])` middleware applied at the router level
- Returns `403 Forbidden` with message if role check fails
- Applied before the controller function in the middleware chain

**Access matrix**

| Feature | Staff | Manager | Admin |
|---------|-------|---------|-------|
| View own tasks | ✅ | ✅ | ✅ |
| View all tasks | ❌ | ✅ | ✅ |
| Create task | ❌ | ✅ | ✅ |
| Assign task | ❌ | ✅ | ✅ |
| Update own task status | ✅ | ✅ | ✅ |
| Submit doc record | ✅ | ✅ | ✅ |
| View all doc records | ❌ | ✅ | ✅ |
| View user list | ❌ | ❌ | ✅ |
| View analytics | ❌ | ✅ | ✅ |

---

### 3.3 Task Management

**Description**
The core scheduling workflow. Managers create tasks with a title, description, due date, and assigned Staff member. Tasks move through a four-stage status pipeline.

**Status pipeline**
```
Pending → In Progress → Done
                ↓
            Overdue (automated — v0.2)
```

**Task fields**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | String | Yes | Max 100 chars |
| description | String | No | Max 500 chars |
| assignedTo | ObjectId (ref User) | Yes | Must be a Staff user |
| createdBy | ObjectId (ref User) | Auto | Set from token |
| status | Enum | Auto | Default: `pending` |
| dueDate | Date | Yes | Must be future date |
| docAttached | Boolean | Auto | Default: `false`, set `true` on doc submit |
| createdAt | Date | Auto | |

**API endpoints**

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | All roles | Staff: own tasks only. Manager/Admin: all tasks |
| POST | `/api/tasks` | Manager, Admin | Create a new task |
| GET | `/api/tasks/:id` | All roles | Single task detail (scoped by role) |
| PATCH | `/api/tasks/:id/status` | Assignee, Manager, Admin | Update task status |
| DELETE | `/api/tasks/:id` | Admin only | Soft delete |

**UI — Manager view**
- Task creation form (modal or dedicated page)
- Team board: list of all tasks filterable by status and assignee
- Each task card shows: title, assignee avatar, due date, status badge, doc-attached indicator

**UI — Staff view**
- My Tasks list: only tasks assigned to the logged-in user
- Status update button on each task (contextual — shows next logical status)
- "Mark as Done" triggers the AI doc generation flow

---

### 3.4 AI-Assisted Documentation

**Description**
When a Staff member marks a task as Done, the system automatically generates a draft completion report using the Gemini API. The draft pre-fills the documentation form. The Staff member reviews, edits if needed, and submits. This removes the blank-page friction of manual report writing.

**Flow**
1. Staff clicks "Mark as Done" on a task
2. Frontend fires `PATCH /api/tasks/:id/status` with `{ status: "done" }`
3. On success, frontend calls `GET /api/docs/draft/:taskId`
4. Backend fetches the task, builds a prompt, calls Gemini API
5. Returns generated draft text to frontend
6. Documentation modal opens pre-filled with the draft
7. Staff edits (optional) and submits via `POST /api/docs`
8. Backend saves the doc record and sets `task.docAttached = true`

**Prompt template**
```
You are a documentation assistant for a small business operations platform called Opsrift.
Write a brief 2-3 sentence completion report for the following task.
Be concise and professional. Write in past tense as if the task is done.

Task title: {title}
Task description: {description}
Assigned to: {assigneeName}
Due date: {dueDate}

Return only the report text, nothing else.
```

**Doc record fields**

| Field | Type | Notes |
|-------|------|-------|
| taskId | ObjectId (ref Task) | Required |
| submittedBy | ObjectId (ref User) | Set from token |
| notes | String | AI draft, editable by user |
| outcome | String | Short outcome label: Completed / Partially Completed / Blocked |
| createdAt | Date | Auto |

**API endpoints**

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/docs/draft/:taskId` | Assignee, Manager, Admin | Generate AI draft |
| POST | `/api/docs` | All roles | Submit a doc record |
| GET | `/api/docs` | Manager, Admin | List all doc records |
| GET | `/api/docs/:taskId` | Manager, Admin | Doc record for a specific task |

---

### 3.5 Dashboard Views

**Description**
Each role lands on a dashboard scoped to their access level. The same `/dashboard` route renders different components based on the role from `AuthContext`.

**Staff dashboard**
- My open tasks (Pending + In Progress)
- My completed tasks this week
- Quick status: how many tasks are due today

**Manager dashboard**
- All tasks by status (count cards: Pending, In Progress, Done)
- Team task list with assignee filter
- Recently submitted doc records

**Admin dashboard**
- Total users by role
- All tasks summary (same as Manager view)
- Link to user management

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JWT (jsonwebtoken), bcrypt |
| AI | Google Gemini API (`gemini-1.5-flash`) via `@google/generative-ai` |
| State management | React Context + TanStack React Query |
| Deployment (frontend) | Vercel |
| Deployment (backend) | Render |
| Database hosting | MongoDB Atlas |

### 4.2 Project Structure

```
opsrift/
├── opsrift-frontend/               # Vite + React app
│   ├── src/
│   │   ├── api/                # axiosInstance.ts
│   │   ├── components/
│   │   │   ├── layout/         # Layout, Sidebar, Topbar
│   │   │   ├── tasks/          # TaskCard, TaskBoard, TaskForm
│   │   │   ├── docs/           # DocModal, DocRecord
│   │   │   ├── dashboard/      # StaffDashboard, ManagerDashboard, AdminDashboard
│   │   │   └── ui/             # StatusBadge, UserAvatar, EmptyState, ConfirmModal
│   │   ├── pages/          # LoginPage, DashboardPage, TasksPage, DocsPage
│   │   ├── routes/         # AppRoutes.tsx, ProtectedRoute.tsx
│   │   ├── store/          # useAuthStore.ts
│   │   ├── hooks/          # useTasks.ts, useDocs.ts
│   │   └── types/          # index.ts (User, Task, Doc interfaces)
│
├── opsrift-backend/                # Express + TypeScript API
│   ├── src/
│   │   ├── config/             # db.ts
│   │   ├── middlewares/        # auth, role, errorHandler
│   │   ├── modules/            # auth, users, tasks, docs
│   │   ├── services/           # ai.service.ts
│   │   ├── jobs/               # escalation.cron.ts
│   │   ├── utils/              # jwt.ts, password.ts
│   │   ├── seed.ts
│   │   └── server.ts
│
└── README.md
```

### 4.3 Middleware Chain

Every protected request passes through this chain before reaching the controller:

```
Request
  → verifyToken       (checks Bearer JWT, attaches req.user)
  → requireRole([])   (checks req.user.role against allowed list)
  → controller
```

### 4.4 Environment Variables

**Backend `.env`**
```
PORT=5000
MONGODB_URI=your_atlas_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=https://your-vercel-url.vercel.app
```

**Frontend `.env.local`**
```
NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com
```

> **Note:** In the Vite implementation, this becomes `VITE_API_URL`.

---

## 5. Data Models

### User
```js
{
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['staff', 'manager', 'admin'] },
  isActive: { type: Boolean, default: true },
  createdAt: Date
}
```

### Task
```js
{
  title: String,
  description: String,
  status: { type: String, enum: ['pending', 'inprogress', 'done', 'overdue'], default: 'pending' },
  assignedTo: { type: ObjectId, ref: 'User' },
  createdBy: { type: ObjectId, ref: 'User' },
  dueDate: Date,
  docAttached: { type: Boolean, default: false },
  createdAt: Date
}
```

### Doc
```js
{
  taskId: { type: ObjectId, ref: 'Task' },
  submittedBy: { type: ObjectId, ref: 'User' },
  notes: String,
  outcome: { type: String, enum: ['Completed', 'Partially Completed', 'Blocked'] },
  createdAt: Date
}
```

### Notification *(v0.2)*
```js
{
  userId: { type: ObjectId, ref: 'User' },
  type: { type: String, enum: ['assigned', 'overdue', 'docRequired'] },
  taskId: { type: ObjectId, ref: 'Task' },
  isRead: { type: Boolean, default: false },
  createdAt: Date
}
```

### AuditLog *(v0.2)*
```js
{
  action: String,
  performedBy: { type: ObjectId, ref: 'User' },
  targetId: ObjectId,
  targetModel: String,
  timestamp: Date
}
```

---

## 6. Security Requirements

| Requirement | Implementation |
|-------------|---------------|
| Password storage | bcrypt, 10 salt rounds |
| Auth tokens | JWT, 7-day expiry |
| Route protection | `verifyToken` middleware on all non-auth routes |
| Role enforcement | `requireRole()` middleware at router level |
| Sensitive field exclusion | `.select('-passwordHash')` on all User queries |
| CORS | Explicit origin whitelist (Vercel URL only) |
| HTTP headers | `helmet()` middleware |
| Login rate limiting | `express-rate-limit` — 10 requests per 15 minutes per IP |
| Input validation | `express-validator` on all POST/PATCH bodies |
| API key safety | Gemini key stored in `.env`, never exposed to frontend |

---

## 7. Deployment Plan

| Step | Action |
|------|--------|
| 1 | Push monorepo to GitHub |
| 2 | Create MongoDB Atlas M0 cluster, whitelist `0.0.0.0/0` for Render |
| 3 | Deploy backend to Render — set all env vars, run seed script via Render shell |
| 4 | Deploy frontend to Vercel — set `NEXT_PUBLIC_API_URL` to Render URL |
| 5 | Test all three demo logins end to end on the live URLs |
| 6 | Update README with live URLs and demo credentials |

---

## 8. Demo Accounts

These accounts are seeded into the database for interview and demonstration purposes.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@opsrift.demo | Demo@1234 |
| Manager | manager@opsrift.demo | Demo@1234 |
| Staff | staff@opsrift.demo | Demo@1234 |

---

## 9. v0.2 Roadmap (Post-Interview / Assessment Build)

| Feature | Description |
|---------|-------------|
| Escalation cron job | `node-cron` job runs hourly, marks tasks overdue after 48hrs, creates notification |
| In-app notifications | Bell icon with unread count, polled every 30 seconds |
| Email notifications | Nodemailer or Resend — notify assignee on task assignment |
| Analytics dashboard | Recharts bar/line charts — tasks by status, completions per week, by assignee |
| User invite system | Admin generates invite link, new user registers via token-gated URL |
| Refresh token rotation | Short-lived access tokens (15m) + long-lived refresh tokens (7d) |
| Audit log | Track all status changes and doc submissions with actor and timestamp |

---

## 10. Build Timeline

| Day | Target |
|-----|--------|
| Tuesday evening | Project scaffold, MongoDB connection, User model, seed script, login endpoint, AuthContext, login page, protected route wrapper, role-based redirect |
| Wednesday morning | Task model, task API endpoints (CRUD + status update) |
| Wednesday afternoon | Task board UI — Manager create form, Staff task list, status update button |
| Wednesday evening | AI doc generation — Gemini service, draft endpoint, doc modal with pre-fill |
| Thursday morning | Deploy to Vercel + Render, end-to-end test on live URLs, README with demo credentials |

---

*Opsrift is a portfolio project by Mustopha Abdulqadir, built to demonstrate production-ready full-stack SaaS patterns including RBAC, scheduling workflows, documentation automation, and AI-assisted features.*

# 🎯 Interview Preparation: Tayo360 Full Stack Developer

> **Role:** Full Stack Developer – Scheduling & Documentation Platform
> **Company:** Tayo360
> **Your Project:** OpsRift — A workflow management platform for scheduling, task management, documentation, and AI-assisted operations
> **Strategic Angle:** This project was **specifically built for this job interview** to demonstrate your deep alignment, technical capability, and proactive commitment to Tayo360.

---

## 1. The Proactive "Built-for-Tayo360" Strategy

> [!IMPORTANT]
> **Why this matters:** Building a dedicated prototype for an interview is the single most powerful way to stand out. It proves you don't just want *a* job; you want *this* job. It shifts the interview from a standard "skills assessment" to a collaborative product review.

### How to frame it:
- **Be bold about it:** Introduce the project early. Let them know you read the JD, got excited by their vision, and spent the last few days building a working model of their core feature set.
- **Show, don't just tell:** Use the codebase as your live resume. When they ask about a concept, share your screen and show how you implemented it in OpsRift.
- **Explain the design intent:** Highlight how your technical choices (like RBAC, cron escalations, and Gemini-based documentation) are tailored to the exact problem space Tayo360 is solving.

---

## 2. The 60-Second Elevator Pitch

> "When I applied to Tayo360, I saw your exact technical requirements and product description, and instead of just submitting a CV, **I decided to build a working prototype of your core product specifically for this interview.** I built OpsRift—a full-stack workflow management platform that directly maps to the scheduling, documentation, and automated workflows you are building. 
> 
> It features a **Node.js/Express REST API** backed by **MongoDB**, a **React/TypeScript** frontend with Tailwind, **role-based access control** (admin/manager/staff), and **six AI-powered features** using the Gemini API. I built this from scratch in just a few days to demonstrate two things: first, that I have the exact engineering and AI integration skills you need, and second, that I am deeply interested in and committed to Tayo360's vision."

---

## 2. JD Feature-by-Feature Mapping

This is the most critical section. For each item in the "What You'll Work On" list, here is exactly what you built and how to explain it.

---

### 2.1 User Management

**What you built:**
- [User model](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/modules/users/user.model.ts) with Mongoose schema: `name`, `email`, `passwordHash`, `role`, `isActive`
- Registration and login via [auth module](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/modules/auth) (hashed passwords with bcrypt, JWT token issuance)
- [Profile management page](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-frontend/src/pages/ProfilePage.tsx) on the frontend
- `isActive` field for account deactivation/soft-delete

**How to explain it:**
> "I built a complete user management system. Users register with email/password, passwords are hashed with bcrypt before storage, and on login they receive a JWT token. The user model includes an `isActive` boolean so admins can deactivate accounts without deleting data. On the frontend, there's a dedicated profile page where users can view and update their information."

**Anticipated questions:**
- *"How do you store passwords?"* → "I never store plaintext. I use bcrypt to hash passwords before saving to MongoDB. On login, I compare the provided password against the stored hash using `bcrypt.compare()`."
- *"How does session management work?"* → "Stateless JWT-based auth. The token is stored in localStorage and attached to every API request via an Axios interceptor (`Authorization: Bearer <token>`). The token contains the user ID and role in its payload."

---

### 2.2 Role-Based Permissions (RBAC)

**What you built:**
- Three roles: `admin`, `manager`, `staff` — defined as an enum in the [User schema](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/modules/users/user.model.ts#L23-L27)
- [Auth middleware](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/middlewares/auth.middleware.ts) (`protect`) — validates JWT, checks if user exists and is active
- [Roles middleware](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/middlewares/roles.middleware.ts) (`role(["manager", "admin"])`) — checks if the authenticated user's role is in the allowed list
- Per-route enforcement in [task.routes.ts](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/modules/tasks/task.routes.ts):
  - `POST /tasks` → managers & admins only
  - `DELETE /tasks/:id` → admins only
  - `GET /tasks` → staff see only their own; managers see all
- Frontend [ProtectedRoute](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-frontend/src/components/ProtectedRoute.tsx) component and conditional UI rendering based on `user.role`

**How to explain it:**
> "RBAC is enforced at two layers. On the backend, every protected route first passes through `protect` middleware, which validates the JWT and confirms the user is active. Then route-specific role checks use a `role()` middleware factory — for example, task creation requires `role(['manager', 'admin'])`. On the frontend, I use a `ProtectedRoute` wrapper with an `allowedRoles` prop, and I conditionally render UI elements based on the user's role from the Zustand auth store."

**Anticipated questions:**
- *"What happens if a staff member tries to access a manager-only endpoint?"* → "The `role()` middleware returns a `403 Forbidden: Insufficient permissions` response. On the frontend, the route redirects them to an `/unauthorized` page that auto-redirects back to their dashboard after 5 seconds."
- *"How is role stored in the token?"* → "The JWT payload includes `{ id, role }`. On every request, the `protect` middleware decodes this and attaches it to `req.user`, which downstream middleware and controllers reference."

---

### 2.3 Scheduling Workflows

**What you built:**
- Full [Task CRUD](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/modules/tasks/task.controller.ts): create, read, update status, delete
- [Task model](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/modules/tasks/task.model.ts) with: `title`, `description`, `status` (pending → inprogress → done / overdue), `assignedTo`, `createdBy`, `dueDate`, `docAttached`
- **Status transition validation** — enforced state machine: `pending → inprogress → done`, `overdue → done` (no backwards transitions)
- **AI Task Breakdown** — manager types a high-level goal ("Onboard new client"), Gemini returns 3–5 structured subtasks with roles and estimated dates, manager reviews and bulk-creates in one shot via `POST /tasks/bulk`
- [TasksPage](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-frontend/src/pages/TasksPage.tsx) with filtering, search, creation modal, and AI breakdown modal

**How to explain it:**
> "The scheduling workflow starts when a manager creates tasks, either manually through a form or using our AI task breakdown feature. They type a high-level goal like 'Onboard new client' and Gemini returns 3-5 concrete subtasks. The manager reviews, edits assignees and due dates, then confirms — all tasks are bulk-created in one API call. Tasks follow a strict state machine: pending → in progress → done. If a task goes 48 hours past its due date while still in progress, a cron job automatically escalates it to 'overdue' status."

---

### 2.4 Documentation Workflows

**What you built:**
- [Doc model](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/modules/docs/doc.model.ts): linked to a task via `taskId`, with `submittedBy`, `notes`, and `outcome` (Completed / Partially Completed / Blocked)
- [Doc controller](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/modules/docs/doc.controller.ts):
  - `GET /docs/draft/:taskId` → AI generates a professional completion report draft using Gemini
  - `POST /docs` → staff submits documentation, task is auto-marked as `done` and `docAttached: true`
  - `POST /docs/review` → **Smart Doc Reviewer** — AI checks if notes are too vague before submission
  - `POST /docs/refine` → **AI Note Refinement** — polishes raw notes into professional documentation and auto-suggests the final operational outcome
- [TaskDetailsPage](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-frontend/src/pages/TaskDetailsPage.tsx) with:
  - "Generate AI Draft" button pre-fills the notes textarea
  - Real-time vagueness warning (AI review on blur)
  - "✨ AI Refine" button that polishes notes and auto-suggests the outcome field
  - Outcome selector and submit flow

**How to explain it:**
> "When a staff member completes a task, they document it on the Task Details page. Three AI features assist: first, 'Generate AI Draft' calls Gemini to produce a structured completion report. Second, an on-blur AI review detects if notes are too vague and shows a warning banner. Third, the '✨ AI Refine' button polishes raw operator notes into professional language and also suggests a concise operational outcome — like 'Database migration completed, latency reduced to 30ms' — which auto-fills the outcome selector. This ensures documentation quality without fabricating details the operator didn't report."

---

### 2.5 Dashboard Reporting

**What you built:**
- [DashboardPage](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-frontend/src/pages/DashboardPage.tsx) with:
  - **Stat cards**: Total tasks, completed, in progress, overdue — animated with Framer Motion
  - **Recent activity feed** showing latest task updates
  - **AI Weekly Summary** button (manager-only) — calls `GET /tasks/ai-weekly-summary` which aggregates the last 7 days of completed docs and generates a professional operations summary via Gemini
  - Role-aware rendering: managers see team-wide stats, staff see personal metrics

**How to explain it:**
> "The dashboard is role-aware. Managers see aggregate metrics across all team members — total tasks, completion rates, overdue counts — while staff see only their personal numbers. For managers, there's an AI Weekly Summary feature that pulls all documentation records from the past 7 days and feeds them to Gemini, which generates a 3-4 paragraph operations report covering what was accomplished, who contributed, what remains open, and any patterns worth flagging."

---

### 2.6 Notifications

**What you built:**
- [Notification model](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/modules/notifications/notification.model.ts): `userId`, `type` (MESSAGE / ANNOUNCEMENT), `title`, `body`, `link`, `referenceId`, `read`
- [Notification store](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-frontend/src/store/useNotificationStore.ts) on frontend with Zustand
- **Automated notification generation** from cron jobs:
  - Task escalated to overdue → notification to staff AND manager
  - Task due soon (within 24h) → reminder notification to staff
  - Weekly AI summary → announcement notification to all managers

**How to explain it:**
> "Notifications are persisted in MongoDB and delivered via API. The system generates notifications automatically in three scenarios: when a task is escalated to overdue (both the assigned staff and the creating manager get notified), when a task is due within 24 hours (staff gets a reminder), and when the weekly AI summary runs (all managers get an announcement). On the frontend, a Zustand store manages notification state with read/unread tracking."

---

### 2.7 Workflow Automation

**What you built:**
- [Escalation cron job](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/jobs/escalation.cron.ts) with **three scheduled jobs** using `node-cron`:

| Cron Schedule | Job | What It Does |
|---|---|---|
| `0 * * * *` (hourly) | Task Escalation | Finds `inprogress` tasks past due by 48h, marks them `overdue`, notifies staff + manager |
| `0 7 * * *` (daily 7 AM) | Due Reminders | Finds tasks due within 24h, sends reminder notifications to assigned staff |
| `0 8 * * 1` (Mondays 8 AM) | Weekly AI Summary | Aggregates week's docs, generates AI summary, announces to all managers |

- **AI-powered workflow automation** via [ai.service.ts](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/services/ai.service.ts):
  - `breakdownGoal()` — AI task decomposition
  - `prioritizeTasks()` — AI priority scoring
  - `generateWeeklySummary()` — AI weekly report
  - `generateDraft()` — AI doc draft generation
  - `reviewNotes()` — AI vagueness detection
  - `refineNotes()` — AI note polishing + suggested outcome extraction

**How to explain it:**
> "I used `node-cron` for scheduled background jobs. The most impactful one is the hourly escalation check — it queries for in-progress tasks that are 48+ hours past due, flips their status to overdue, and creates notifications for both the assigned staff member and the manager who created the task. The daily reminder catches tasks due within 24 hours. And every Monday morning, the weekly summary cron aggregates all completed documentation from the past week, sends it to Gemini for analysis, and pushes the summary as an announcement notification to all managers."

---

### 2.8 Secure Data Management

**What you built:**
- **Helmet** for HTTP security headers ([app.ts](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/app.ts#L15))
- **Rate limiting** on auth endpoints — 10 requests per 15 minutes per IP ([app.ts](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/app.ts#L27-L34))
- **CORS** restricted to frontend origin only ([app.ts](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/app.ts#L18-L24))
- **JWT authentication** with token validation on every protected route
- **bcrypt password hashing** — never storing plaintext
- **Active user check** — even if JWT is valid, user must have `isActive: true`
- **Access control on data** — staff can only see/modify their own tasks, not other users' data
- **Trust proxy** configured for deployment behind Render's reverse proxy

**How to explain it:**
> "Security is layered. At the transport level, I use Helmet for security headers and CORS restricted to the frontend origin. At the auth level, JWT tokens with proper validation, and bcrypt for password hashing. I also check that the user is still active even if the token is valid — so if an admin deactivates someone, they can't keep using their existing token. Rate limiting on auth endpoints prevents brute-force attacks. And at the data level, staff can only access their own tasks — this is enforced in every controller with an ownership check."

---

## 3. Tech Stack Deep-Dive

### 3.1 Matching JD Stack → Your Stack

| JD Requirement | Your Experience | Where in OpsRift |
|---|---|---|
| **React** | ✅ React 19 with hooks | All frontend pages |
| **Next.js** | ✅ Used at DoLessons, Infaq.ng | CV experience (mention these) |
| **TypeScript** | ✅ Full TypeScript on both ends | Backend + Frontend |
| **Tailwind CSS** | ✅ Tailwind on frontend | All component styling |
| **Node.js** | ✅ Node.js runtime | Backend server |
| **NestJS / Express** | ✅ Express.js | [app.ts](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-backend/src/app.ts) |
| **PostgreSQL** | ⚠️ You used MongoDB | Acknowledge this — see talking point below |
| **AWS** | ⚠️ Deployed to Render/Vercel | Acknowledge this — see talking point below |

**For PostgreSQL (gap):**
> "In OpsRift I used MongoDB with Mongoose because the data is document-oriented — tasks with nested references to users and docs. I'm very comfortable with relational databases and SQL — I understand schemas, migrations, JOINs, indexes, and foreign key constraints. In a PostgreSQL context, I'd use a tool like Prisma or TypeORM for the ORM layer, which follows the same pattern of defining schemas and relationships that I use with Mongoose."

**For AWS (gap):**
> "I've deployed to Render and Vercel, which abstract away some AWS concepts, but I understand the underlying services — EC2 for compute, S3 for storage, RDS for managed databases, and CloudFront for CDN. I have AWS listed in my skill set and I'm ready to work with it directly."

---

## 4. Architecture Walkthrough (Draw This if Asked)

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TS + Vite)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │Dashboard │ │ Tasks    │ │ Task     │ │  Profile   │  │
│  │ Page     │ │  Page    │ │ Details  │ │   Page     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       │             │            │              │         │
│  ┌────▼─────────────▼────────────▼──────────────▼──────┐  │
│  │          Zustand Stores (Auth, Notifications)       │  │
│  └────────────────────┬────────────────────────────────┘  │
│                       │                                   │
│  ┌────────────────────▼────────────────────────────────┐  │
│  │     Axios Instance (JWT interceptor, error handler) │  │
│  └────────────────────┬────────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────┘
                        │ HTTPS / REST
┌───────────────────────▼──────────────────────────────────┐
│                  BACKEND (Node + Express + TS)            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Middleware Pipeline                              │    │
│  │  helmet → cors → rateLimit → json → auth → role  │    │
│  └──────────────────┬───────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼───────────────────────────────┐    │
│  │  Route Modules                                    │    │
│  │  /auth  /tasks  /docs  /users  /notifications     │    │
│  └──────────────────┬───────────────────────────────┘    │
│                     │                                     │
│  ┌─────────────┐  ┌─▼──────────┐  ┌──────────────────┐  │
│  │ AI Service  │  │ Controllers│  │  Cron Jobs        │  │
│  │ (Gemini)    │◄─┤            │  │  (node-cron)      │  │
│  └─────────────┘  └──────┬─────┘  └────────┬─────────┘  │
│                          │                  │             │
│  ┌───────────────────────▼──────────────────▼──────────┐ │
│  │  Mongoose ODM (Models: User, Task, Doc, Notification)│ │
│  └───────────────────────┬─────────────────────────────┘ │
└──────────────────────────┼───────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  MongoDB    │
                    │  Atlas      │
                    └─────────────┘
```

---

## 5. Key Technical Decisions to Highlight

### 5.1 Why Zustand over Redux?
> "Zustand is lightweight, requires almost zero boilerplate compared to Redux Toolkit, and fits perfectly for a project this size. I have three stores — auth, notifications, and toasts — each under 60 lines. If the app grew to the scale where I needed DevTools-level debugging and middleware chains, I'd switch to Redux Toolkit."

### 5.2 Why Dynamic Imports for AI and Cron?
> "Both `@google/genai` and `node-cron` are dynamically imported at runtime. This keeps the initial bundle smaller and ensures the server can start even if these optional dependencies fail to load. The AI service lazily initializes the GoogleGenAI client on first use."

### 5.3 Why Graceful Fallbacks in AI Service?
> "Every AI function has a `try/catch` with a sensible fallback. If Gemini is down or the API key is invalid, `breakdownGoal()` returns 3 generic subtasks, `prioritizeTasks()` sorts by due date, `reviewNotes()` checks string length. The app never breaks because an external AI service is unavailable."

### 5.4 Why State Machine for Task Status?
> "I enforce valid transitions server-side: pending → inprogress → done, overdue → done. This prevents invalid states like going from 'done' back to 'pending'. The `validTransitions` map in the controller makes this explicit and easy to extend."

### 5.5 Why Human-Led AI Refinement (Not Fabrication)?
> "The `refineNotes()` function explicitly instructs Gemini to NEVER add information the operator didn't mention. It only polishes grammar, structure, and tone. This is a deliberate design choice — in operational contexts, accuracy matters more than eloquence. The AI also suggests a one-line outcome summary based solely on the operator's reported facts, which the user can accept or edit before submission."

---

## 6. Likely Interview Questions & Answers

### General / Behavioral

**Q: "Walk me through a feature you built end-to-end."**
> "The AI Task Breakdown feature. A manager types a goal like 'Prepare quarterly report'. On the frontend, a modal captures the goal and sends `POST /api/tasks/ai-breakdown`. The backend controller extracts the goal, passes it to `breakdownGoal()` in the AI service, which constructs a prompt and calls Gemini with `responseMimeType: 'application/json'` to get structured output. Gemini returns 3-5 subtasks with titles, descriptions, suggested roles, and estimated days. The frontend renders them in an editable list where the manager can change assignees and dates. On confirm, it sends `POST /api/tasks/bulk` to create all tasks in one shot."

**Q: "How do you handle errors?"**
> "Three layers. On the backend, every controller uses `try/catch` with `next(error)` to pass to a centralized error handler middleware. The AI service has graceful fallbacks so external failures don't crash the app. On the frontend, the Axios interceptor catches all API errors, logs them, and handles 401s by clearing the token and redirecting to login. For user-facing errors, I use a Zustand toast store to show error/success messages."

**Q: "Tell me about a challenging debugging situation."**
> "I dealt with a `SQLSTATE[HY000]: General error: 1364 Field 'value' doesn't have a default value` error on another project (DoLessons). The backend was inserting `discount_value` but the database column was named `value`. I traced it from the frontend request, through the API layer, to the actual SQL INSERT statement the ORM was generating. The fix was aligning the backend field name with the database schema. It taught me to always verify my ORM's generated queries against the actual database schema."

---

### Technical Deep-Dives

**Q: "How does your authentication flow work?"**
> "On login, the server validates credentials, creates a JWT with `{ id, role }` payload signed with a secret, and returns it. The frontend stores it in localStorage and the Zustand auth store. Every subsequent API request has the Axios interceptor attach it as `Authorization: Bearer <token>`. On the backend, the `protect` middleware decodes the token, checks the user still exists and is active in the database, and attaches the decoded payload to `req.user`."

**Q: "What would you do differently if you had to scale this?"**
> "I've done a full back-of-the-envelope analysis. At 15K DAU, we'd hit ~60 RPS peak and ~30 GB/year of data growth. Three critical changes: (1) Move from MongoDB to PostgreSQL with Prisma for relational integrity and complex reporting queries — I've mapped out the schema migration including foreign keys and multi-tenancy with Row-Level Security. (2) Replace polling-based notifications with WebSockets using Socket.io + Redis Pub/Sub adapter — this alone reduces notification traffic by 99.9% at scale. (3) Extract cron jobs from the API process into AWS EventBridge + SQS worker architecture so they don't compete with request handling and don't duplicate when horizontally scaling."

**Q: "How would you add real-time collaboration features?"**
> "I'd introduce Socket.io. When a task status changes, the server emits an event to all connected clients in the relevant room (e.g., a team room). The frontend would listen for these events and update Zustand stores directly, giving instant UI updates without polling."

**Q: "How do you test your code?"**
> "I have a [test directory](file:///c:/Users/abdul/Desktop/FlowDesk/opsrift-frontend/src/test) set up. For the backend, I'd use Jest with Supertest for API integration tests — sending real HTTP requests to the Express app with a test MongoDB instance. For the frontend, React Testing Library for component behavior tests. I also test API endpoints manually with Postman/Thunder Client during development."

---

### Startup / Culture Fit

**Q: "Why Tayo360?"**
> "To be honest, the moment I read the job description, I knew this was the exact problem space I wanted to work on. I was so excited about Tayo360's vision that **I went ahead and built OpsRift specifically for this interview.** I wanted to prove to you that my interest is real and my skills are a 100% match. Instead of just talking about my experience, I wanted to show you a working prototype that implements your exact core requirements: user roles, strict task scheduling, AI-assisted documentation, automated cron jobs, and high-performance metrics. I wanted to show you that I can step into your team and start contributing on day one without any hand-holding."

**Q: "Can you work independently?"**
> "At NextIF, I was the sole tech lead driving frontend and full-stack development. I made architecture decisions, built features end-to-end, and deployed them myself. At Infaq.ng, I led the technical direction for the entire frontend. I'm comfortable owning features without needing hand-holding."

**Q: "What's your experience with workflow automation?"**
> "Beyond the cron-based automation in OpsRift, I built payment webhook verification at NextIF — when a payment comes in, the system automatically verifies it, updates the user's record, sends a confirmation email, and generates a certificate. That's a multi-step automated workflow triggered by an external event."

---

## 7. Your Application Recap — Key Points to Reference

From your application email, these are the strongest points to reinforce:

1. **"Built authenticated dashboards for three distinct user roles with full RBAC and JWT-secured route protection"** → You can now demonstrate this live in OpsRift
2. **"Campaign workflows, a donation pipeline, and a real-time reporting dashboard"** → Maps to task workflows and dashboard reporting
3. **"I take ownership end-to-end"** → OpsRift proves this: you designed the schema, built the API, wrote the frontend, integrated AI, set up cron jobs, and deployed
4. **"Integration of Gemini AI for operational tasks"** → 6 distinct AI features, not just a chatbot

---

## 8. Questions to Ask the Interviewer

1. "What does the current architecture look like? Is it monolithic Express or are you considering NestJS modules?"
2. "How are you currently handling scheduling workflows — is there an existing data model I'd be extending?"
3. "What's the deployment pipeline? Are you on AWS ECS, Lambda, or EC2?"
4. "How large is the engineering team and what does the code review process look like?"
5. "Is the paid technical assessment a take-home project or a live coding session?"

---

## 9. Final Pre-Interview Checklist

- [ ] Be ready to share your screen and walk through the OpsRift codebase
- [ ] Have the backend running locally (`npm run dev`) to demo API responses
- [ ] Have the frontend running to show the Dashboard, Tasks page, and AI features
- [ ] Know these file paths cold: `task.controller.ts`, `ai.service.ts`, `escalation.cron.ts`, `auth.middleware.ts`, `roles.middleware.ts`
- [ ] Practice the elevator pitch out loud until it's under 60 seconds
- [ ] Review your application email so your talking points are consistent
- [ ] Be ready to discuss the scaling analysis — traffic numbers, AWS architecture, cost estimates

---

## 10. System Design Questions & Answers

### SD Q1: "How would you design this scheduling platform to handle 50,000 users?"

> "I'd start with the numbers. At 50K users with ~30% DAU, that's 15K daily active users generating roughly 36 API requests each — about 540K requests per day, peaking at ~60 RPS. That's beyond a single Node.js process.
>
> **Compute:** I'd deploy to AWS ECS Fargate with 3-6 containerized Node.js instances behind an Application Load Balancer. Fargate auto-scales based on CPU/request count.
>
> **Database:** Migrate from MongoDB to PostgreSQL on RDS Multi-AZ. For this workload — ~30 GB/year growth — a single `db.r6g.large` instance with a read replica handles it comfortably. I'd add composite indexes on `(assigned_to, status)` and `(organization_id, status)` for the most frequent queries.
>
> **Caching:** Add ElastiCache Redis for three things: JWT session validation (avoid DB lookup on every request), AI response caching (same task description → same breakdown, 24h TTL), and rate limiting state across instances.
>
> **Background jobs:** Extract cron jobs from the API process into EventBridge + SQS. EventBridge triggers on schedule, SQS queues the work, a dedicated worker service processes it. This prevents cron duplication when horizontally scaling."

---

### SD Q2: "How would you design the notification system for real-time delivery?"

> "Currently I use polling — the frontend fetches `GET /api/notifications` periodically. At scale, with 15K DAU polling every 30 seconds, that's 43.2 million requests per day just for notifications — extremely wasteful.
>
> I'd migrate to WebSockets using Socket.io with a Redis Pub/Sub adapter:
>
> 1. **Connection:** Client establishes a WebSocket connection on login. Server creates a room per user ID.
> 2. **Event flow:** When a cron job escalates a task, it writes the notification to the database AND publishes to a Redis channel. All API instances subscribe to Redis channels. The instance holding the user's WebSocket connection pushes the event directly.
> 3. **Scaling:** The `@socket.io/redis-adapter` ensures events reach the right instance regardless of which server the client is connected to. Redis handles cross-instance message routing.
> 4. **Fallback:** If the WebSocket drops, the client falls back to periodic polling with exponential backoff.
>
> This reduces notification-related API traffic by ~99.9% and delivers updates in sub-second latency."

---

### SD Q3: "How would you add multi-tenancy to support 500 organizations?"

> "I'd use shared database, tenant-scoped rows — the most cost-effective approach for a SaaS with this many tenants.
>
> 1. **Schema:** Add an `organization_id` UUID column to every table (tasks, docs, notifications, users). Create an `organizations` table with billing info and settings.
> 2. **Isolation:** Use PostgreSQL Row-Level Security (RLS). Each table gets a policy like `USING (organization_id = current_setting('app.tenant_id')::uuid)`. A middleware sets the session variable from the JWT's `organizationId` claim.
> 3. **JWT update:** The token payload becomes `{ id, role, organizationId }`. Every API request is automatically scoped to the correct tenant.
> 4. **Query safety:** Even if a developer forgets a WHERE clause, RLS at the database level prevents cross-tenant data leaks.
>
> For large enterprise tenants needing isolation, I'd offer a dedicated database option — but for 500 SMB orgs, shared-with-RLS is the right tradeoff between cost and security."

---

### SD Q4: "Walk me through how you'd handle a traffic spike — say 10x normal load during a Monday morning."

> "Monday morning is already a peak: users check dashboards, the weekly AI summary cron runs, and managers create tasks for the week.
>
> 1. **Auto-scaling:** ECS Fargate scales containers based on CPU utilization and request count. I'd set a scaling policy at 60% CPU → add instance, with a min of 2 and max of 8 tasks.
> 2. **Database protection:** RDS connection pooling via PgBouncer limits connection count. Read-heavy queries (dashboard stats, notification lists) hit the read replica.
> 3. **AI throttling:** The weekly AI summary cron generates Gemini calls for every org. I'd batch these with SQS — process 10 orgs/minute max to avoid Gemini rate limits and spread the load.
> 4. **CDN buffering:** Static assets (React SPA) are served from CloudFront, so the API only handles data requests.
> 5. **Circuit breaker:** If Gemini API latency exceeds 10s, fall back to the local heuristic functions I already built — `breakdownGoal()` returns 3 generic subtasks, `reviewNotes()` checks string length."

---

### SD Q5: "How would you design a caching strategy for this application?"

> "I'd use a tiered caching approach with Redis:
>
> **L1 — User session cache (Redis, 15-min TTL):**
> After the `protect` middleware validates a JWT, cache the user object in Redis keyed by `user:{id}`. This eliminates the MongoDB/PostgreSQL lookup on every authenticated request. At 15K DAU making 36 requests each, that's 540K DB reads saved per day.
>
> **L2 — AI response cache (Redis, 24-hour TTL):**
> AI task breakdowns for the same goal produce similar results. Cache by hashing the input: `ai:breakdown:{sha256(goal)}`. Same for `generateDraft()` — cache by task ID. This reduces Gemini API costs by 40-60%.
>
> **L3 — Dashboard stats cache (Redis, 5-min TTL):**
> Aggregate queries (total tasks, completed count, overdue count) are expensive. Cache the result per user/org with a 5-minute TTL and invalidate on task status change.
>
> **Invalidation strategy:** Use event-driven invalidation — when a task status changes, publish to a Redis channel. Subscribers invalidate the relevant cache keys. For AI caches, use a simple TTL-based expiry."

---

### SD Q6: "How would you implement rate limiting that works across multiple server instances?"

> "The current implementation uses `express-rate-limit` with in-memory storage — this breaks the moment you add a second server because each instance has its own counter.
>
> For production:
> 1. **Replace the store** with `rate-limit-redis`. Same `express-rate-limit` middleware, but the counter is stored in a shared ElastiCache Redis instance.
> 2. **Tiered limits:**
>    - Auth endpoints: 10 requests / 15 minutes / IP (brute-force protection)
>    - AI endpoints: 5 requests / hour / user (cost control)
>    - General API: 100 requests / minute / user (abuse prevention)
> 3. **Sliding window:** Use the `sliding` window algorithm instead of fixed windows to prevent burst attacks at window boundaries.
> 4. **Response headers:** Return `X-RateLimit-Remaining` and `Retry-After` so the frontend can show appropriate UI (disable buttons, show countdown)."

---

### SD Q7: "How would you set up CI/CD for this project?"

> "I'd use GitHub Actions with a 3-stage pipeline:
>
> **Stage 1 — Test (every PR):**
> - Run `npm run lint` and `npm run typecheck`
> - Run Jest unit tests + Supertest integration tests against a Dockerized PostgreSQL
> - Run frontend tests with React Testing Library
> - Report coverage, block merge below 80%
>
> **Stage 2 — Build & Push (on merge to main):**
> - Build Docker image for backend
> - Build frontend with `vite build`
> - Push backend image to Amazon ECR
> - Push frontend assets to S3
>
> **Stage 3 — Deploy (auto or manual gate):**
> - Update ECS task definition with new image tag
> - ECS performs rolling deployment (new tasks start → health check passes → old tasks drain)
> - Invalidate CloudFront cache for frontend
> - Run smoke tests against production API
>
> For staging: deploy every PR merge to a staging environment. For production: require a manual approval gate in GitHub Actions."

---

### SD Q8: "How would you approach migrating from MongoDB to PostgreSQL without downtime?"

> "I'd use a 4-phase migration:
>
> **Phase 1 — Dual Schema (1 week):**
> Add Prisma alongside Mongoose. Define the PostgreSQL schema to mirror the MongoDB collections. Add foreign key relationships and indexes.
>
> **Phase 2 — Data Migration (1 week):**
> Write a migration script that reads all MongoDB documents and inserts them into PostgreSQL. Handle ObjectId → UUID conversion. Run against production data in a staging PostgreSQL instance to validate.
>
> **Phase 3 — Dual Write (1-2 weeks):**
> Update all controllers to write to both MongoDB and PostgreSQL. Read from MongoDB (source of truth). Run consistency checks nightly to ensure both databases stay in sync. This catches any edge cases before cutover.
>
> **Phase 4 — Cutover (1 day):**
> - Set app to read-only mode during cutover (2-hour maintenance window)
> - Run final sync to catch any missed writes
> - Switch read source from MongoDB to PostgreSQL
> - Remove Mongoose code and MongoDB connection
> - Monitor for 48 hours, keep MongoDB backup for 30 days
>
> Total timeline: ~4-6 weeks. The dual-write phase is the safety net — if PostgreSQL has issues, you instantly fall back to MongoDB reads."

---

> [!TIP]
> **The single most powerful thing you can do in this interview is show, not tell.** If they ask "How would you build role-based permissions?", don't describe it hypothetically — pull up your `roles.middleware.ts` and show the 13 lines of code. If they ask about workflow automation, show the cron job. If they ask about scaling, reference the concrete numbers from your analysis. Your OpsRift project is your interview.

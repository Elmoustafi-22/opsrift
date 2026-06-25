# Opsrift Backend API Service

The backend API service for the Opsrift workflow scheduling and operations management platform. It handles authentication, task assignment, progress tracking, automatic escalations, CSV/PDF reports, and Gemini AI operations.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **AI Integration**: `@google/genai` (utilizing the `gemini-2.5-flash` model)
- **Task Scheduler**: `node-cron`
- **Security & Utilities**: JWT, Bcryptjs, Express Rate Limit, Helmet, CORS

---

## 📋 Core Backend Features
1. **Goal Breakdown Engine**: Gemini AI decomposes a manager's high-level goal into a series of actionable tasks.
2. **AI Document Refinement**: Polishes staff raw notes and extracts a one-sentence final operational outcome summary in structured JSON.
3. **Smart Doc Reviewer**: Scans documentation notes for vagueness or low-effort text before submission.
4. **Cron Scheduler (Jobs)**:
   - **Due Soon Reminder**: Fires daily to warn operators of tasks due within 24 hours.
   - **Escalation Engine**: Automatically flags overdue tasks as "escalated" for managerial attention.
5. **Operational Reports Ingestion**: Compiles and structures completed tasks and logs into CSV exports.
6. **AI Weekly Summary**: Gathers the past week's completed task outcomes and compiles an executive weekly report.

---

## ⚙️ Environment Variables

Create a `.env` file in `opsrift-backend` root with the following configuration keys:

```env
PORT=5000
MONGO_URI=mongodb://username:password@host:port/database_name?authSource=admin
JWT_SECRET=your_jwt_signing_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🚀 Installation & Local Development

### 1. Install Dependencies
Ensure you have Node.js (v18+) and npm installed, then run:
```bash
npm install
```

### 2. Seed Database Users
The database can be pre-populated with default seed data for admins, managers, and staff members:
```bash
npm run seed
```

### 3. Run Development Server
Launches the development server with live reload:
```bash
npm run dev
```

### 4. Build for Production
Compiles the TypeScript source files to standard JavaScript in the `dist` directory:
```bash
npm run build
```

### 5. Running Production Build
```bash
npm start
```

### 6. Run Unit Tests
Executes the Jest test suite:
```bash
npm test
```

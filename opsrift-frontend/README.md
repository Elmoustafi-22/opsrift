# Opsrift Frontend Web Client

The web client for the Opsrift workflow scheduling and operations management platform. This application allows admins, managers, and operators to interact with tasks, manage objectives, trigger AI task guidelines, refine notes, and generate operational summaries.

---

## 🛠️ Tech Stack
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (modular design tokens, glassmorphism card layouts, full @media print stylesheets)
- **State Management**: Zustand (with local storage persistence)
- **Routing**: React Router v7
- **HTTP Client**: Axios (configured with interceptors for token inclusion)
- **Icons**: Lucide React
- **Animations**: Framer Motion

---

## 📋 Core Dashboard Features
1. **Interactive Task Board**: Filter and manage active vs. historical operations.
2. **Details View**: Check task descriptions, assignees, deadlines, and **AI Operational Guidelines & Suggestions**.
3. **Task outcomes Dialog**: Form to mark tasks done, featuring **✨ AI Refine** to auto-polish completion notes and auto-fill the final outcome field. It includes live note vagueness warning flags.
4. **AI Goal Planner**: Modal interface to generate task list drafts from high-level objectives.
5. **Operational Reports Export**: Download task lists and documentation logs directly to CSV format.
6. **Print-to-PDF Layout**: Formatted print sheets that automatically strip away sidebars, headers, and UI actions for clean report generation.
7. **Profile View**: View personal Fellow details and update credentials.

---

## 🚀 Installation & Local Development

### 1. Install Dependencies
Run from the `opsrift-frontend` directory:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in `opsrift-frontend` root pointing to the backend API:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
Launches the local Vite server:
```bash
npm run dev
```

### 4. Build for Production
Compiles and minifies assets into the `dist` directory:
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```

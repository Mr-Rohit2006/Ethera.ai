# Ethera.ai – Team Task Manager (Full‑Stack)

## ✨ Overview
A premium‑styled, **full‑stack** web application that lets teams:
- **Create projects** and manage their settings.
- **Invite members** by email and assign **role‑based permissions** (Admin / Member).
- **Create, assign, and track tasks** on a sleek Kanban board.
- View **real‑time dashboard analytics** (progress, overdue tasks, upcoming deadlines).

All UI components follow a dark‑slate glassmorphism design with smooth micro‑animations, custom Google fonts (Outfit & Inter), and vibrant gradients.

---

## 🛠️ Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Vite + React, React‑Router‑DOM, Lucide‑react icons |
| Styling | Vanilla CSS (glassmorphic, dark theme) |
| Backend | Node.js + Express |
| Database | SQLite (local) – ready to swap to Turso/ Supabase for cloud |
| Auth | JWT (bcrypt password hashing) |
| Deployment | Vercel (via `vercel.json`) |

---

## 🚀 Getting Started (Local)
1. **Clone the repository** (already done) – if starting fresh:
   ```bash
   git clone https://github.com/Mr-Rohit2006/Ethera.ai.git
   cd Ethera.ai
   ```
2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   # Frontend
   cd ../frontend
   npm install
   ```
3. **Run the servers**
   ```bash
   # Backend (in one terminal)
   cd backend
   npm run start   # or: node server.js
   # Frontend (in another terminal)
   cd ../frontend
   npm run dev
   ```
   The app will be reachable at `http://localhost:3000` (Vite) and the API at `http://localhost:5000/api`.
4. **Open the app** – the browser will automatically open the login screen. Register a user, create a project, invite teammates, and start managing tasks.

---

## 📦 Production Deployment (Vercel)
1. **Push the repository** – already pushed to GitHub.
2. **Add a Vercel project** – import the `Ethera.ai` repo.
3. **Vercel reads `vercel.json`** which:
   - Deploys the Express backend as a serverless function (`backend/server.js`).
   - Serves the built React app from `frontend/dist`.
   - Routes all `/api/*` calls to the backend and all other routes to `index.html` (SPA fallback).
4. **Deploy** – Vercel will run `npm install && npm run build` in both folders automatically.
5. **Configure environment variables** (optional, for a persistent DB):
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`
   Add them under **Project Settings → Environment Variables**.

---

## 🗄️ Database
- The default local DB (`backend/database.sqlite`) works for development.
- For production, replace the SQLite client in `backend/config/db.js` with a cloud‑hosted SQLite (e.g., Turso) – only the connection URL changes, the rest of the code stays the same.

---

## 👥 Role‑Based Access Control
| Role | Permissions |
|------|-------------|
| **Admin** (project owner) | Create / edit / delete projects, add / remove members, change member roles, full task CRUD. |
| **Member** | View project, create tasks, **only** update task **status** (cannot edit title/description/assignee). |

---

## 📚 Scripts
```bash
# Backend
npm run start          # start server (node server.js)
npm run dev            # hot‑reload with nodemon (if configured)

# Frontend
npm run dev            # Vite dev server
npm run build          # production build (output in frontend/dist)
```

---

## 🎨 Design System (Frontend)
- **Colors** – dark slate base, primary accent `#6366F1` (indigo), secondary `#A78BFA` (purple).
- **Typography** – `Outfit` for headers, `Inter` for body text.
- **Components** – glass‑styled cards, subtle shadows, smooth hover transitions.
- **Micro‑animations** – button ripples, card drag‑and‑drop, fade‑in panels.

---

## 🐞 Troubleshooting
- **404 on refresh** – ensure the backend fallback route (`app.get('*', ...)`) is present (it is).
- **Database not persisting on Vercel** – Vercel serverless functions are stateless; use a remote DB (Turso, Supabase, etc.).
- **CORS errors** – Vercel automatically handles same‑origin; for external API calls configure appropriate headers in `server.js`.

---

## 📌 License
MIT – feel free to fork, extend, or contribute!

# Deployment Guide: Vercel (Frontend) & Render (Backend + Database)

This project is prepared for single-click / simple manual deployment with **Render** (Node.js Backend & PostgreSQL) and **Vercel** (React/Vite Frontend).

---

## 1. Backend Deployment on Render

### Option A: 1-Click Blueprint (Recommended)
1. Push your repository to **GitHub** or **GitLab**.
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your Git repository.
5. Render will auto-detect `render.yaml` and create:
   - **PostgreSQL Database** (`attendance-db`)
   - **Node.js Web Service** (`attendance-backend`)
6. In the Web Service Environment tab, set:
   - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
   - `ADMIN_PASSWORD_HASH`: Your bcrypt hashed password (e.g. generated via `node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"`)

### Option B: Manual Web Service Setup
1. On Render, click **New +** -> **Web Service**.
2. Connect your repository.
3. Configure the service settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run migrate && npm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DATABASE_URL`: *(Your Render Postgres Connection String)*
   - `DB_SSL`: `true`
   - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
   - `ADMIN_USERNAME`: `admin`
   - `ADMIN_PASSWORD_HASH`: *(Your bcrypt hashed password)*
   - `SESSION_SECRET`: *(A long random secret string)*

---

## 2. Frontend Deployment on Vercel

1. Log into [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import your Git repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://<your-render-backend-name>.onrender.com`
6. Click **Deploy**.

---

## 3. Post-Deployment Verification Checklist

- [ ] Ensure backend health check returns `status: ok` by visiting `https://<your-render-backend>.onrender.com/api/health`.
- [ ] Ensure `ALLOWED_ORIGINS` in Render environment matches your Vercel URL (e.g., `https://<your-app>.vercel.app`).
- [ ] Log in with your admin credentials on the deployed Vercel site.

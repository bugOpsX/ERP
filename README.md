# Kamla Enterprises — Industrial Attendance Management Portal

An enterprise-grade, multi-site attendance management and reporting platform built for contractor operations across industrial blast furnaces and manufacturing plants.

---

## 🏢 Project Overview

Kamla Enterprises operates as a contractor across multiple industrial sites (such as Surat Plant - BF-2/BF-3, and future expansions like Korba Site). This portal provides an end-to-end attendance processing pipeline—from Excel spreadsheet uploads and parsing to transactional database storage, monthly worker summaries, admin session security, and printable PDF attendance cards.

---

## ✨ Key Features

- **Plant-Aware Parser Architecture:** Extensible parser engine (`ImporterRegistry` & `KamlaV1Parser`) supporting custom spreadsheet layouts per industrial site.
- **Transactional Database Imports:** Two-step upload lifecycle (`Validate & Preview` → `Transactional Import/Replace`) powered by PostgreSQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`).
- **Granular Shift & Man-Day Logic:** Automatic weekday man-day logging, Sunday ratio calculations ($\text{Sunday Hours} / 5$), shift classification (`DAY`, `NIGHT`, `SUNDAY`, `Day + Night`), and multi-shift punch consolidation.
- **Global Context Controls:** Filter data across Plant Location, Year, Month, and Blast Furnace Unit (`BF-2`, `BF-3`, `ALL`).
- **Admin Session Security:** JWT-authenticated administration with HTTP-Only cookies (`kamla_admin_session`), bcrypt password hashing, login rate-limiting (10 attempts / 15 mins), and route protection.
- **Industrial PDF Engine:** Client-side worker card generation and bulk PDF exporting using `jspdf` and `html2canvas`.
- **Hybrid Source of Truth:** PostgreSQL handles historical data and monthly summaries, while preserving backward compatibility with live n8n webhook data streams.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18/19, Vite, Tailwind CSS, Material-UI (MUI), Lucide/Material Icons |
| **Backend** | Node.js (ESM), Express.js, `pg` (PostgreSQL Client), Multer, SheetJS (`xlsx`) |
| **Database** | PostgreSQL (v14+) with raw SQL migration scripts |
| **Security** | JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, HTTP-Only Cookies |
| **Live Automation** | n8n Docker Workflow Integration |

---

## 📁 Repository Structure

```text
attendance-system/
├── backend/
│   ├── config/             # DB & Webhook configurations
│   ├── controllers/        # Request handlers (auth, historical, upload, etc.)
│   ├── middleware/         # Auth, upload, and rate-limiting middleware
│   ├── migrations/         # SQL migration scripts (001 to 004)
│   ├── src/
│   │   ├── db/             # PG pool connection & migration runner
│   │   ├── importers/      # BaseParser & KamlaV1Parser implementation
│   │   └── services/       # Core business logic (importEngine, historical, auth)
│   ├── app.js              # Express app entry point
│   ├── .env.example        # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components (Header, Sidebar, WorkerCard, Table, etc.)
│   │   ├── context/        # React Context (AuthContext, AttendanceContext, SiteContext)
│   │   ├── pages/          # App pages (Upload, History, Login)
│   │   ├── services/       # Axios API client
│   │   └── utils/          # PDF generator utility
│   ├── .env.example        # Frontend environment template
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: v18.0 or higher
- **PostgreSQL**: v14.0 or higher
- **npm**: v9.0 or higher

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` using `.env.example`:

```bash
cp .env.example .env
```

Configure your PostgreSQL credentials in `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kamla_attendance
DB_USER=postgres
DB_PASSWORD=your_postgres_password

ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$k5hLCAgriibJN3jnmCw6OOAC82LfKiM23OPQ8Pac4KC7WAElt7teK
SESSION_SECRET=your_super_secret_session_key
SESSION_MAX_AGE=86400
```

Run database migrations to initialize tables and seed default plants:

```bash
npm run db:migrate
```

Start the backend development server:

```bash
npm run dev
```

The backend server will run on `http://localhost:5000`.

---

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` using `.env.example`:

```bash
cp .env.example .env
```

Configure the API base URL in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the Vite development server:

```bash
npm run dev
```

The frontend application will run on `http://localhost:5173`.

---


## 📄 License

Internal Enterprise Software — Kamla Enterprises. All rights reserved.

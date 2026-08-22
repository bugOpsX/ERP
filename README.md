# 🏢 Kamla Enterprises — Industrial Attendance Management Portal

An enterprise-grade, multi-site attendance management, reporting, and payroll-ready platform built for industrial contractor operations across manufacturing plants and blast furnace sites.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Multi-Plant Engine](#-architecture--multi-plant-engine)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Security & Environment Hygiene](#-security--environment-hygiene)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Database Migrations](#-database-migrations)
- [API Reference](#-api-reference)
- [License](#-license)

---

## 🏢 Overview

Kamla Enterprises operates as a primary industrial contractor managing worker attendance and manpower deployment across multiple industrial plants (including **Surat Plant - BF-2 / BF-3** and **Korba Plant**).

This portal provides a unified, end-to-end processing pipeline:
1. **Excel Import Engine**: Parses site-specific monthly attendance workbooks (`.xlsx`).
2. **Transactional Database Storage**: Stores daily attendance records and monthly aggregate summaries in PostgreSQL.
3. **Multi-Plant Dashboard**: Instant filtering across Plant Location, Year, Month, Unit (`BF-2`, `BF-3`, `KORBA-MAIN`, etc.), and Attendance Type.
4. **Vector PDF Worker Cards**: Generates individual and bulk PDF attendance cards with **100% selectable, searchable text and vector lines** (suitable for audit compliance and client submission).
5. **High Performance API**: Integrated Express GZIP payload compression for fast historical data retrieval.

---

## ✨ Key Features

- 🏗️ **Extensible Multi-Plant Parser Engine**: Standardized `BaseParser` interface with dedicated site parsers (`KamlaV1Parser` for Surat time-based data, `KorbaV1Parser` for Korba MD/OT-based data).
- 🔒 **Transactional Import Lifecycle**: Two-step upload process (`Preview & Validate` → `Atomic Database Import/Replace`) wrapped in PostgreSQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`).
- ⏱️ **Advanced Shift & Attendance Analytics**:
  - Shifts: `DAY`, `NIGHT`, `NIGHT_MAN_DAY`, `SUNDAY`, `Day + Night`.
  - Automated calculation of Day Man Days, Night Man Days, Sunday Ratios ($\text{Sunday Hours} / 5$), Total Man Days, and Overtime Hours.
- 📄 **True Vector PDF Generation**:
  - Real, selectable text (searchable worker names, Gate Pass IDs, WISA numbers).
  - Clean vector table lines and crisp typography using native `jsPDF` primitives (no rasterized canvas images).
  - Single worker card downloads and bulk export per site/unit.
- ⚡ **GZIP API Compression**: Integrated `compression` middleware reducing large historical payload sizes by over **94.5%** (from ~2.8MB down to ~155KB).
- 🛡️ **Enterprise Admin Security**:
  - JWT session tokens delivered via secure HTTP-Only cookies (`kamla_admin_session`).
  - `bcrypt` password hash verification and brute-force rate-limiting (10 login attempts / 15 minutes).
  - Protected API routes and clean environment variable isolation.

---

## 🛠️ Technology Stack

| Layer | Technology / Package |
| :--- | :--- |
| **Frontend** | React 18/19, Vite, Vanilla CSS / MUI, Lucide React, Axios, jsPDF |
| **Backend** | Node.js (ESM), Express.js, `pg` (PostgreSQL client), `compression`, Multer, SheetJS (`xlsx`) |
| **Database** | PostgreSQL (v14+) with raw SQL migration runner |
| **Security** | JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `express-rate-limit` |
| **Automation** | n8n Webhook Workflow Integration |

---

## 📁 Repository Structure

```text
attendance-system/
├── backend/
│   ├── config/             # Database and Webhook configurations
│   ├── controllers/        # Express controllers (auth, attendance, upload, worker)
│   ├── middleware/         # Auth, upload, and rate-limiting middleware
│   ├── migrations/         # SQL migration scripts (001 to 006)
│   ├── src/
│   │   ├── config/         # PostgreSQL connection pool configuration
│   │   ├── db/             # Database runner and migration executor
│   │   ├── importers/      # Plant parsers (kamlaV1Parser, korbaV1Parser) and registry
│   │   ├── models/         # AttendanceRecord and MonthlySummary data access objects
│   │   └── services/       # Business logic (importEngine, historical, auth, upload)
│   ├── app.js              # Express app initialization & middleware stack
│   ├── server.js           # Server listener entry point
│   ├── .env.example        # Backend environment template (Sanitized)
│   └── package.json
│
├── frontend/
│   ├── public/             # Static assets & site logo
│   ├── src/
│   │   ├── assets/         # Images and brand identity assets
│   │   ├── components/     # UI components (AttendanceCard, Header, Sidebar, Drawers)
│   │   ├── context/        # React Context (AuthContext, AttendanceContext, SiteContext)
│   │   ├── pages/          # Application views (Upload, History, Login)
│   │   ├── services/       # API HTTP client (Axios)
│   │   └── utils/          # True Vector PDF generator utility (`pdfGenerator.js`)
│   ├── .env.example        # Frontend environment template (Sanitized)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🛡️ Security & Environment Hygiene

> [!IMPORTANT]
> Never commit actual credentials, database passwords, session secrets, or API keys to GitHub.

All environment secrets are stored in `.env` files which are excluded by `.gitignore`.

### 1. Generating Admin Password Hash
To create a bcrypt password hash for your administrator credentials, execute the following in your terminal:

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_STRONG_PASSWORD', 10))"
```

Paste the resulting `$2b$10$...` hash into `ADMIN_PASSWORD_HASH` inside your `backend/.env` file.

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: v18.0 or higher
- **PostgreSQL**: v14.0 or higher
- **npm**: v9.0 or higher

---

### 1. Backend Setup

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create your local `.env` file from the sanitized template:
   ```bash
   cp .env.example .env
   ```

3. Update `backend/.env` with your local configuration:
   ```env
   PORT=5000
   N8N_ATTENDANCE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/Attendance-imp

   # Database Credentials
   DATABASE_URL=postgresql://your_user:your_password@localhost:5432/attendance_db
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=attendance_db
   DB_USER=your_user
   DB_PASSWORD=your_password

   # Admin Authentication
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=$2b$10$YOUR_BCRYPT_HASH_HERE
   SESSION_SECRET=your_random_64_character_secret_key_here
   SESSION_MAX_AGE=86400
   ```

4. Run PostgreSQL database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start backend development server:
   ```bash
   npm run dev
   ```
   *Backend running at `http://localhost:5000`*

---

### 2. Frontend Setup

1. In a new terminal, navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create your local `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Configure the API endpoint in `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

4. Start Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend running at `http://localhost:5173`*

---

## 🗄️ Database Migrations

Migrations are stored under `backend/migrations/` and executed sequentially:

| File | Description |
| :--- | :--- |
| `001_initial_schema.sql` | Base schema for plants, workers, attendance records, and monthly summaries |
| `002_import_batch_logs.sql` | Import batch tracking table for upload auditing |
| `003_worker_metadata.sql` | Additional worker metadata (Gate Pass, WISA, Designation) |
| `004_plant_registry_updates.sql` | Plant location, city, state, and parser profile seeding |
| `005_add_night_man_day.sql` | Columns for Night Shift Man Days logging |
| `006_korba_attendance_support.sql` | Support for Korba site attendance structure & metadata |

Run migrations manually at any time with `npm run db:migrate` in `backend/`.

---

## 🔌 API Reference

### Auth Endpoints
- `POST /api/auth/login` — Authenticate admin credentials and receive HTTP-Only cookie.
- `POST /api/auth/logout` — Clear session cookie.
- `GET /api/auth/me` — Verify active administrator session.

### Attendance & Historical Data
- `GET /api/attendance/periods` — List available attendance periods by plant, year, and month.
- `GET /api/attendance/history` — Fetch monthly attendance records and summaries (Compressed with GZIP).

### Upload & Import Engine
- `POST /api/upload/inspect` — Inspect uploaded `.xlsx` file and preview parsed attendance data.
- `POST /api/upload/import` — Execute atomic database commit for validated attendance dataset.

---

## 📄 License

Internal Enterprise Application — **Kamla Enterprises**. All rights reserved.

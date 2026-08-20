-- Migration 001: Initial Schema for Attendance Dashboard
-- Creates sites, workers, attendance_imports, attendance_records, and monthly_worker_summaries

-- 1. Sites Table
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Workers Table
CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    gate_pass VARCHAR(50),
    wisa VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    department VARCHAR(100),
    blast_furnace VARCHAR(50) NOT NULL,
    site_id INT REFERENCES sites(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_workers_site_wisa UNIQUE (blast_furnace, wisa)
);

CREATE INDEX IF NOT EXISTS idx_workers_blast_furnace_wisa ON workers (blast_furnace, wisa);
CREATE INDEX IF NOT EXISTS idx_workers_wisa ON workers (wisa);
CREATE INDEX IF NOT EXISTS idx_workers_gate_pass ON workers (gate_pass);

-- 3. Attendance Imports Table
CREATE TABLE IF NOT EXISTS attendance_imports (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2000),
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'imported',
    bf2_record_count INT DEFAULT 0,
    bf3_record_count INT DEFAULT 0,
    worker_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_imports_month_year ON attendance_imports (month, year);

-- 4. Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    worker_id INT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    import_id INT REFERENCES attendance_imports(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    day_name VARCHAR(20),
    is_sunday BOOLEAN DEFAULT FALSE,
    day_in VARCHAR(20),
    day_out VARCHAR(20),
    night_in VARCHAR(20),
    night_out VARCHAR(20),
    shift_type VARCHAR(50),
    weekday_man_day NUMERIC(10, 3) DEFAULT 0,
    sunday_hours NUMERIC(10, 2) DEFAULT 0,
    sunday_ratio NUMERIC(10, 2) DEFAULT 0,
    man_day NUMERIC(10, 3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_attendance_records_worker_date UNIQUE (worker_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_worker_date ON attendance_records (worker_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records (attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_import_id ON attendance_records (import_id);

-- 5. Monthly Worker Summaries Table
CREATE TABLE IF NOT EXISTS monthly_worker_summaries (
    id SERIAL PRIMARY KEY,
    worker_id INT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2000),
    blast_furnace VARCHAR(50) NOT NULL,
    site_id INT REFERENCES sites(id) ON DELETE SET NULL,
    working_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    sunday_working_days INT DEFAULT 0,
    weekday_man_days NUMERIC(10, 2) DEFAULT 0,
    sunday_hours NUMERIC(10, 2) DEFAULT 0,
    sunday_ratio NUMERIC(10, 2) DEFAULT 0,
    total_man_days NUMERIC(10, 2) DEFAULT 0,
    night_shifts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_monthly_worker_summaries UNIQUE (worker_id, month, year, blast_furnace)
);

CREATE INDEX IF NOT EXISTS idx_monthly_summaries_month_year_bf ON monthly_worker_summaries (month, year, blast_furnace);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_worker ON monthly_worker_summaries (worker_id, month, year);

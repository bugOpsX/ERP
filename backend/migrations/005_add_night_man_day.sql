-- Migration 005: Add Night Man Day columns to attendance_records and monthly_worker_summaries

ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS night_man_day NUMERIC(10, 3) DEFAULT 0;

ALTER TABLE monthly_worker_summaries 
ADD COLUMN IF NOT EXISTS night_man_days NUMERIC(10, 2) DEFAULT 0;

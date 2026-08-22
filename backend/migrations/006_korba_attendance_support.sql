-- Migration 006: Korba Plant Attendance Support
-- Extends worker, attendance, and summary models for plant-aware Korba (PLANT_B) MD+OT attendance.

-- 1. Update PLANT_B profile in plants table
UPDATE plants
SET name = 'Kamla Enterprises Plant',
    city = 'Korba',
    state = 'Chhattisgarh',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'PLANT_B';

-- 2. Create Korba main site entry
INSERT INTO sites (code, name, plant_id)
VALUES (
  'KORBA-MAIN',
  'Korba Site / Main Workforce',
  (SELECT id FROM plants WHERE code = 'PLANT_B')
)
ON CONFLICT (code) DO NOTHING;

-- 3. Extend workers table for Korba identity fields
ALTER TABLE workers ALTER COLUMN wisa DROP NOT NULL;
ALTER TABLE workers ALTER COLUMN blast_furnace DROP NOT NULL;

ALTER TABLE workers ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS aadhaar_no VARCHAR(50);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS sub_contractor_name VARCHAR(255);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS plant_id INT REFERENCES plants(id) ON DELETE SET NULL;

-- Backfill plant_id for existing Surat workers
UPDATE workers
SET plant_id = (SELECT id FROM plants WHERE code = 'PLANT_A')
WHERE plant_id IS NULL;

-- Indexes for worker identity
CREATE UNIQUE INDEX IF NOT EXISTS uk_workers_plant_employee_id ON workers (plant_id, employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workers_plant_wisa ON workers (plant_id, wisa);

-- 4. Extend attendance_records table for MD and OT support
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS md NUMERIC(10, 3) DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS ot_hours NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS attendance_type VARCHAR(50) DEFAULT 'PUNCH_BASED';

-- 5. Extend monthly_worker_summaries table for Korba plant summary metrics
ALTER TABLE monthly_worker_summaries ALTER COLUMN blast_furnace DROP NOT NULL;

ALTER TABLE monthly_worker_summaries ADD COLUMN IF NOT EXISTS plant_id INT REFERENCES plants(id) ON DELETE SET NULL;
ALTER TABLE monthly_worker_summaries ADD COLUMN IF NOT EXISTS total_ot_hours NUMERIC(10, 2) DEFAULT 0;

-- Backfill plant_id for existing monthly worker summaries
UPDATE monthly_worker_summaries
SET plant_id = (SELECT id FROM plants WHERE code = 'PLANT_A')
WHERE plant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_monthly_summaries_plant_month_year ON monthly_worker_summaries (plant_id, month, year);

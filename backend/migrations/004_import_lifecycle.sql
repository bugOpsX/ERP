-- Migration 004: Enhance attendance_imports table for Import Lifecycle and Duplicate Detection

ALTER TABLE attendance_imports ADD COLUMN IF NOT EXISTS upload_id VARCHAR(100) UNIQUE;
ALTER TABLE attendance_imports ADD COLUMN IF NOT EXISTS plant_code VARCHAR(50) DEFAULT 'PLANT_A';
ALTER TABLE attendance_imports ADD COLUMN IF NOT EXISTS plant_id INT REFERENCES plants(id) ON DELETE SET NULL;
ALTER TABLE attendance_imports ADD COLUMN IF NOT EXISTS total_record_count INT DEFAULT 0;
ALTER TABLE attendance_imports ADD COLUMN IF NOT EXISTS temp_file_path TEXT;
ALTER TABLE attendance_imports ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Drop previous status constraint if any, and set default status to 'pending'
ALTER TABLE attendance_imports ALTER COLUMN status SET DEFAULT 'pending';

-- Add index on upload_id and plant_code for fast lookup
CREATE INDEX IF NOT EXISTS idx_attendance_imports_upload_id ON attendance_imports (upload_id);
CREATE INDEX IF NOT EXISTS idx_attendance_imports_plant_month_year ON attendance_imports (plant_code, month, year);

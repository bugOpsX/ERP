-- Migration 003: Plant Location and Plant Units Architecture
-- Distinguishes higher-level Plant Location from Plant Units (sites)

CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Link existing sites (BF-2, BF-3) to a plant location
ALTER TABLE sites ADD COLUMN IF NOT EXISTS plant_id INT REFERENCES plants(id) ON DELETE SET NULL;

-- Seed default Plant A (Kamla Enterprises Plant)
INSERT INTO plants (code, name, city, state)
VALUES ('PLANT_A', 'Kamla Enterprises Plant', 'Surat', 'Gujarat')
ON CONFLICT (code) DO UPDATE SET city = 'Surat', state = 'Gujarat';

-- Seed default Plant B (Future Plant placeholder for architecture verification)
INSERT INTO plants (code, name, city)
VALUES ('PLANT_B', 'Future Plant Location', 'Other City')
ON CONFLICT (code) DO NOTHING;

-- Associate existing sites (BF-2, BF-3) with PLANT_A
UPDATE sites
SET plant_id = (SELECT id FROM plants WHERE code = 'PLANT_A')
WHERE plant_id IS NULL AND code IN ('BF-2', 'BF-3');

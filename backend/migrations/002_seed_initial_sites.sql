-- Migration 002: Seed Initial Sites
-- Populates the sites table with default units (BF-2 and BF-3)

INSERT INTO sites (code, name) VALUES
    ('BF-2', 'Blast Furnace 2'),
    ('BF-3', 'Blast Furnace 3')
ON CONFLICT (code) DO NOTHING;

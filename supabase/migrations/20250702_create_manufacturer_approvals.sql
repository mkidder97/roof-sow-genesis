-- Create manufacturer_approvals table
CREATE TABLE IF NOT EXISTS manufacturer_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer TEXT NOT NULL,
    product_type TEXT NOT NULL,
    fpa_number TEXT NOT NULL,
    mcrf_value NUMERIC NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manufacturer_approvals_manufacturer ON manufacturer_approvals(manufacturer);
CREATE INDEX IF NOT EXISTS idx_manufacturer_approvals_product_type ON manufacturer_approvals(product_type);
CREATE INDEX IF NOT EXISTS idx_manufacturer_approvals_active ON manufacturer_approvals(is_active);
CREATE INDEX IF NOT EXISTS idx_manufacturer_approvals_expiration ON manufacturer_approvals(expiration_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_manufacturer_approvals_updated_at 
    BEFORE UPDATE ON manufacturer_approvals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Seed data with manufacturer approvals from SOW_SPEC.md
INSERT INTO manufacturer_approvals (manufacturer, product_type, fpa_number, mcrf_value, expiration_date, notes) VALUES
-- Johns Manville
('johns-manville', 'tpo', 'FL16758.3-R35', 285, '2025-12-31 23:59:59+00', 'TPO Single Ply system with HL fasteners'),
('johns-manville', 'epdm', 'FL16758.2-R40', 285, '2025-12-31 23:59:59+00', 'EPDM membrane system'),
('johns-manville', 'modified-bitumen', 'FL16758.1-R25', 285, '2025-12-31 23:59:59+00', 'Modified bitumen system'),

-- Carlisle SynTec
('carlisle', 'tpo', 'FL17825.1-R60', 295, '2026-06-30 23:59:59+00', 'Sure-Weld TPO with X-Treme HP fasteners'),
('carlisle', 'epdm', 'FL17825.2-R45', 295, '2026-06-30 23:59:59+00', 'EPDM membrane system'),
('carlisle', 'fleeceback', 'FL17825.3-R35', 295, '2026-06-30 23:59:59+00', 'FleeceBACK membrane system'),

-- GAF
('gaf', 'tpo', 'FL18552.1-R40', 280, '2025-09-30 23:59:59+00', 'EverGuard TPO system'),
('gaf', 'epdm', 'FL18552.2-R35', 280, '2025-09-30 23:59:59+00', 'Liberty EPDM system'),
('gaf', 'modified-bitumen', 'FL18552.3-R30', 280, '2025-09-30 23:59:59+00', 'Ruberoid Modified Bitumen system');

-- Create view for active approvals only
CREATE OR REPLACE VIEW active_manufacturer_approvals AS
SELECT * FROM manufacturer_approvals 
WHERE is_active = TRUE 
AND (expiration_date IS NULL OR expiration_date > NOW());

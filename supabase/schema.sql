-- Supabase Schema for roof-sow-genesis Self-Healing PDF System
-- This schema tracks project metadata, PDF generation history, fix stats, and version diffs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    project_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT unique_user_project_name UNIQUE(user_id, name)
);

-- PDF versions table
CREATE TABLE pdf_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    input_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of input JSON
    pdf_path VARCHAR(500) NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- File metadata
    file_size BIGINT, -- in bytes
    page_count INTEGER,
    
    -- Generation metrics
    metrics JSONB DEFAULT '{}', -- generation time, errors, warnings, etc.
    
    -- Input data snapshot
    input_data JSONB NOT NULL,
    
    -- Generation status
    status VARCHAR(50) DEFAULT 'generating', -- generating, completed, failed, quarantined
    error_message TEXT,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('generating', 'completed', 'failed', 'quarantined')),
    CONSTRAINT unique_project_version UNIQUE(project_id, version_number)
);

-- Fixes table
CREATE TABLE fixes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    base_version_id UUID REFERENCES pdf_versions(id) ON DELETE CASCADE NOT NULL,
    new_version_id UUID REFERENCES pdf_versions(id) ON DELETE CASCADE,
    fix_type VARCHAR(100) NOT NULL, -- layout, content, formatting, wind_calculation, etc.
    claude_summary TEXT NOT NULL,
    fix_snippet TEXT, -- The actual code/fix applied
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Fix metadata
    analysis_data JSONB DEFAULT '{}', -- PDF analysis results that triggered the fix
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    applied_by VARCHAR(100) DEFAULT 'claude', -- claude, manual, automated
    
    -- Performance tracking
    execution_time_ms INTEGER,
    
    -- Error handling
    error_details JSONB DEFAULT '{}',
    quarantine_reason TEXT
);

-- Fix history aggregations for performance
CREATE TABLE fix_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Daily stats
    total_fixes INTEGER DEFAULT 0,
    successful_fixes INTEGER DEFAULT 0,
    failed_fixes INTEGER DEFAULT 0,
    quarantined_fixes INTEGER DEFAULT 0,
    
    -- Fix type breakdown
    fix_type_counts JSONB DEFAULT '{}',
    
    -- Performance metrics
    avg_execution_time_ms DECIMAL(10,2),
    avg_confidence_score DECIMAL(3,2),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_project_date UNIQUE(project_id, date)
);

-- Test results table for regression testing
CREATE TABLE test_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pdf_version_id UUID REFERENCES pdf_versions(id) ON DELETE CASCADE NOT NULL,
    test_type VARCHAR(100) NOT NULL, -- layout, content, regression, integration
    test_name VARCHAR(255) NOT NULL,
    passed BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Test details
    expected_result JSONB,
    actual_result JSONB,
    diff_data JSONB,
    execution_time_ms INTEGER,
    
    -- Error information
    error_message TEXT,
    stack_trace TEXT
);

-- Backup tracking table
CREATE TABLE backup_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_name VARCHAR(255) NOT NULL, -- pdf-generator.ts, wind-calculations.ts, etc.
    backup_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Backup metadata
    original_file_size BIGINT,
    backup_reason VARCHAR(255), -- fix_application, manual_backup, scheduled
    related_fix_id UUID REFERENCES fixes(id) ON DELETE SET NULL,
    
    -- File hash for integrity
    file_hash VARCHAR(64) NOT NULL
);

-- Quarantine tracking
CREATE TABLE quarantine_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fix_id UUID REFERENCES fixes(id) ON DELETE CASCADE NOT NULL,
    quarantine_path VARCHAR(500) NOT NULL,
    quarantine_reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Resolution tracking
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);

CREATE INDEX idx_pdf_versions_project_id ON pdf_versions(project_id);
CREATE INDEX idx_pdf_versions_created_at ON pdf_versions(created_at);
CREATE INDEX idx_pdf_versions_input_hash ON pdf_versions(input_hash);
CREATE INDEX idx_pdf_versions_status ON pdf_versions(status);

CREATE INDEX idx_fixes_base_version_id ON fixes(base_version_id);
CREATE INDEX idx_fixes_new_version_id ON fixes(new_version_id);
CREATE INDEX idx_fixes_created_at ON fixes(created_at);
CREATE INDEX idx_fixes_fix_type ON fixes(fix_type);
CREATE INDEX idx_fixes_success ON fixes(success);

CREATE INDEX idx_fix_statistics_project_id ON fix_statistics(project_id);
CREATE INDEX idx_fix_statistics_date ON fix_statistics(date);

CREATE INDEX idx_test_results_pdf_version_id ON test_results(pdf_version_id);
CREATE INDEX idx_test_results_test_type ON test_results(test_type);
CREATE INDEX idx_test_results_created_at ON test_results(created_at);

CREATE INDEX idx_backup_history_created_at ON backup_history(created_at);
CREATE INDEX idx_backup_history_module_name ON backup_history(module_name);

CREATE INDEX idx_quarantine_log_fix_id ON quarantine_log(fix_id);
CREATE INDEX idx_quarantine_log_resolved ON quarantine_log(resolved);

-- Row Level Security (RLS) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fix_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarantine_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

-- PDF versions policies (through project ownership)
CREATE POLICY "Users can view PDF versions of their projects" ON pdf_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = pdf_versions.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert PDF versions for their projects" ON pdf_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = pdf_versions.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Similar policies for other tables...
CREATE POLICY "Users can view fixes for their projects" ON fixes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pdf_versions pv
            JOIN projects p ON p.id = pv.project_id
            WHERE pv.id = fixes.base_version_id 
            AND p.user_id = auth.uid()
        )
    );

-- Functions for automated tasks
CREATE OR REPLACE FUNCTION update_fix_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO fix_statistics (
        project_id, 
        date, 
        total_fixes, 
        successful_fixes, 
        failed_fixes,
        quarantined_fixes
    )
    SELECT 
        p.id,
        CURRENT_DATE,
        COUNT(*),
        COUNT(*) FILTER (WHERE NEW.success = true),
        COUNT(*) FILTER (WHERE NEW.success = false AND NEW.quarantine_reason IS NULL),
        COUNT(*) FILTER (WHERE NEW.quarantine_reason IS NOT NULL)
    FROM pdf_versions pv
    JOIN projects p ON p.id = pv.project_id
    WHERE pv.id = NEW.base_version_id
    GROUP BY p.id
    ON CONFLICT (project_id, date) 
    DO UPDATE SET
        total_fixes = fix_statistics.total_fixes + 1,
        successful_fixes = CASE 
            WHEN NEW.success THEN fix_statistics.successful_fixes + 1 
            ELSE fix_statistics.successful_fixes 
        END,
        failed_fixes = CASE 
            WHEN NOT NEW.success AND NEW.quarantine_reason IS NULL THEN fix_statistics.failed_fixes + 1 
            ELSE fix_statistics.failed_fixes 
        END,
        quarantined_fixes = CASE 
            WHEN NEW.quarantine_reason IS NOT NULL THEN fix_statistics.quarantined_fixes + 1 
            ELSE fix_statistics.quarantined_fixes 
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics when fixes are added
CREATE TRIGGER trigger_update_fix_statistics
    AFTER INSERT ON fixes
    FOR EACH ROW
    EXECUTE FUNCTION update_fix_statistics();

-- Function to auto-update project timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW project_summary AS
SELECT 
    p.*,
    COUNT(pv.id) as total_versions,
    COUNT(pv.id) FILTER (WHERE pv.status = 'completed') as completed_versions,
    COUNT(pv.id) FILTER (WHERE pv.status = 'failed') as failed_versions,
    MAX(pv.created_at) as last_generation_at,
    COALESCE(SUM(fs.total_fixes), 0) as total_fixes,
    COALESCE(SUM(fs.successful_fixes), 0) as successful_fixes
FROM projects p
LEFT JOIN pdf_versions pv ON pv.project_id = p.id
LEFT JOIN fix_statistics fs ON fs.project_id = p.id
GROUP BY p.id;

CREATE VIEW recent_activity AS
SELECT 
    'pdf_generation' as activity_type,
    pv.project_id,
    p.name as project_name,
    pv.created_at,
    jsonb_build_object(
        'version_number', pv.version_number,
        'status', pv.status,
        'file_size', pv.file_size
    ) as details
FROM pdf_versions pv
JOIN projects p ON p.id = pv.project_id
UNION ALL
SELECT 
    'fix_applied' as activity_type,
    pv.project_id,
    p.name as project_name,
    f.created_at,
    jsonb_build_object(
        'fix_type', f.fix_type,
        'success', f.success,
        'confidence_score', f.confidence_score
    ) as details
FROM fixes f
JOIN pdf_versions pv ON pv.id = f.base_version_id
JOIN projects p ON p.id = pv.project_id
ORDER BY created_at DESC;

-- Comments for documentation
COMMENT ON TABLE projects IS 'Main projects table tracking SOW generation projects';
COMMENT ON TABLE pdf_versions IS 'Tracks each PDF generation with full versioning and metadata';
COMMENT ON TABLE fixes IS 'Logs all attempted fixes with their outcomes and metadata';
COMMENT ON TABLE fix_statistics IS 'Aggregated daily statistics for performance monitoring';
COMMENT ON TABLE test_results IS 'Results from regression and validation tests';
COMMENT ON TABLE backup_history IS 'Tracks backups of critical system files';
COMMENT ON TABLE quarantine_log IS 'Tracks fixes that were quarantined due to issues';

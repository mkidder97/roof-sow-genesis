-- File Management System Database Migration
-- Creates tables for comprehensive file management with versioning and metadata

-- Create file_type_enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE file_type_enum AS ENUM ('photo', 'document', 'sow', 'report');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user_role user_role_enum NOT NULL,
    original_name TEXT NOT NULL,
    filename TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size BIGINT NOT NULL,
    file_type file_type_enum NOT NULL,
    stage workflow_stage_enum NOT NULL,
    upload_path TEXT NOT NULL,
    cloud_path TEXT,
    thumbnail_path TEXT,
    cloud_thumbnail_path TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    security_checks JSONB NOT NULL DEFAULT '[]',
    version INTEGER NOT NULL DEFAULT 1,
    parent_file_id UUID REFERENCES project_files(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    is_cloud_stored BOOLEAN NOT NULL DEFAULT false,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create file_versions table
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    filename TEXT NOT NULL,
    upload_path TEXT NOT NULL,
    cloud_path TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    changes TEXT[] DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON project_files(user_id);
CREATE INDEX IF NOT EXISTS idx_project_files_stage ON project_files(stage);
CREATE INDEX IF NOT EXISTS idx_project_files_file_type ON project_files(file_type);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_at ON project_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_project_files_parent_file_id ON project_files(parent_file_id);
CREATE INDEX IF NOT EXISTS idx_project_files_tags ON project_files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_project_files_metadata ON project_files USING GIN(metadata);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_version ON file_versions(version);
CREATE INDEX IF NOT EXISTS idx_file_versions_uploaded_by ON file_versions(uploaded_by);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_project_files_project_stage_type ON project_files(project_id, stage, file_type);
CREATE INDEX IF NOT EXISTS idx_project_files_user_stage ON project_files(user_id, stage);

-- Add RLS (Row Level Security) policies
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access files from projects they're assigned to
CREATE POLICY "Users can access project files" ON project_files
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid() 
            OR assigned_inspector = auth.uid() 
            OR assigned_consultant = auth.uid() 
            OR assigned_engineer = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Users can only access file versions for files they can access
CREATE POLICY "Users can access file versions" ON file_versions
    FOR ALL USING (
        file_id IN (
            SELECT id FROM project_files 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE user_id = auth.uid() 
                OR assigned_inspector = auth.uid() 
                OR assigned_consultant = auth.uid() 
                OR assigned_engineer = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for project_files updated_at
DROP TRIGGER IF EXISTS update_project_files_updated_at ON project_files;
CREATE TRIGGER update_project_files_updated_at
    BEFORE UPDATE ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle file versioning
CREATE OR REPLACE FUNCTION handle_file_versioning()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is an update to an existing file with the same original_name and stage
    IF TG_OP = 'INSERT' AND NEW.parent_file_id IS NOT NULL THEN
        -- Create a version record for the new file
        INSERT INTO file_versions (
            file_id,
            version,
            filename,
            upload_path,
            cloud_path,
            metadata,
            changes,
            uploaded_by
        ) VALUES (
            NEW.parent_file_id,
            NEW.version,
            NEW.filename,
            NEW.upload_path,
            NEW.cloud_path,
            NEW.metadata,
            ARRAY['File updated'],
            NEW.user_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic versioning
DROP TRIGGER IF EXISTS project_files_versioning ON project_files;
CREATE TRIGGER project_files_versioning
    AFTER INSERT ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION handle_file_versioning();

-- Create function to get file statistics for a project
CREATE OR REPLACE FUNCTION get_project_file_stats(project_uuid UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    photos_count BIGINT,
    documents_count BIGINT,
    sows_count BIGINT,
    reports_count BIGINT,
    inspection_files BIGINT,
    consultant_files BIGINT,
    engineering_files BIGINT,
    complete_files BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_files,
        COALESCE(SUM(size), 0)::BIGINT as total_size,
        COUNT(*) FILTER (WHERE file_type = 'photo')::BIGINT as photos_count,
        COUNT(*) FILTER (WHERE file_type = 'document')::BIGINT as documents_count,
        COUNT(*) FILTER (WHERE file_type = 'sow')::BIGINT as sows_count,
        COUNT(*) FILTER (WHERE file_type = 'report')::BIGINT as reports_count,
        COUNT(*) FILTER (WHERE stage = 'inspection')::BIGINT as inspection_files,
        COUNT(*) FILTER (WHERE stage = 'consultant_review')::BIGINT as consultant_files,
        COUNT(*) FILTER (WHERE stage = 'engineering')::BIGINT as engineering_files,
        COUNT(*) FILTER (WHERE stage = 'complete')::BIGINT as complete_files
    FROM project_files 
    WHERE project_id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get files with GPS coordinates
CREATE OR REPLACE FUNCTION get_project_files_with_gps(project_uuid UUID)
RETURNS TABLE (
    id UUID,
    original_name TEXT,
    filename TEXT,
    uploaded_at TIMESTAMPTZ,
    latitude FLOAT,
    longitude FLOAT,
    altitude FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.id,
        pf.original_name,
        pf.filename,
        pf.uploaded_at,
        (pf.metadata->'gpsCoordinates'->>'latitude')::FLOAT as latitude,
        (pf.metadata->'gpsCoordinates'->>'longitude')::FLOAT as longitude,
        (pf.metadata->'gpsCoordinates'->>'altitude')::FLOAT as altitude
    FROM project_files pf
    WHERE pf.project_id = project_uuid
    AND pf.metadata->'gpsCoordinates' IS NOT NULL
    AND pf.metadata->'gpsCoordinates'->>'latitude' IS NOT NULL
    AND pf.metadata->'gpsCoordinates'->>'longitude' IS NOT NULL
    ORDER BY pf.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete file versions for files that no longer exist
    DELETE FROM file_versions 
    WHERE file_id NOT IN (SELECT id FROM project_files);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON project_files TO authenticated;
GRANT ALL ON file_versions TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_file_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_files_with_gps(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_files() TO service_role;

-- Add comments for documentation
COMMENT ON TABLE project_files IS 'Stores all files uploaded to projects with comprehensive metadata';
COMMENT ON TABLE file_versions IS 'Tracks version history for files with change tracking';
COMMENT ON COLUMN project_files.metadata IS 'JSONB field containing EXIF data, GPS coordinates, security checks, etc.';
COMMENT ON COLUMN project_files.security_checks IS 'Array of security validation results';
COMMENT ON COLUMN project_files.tags IS 'User-defined tags for file organization';
COMMENT ON COLUMN project_files.is_cloud_stored IS 'Flag indicating if file is stored in cloud storage vs local';

-- Create view for files with user information
CREATE OR REPLACE VIEW project_files_with_users AS
SELECT 
    pf.*,
    up.full_name as uploaded_by_name,
    up.email as uploaded_by_email,
    p.name as project_name,
    p.address as project_address
FROM project_files pf
JOIN user_profiles up ON pf.user_id = up.id
JOIN projects p ON pf.project_id = p.id;

-- Grant access to the view
GRANT SELECT ON project_files_with_users TO authenticated;

-- Create materialized view for file statistics (optional, for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS project_file_statistics AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    COUNT(pf.id) as total_files,
    SUM(pf.size) as total_size,
    COUNT(pf.id) FILTER (WHERE pf.file_type = 'photo') as photo_count,
    COUNT(pf.id) FILTER (WHERE pf.file_type = 'document') as document_count,
    COUNT(pf.id) FILTER (WHERE pf.file_type = 'sow') as sow_count,
    COUNT(pf.id) FILTER (WHERE pf.file_type = 'report') as report_count,
    COUNT(pf.id) FILTER (WHERE pf.metadata->'gpsCoordinates' IS NOT NULL) as files_with_gps,
    MAX(pf.uploaded_at) as last_upload
FROM projects p
LEFT JOIN project_files pf ON p.id = pf.project_id
GROUP BY p.id, p.name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_file_statistics_project_id 
ON project_file_statistics(project_id);

-- Grant access to materialized view
GRANT SELECT ON project_file_statistics TO authenticated;

-- Function to refresh statistics (can be called periodically)
CREATE OR REPLACE FUNCTION refresh_file_statistics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY project_file_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION refresh_file_statistics() TO authenticated;

-- Create notification function for file uploads
CREATE OR REPLACE FUNCTION notify_file_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- Send notification when a new file is uploaded
    PERFORM pg_notify(
        'file_uploaded',
        json_build_object(
            'project_id', NEW.project_id,
            'file_id', NEW.id,
            'file_type', NEW.file_type,
            'stage', NEW.stage,
            'user_id', NEW.user_id,
            'original_name', NEW.original_name
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for file upload notifications
DROP TRIGGER IF EXISTS file_upload_notification ON project_files;
CREATE TRIGGER file_upload_notification
    AFTER INSERT ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION notify_file_upload();

-- Migration complete message
DO $$
BEGIN
    RAISE NOTICE 'File Management System migration completed successfully!';
    RAISE NOTICE 'Created tables: project_files, file_versions';
    RAISE NOTICE 'Created functions: get_project_file_stats, get_project_files_with_gps, cleanup_orphaned_files';
    RAISE NOTICE 'Created views: project_files_with_users, project_file_statistics';
    RAISE NOTICE 'Enabled RLS and created security policies';
    RAISE NOTICE 'Added triggers for versioning and notifications';
END $$;
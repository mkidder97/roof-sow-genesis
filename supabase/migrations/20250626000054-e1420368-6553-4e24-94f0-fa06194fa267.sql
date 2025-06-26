
-- Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_sow_generations_user_status ON sow_generations(user_id, generation_status);
CREATE INDEX IF NOT EXISTS idx_field_inspections_status_created ON field_inspections(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sow_generations_created_status ON sow_generations(created_at, generation_status);
CREATE INDEX IF NOT EXISTS idx_projects_user_stage ON projects(user_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sow_generations_inspection_id ON sow_generations(inspection_id);

-- Additional performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_field_inspections_user_created ON field_inspections(inspector_id, created_at DESC) WHERE inspector_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sow_generations_duration ON sow_generations(generation_duration_seconds) WHERE generation_duration_seconds IS NOT NULL;

-- Enhanced RLS Policies for SOW Security
DROP POLICY IF EXISTS "Users can view own sow_generations" ON sow_generations;
DROP POLICY IF EXISTS "Users can insert own sow_generations" ON sow_generations;
DROP POLICY IF EXISTS "Users can update own sow_generations" ON sow_generations;
DROP POLICY IF EXISTS "Users can delete own sow_generations" ON sow_generations;

-- Create more secure RLS policies
CREATE POLICY "Users can view own sow_generations" ON sow_generations
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM field_inspections fi 
      WHERE fi.id = sow_generations.inspection_id 
      AND fi.inspector_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sow_generations" ON sow_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sow_generations" ON sow_generations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sow_generations" ON sow_generations
  FOR DELETE USING (auth.uid() = user_id);

-- Audit logging table for SOW operations
CREATE TABLE IF NOT EXISTS sow_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_generation_id UUID REFERENCES sow_generations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'downloaded', 'failed')),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for audit log
ALTER TABLE sow_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON sow_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- File upload security constraints
ALTER TABLE sow_generations 
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT CHECK (file_size_bytes <= 52428800), -- 50MB limit
ADD COLUMN IF NOT EXISTS file_mime_type TEXT CHECK (
  file_mime_type IS NULL OR 
  file_mime_type IN (
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  )
);

-- Database health monitoring function
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  connection_count INTEGER;
  slow_queries INTEGER;
  table_sizes JSONB;
BEGIN
  -- Get active connections
  SELECT count(*) INTO connection_count 
  FROM pg_stat_activity 
  WHERE state = 'active';
  
  -- Get slow queries (>5 seconds)
  SELECT count(*) INTO slow_queries 
  FROM pg_stat_activity 
  WHERE state = 'active' 
  AND query_start < now() - interval '5 seconds';
  
  -- Get table sizes
  SELECT jsonb_object_agg(schemaname||'.'||tablename, pg_total_relation_size(schemaname||'.'||tablename))
  INTO table_sizes
  FROM pg_tables 
  WHERE schemaname = 'public';
  
  result := jsonb_build_object(
    'timestamp', now(),
    'active_connections', connection_count,
    'slow_queries', slow_queries,
    'table_sizes', table_sizes,
    'database_size', pg_database_size(current_database())
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Materialized view for dashboard metrics (refreshed every 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_metrics_cache AS
SELECT 
  COUNT(DISTINCT fi.id) as total_inspections,
  COUNT(DISTINCT CASE WHEN sg.generation_status = 'completed' THEN sg.id END) as completed_sows,
  COUNT(DISTINCT CASE WHEN sg.generation_status IN ('pending', 'processing') THEN sg.id END) as pending_sows,
  COALESCE(AVG(sg.generation_duration_seconds), 0)::INTEGER as avg_generation_time,
  COUNT(DISTINCT CASE WHEN fi.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN fi.id END) as inspections_this_week,
  COUNT(DISTINCT CASE WHEN sg.created_at >= CURRENT_DATE - INTERVAL '7 days' AND sg.generation_status = 'completed' THEN sg.id END) as sows_this_week,
  NOW() as last_updated
FROM field_inspections fi
LEFT JOIN sow_generations sg ON fi.id = sg.inspection_id;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_metrics_cache_unique ON dashboard_metrics_cache (last_updated);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data retention function (archive old SOWs)
CREATE OR REPLACE FUNCTION archive_old_sows()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Archive SOWs older than 2 years to archive table
  CREATE TABLE IF NOT EXISTS sow_generations_archive (LIKE sow_generations INCLUDING ALL);
  
  WITH archived AS (
    DELETE FROM sow_generations 
    WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
    AND generation_status IN ('completed', 'failed')
    RETURNING *
  )
  INSERT INTO sow_generations_archive SELECT * FROM archived;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Log the archival
  INSERT INTO sow_audit_log (
    user_id, 
    action, 
    details
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID, -- System user
    'archived', 
    jsonb_build_object('archived_count', archived_count, 'archive_date', CURRENT_DATE)
  );
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION log_sow_operations()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO sow_audit_log (sow_generation_id, user_id, action, details)
    VALUES (NEW.id, NEW.user_id, 'created', jsonb_build_object('template_type', NEW.template_type));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.generation_status != NEW.generation_status THEN
      INSERT INTO sow_audit_log (sow_generation_id, user_id, action, details)
      VALUES (NEW.id, NEW.user_id, 
        CASE 
          WHEN NEW.generation_status = 'completed' THEN 'completed'
          WHEN NEW.generation_status = 'failed' THEN 'failed'
          ELSE 'updated'
        END,
        jsonb_build_object(
          'old_status', OLD.generation_status,
          'new_status', NEW.generation_status,
          'duration_seconds', NEW.generation_duration_seconds
        )
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO sow_audit_log (sow_generation_id, user_id, action, details)
    VALUES (OLD.id, OLD.user_id, 'deleted', jsonb_build_object('deleted_at', NOW()));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
DROP TRIGGER IF EXISTS sow_audit_trigger ON sow_generations;
CREATE TRIGGER sow_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sow_generations
  FOR EACH ROW EXECUTE FUNCTION log_sow_operations();

-- Performance monitoring table
CREATE TABLE IF NOT EXISTS database_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  details JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance log
CREATE INDEX IF NOT EXISTS idx_performance_log_metric_time ON database_performance_log(metric_name, recorded_at DESC);

-- Function to log performance metrics
CREATE OR REPLACE FUNCTION log_performance_metric(
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO database_performance_log (metric_name, metric_value, details)
  VALUES (p_metric_name, p_metric_value, p_details);
  
  -- Keep only last 30 days of performance data
  DELETE FROM database_performance_log 
  WHERE recorded_at < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE sow_audit_log IS 'Audit trail for all SOW generation operations';
COMMENT ON MATERIALIZED VIEW dashboard_metrics_cache IS 'Cached dashboard metrics for performance';
COMMENT ON FUNCTION get_database_health() IS 'Returns current database health metrics';
COMMENT ON FUNCTION archive_old_sows() IS 'Archives SOW generations older than 2 years';
COMMENT ON TABLE database_performance_log IS 'Tracks database performance metrics over time';

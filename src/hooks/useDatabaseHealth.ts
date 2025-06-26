
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseHealth {
  timestamp: string;
  active_connections: number;
  slow_queries: number;
  table_sizes: Record<string, number>;
  database_size: number;
}

interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  details: any;
  recorded_at: string;
}

export function useDatabaseHealth() {
  return useQuery({
    queryKey: ['database-health'],
    queryFn: async (): Promise<DatabaseHealth> => {
      const { data, error } = await supabase.rpc('get_database_health');
      
      if (error) {
        throw new Error(`Database health check failed: ${error.message}`);
      }
      
      // Handle the JSON data properly by parsing it if it's a string
      const healthData = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        timestamp: healthData.timestamp,
        active_connections: healthData.active_connections || 0,
        slow_queries: healthData.slow_queries || 0,
        table_sizes: healthData.table_sizes || {},
        database_size: healthData.database_size || 0
      } as DatabaseHealth;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider stale after 25 seconds
  });
}

export function usePerformanceMetrics(metricName?: string, limit: number = 100) {
  return useQuery({
    queryKey: ['performance-metrics', metricName, limit],
    queryFn: async (): Promise<PerformanceMetric[]> => {
      let query = supabase
        .from('database_performance_log')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (metricName) {
        query = query.eq('metric_name', metricName);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch performance metrics: ${error.message}`);
      }
      
      return data || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useAuditLog(sowGenerationId?: string, limit: number = 50) {
  return useQuery({
    queryKey: ['audit-log', sowGenerationId, limit],
    queryFn: async () => {
      let query = supabase
        .from('sow_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sowGenerationId) {
        query = query.eq('sow_generation_id', sowGenerationId);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch audit log: ${error.message}`);
      }
      
      return data || [];
    },
    refetchInterval: 30000,
  });
}

export async function logPerformanceMetric(
  metricName: string,
  metricValue: number,
  details: any = {}
) {
  const { error } = await supabase.rpc('log_performance_metric', {
    p_metric_name: metricName,
    p_metric_value: metricValue,
    p_details: details
  });

  if (error) {
    console.error('Failed to log performance metric:', error);
    throw error;
  }
}

export async function refreshDashboardMetrics() {
  const { error } = await supabase.rpc('refresh_dashboard_metrics');

  if (error) {
    console.error('Failed to refresh dashboard metrics:', error);
    throw error;
  }
}

export async function archiveOldSOWs(): Promise<number> {
  const { data, error } = await supabase.rpc('archive_old_sows');

  if (error) {
    console.error('Failed to archive old SOWs:', error);
    throw error;
  }

  return data || 0;
}

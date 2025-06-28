
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FieldInspection, convertRowToInspection } from '@/types/fieldInspection';

export function useCompletedInspections() {
  const [completedInspections, setCompletedInspections] = useState<FieldInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchCompletedInspections = async () => {
    try {
      setLoading(true);
      console.log('🔍 Engineer Dashboard: Fetching completed inspections...');
      
      // FIXED: Query for inspections that are completed by ANY criteria
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .or('status.eq.Completed,completed.eq.true,ready_for_handoff.eq.true')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching completed inspections:', error);
        throw error;
      }

      console.log('📊 Raw completed inspections data:', data);
      
      if (data && data.length > 0) {
        const convertedInspections = data.map(convertRowToInspection);
        console.log('✅ Converted completed inspections:', convertedInspections);
        
        // FIXED: More inclusive filtering for completed inspections
        const filteredInspections = convertedInspections.filter(inspection => {
          // Consider completed if ANY of these conditions are true:
          const hasCompletedStatus = inspection.status === 'Completed';
          const hasCompletedFlag = inspection.completed === true;
          const hasReadyForHandoff = inspection.ready_for_handoff === true;
          const hasCompletedAt = inspection.completed_at !== null;
          
          const isCompleted = hasCompletedStatus || hasCompletedFlag || hasReadyForHandoff || hasCompletedAt;
          
          console.log(`🔍 Filtering "${inspection.project_name}":`, {
            id: inspection.id,
            status: inspection.status,
            completed: inspection.completed,
            ready_for_handoff: inspection.ready_for_handoff,
            completed_at: inspection.completed_at,
            sow_generated: inspection.sow_generated,
            hasCompletedStatus,
            hasCompletedFlag,
            hasReadyForHandoff,
            hasCompletedAt,
            isCompleted
          });
          
          return isCompleted;
        });
        
        console.log('🎯 Final completed inspections for Engineer Dashboard:', filteredInspections);
        setCompletedInspections(filteredInspections);
      } else {
        console.log('⚠️ No completed inspections found in database');
        setCompletedInspections([]);
      }
    } catch (err) {
      console.error('💥 Failed to fetch completed inspections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch completed inspections');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    console.log('🔄 Force refetching completed inspections...');
    fetchCompletedInspections();
  };

  useEffect(() => {
    fetchCompletedInspections();
  }, []);

  return {
    completedInspections,
    loading,
    error,
    refetch
  };
}


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
      console.log('Fetching completed inspections for Engineer Dashboard...');
      
      // IMPROVED: Query for inspections using BOTH status and boolean flags for robustness
      // This handles edge cases where either field might be set but not the other
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .or('status.eq.Completed,completed.eq.true,ready_for_handoff.eq.true')
        .order('completed_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching completed inspections:', error);
        throw error;
      }

      console.log('Raw completed inspections data:', data);
      
      if (data && data.length > 0) {
        const convertedInspections = data.map(convertRowToInspection);
        console.log('Converted completed inspections:', convertedInspections);
        
        // Filter to only include truly completed inspections
        const filteredInspections = convertedInspections.filter(inspection => {
          const isCompleted = inspection.status === 'Completed' || 
                             inspection.completed === true || 
                             inspection.ready_for_handoff === true;
          
          console.log(`Filtering inspection "${inspection.project_name}":`, {
            id: inspection.id,
            status: inspection.status,
            completed: inspection.completed,
            ready_for_handoff: inspection.ready_for_handoff,
            sow_generated: inspection.sow_generated,
            isCompleted
          });
          
          return isCompleted;
        });
        
        console.log('Final filtered completed inspections:', filteredInspections);
        setCompletedInspections(filteredInspections);
      } else {
        console.log('No completed inspections found');
        setCompletedInspections([]);
      }
    } catch (err) {
      console.error('Failed to fetch completed inspections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch completed inspections');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
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


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
      
      // Query for inspections that are completed - use broader criteria
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .or('status.eq.Completed,completed.eq.true,status.eq.completed')
        .order('completed_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching completed inspections:', error);
        throw error;
      }

      console.log('Raw completed inspections data:', data);
      
      if (data && data.length > 0) {
        const convertedInspections = data.map(convertRowToInspection);
        console.log('Converted completed inspections:', convertedInspections);
        
        // Debug each inspection
        convertedInspections.forEach(inspection => {
          console.log(`Inspection "${inspection.project_name}":`, {
            id: inspection.id,
            status: inspection.status,
            completed: inspection.completed,
            sow_generated: inspection.sow_generated,
            ready_for_sow: !inspection.sow_generated
          });
        });
        
        setCompletedInspections(convertedInspections);
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

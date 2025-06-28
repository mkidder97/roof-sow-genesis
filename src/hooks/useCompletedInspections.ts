
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FieldInspection, convertRowToInspection } from '@/types/fieldInspection';

export function useCompletedInspections() {
  const [completedInspections, setCompletedInspections] = useState<FieldInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const syncDatabaseConsistency = async () => {
    try {
      console.log('Syncing database consistency for completed inspections...');
      
      // Update any records where status is "Completed" but flags aren't set
      const { error: updateError } = await supabase
        .from('field_inspections')
        .update({
          completed: true,
          ready_for_handoff: true
        })
        .eq('status', 'Completed')
        .or('completed.is.null,completed.eq.false,ready_for_handoff.is.null,ready_for_handoff.eq.false');

      if (updateError) {
        console.error('Error syncing database:', updateError);
      } else {
        console.log('Database sync completed successfully');
      }
    } catch (err) {
      console.error('Failed to sync database:', err);
    }
  };

  const fetchCompletedInspections = async () => {
    try {
      setLoading(true);
      console.log('Fetching completed inspections for Engineer Dashboard...');
      
      // First sync the database to fix any inconsistencies
      await syncDatabaseConsistency();
      
      // Now fetch with a more comprehensive query that catches all completed inspections
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
        
        // More lenient filtering - if ANY completion indicator is true, include it
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


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
      
      // Query for inspections that are completed and ready for SOW generation
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .or('status.eq.Completed,completed.eq.true')
        .eq('sow_generated', false)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed inspections:', error);
        throw error;
      }

      console.log('Raw completed inspections data:', data);
      
      if (data && data.length > 0) {
        const convertedInspections = data.map(convertRowToInspection);
        console.log('Converted completed inspections:', convertedInspections);
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

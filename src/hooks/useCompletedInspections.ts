
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
      
      // FIXED: Query for inspections with status = 'Completed'
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .eq('status', 'Completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching completed inspections:', error);
        throw error;
      }

      console.log('📊 Raw completed inspections data:', data);
      
      if (data && data.length > 0) {
        const convertedInspections = data.map(convertRowToInspection);
        console.log('✅ Converted completed inspections:', convertedInspections);
        setCompletedInspections(convertedInspections);
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

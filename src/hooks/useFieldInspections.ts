
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FieldInspection, convertRowToInspection } from '@/types/fieldInspection';

export function useFieldInspections() {
  const [inspections, setInspections] = useState<FieldInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedInspections = data?.map(convertRowToInspection) || [];
      setInspections(convertedInspections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveInspection = async (inspectionData: Partial<FieldInspection>): Promise<string> => {
    try {
      // Convert ASCE requirements to JSON for database storage
      const dbData = {
        ...inspectionData,
        asce_requirements: inspectionData.asce_requirements ? 
          JSON.stringify(inspectionData.asce_requirements) : null
      };

      if (inspectionData.id) {
        // Update existing
        const { error } = await supabase
          .from('field_inspections')
          .update(dbData)
          .eq('id', inspectionData.id);
        
        if (error) throw error;
        await fetchInspections();
        return inspectionData.id;
      } else {
        // Create new - use single insert instead of array
        const { data, error } = await supabase
          .from('field_inspections')
          .insert(dbData)
          .select()
          .single();
        
        if (error) throw error;
        await fetchInspections();
        return data.id;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save inspection');
    }
  };

  const completeInspection = async (inspectionId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('field_inspections')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString(),
          status: 'Completed'
        })
        .eq('id', inspectionId);
      
      if (error) throw error;
      await fetchInspections();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to complete inspection');
    }
  };

  const deleteInspection = async (inspectionId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('field_inspections')
        .delete()
        .eq('id', inspectionId);
      
      if (error) throw error;
      await fetchInspections();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete inspection');
    }
  };

  const getInspection = async (inspectionId: string): Promise<FieldInspection | null> => {
    try {
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .eq('id', inspectionId)
        .single();
      
      if (error) throw error;
      return data ? convertRowToInspection(data) : null;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get inspection');
    }
  };

  const refetch = () => {
    fetchInspections();
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  return {
    inspections,
    loading,
    error,
    saveInspection,
    completeInspection,
    deleteInspection,
    getInspection,
    refetch,
    // Aliases for compatibility
    data: inspections,
    isLoading: loading
  };
}

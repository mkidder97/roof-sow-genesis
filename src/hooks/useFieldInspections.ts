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
      console.log('Fetching all field inspections...');
      
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inspections:', error);
        throw error;
      }

      console.log('Raw inspections data:', data);
      
      if (data) {
        const convertedInspections = data.map(convertRowToInspection);
        console.log('Converted inspections:', convertedInspections);
        
        // Debug each inspection status
        convertedInspections.forEach(inspection => {
          console.log(`Inspection "${inspection.project_name}":`, {
            id: inspection.id,
            status: inspection.status,
            completed: inspection.completed,
            sow_generated: inspection.sow_generated,
            completed_at: inspection.completed_at,
            ready_for_handoff: inspection.ready_for_handoff
          });
        });
        
        setInspections(convertedInspections);
      } else {
        setInspections([]);
      }
    } catch (err) {
      console.error('Failed to fetch inspections:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveInspection = async (inspectionData: Partial<FieldInspection>): Promise<string> => {
    try {
      // Convert ASCE requirements to JSON for database storage and ensure required fields
      const dbData: any = {
        project_name: inspectionData.project_name || 'Untitled Project',
        project_address: inspectionData.project_address || 'TBD',
        inspector_name: inspectionData.inspector_name || 'Unknown Inspector',
        ...inspectionData,
        asce_requirements: inspectionData.asce_requirements ? 
          JSON.stringify(inspectionData.asce_requirements) : null
      };

      if (inspectionData.id) {
        // Update existing
        console.log('Updating inspection:', inspectionData.id, dbData);
        const { error } = await supabase
          .from('field_inspections')
          .update(dbData)
          .eq('id', inspectionData.id);
        
        if (error) throw error;
        await fetchInspections();
        return inspectionData.id;
      } else {
        // Create new - use single insert instead of array
        console.log('Creating new inspection:', dbData);
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
      console.error('Failed to save inspection:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to save inspection');
    }
  };

  const completeInspection = async (inspectionId: string): Promise<void> => {
    try {
      console.log('Completing inspection:', inspectionId);
      
      // FIXED: Set BOTH status AND boolean flags for consistency
      const updateData = { 
        completed: true, 
        completed_at: new Date().toISOString(),
        status: 'Completed', // Ensure status is also set
        ready_for_handoff: true // Ensure this is set for engineer workflow
      };
      
      console.log('Update data for completion:', updateData);
      
      const { error } = await supabase
        .from('field_inspections')
        .update(updateData)
        .eq('id', inspectionId);
      
      if (error) {
        console.error('Error completing inspection:', error);
        throw error;
      }
      
      console.log('Inspection completed successfully with both status and flags set');
      await fetchInspections();
    } catch (err) {
      console.error('Failed to complete inspection:', err);
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

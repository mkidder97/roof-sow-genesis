
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FieldInspection, FieldInspectionRow } from '@/types/fieldInspection';
import { toast } from 'sonner';

// Convert database row to FieldInspection type
const convertRowToInspection = (row: FieldInspectionRow): FieldInspection => {
  return {
    ...row,
    inspection_date: row.inspection_date || '',
    priority_level: (row.priority_level as 'Standard' | 'Expedited' | 'Emergency') || 'Standard',
    status: (row.status as 'Draft' | 'Completed' | 'Under Review' | 'Approved') || 'Draft',
    hvac_units: row.hvac_units ? (Array.isArray(row.hvac_units) ? row.hvac_units : JSON.parse(row.hvac_units as string)) : [],
    roof_drains: row.roof_drains ? (Array.isArray(row.roof_drains) ? row.roof_drains : JSON.parse(row.roof_drains as string)) : [],
    penetrations: row.penetrations ? (Array.isArray(row.penetrations) ? row.penetrations : JSON.parse(row.penetrations as string)) : [],
    insulation_layers: row.insulation_layers ? (Array.isArray(row.insulation_layers) ? row.insulation_layers : JSON.parse(row.insulation_layers as string)) : [],
    skylights_detailed: row.skylights_detailed ? (Array.isArray(row.skylights_detailed) ? row.skylights_detailed : JSON.parse(row.skylights_detailed as string)) : [],
    skylights: row.skylights || 0,
    photos: row.photos || [],
    sow_generated: row.sow_generated || false,
    drainage_options: row.drainage_options ? (Array.isArray(row.drainage_options) ? row.drainage_options : JSON.parse(row.drainage_options as string)) : [],
    interior_protection_needed: row.interior_protection_needed || false,
    interior_protection_sqft: row.interior_protection_sqft || 0,
    conduit_attached: row.conduit_attached || false,
    upgraded_lighting: row.upgraded_lighting || false,
    interior_fall_protection: row.interior_fall_protection || false,
    curbs_above_8: row.curbs_above_8 || false,
    gas_line_penetrating_deck: row.gas_line_penetrating_deck || false,
    access_method: (row.access_method as 'internal_hatch' | 'external_ladder' | 'extension_ladder') || 'internal_hatch',
  };
};

export function useFieldInspections() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<FieldInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .eq('inspector_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch inspections error:', error);
        throw error;
      }
      
      const convertedData = (data || []).map(convertRowToInspection);
      setInspections(convertedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inspections';
      console.error('Fetch inspections error:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveInspection = async (inspectionData: Partial<FieldInspection>): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to save inspections');
      return null;
    }

    try {
      console.log('Saving inspection:', inspectionData);
      
      const dataToSave = {
        ...inspectionData,
        inspector_id: user.id,
        inspector_name: inspectionData.inspector_name || user.email || 'Unknown Inspector',
        updated_at: new Date().toISOString(),
      };

      let result;
      
      if (inspectionData.id) {
        // Update existing inspection
        const { data, error } = await supabase
          .from('field_inspections')
          .update(dataToSave)
          .eq('id', inspectionData.id)
          .eq('inspector_id', user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success('Inspection updated successfully');
      } else {
        // Create new inspection
        const { data, error } = await supabase
          .from('field_inspections')
          .insert({
            ...dataToSave,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success('Inspection saved successfully');
      }

      // Refresh the inspections list
      await fetchInspections();
      
      return result.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save inspection';
      console.error('Save inspection error:', errorMessage);
      toast.error(errorMessage);
      return null;
    }
  };

  const completeInspection = async (inspectionId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to complete inspections');
      return false;
    }

    try {
      const { error } = await supabase
        .from('field_inspections')
        .update({
          status: 'Completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId)
        .eq('inspector_id', user.id);

      if (error) throw error;

      toast.success('Inspection marked as completed');
      await fetchInspections();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete inspection';
      console.error('Complete inspection error:', errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const deleteInspection = async (inspectionId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to delete inspections');
      return false;
    }

    try {
      const { error } = await supabase
        .from('field_inspections')
        .delete()
        .eq('id', inspectionId)
        .eq('inspector_id', user.id);

      if (error) throw error;

      toast.success('Inspection deleted successfully');
      await fetchInspections();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete inspection';
      console.error('Delete inspection error:', errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const getInspection = async (inspectionId: string): Promise<FieldInspection | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .eq('id', inspectionId)
        .eq('inspector_id', user.id)
        .single();

      if (error) throw error;
      
      return convertRowToInspection(data);
    } catch (err) {
      console.error('Get inspection error:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [user]);

  return {
    inspections,
    loading,
    error,
    saveInspection,
    completeInspection,
    deleteInspection,
    getInspection,
    refetch: fetchInspections,
  };
}

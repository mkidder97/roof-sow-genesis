import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FieldInspection, FieldInspectionRow } from '@/types/fieldInspection';

// Convert database row to FieldInspection type
const convertRowToInspection = (row: FieldInspectionRow): FieldInspection => {
  return {
    ...row,
    inspection_date: row.inspection_date || new Date().toISOString().split('T')[0],
    priority_level: (row.priority_level as 'Standard' | 'Expedited' | 'Emergency') || 'Standard',
    status: (row.status as 'Draft' | 'Completed' | 'Under Review' | 'Approved') || 'Draft',
    hvac_units: row.hvac_units ? (Array.isArray(row.hvac_units) ? row.hvac_units : JSON.parse(row.hvac_units as string)) : [],
    roof_drains: row.roof_drains ? (Array.isArray(row.roof_drains) ? row.roof_drains : JSON.parse(row.roof_drains as string)) : [],
    penetrations: row.penetrations ? (Array.isArray(row.penetrations) ? row.penetrations : JSON.parse(row.penetrations as string)) : [],
    insulation_layers: row.insulation_layers ? (Array.isArray(row.insulation_layers) ? row.insulation_layers : JSON.parse(row.insulation_layers as string)) : [],
    skylights: row.skylights || 0,
    photos: row.photos || [],
    sow_generated: row.sow_generated || false,
    drainage_options: row.drainage_options ? (Array.isArray(row.drainage_options) ? row.drainage_options : JSON.parse(row.drainage_options as string)) : [],
    interior_protection_needed: row.interior_protection_needed || false,
    interior_protection_sqft: row.interior_protection_sqft || 0,
    conduit_attached: row.conduit_attached || false,
    upgraded_lighting: row.upgraded_lighting || false,
    interior_fall_protection: row.interior_fall_protection || false,
    access_method: (row.access_method as 'internal_hatch' | 'external_ladder' | 'extension_ladder') || 'internal_hatch',
  };
};

// Convert FieldInspection to database insert format
const convertInspectionToRow = (inspection: Partial<FieldInspection>) => {
  const row: any = { ...inspection };
  
  // Ensure required fields have values
  if (!row.project_name) {
    throw new Error('Project name is required');
  }
  if (!row.project_address) {
    throw new Error('Project address is required');
  }
  if (!row.inspector_name) {
    throw new Error('Inspector name is required');
  }
  
  // Convert arrays to proper format for database storage
  if (row.hvac_units && Array.isArray(row.hvac_units)) {
    // Keep as array since the column is jsonb
    row.hvac_units = row.hvac_units;
  } else if (!row.hvac_units) {
    row.hvac_units = [];
  }
  
  if (row.roof_drains && Array.isArray(row.roof_drains)) {
    row.roof_drains = row.roof_drains;
  } else if (!row.roof_drains) {
    row.roof_drains = [];
  }
  
  if (row.penetrations && Array.isArray(row.penetrations)) {
    row.penetrations = row.penetrations;
  } else if (!row.penetrations) {
    row.penetrations = [];
  }
  
  if (row.insulation_layers && Array.isArray(row.insulation_layers)) {
    row.insulation_layers = row.insulation_layers;
  } else if (!row.insulation_layers) {
    row.insulation_layers = [];
  }
  
  if (row.drainage_options && Array.isArray(row.drainage_options)) {
    row.drainage_options = row.drainage_options;
  } else if (!row.drainage_options) {
    row.drainage_options = [];
  }
  
  // Ensure proper defaults for other fields
  if (!row.inspection_date) {
    row.inspection_date = new Date().toISOString().split('T')[0];
  }
  
  if (!row.priority_level) {
    row.priority_level = 'Standard';
  }
  
  if (!row.status) {
    row.status = 'Draft';
  }
  
  if (!row.access_method) {
    row.access_method = 'internal_hatch';
  }
  
  // Ensure boolean fields are properly set
  row.interior_protection_needed = row.interior_protection_needed || false;
  row.conduit_attached = row.conduit_attached || false;
  row.upgraded_lighting = row.upgraded_lighting || false;
  row.interior_fall_protection = row.interior_fall_protection || false;
  row.sow_generated = row.sow_generated || false;
  
  // Ensure numeric fields are properly set
  row.skylights = row.skylights || 0;
  row.interior_protection_sqft = row.interior_protection_sqft || 0;
  row.number_of_stories = row.number_of_stories || 1;
  
  return row;
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
    } finally {
      setLoading(false);
    }
  };

  const createInspection = async (inspection: Partial<FieldInspection>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const inspectionData = {
        ...inspection,
        inspector_id: user.id,
        inspector_name: user.user_metadata?.full_name || user.email || 'Unknown Inspector',
      };
      
      const insertData = convertInspectionToRow(inspectionData);
      
      console.log('Creating inspection with data:', insertData);

      const { data, error } = await supabase
        .from('field_inspections')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Create inspection error:', error);
        throw error;
      }
      
      console.log('Created inspection:', data);
      const convertedData = convertRowToInspection(data);
      setInspections(prev => [convertedData, ...prev]);
      return convertedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create inspection';
      console.error('Create inspection error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateInspection = async (id: string, updates: Partial<FieldInspection>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updateData = convertInspectionToRow(updates);
      
      console.log('Updating inspection with data:', updateData);
      
      const { data, error } = await supabase
        .from('field_inspections')
        .update(updateData)
        .eq('id', id)
        .eq('inspector_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update inspection error:', error);
        throw error;
      }

      console.log('Updated inspection:', data);
      const convertedData = convertRowToInspection(data);
      setInspections(prev => 
        prev.map(inspection => 
          inspection.id === id ? convertedData : inspection
        )
      );
      
      return convertedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inspection';
      console.error('Update inspection error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteInspection = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('field_inspections')
        .delete()
        .eq('id', id)
        .eq('inspector_id', user.id);

      if (error) {
        console.error('Delete inspection error:', error);
        throw error;
      }

      setInspections(prev => prev.filter(inspection => inspection.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete inspection';
      console.error('Delete inspection error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [user]);

  return {
    inspections,
    loading,
    error,
    createInspection,
    updateInspection,
    deleteInspection,
    refetch: fetchInspections,
  };
}

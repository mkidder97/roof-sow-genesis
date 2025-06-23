
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FieldInspection, FieldInspectionRow } from '@/types/fieldInspection';

// Convert database row to FieldInspection type
const convertRowToInspection = (row: FieldInspectionRow): FieldInspection => {
  return {
    ...row,
    inspection_date: row.inspection_date || '',
    priority_level: (row.priority_level as 'Standard' | 'Expedited' | 'Emergency') || 'Standard',
    status: (row.status as 'Draft' | 'Completed' | 'Under Review' | 'Approved') || 'Draft',
    hvac_units: Array.isArray(row.hvac_units) ? row.hvac_units : [],
    roof_drains: Array.isArray(row.roof_drains) ? row.roof_drains : [],
    penetrations: Array.isArray(row.penetrations) ? row.penetrations : [],
    skylights: row.skylights || 0,
    roof_hatches: row.roof_hatches || 0,
    photos: row.photos || [],
    sow_generated: row.sow_generated || false,
  };
};

// Convert FieldInspection to database insert format
const convertInspectionToRow = (inspection: Partial<FieldInspection>) => {
  const row: any = { ...inspection };
  
  // Convert arrays to JSON for database storage
  if (row.hvac_units) {
    row.hvac_units = JSON.stringify(row.hvac_units);
  }
  if (row.roof_drains) {
    row.roof_drains = JSON.stringify(row.roof_drains);
  }
  if (row.penetrations) {
    row.penetrations = JSON.stringify(row.penetrations);
  }
  
  return row;
};

export function useFieldInspections() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<FieldInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .eq('inspector_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const convertedData = (data || []).map(convertRowToInspection);
      setInspections(convertedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inspections');
    } finally {
      setLoading(false);
    }
  };

  const createInspection = async (inspection: Partial<FieldInspection>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const insertData = convertInspectionToRow({
        ...inspection,
        inspector_id: user.id,
        inspector_name: user.user_metadata?.full_name || user.email || 'Unknown Inspector',
      });

      const { data, error } = await supabase
        .from('field_inspections')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      const convertedData = convertRowToInspection(data);
      setInspections(prev => [convertedData, ...prev]);
      return convertedData;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create inspection');
    }
  };

  const updateInspection = async (id: string, updates: Partial<FieldInspection>) => {
    try {
      const updateData = convertInspectionToRow(updates);
      
      const { data, error } = await supabase
        .from('field_inspections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const convertedData = convertRowToInspection(data);
      setInspections(prev => 
        prev.map(inspection => 
          inspection.id === id ? convertedData : inspection
        )
      );
      
      return convertedData;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update inspection');
    }
  };

  const deleteInspection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('field_inspections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInspections(prev => prev.filter(inspection => inspection.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete inspection');
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

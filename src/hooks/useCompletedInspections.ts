
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

export function useCompletedInspections() {
  const { user } = useAuth();
  const [completedInspections, setCompletedInspections] = useState<FieldInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletedInspections = async () => {
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
        .eq('status', 'Completed')
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Fetch completed inspections error:', error);
        throw error;
      }
      
      const convertedData = (data || []).map(convertRowToInspection);
      setCompletedInspections(convertedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch completed inspections';
      console.error('Fetch completed inspections error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to convert inspection data to SOW input format
  const convertInspectionToSOWInput = (inspection: FieldInspection) => {
    return {
      projectName: inspection.project_name,
      address: inspection.project_address,
      companyName: inspection.customer_name || '',
      squareFootage: inspection.square_footage || 0,
      buildingHeight: inspection.building_height || 0,
      buildingDimensions: {
        length: inspection.building_length || 0,
        width: inspection.building_width || 0
      },
      deckType: inspection.deck_type || '',
      projectType: 'recover', // Default from inspection context
      roofSlope: inspection.roof_slope || '',
      membraneType: inspection.existing_membrane_type || '',
      insulationType: inspection.insulation_type || '',
      insulationLayers: inspection.insulation_layers || [],
      coverBoardType: inspection.cover_board_type || '',
      hvacUnits: inspection.hvac_units?.length || 0,
      roofDrains: inspection.roof_drains?.length || 0,
      penetrations: inspection.penetrations || [],
      skylights: inspection.skylights || 0,
      drainageOptions: inspection.drainage_options || [],
      accessMethod: inspection.access_method || 'internal_hatch',
      photos: inspection.photos || [],
      notes: inspection.notes || '',
      inspectionDate: inspection.inspection_date,
      inspectorName: inspection.inspector_name
    };
  };

  useEffect(() => {
    fetchCompletedInspections();
  }, [user]);

  return {
    completedInspections,
    loading,
    error,
    refetch: fetchCompletedInspections,
    convertInspectionToSOWInput,
  };
}

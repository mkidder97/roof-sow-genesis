
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FieldInspection, convertRowToInspection } from '@/types/fieldInspection';

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
      
      // Use the centralized conversion function
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

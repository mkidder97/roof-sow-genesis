
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import InspectionDetails from '@/components/field-inspector/InspectionDetails';
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
    insulation_layers: Array.isArray(row.insulation_layers) ? row.insulation_layers : [],
    skylights: row.skylights || 0,
    photos: row.photos || [],
    sow_generated: row.sow_generated || false,
    drainage_options: row.drainage_options ? (Array.isArray(row.drainage_options) ? row.drainage_options : []) : [],
    interior_protection_needed: row.interior_protection_needed || false,
    interior_protection_sqft: row.interior_protection_sqft || 0,
    conduit_attached: row.conduit_attached || false,
    upgraded_lighting: row.upgraded_lighting || false,
    interior_fall_protection: row.interior_fall_protection || false,
    access_method: (row.access_method as 'internal_hatch' | 'external_ladder' | 'extension_ladder') || 'internal_hatch',
  };
};

const InspectionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: inspection, isLoading, error } = useQuery({
    queryKey: ['inspection', id],
    queryFn: async () => {
      if (!id) throw new Error('Inspection ID is required');
      
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return convertRowToInspection(data);
    },
    enabled: !!id,
  });

  const handleEdit = () => {
    if (id) {
      navigate(`/field-inspection/${id}/edit`);
    }
  };

  const handleGenerateSOW = () => {
    // TODO: Implement SOW generation
    console.log('Generate SOW for inspection:', id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading inspection details...
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/field-inspector')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Inspection Not Found</h1>
            <p className="text-blue-200 mb-6">
              The inspection you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/field-inspector')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/field-inspector')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <InspectionDetails
          inspection={inspection}
          onEdit={handleEdit}
          onGenerateSOW={handleGenerateSOW}
        />
      </div>
    </div>
  );
};

export default InspectionDetailsPage;

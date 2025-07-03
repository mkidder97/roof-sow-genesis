// Field Inspection Utility Functions - Shared between frontend and backend
import { FieldInspection, FieldInspectionRow, DrainageSOWConfig } from '../types/fieldInspection';

/**
 * Utility functions that are imported elsewhere
 */
export const convertRowToInspection = (row: any): FieldInspection => {
  return {
    ...row,
    id: row.id || undefined,
    project_name: row.project_name || '',
    project_address: row.project_address || '',
    inspector_name: row.inspector_name || '',
    status: row.status || 'Draft',
    priority_level: row.priority_level || 'Standard',
    weather_conditions: row.weather_conditions || 'Clear',
    access_method: row.access_method || 'internal_hatch',
    // Parse JSON fields if needed
    insulation_layers: Array.isArray(row.insulation_layers) ? row.insulation_layers : [],
    hvac_units: Array.isArray(row.hvac_units) ? row.hvac_units : [],
    roof_drains: Array.isArray(row.roof_drains) ? row.roof_drains : [],
    penetrations: Array.isArray(row.penetrations) ? row.penetrations : [],
    skylights_detailed: Array.isArray(row.skylights_detailed) ? row.skylights_detailed : [],
    drainage_options: Array.isArray(row.drainage_options) ? row.drainage_options : [],
  };
};

export const generateDrainageSOWConfig = (inspection: FieldInspection): DrainageSOWConfig => {
  return {
    primary_type: inspection.drainage_primary_type || undefined,
    overflow_type: inspection.drainage_overflow_type || undefined,
    deck_drains_count: inspection.drainage_deck_drains_count || undefined,
    deck_drains_diameter: inspection.drainage_deck_drains_diameter || undefined,
    scuppers_count: inspection.drainage_scuppers_count || undefined,
    scuppers_length: inspection.drainage_scuppers_length || undefined,
    scuppers_width: inspection.drainage_scuppers_width || undefined,
    scuppers_height: inspection.drainage_scuppers_height || undefined,
    gutters_linear_feet: inspection.drainage_gutters_linear_feet || undefined,
    gutters_height: inspection.drainage_gutters_height || undefined,
    gutters_width: inspection.drainage_gutters_width || undefined,
    gutters_depth: inspection.drainage_gutters_depth || undefined,
    additional_count: inspection.drainage_additional_count || undefined,
    additional_size: inspection.drainage_additional_size || undefined,
    additional_notes: inspection.drainage_additional_notes || undefined,
    // Add compatibility for new interface properties
    includeInternalGutters: inspection.drainage_options?.some((d: any) => d.type === 'internal_gutter') || false,
    includeExternalGutters: inspection.drainage_options?.some((d: any) => d.type === 'external_gutter') || false,
    includeDeckDrains: inspection.drainage_options?.some((d: any) => d.type === 'deck_drain') || false,
    includeOverflowDrains: inspection.drainage_options?.some((d: any) => d.type === 'overflow_drain') || false,
    includeScuppers: inspection.drainage_options?.some((d: any) => d.type === 'overflow_scuppers') || false,
  };
};

export const selectSOWTemplate = (inspectionData: FieldInspection): string => {
  const projectType = inspectionData.project_type || 'tearoff';
  const deckType = inspectionData.deck_type || 'steel';
  
  if (projectType === 'tearoff') {
    if (deckType === 'gypsum') {
      return 'T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum';
    } else if (deckType === 'lightweight_concrete') {
      return 'T7-Tearoff-TPO(MA)-insul-lwc-steel';
    } else {
      return 'T6-Tearoff-TPO(MA)-insul-steel';
    }
  } else if (projectType === 'recover') {
    if (inspectionData.existing_membrane_type?.toLowerCase().includes('tpo')) {
      return 'TPO_RECOVER';
    }
    if (inspectionData.existing_membrane_type?.toLowerCase().includes('pvc')) {
      return 'PVC_RECOVER';
    }
    if (inspectionData.existing_membrane_type?.toLowerCase().includes('epdm')) {
      return 'EPDM_RECOVER';
    }
    return 'T5-Recover-TPO(Rhino)-iso-EPS flute fill-SSR';
  }
  
  return 'T6-Tearoff-TPO(MA)-insul-steel'; // Default
};

/**
 * Validates field inspection data for completeness
 */
export const validateFieldInspection = (inspection: Partial<FieldInspection>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields
  if (!inspection.project_name?.trim()) {
    errors.push('Project name is required');
  }
  
  if (!inspection.project_address?.trim()) {
    errors.push('Project address is required');
  }
  
  if (!inspection.inspector_name?.trim()) {
    errors.push('Inspector name is required');
  }
  
  // Validate numeric fields
  if (inspection.building_height && (inspection.building_height < 1 || inspection.building_height > 2000)) {
    errors.push('Building height must be between 1 and 2000 feet');
  }
  
  if (inspection.square_footage && (inspection.square_footage < 100 || inspection.square_footage > 10000000)) {
    errors.push('Square footage must be between 100 and 10,000,000');
  }
  
  // Validate condition ratings
  if (inspection.overall_condition && (inspection.overall_condition < 1 || inspection.overall_condition > 10)) {
    errors.push('Overall condition must be between 1 and 10');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Calculates inspection completeness percentage
 */
export const calculateInspectionCompleteness = (inspection: FieldInspection): number => {
  const requiredFields = [
    'project_name',
    'project_address',
    'inspector_name',
    'building_height',
    'square_footage',
    'deck_type',
    'existing_membrane_type',
    'overall_condition'
  ];
  
  const optionalFields = [
    'building_length',
    'building_width',
    'roof_slope',
    'insulation_type',
    'number_of_stories',
    'weather_conditions',
    'notes'
  ];
  
  let completedRequired = 0;
  let completedOptional = 0;
  
  requiredFields.forEach(field => {
    if (inspection[field as keyof FieldInspection]) {
      completedRequired++;
    }
  });
  
  optionalFields.forEach(field => {
    if (inspection[field as keyof FieldInspection]) {
      completedOptional++;
    }
  });
  
  // Weight required fields more heavily (70%) vs optional (30%)
  const requiredWeight = 0.7;
  const optionalWeight = 0.3;
  
  const requiredScore = (completedRequired / requiredFields.length) * requiredWeight;
  const optionalScore = (completedOptional / optionalFields.length) * optionalWeight;
  
  return Math.round((requiredScore + optionalScore) * 100);
};

/**
 * Formats inspection data for display
 */
export const formatInspectionForDisplay = (inspection: FieldInspection) => {
  return {
    ...inspection,
    formattedDate: inspection.inspection_date ? 
      new Date(inspection.inspection_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'Not set',
    formattedSquareFootage: inspection.square_footage ? 
      new Intl.NumberFormat('en-US').format(inspection.square_footage) + ' sq ft' : 'Not specified',
    formattedBuildingHeight: inspection.building_height ? 
      inspection.building_height + ' ft' : 'Not specified',
    statusBadgeColor: getStatusBadgeColor(inspection.status),
    priorityBadgeColor: getPriorityBadgeColor(inspection.priority_level),
    completenessPercentage: calculateInspectionCompleteness(inspection)
  };
};

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'Completed': return 'green';
    case 'In Progress': return 'blue';
    case 'Under Review': return 'yellow';
    case 'Draft': return 'gray';
    default: return 'gray';
  }
}

function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case 'Urgent': return 'red';
    case 'High': return 'orange';
    case 'Standard': return 'blue';
    case 'Low': return 'gray';
    default: return 'gray';
  }
}

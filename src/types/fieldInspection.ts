// Core interfaces for field inspection system
export interface InsulationLayer {
  id: string;
  type: string;
  thickness: number;
  description?: string;
}

export interface HVACUnit {
  type: string;
  count: number;
  condition: string;
}

export interface RoofDrain {
  type: string;
  count: number;
  condition: string;
}

export interface DrainageOption {
  id: string;
  type: 'internal_gutter' | 'external_gutter' | 'deck_drain' | 'overflow_drain' | 'overflow_scuppers';
  count?: number;
  linear_feet?: number;
  condition?: string;
}

export interface Penetration {
  type: string;
  count: number;
}

export interface SkylightDetail {
  type: string;
  count: number;
}

export interface InspectionFormStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

// ASCE 7 related interfaces
export interface ASCEVersion {
  version: string;
  year: number;
  description: string;
  isDefault: boolean;
}

export interface ASCERequirements {
  version: string;
  wind_speed: number;
  exposure_category: string;
  building_classification: string;
  risk_category: string;
  importance_factor: number;
  notes?: string;
}

// Main field inspection interface - consolidated and clean
export interface FieldInspection {
  // System identifiers
  id?: string;
  project_id?: string;
  inspector_id?: string;
  sow_id?: string;

  // Basic project information
  project_name: string;
  project_address: string;
  inspector_name: string;
  inspection_date?: string;
  status: 'Draft' | 'Completed' | 'Under Review' | 'Approved';
  priority_level: 'Standard' | 'Expedited' | 'Emergency';

  // Enhanced address fields for geocoding and jurisdiction
  city?: string;
  state?: string;
  zip_code?: string;

  // ASCE 7 and wind analysis fields
  asce_version?: string;
  wind_speed?: number;
  exposure_category?: string;
  building_classification?: string;
  asce_requirements?: ASCERequirements;

  // Building specifications
  building_height?: number;
  building_length?: number;
  building_width?: number;
  square_footage?: number;
  number_of_stories?: number;

  // Weather and access
  weather_conditions?: string;
  access_method?: 'internal_hatch' | 'external_ladder' | 'extension_ladder';

  // Roof system details
  deck_type?: string;
  existing_membrane_type?: string;
  existing_membrane_condition?: number;
  insulation_type?: string;
  insulation_condition?: string;
  roof_slope?: string;
  roof_age_years?: number;
  cover_board_type?: string;

  // Equipment and features - using proper typed arrays
  hvac_units?: HVACUnit[];
  roof_drains?: RoofDrain[];
  penetrations?: Penetration[];
  insulation_layers?: InsulationLayer[];
  skylights?: number;
  skylights_detailed?: SkylightDetail[];
  roof_hatches?: number;

  // Conditions and assessments
  overall_condition?: number;
  concerns?: string;
  recommendations?: string;
  notes?: string;
  handoff_notes?: string;
  special_requirements?: string;

  // Drainage and protection
  drainage_options?: DrainageOption[];
  interior_protection_needed?: boolean;
  interior_protection_sqft?: number;
  conduit_attached?: boolean;
  upgraded_lighting?: boolean;
  interior_fall_protection?: boolean;
  curbs_above_8?: boolean;
  gas_line_penetrating_deck?: boolean;

  // Customer information (optional for field inspections)
  customer_name?: string;
  customer_phone?: string;

  // Documentation
  photos?: string[];

  // Workflow tracking
  completed?: boolean;
  completed_at?: string;
  ready_for_handoff?: boolean;
  sow_generated?: boolean;
  sow_generation_count?: number;

  // System fields
  created_at?: string;
  updated_at?: string;

  // Field inspection specific data - using proper Record types
  observations?: Record<string, any>;
  measurements?: Record<string, any>;
  conditions?: Record<string, any>;
  takeoff_items?: Record<string, any>;
}

// Database row type that matches Supabase types exactly
export interface FieldInspectionRow {
  id: string;
  inspector_name: string;
  inspector_id: string | null;
  inspection_date: string | null;
  project_name: string;
  project_address: string;
  customer_name: string | null;
  customer_phone: string | null;
  building_height: number | null;
  building_length: number | null;
  building_width: number | null;
  square_footage: number | null;
  number_of_stories: number | null;
  roof_slope: string | null;
  deck_type: string | null;
  existing_membrane_type: string | null;
  existing_membrane_condition: number | null;
  roof_age_years: number | null;
  insulation_type: string | null;
  insulation_condition: string | null;
  insulation_layers: any; // JSON from database
  cover_board_type: string | null;
  hvac_units: any; // JSON from database
  roof_drains: any; // JSON from database
  penetrations: any; // JSON from database
  skylights: number | null;
  skylights_detailed: any; // JSON from database
  overall_condition: number | null;
  priority_level: string | null;
  photos: string[] | null;
  notes: string | null;
  status: string | null;
  sow_generated: boolean | null;
  sow_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  drainage_options: any; // JSON from database
  interior_protection_needed: boolean | null;
  interior_protection_sqft: number | null;
  conduit_attached: boolean | null;
  upgraded_lighting: boolean | null;
  interior_fall_protection: boolean | null;
  curbs_above_8: boolean | null;
  gas_line_penetrating_deck: boolean | null;
  access_method: string | null;
  project_id: string | null;
  observations: any; // JSON from database
  measurements: any; // JSON from database
  conditions: any; // JSON from database
  takeoff_items: any; // JSON from database
  recommendations: string | null;
  concerns: string | null;
  completed: boolean | null;
  ready_for_handoff: boolean | null;
  handoff_notes: string | null;
  sow_generation_count: number | null;
}

// Type conversion helpers
export function convertRowToInspection(row: FieldInspectionRow): FieldInspection {
  return {
    ...row,
    hvac_units: row.hvac_units || [],
    roof_drains: row.roof_drains || [],
    penetrations: row.penetrations || [],
    insulation_layers: row.insulation_layers || [],
    skylights_detailed: row.skylights_detailed || [],
    drainage_options: row.drainage_options || [],
    observations: row.observations || {},
    measurements: row.measurements || {},
    conditions: row.conditions || {},
    takeoff_items: row.takeoff_items || {}
  };
}

export function convertInspectionToRow(inspection: FieldInspection): Partial<FieldInspectionRow> {
  return {
    ...inspection,
    hvac_units: inspection.hvac_units || null,
    roof_drains: inspection.roof_drains || null,
    penetrations: inspection.penetrations || null,
    insulation_layers: inspection.insulation_layers || null,
    skylights_detailed: inspection.skylights_detailed || null,
    drainage_options: inspection.drainage_options || null,
    observations: inspection.observations || null,
    measurements: inspection.measurements || null,
    conditions: inspection.conditions || null,
    takeoff_items: inspection.takeoff_items || null
  };
}

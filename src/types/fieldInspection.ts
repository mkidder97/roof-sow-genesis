
// Complete field inspection types matching database schema
export interface FieldInspection {
  id?: string;
  project_name: string;
  project_address: string;
  inspector_name: string;
  inspector_id?: string;
  customer_name?: string;
  customer_phone?: string;
  inspection_date?: string;
  
  // Location fields - Add missing county
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  
  // Building specifications
  building_height?: number;
  building_length?: number;
  building_width?: number;
  square_footage?: number;
  number_of_stories?: number;
  
  // Roof system details
  deck_type?: string;
  roof_slope?: string;
  existing_membrane_type?: string;
  existing_membrane_condition?: number;
  insulation_type?: string;
  insulation_condition?: string;
  cover_board_type?: string;
  roof_age_years?: number;
  
  // ASCE 7 requirements
  asce_version?: string;
  wind_speed?: number;
  exposure_category?: string;
  building_classification?: string;
  asce_requirements?: ASCERequirements;
  
  // Equipment and features
  hvac_units?: any[];
  roof_drains?: any[];
  penetrations?: any[];
  skylights?: number;
  roof_hatches?: number;
  
  // Assessment
  overall_condition?: number;
  notes?: string;
  recommendations?: string;
  concerns?: string;
  photos?: string[];
  
  // Workflow
  status?: 'Draft' | 'Under Review' | 'Completed' | 'Approved';
  priority_level?: 'Standard' | 'Expedited' | 'Emergency';
  completed?: boolean;
  ready_for_handoff?: boolean;
  sow_generated?: boolean;
  sow_id?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  
  // Additional fields
  weather_conditions?: string;
  access_method?: string;
  special_requirements?: string;
  handoff_notes?: string;
  project_type?: 'recover' | 'tearoff' | 'new';
  
  // Enhanced inspection fields
  measurements?: any;
  observations?: any;
  conditions?: any;
  takeoff_items?: any;
  sow_generation_count?: number;
  
  // Detailed equipment tracking  
  drainage_options?: any[];
  interior_protection_needed?: boolean;
  interior_protection_sqft?: number;
  conduit_attached?: boolean;
  upgraded_lighting?: boolean;
  interior_fall_protection?: boolean;
  insulation_layers?: any[];
  skylights_detailed?: any[];
  curbs_above_8?: boolean;
  gas_line_penetrating_deck?: boolean;
  project_id?: string;
}

export interface ASCERequirements {
  version: string;
  wind_speed?: number;
  exposure_category: string;
  building_classification: string;
  risk_category: string;
  importance_factor: number;
  hvhz_applicable?: boolean;
  engineer_approved?: boolean;
  approval_date?: string;
  approval_engineer?: string;
  notes?: string;
}

// Field inspection data from database - REQUIRED id
export interface FieldInspectionData extends FieldInspection {
  id: string; // Required for database operations
}

// Alias for compatibility
export type FieldInspectionRow = FieldInspection;

// Conversion function for database rows
export function convertRowToInspection(row: any): FieldInspection {
  return {
    ...row,
    // Ensure proper type conversion
    building_height: row.building_height ? Number(row.building_height) : undefined,
    building_length: row.building_length ? Number(row.building_length) : undefined,
    building_width: row.building_width ? Number(row.building_width) : undefined,
    square_footage: row.square_footage ? Number(row.square_footage) : undefined,
    wind_speed: row.wind_speed ? Number(row.wind_speed) : undefined,
    existing_membrane_condition: row.existing_membrane_condition ? Number(row.existing_membrane_condition) : undefined,
    overall_condition: row.overall_condition ? Number(row.overall_condition) : undefined,
    roof_age_years: row.roof_age_years ? Number(row.roof_age_years) : undefined,
    number_of_stories: row.number_of_stories ? Number(row.number_of_stories) : undefined,
    skylights: row.skylights ? Number(row.skylights) : undefined,
    roof_hatches: row.roof_hatches ? Number(row.roof_hatches) : undefined,
    // Properly handle ASCE requirements JSON conversion
    asce_requirements: row.asce_requirements ? 
      (typeof row.asce_requirements === 'string' ? 
        JSON.parse(row.asce_requirements) : 
        row.asce_requirements) : undefined,
  };
}

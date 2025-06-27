export interface FieldInspection {
  id?: string;
  inspector_name: string;
  inspector_id?: string;
  inspection_date: string;
  project_name: string;
  project_address: string;
  customer_name?: string;
  customer_phone?: string;
  building_height?: number;
  building_length?: number;
  building_width?: number;
  square_footage?: number;
  number_of_stories?: number;
  roof_slope?: string;
  deck_type?: string;
  existing_membrane_type?: string;
  existing_membrane_condition?: number;
  roof_age_years?: number;
  insulation_type?: string;
  insulation_condition?: string;
  insulation_layers?: InsulationLayer[];
  cover_board_type?: string;
  hvac_units?: HVACUnit[];
  roof_drains?: RoofDrain[];
  penetrations?: Penetration[];
  skylights?: number;
  skylights_detailed?: SkylightDetail[];
  overall_condition?: number;
  priority_level: 'Standard' | 'Expedited' | 'Emergency';
  photos?: string[];
  notes?: string;
  status: 'Draft' | 'Completed' | 'Under Review' | 'Approved';
  sow_generated?: boolean;
  sow_id?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  // Additional properties from Supabase schema
  drainage_options?: DrainageOption[];
  interior_protection_needed?: boolean;
  interior_protection_sqft?: number;
  conduit_attached?: boolean;
  upgraded_lighting?: boolean;
  interior_fall_protection?: boolean;
  curbs_above_8?: boolean;
  gas_line_penetrating_deck?: boolean;
  access_method?: 'internal_hatch' | 'external_ladder' | 'extension_ladder';
  weather_conditions?: string;
  completed?: boolean;
  project_type?: string;
  ready_for_handoff?: boolean;
  handoff_notes?: string;
  sow_generation_count?: number;
  special_requirements?: string;
  roof_hatches?: number;
  project_id?: string;
  observations?: any;
  measurements?: any;
  conditions?: any;
  takeoff_items?: any;
  recommendations?: string;
  concerns?: string;
}

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
}

export interface FieldInspection {
  id?: string;
  project_name: string;
  project_address: string;
  inspector_name: string;
  inspector_id?: string;
  inspection_date?: string;
  status: 'Draft' | 'Completed' | 'Under Review' | 'Approved';
  priority_level: 'Standard' | 'Expedited' | 'Emergency';
  
  // New required address fields
  city?: string;
  state?: string;
  zip_code?: string;
  
  // New required wind and building fields
  wind_speed?: number;
  exposure_category?: string;
  building_classification?: string;
  
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
  
  // Equipment and features
  hvac_units?: any[];
  roof_drains?: any[];
  penetrations?: any[];
  insulation_layers?: any[];
  skylights?: number;
  skylights_detailed?: any[];
  roof_hatches?: number;
  
  // Conditions and assessments
  overall_condition?: number;
  concerns?: string;
  recommendations?: string;
  notes?: string;
  handoff_notes?: string;
  special_requirements?: string;
  
  // Drainage and protection
  drainage_options?: any[];
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
  sow_id?: string;
  sow_generation_count?: number;
  
  // Project tracking
  project_id?: string;
  
  // System fields
  created_at?: string;
  updated_at?: string;
  
  // Field inspection specific data
  observations?: Record<string, any>;
  measurements?: Record<string, any>;
  conditions?: Record<string, any>;
  takeoff_items?: Record<string, any>;
}

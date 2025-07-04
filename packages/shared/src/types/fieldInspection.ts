// Field Inspection Types - Shared between frontend and backend

export interface HVACUnit {
  id: string;
  description?: string;
  quantity: number;
  condition: string;
  needs_curb_adapter?: boolean;
  type: string;
  count: number;
}

export interface RoofDrain {
  id: string;
  type: string;
  quantity: number;
  condition: string;
  location?: string;
  count: number;
}

export interface Penetration {
  id: string;
  type: string;
  quantity: number;
  condition: string;
  description?: string;
  count: number;
}

export interface SkylightEquipment {
  id: string;
  description?: string;
  quantity: number;
  condition: string;
  curb_condition?: string;
  glazing_condition?: string;
  leaks?: boolean;
}

export interface AccessPointEquipment {
  id: string;
  type: string;
  description?: string;
  quantity: number;
  condition: string;
  location?: string;
  size?: string;
}

export interface HVACEquipment {
  id: string;
  description?: string;
  quantity: number;
  condition: string;
  mounting_type?: string;
  refrigerant_lines_condition?: string;
  electrical_connections_condition?: string;
  curb_condition?: string;
  clearances?: string;
  type: string;
}

interface RoofLayer {
  id: string;
  type: 'membrane' | 'insulation' | 'deck' | 'barrier' | 'coverboard';
  description: string;
  attachment: 'mechanically_attached' | 'adhered' | 'ballasted' | 'welded';
  thickness: string;
  material?: string;
}

export interface AccessPoint {
  id: string;
  type: string;
  description?: string;
  quantity: number;
  condition: string;
  location: string;
  size?: string;
  notes?: string;
}

export interface SkylightItem {
  id: string;
  description?: string;
  quantity: number;
  condition: string;
  curb_condition?: string;
  glazing_condition?: string;
  leaks?: boolean;
  type: string;
  size: string;
  notes?: string;
}

export interface FieldInspectionData {
  id: string;
  project_name: string;
  project_address: string;
  inspector_name: string;
  inspection_date?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Under Review';
  priority_level: 'Low' | 'Standard' | 'High' | 'Urgent';
  weather_conditions: 'Clear' | 'Cloudy' | 'Light Rain' | 'Heavy Rain' | 'Snow' | 'Wind' | 'Other';
}

export interface DrainageSOWConfig {
  primary_type?: string;
  overflow_type?: string;
  deck_drains_count?: number;
  deck_drains_diameter?: number;
  scuppers_count?: number;
  scuppers_length?: number;
  scuppers_width?: number;
  scuppers_height?: number;
  gutters_linear_feet?: number;
  gutters_height?: number;
  gutters_width?: number;
  gutters_depth?: number;
  additional_count?: number;
  additional_size?: string;
  additional_notes?: string;
  specifications?: {
    internalGutters?: string;
    externalGutters?: string;
    deckDrains?: string;
  };
  additional_drainage?: string;
  // Legacy compatibility
  includeInternalGutters?: boolean;
  includeExternalGutters?: boolean;
  includeDeckDrains?: boolean;
  includeOverflowDrains?: boolean;
  includeScuppers?: boolean;
}

export interface FieldInspection {
  id?: string;
  project_name: string;
  project_address: string;
  inspector_name: string;
  inspection_date?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Under Review';
  priority_level: 'Low' | 'Standard' | 'High' | 'Urgent';
  weather_conditions: 'Clear' | 'Cloudy' | 'Light Rain' | 'Heavy Rain' | 'Snow' | 'Wind' | 'Other';
  temperature?: number;
  wind_speed?: number;
  access_method: 'ladder' | 'internal_hatch' | 'external_stairs' | 'crane' | 'other';
  safety_concerns?: string;

  // Enhanced roof assembly configuration
  roof_assembly_layers?: RoofLayer[];
  project_type?: 'tearoff' | 'recover' | 'new';
  recover_type?: string;
  original_membrane_type?: string;

  // Legacy fields (kept for backward compatibility)
  deck_type?: string;
  existing_membrane_type?: string;
  insulation_type?: string;
  roof_slope?: string;
  insulation_condition?: string;
  existing_membrane_condition?: number;
  roof_age_years?: number;

  building_height?: number;
  building_length?: number;
  building_width?: number;
  square_footage?: number;
  number_of_stories?: number;
  parapet_height?: number;
  roof_configuration?: string;

  hvac_units?: HVACUnit[];
  roof_drains?: RoofDrain[];
  penetrations?: Penetration[];
  skylights?: number;
  roof_hatches?: number;
  overall_condition?: number;

  equipment_skylights?: SkylightEquipment[];
  equipment_access_points?: AccessPointEquipment[];
  equipment_hvac_units?: HVACEquipment[];

  drainage_primary_type?: 'Deck Drains' | 'Scuppers' | 'Gutters';
  drainage_overflow_type?: 'Deck Drains' | 'Scuppers' | 'Gutters';
  drainage_deck_drains_count?: number;
  drainage_deck_drains_diameter?: number;
  drainage_scuppers_count?: number;
  drainage_scuppers_length?: number;
  drainage_scuppers_width?: number;
  drainage_scuppers_height?: number;
  drainage_gutters_linear_feet?: number;
  drainage_gutters_height?: number;
  drainage_gutters_width?: number;
  drainage_gutters_depth?: number;
  drainage_condition?: string;
  drainage_additional_count?: number;
  drainage_additional_size?: string;
  drainage_additional_notes?: string;

  penetrations_gas_lines?: boolean;
  penetrations_conduit_attached?: boolean;
  curbs_8_inch_or_above?: boolean;
  side_discharge_units?: boolean;

  photos?: string[];
  completed?: boolean;
  ready_for_handoff?: boolean;

  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;

  notes?: string;
  concerns?: string;
  recommendations?: string;

  inspector_id?: string;
  engineer_id?: string;
  customer_name?: string;
  customer_phone?: string;

  wind_speed_design?: number;
  exposure_category?: string;
  building_classification?: string;

  // Additional properties
  sow_generated?: boolean;
  asce_requirements?: any; // Will be typed properly when we move ASCE types
  asce_version?: string;
  cover_board_type?: string;
  insulation_layers?: any[];
  drainage_options?: any[];
  interior_protection_needed?: boolean;
  interior_protection_sqft?: number;
  conduit_attached?: boolean;
  upgraded_lighting?: boolean;
  interior_fall_protection?: boolean;
  special_requirements?: string;
  
  // Additional compatibility properties
  deck_substrate?: string;
  attachment_method?: string;
  insulation_attachment?: string;
  walkway_pads?: boolean | number;
  equipment_platforms?: boolean | number;
  penetrations_gas_line_count?: number;
  penetrations_conduit_description?: string;
  penetrations_other?: any;
  curbs_count?: number;
  side_discharge_count?: number;
  skylights_detailed?: SkylightItem[];
  curbs_above_8?: boolean;
  gas_line_penetrating_deck?: boolean;
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
  insulation_layers: any;
  cover_board_type: string | null;
  hvac_units: any;
  roof_drains: any;
  penetrations: any;
  skylights: number | null;
  skylights_detailed: any;
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
  drainage_options: any;
  interior_protection_needed: boolean | null;
  interior_protection_sqft: number | null;
  conduit_attached: boolean | null;
  upgraded_lighting: boolean | null;
  interior_fall_protection: boolean | null;
  curbs_above_8: boolean | null;
  gas_line_penetrating_deck: boolean | null;
  access_method: string | null;
}
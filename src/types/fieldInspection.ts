
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

  // New Enhanced Equipment Inventory Fields
  // Skylights
  equipment_skylights?: SkylightItem[];
  
  // Access Points
  equipment_access_points?: AccessPoint[];
  
  // HVAC Equipment
  equipment_hvac_units?: HVACUnit[];
  
  // ENHANCED DRAINAGE SYSTEM FOR SOW INTEGRATION
  // Primary Drainage Configuration
  drainage_primary_type?: 'Deck Drains' | 'Scuppers' | 'Gutters';
  drainage_overflow_type?: 'Overflow Scuppers' | 'Secondary Drains' | 'None' | 'Other';
  
  // Deck Drains Specifications (for SOW template sections)
  drainage_deck_drains_count?: number;
  drainage_deck_drains_diameter?: number; // inches
  
  // Scuppers Specifications (for SOW template sections)  
  drainage_scuppers_count?: number;
  drainage_scuppers_length?: number; // inches
  drainage_scuppers_width?: number; // inches
  drainage_scuppers_height?: number; // inches above roof line
  
  // Gutters Specifications (for SOW template sections)
  drainage_gutters_linear_feet?: number;
  drainage_gutters_height?: number; // inches
  drainage_gutters_width?: number; // inches  
  drainage_gutters_depth?: number; // inches
  
  // Additional/Overflow Drainage Details
  drainage_additional_count?: number;
  drainage_additional_size?: string; // flexible sizing description
  drainage_additional_notes?: string;
  
  // Legacy drainage fields (keep for compatibility)
  drainage_condition?: string;
  drainage_interior_drains?: number;
  drainage_drain_size?: string;
  drainage_scuppers?: number;
  drainage_scupper_size?: string;
  
  // SOW Template Selection Data
  roof_assembly_layers?: RoofLayer[];
  attachment_method?: 'mechanically_attached' | 'fully_adhered' | 'ballasted';
  deck_substrate?: 'steel' | 'concrete' | 'gypsum' | 'lightweight_concrete' | 'wood';
  insulation_attachment?: 'mechanically_attached' | 'adhered';
  
  // Penetrations
  penetrations_gas_lines?: boolean;
  penetrations_gas_line_count?: number;
  penetrations_conduit_attached?: boolean;
  penetrations_conduit_description?: string;
  penetrations_other?: string;
  
  // Curbs & Equipment Platforms
  curbs_8_inch_or_above?: boolean;
  curbs_count?: number;
  side_discharge_units?: boolean;
  side_discharge_count?: number;
  equipment_platforms?: number;
  walkway_pads?: number;
  
  // Edge Details & Accessories
  edge_detail_type?: string;
  expansion_joints?: number;
  
  // Safety Equipment
  safety_tie_off_points?: number;
  safety_fall_protection_type?: string;
  safety_warning_lines?: number;
}

// Roof Layer interface for SOW assembly generation
export interface RoofLayer {
  id: string;
  layer: string;
  description: string;
  attachment: string;
  thickness: string;
}

// New equipment item types
export interface SkylightItem {
  id: string;
  type: string;
  quantity: number;
  size: string;
  condition: string;
  notes?: string;
}

export interface AccessPoint {
  id: string;
  type: string;
  quantity: number;
  condition: string;
  location: string;
  notes?: string;
}

export interface HVACUnit {
  id: string;
  type: string;
  quantity: number;
  condition: string;
  notes?: string;
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

// SOW Template Selection Logic Types
export interface SOWTemplateSelector {
  project_type: 'recover' | 'tearoff' | 'new';
  membrane_type: string;
  attachment_method: string;
  deck_substrate: string;
  insulation_attachment?: string;
  geographic_zone?: 'florida_hvhz' | 'florida_non_hvhz' | 'standard';
}

// Drainage Section Configuration for SOW Templates
export interface DrainageSOWConfig {
  primary_type: 'Deck Drains' | 'Scuppers' | 'Gutters';
  overflow_type?: string;
  specifications: {
    deck_drains?: {
      count: number;
      diameter: number;
      type: 'primary' | 'secondary' | 'overflow';
    };
    scuppers?: {
      count: number;
      length: number;
      width: number;
      height_above_roof: number;
      type: 'primary' | 'overflow';
    };
    gutters?: {
      linear_feet: number;
      height: number;
      width: number;
      depth: number;
    };
  };
  additional_drainage?: {
    count: number;
    type: string;
    specifications: string;
  };
}

// Field inspection data from database - REQUIRED id
export interface FieldInspectionData extends FieldInspection {
  id: string; // Required for database operations
}

// Alias for compatibility
export type FieldInspectionRow = FieldInspection;

// Enhanced conversion function for database rows with new drainage fields
export function convertRowToInspection(row: any): FieldInspection {
  return {
    ...row,
    // Ensure proper type conversion for all numeric fields
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
    
    // Enhanced drainage field conversions
    drainage_deck_drains_count: row.drainage_deck_drains_count ? Number(row.drainage_deck_drains_count) : undefined,
    drainage_deck_drains_diameter: row.drainage_deck_drains_diameter ? Number(row.drainage_deck_drains_diameter) : undefined,
    drainage_scuppers_count: row.drainage_scuppers_count ? Number(row.drainage_scuppers_count) : undefined,
    drainage_scuppers_length: row.drainage_scuppers_length ? Number(row.drainage_scuppers_length) : undefined,
    drainage_scuppers_width: row.drainage_scuppers_width ? Number(row.drainage_scuppers_width) : undefined,
    drainage_scuppers_height: row.drainage_scuppers_height ? Number(row.drainage_scuppers_height) : undefined,
    drainage_gutters_linear_feet: row.drainage_gutters_linear_feet ? Number(row.drainage_gutters_linear_feet) : undefined,
    drainage_gutters_height: row.drainage_gutters_height ? Number(row.drainage_gutters_height) : undefined,
    drainage_gutters_width: row.drainage_gutters_width ? Number(row.drainage_gutters_width) : undefined,
    drainage_gutters_depth: row.drainage_gutters_depth ? Number(row.drainage_gutters_depth) : undefined,
    drainage_additional_count: row.drainage_additional_count ? Number(row.drainage_additional_count) : undefined,
    
    // Properly handle ASCE requirements JSON conversion
    asce_requirements: row.asce_requirements ? 
      (typeof row.asce_requirements === 'string' ? 
        JSON.parse(row.asce_requirements) : 
        row.asce_requirements) : undefined,
        
    // Handle roof assembly layers JSON conversion
    roof_assembly_layers: row.roof_assembly_layers ? 
      (typeof row.roof_assembly_layers === 'string' ? 
        JSON.parse(row.roof_assembly_layers) : 
        row.roof_assembly_layers) : undefined,
        
    // Handle equipment arrays
    equipment_skylights: row.equipment_skylights || [],
    equipment_access_points: row.equipment_access_points || [],
    equipment_hvac_units: row.equipment_hvac_units || [],
  };
}

// SOW Template Selection Helper Function
export function selectSOWTemplate(inspection: FieldInspection): string {
  const {
    project_type = 'tearoff',
    attachment_method = 'mechanically_attached', 
    deck_substrate = 'steel',
    insulation_attachment = 'mechanically_attached'
  } = inspection;
  
  // Template naming: [TYPE]-[MEMBRANE]-[ATTACHMENT]-[INSULATION]-[DECK]
  if (project_type === 'tearoff') {
    if (attachment_method === 'mechanically_attached') {
      if (deck_substrate === 'steel') {
        return 'T6-Tearoff-TPO(MA)-insul-steel';
      } else if (deck_substrate === 'gypsum' && insulation_attachment === 'adhered') {
        return 'T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum';
      } else if (deck_substrate === 'lightweight_concrete') {
        return 'T7-Tearoff-TPO(MA)-insul-lwc-steel';
      }
    }
  } else if (project_type === 'recover') {
    return 'T5-Recover-TPO(Rhino)-iso-EPS flute fill-SSR';
  }
  
  // Default fallback
  return 'T6-Tearoff-TPO(MA)-insul-steel';
}

// Generate Drainage Configuration for SOW
export function generateDrainageSOWConfig(inspection: FieldInspection): DrainageSOWConfig {
  const config: DrainageSOWConfig = {
    primary_type: inspection.drainage_primary_type || 'Deck Drains',
    overflow_type: inspection.drainage_overflow_type,
    specifications: {}
  };
  
  // Configure based on primary drainage type
  if (config.primary_type === 'Deck Drains' && inspection.drainage_deck_drains_count) {
    config.specifications.deck_drains = {
      count: inspection.drainage_deck_drains_count,
      diameter: inspection.drainage_deck_drains_diameter || 4,
      type: 'primary'
    };
  }
  
  if (config.primary_type === 'Scuppers' && inspection.drainage_scuppers_count) {
    config.specifications.scuppers = {
      count: inspection.drainage_scuppers_count,
      length: inspection.drainage_scuppers_length || 12,
      width: inspection.drainage_scuppers_width || 4,
      height_above_roof: inspection.drainage_scuppers_height || 2,
      type: 'primary'
    };
  }
  
  if (config.primary_type === 'Gutters' && inspection.drainage_gutters_linear_feet) {
    config.specifications.gutters = {
      linear_feet: inspection.drainage_gutters_linear_feet,
      height: inspection.drainage_gutters_height || 6,
      width: inspection.drainage_gutters_width || 8,
      depth: inspection.drainage_gutters_depth || 4
    };
  }
  
  // Add additional drainage if specified
  if (inspection.drainage_additional_count && inspection.drainage_additional_count > 0) {
    config.additional_drainage = {
      count: inspection.drainage_additional_count,
      type: inspection.drainage_overflow_type || 'Other',
      specifications: inspection.drainage_additional_size || ''
    };
  }
  
  return config;
}

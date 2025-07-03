// Shared types for ASCE requirements - use this across all modules
export interface ASCERequirements {
  // Core required fields for SOW generation - made more flexible
  version?: string; // Made optional for flexibility
  exposure_category?: string; // Made optional
  exposureCategory?: string; // Alternative naming
  building_classification?: string; // Made optional
  buildingClassification?: string; // Alternative naming
  risk_category?: string; // Made optional
  importance_factor?: number; // Made optional
  
  // Location fields
  state?: string; // Added missing state property
  
  // Optional enhanced fields
  wind_speed?: number;
  windSpeed?: number; // Alternative naming for compatibility
  buildingHeight?: number;
  roofZone?: string;
  hvhz_applicable?: boolean;
  engineer_approved?: boolean;
  approval_date?: string;
  approval_engineer?: string;
  notes?: string;
  pressureCoefficients?: {
    zone1?: number;
    zone2?: number;
    zone3?: number;
  };
}

// For contexts where partial data is acceptable (like form drafts)
export interface PartialASCERequirements {
  version?: string;
  wind_speed?: number;
  windSpeed?: number;
  exposure_category?: string;
  exposureCategory?: string;
  building_classification?: string;
  buildingClassification?: string;
  buildingHeight?: number;
  roofZone?: string;
  risk_category?: string;
  importance_factor?: number;
  hvhz_applicable?: boolean;
  engineer_approved?: boolean;
  approval_date?: string;
  approval_engineer?: string;
  notes?: string;
  state?: string; // Added missing state property
  pressureCoefficients?: {
    zone1?: number;
    zone2?: number;
    zone3?: number;
  };
}

// Utility function to convert partial to complete - now more lenient
export function validateASCERequirements(
  partial: PartialASCERequirements
): ASCERequirements {
  // Return the partial data as complete since all fields are now optional
  return {
    version: partial.version,
    exposure_category: partial.exposure_category,
    exposureCategory: partial.exposureCategory,
    building_classification: partial.building_classification,
    buildingClassification: partial.buildingClassification,
    risk_category: partial.risk_category,
    importance_factor: partial.importance_factor || 1.0,
    state: partial.state,
    // Copy all optional fields
    wind_speed: partial.wind_speed,
    windSpeed: partial.windSpeed,
    buildingHeight: partial.buildingHeight,
    roofZone: partial.roofZone,
    hvhz_applicable: partial.hvhz_applicable,
    engineer_approved: partial.engineer_approved,
    approval_date: partial.approval_date,
    approval_engineer: partial.approval_engineer,
    notes: partial.notes,
    pressureCoefficients: partial.pressureCoefficients,
  };
}
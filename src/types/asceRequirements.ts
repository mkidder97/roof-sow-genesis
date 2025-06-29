// Shared types for ASCE requirements - use this across all modules
export interface ASCERequirements {
  // Core required fields for SOW generation
  version: string;
  exposure_category: string;
  building_classification: string;
  risk_category: string;
  importance_factor: number;
  
  // Optional enhanced fields
  wind_speed?: number;
  windSpeed?: number; // Alternative naming for compatibility
  exposureCategory?: string; // Alternative naming
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
  buildingHeight?: number;
  roofZone?: string;
  risk_category?: string;
  importance_factor?: number;
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

// Utility function to convert partial to complete
export function validateASCERequirements(
  partial: PartialASCERequirements
): ASCERequirements | null {
  if (!partial.version || !partial.exposure_category || 
      !partial.building_classification || !partial.risk_category) {
    return null;
  }
  
  return {
    version: partial.version,
    exposure_category: partial.exposure_category,
    building_classification: partial.building_classification,
    risk_category: partial.risk_category,
    importance_factor: partial.importance_factor || 1.0,
    // Copy all optional fields
    wind_speed: partial.wind_speed,
    windSpeed: partial.windSpeed,
    exposureCategory: partial.exposureCategory,
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
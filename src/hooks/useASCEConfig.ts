import { useState, useEffect, useMemo } from 'react';
import asceConfig from '../data/asce-7-config.json';

export interface ASCEVersion {
  version: string;
  year: number;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  wind_provisions: {
    chapter: string;
    method: string;
    pressure_zones: string[];
    special_provisions: string[];
  };
}

export interface ExposureCategory {
  category: string;
  description: string;
  ground_elevation_factor: number;
  common_locations: string[];
}

export interface BuildingClassification {
  class: string;
  description: string;
  importance_factor: number;
  examples: string[];
  isDefault?: boolean;
}

export interface ASCERequirements {
  version: string;
  exposure_category: string;
  building_classification: string;
  risk_category: string;
  importance_factor: number;
  wind_speed?: number;
  hvhz_applicable?: boolean;
  notes?: string;
  engineer_approved?: boolean;
  approval_date?: string;
  approval_engineer?: string;
}

export interface ASCEConfigState {
  versions: ASCEVersion[];
  exposureCategories: ExposureCategory[];
  buildingClassifications: BuildingClassification[];
  riskCategories: BuildingClassification[];
  hvhzRegions: any;
  defaultValues: any;
  manualOverride: any;
}

export interface UseASCEConfigReturn {
  config: ASCEConfigState;
  selectedRequirements: ASCERequirements | null;
  updateRequirements: (requirements: Partial<ASCERequirements>) => void;
  resetToDefaults: () => void;
  validateRequirements: (requirements: ASCERequirements) => { isValid: boolean; errors: string[] };
  getImportanceFactorForClass: (classification: string) => number;
  isHVHZLocation: (state: string, county?: string) => boolean;
  getRecommendedASCEVersion: (year?: number) => ASCEVersion;
  requiresEngineerApproval: boolean;
}

export function useASCEConfig(): UseASCEConfigReturn {
  const [config] = useState<ASCEConfigState>({
    versions: asceConfig.asce_versions as ASCEVersion[],
    exposureCategories: asceConfig.exposure_categories as ExposureCategory[],
    buildingClassifications: asceConfig.building_classifications as BuildingClassification[],
    riskCategories: asceConfig.risk_categories as BuildingClassification[],
    hvhzRegions: asceConfig.hvhz_regions,
    defaultValues: asceConfig.default_values,
    manualOverride: asceConfig.manual_override
  });

  const [selectedRequirements, setSelectedRequirements] = useState<ASCERequirements | null>(null);

  // Initialize with default values
  useEffect(() => {
    const defaultRequirements: ASCERequirements = {
      version: config.defaultValues.asce_version,
      exposure_category: config.defaultValues.exposure_category,
      building_classification: config.defaultValues.building_classification,
      risk_category: config.defaultValues.risk_category,
      importance_factor: config.defaultValues.importance_factor,
      engineer_approved: false
    };
    setSelectedRequirements(defaultRequirements);
  }, [config]);

  const updateRequirements = (updates: Partial<ASCERequirements>) => {
    setSelectedRequirements(prev => {
      if (!prev) return null;
      
      const updated = { ...prev, ...updates };
      
      // Auto-update importance factor when building classification changes
      if (updates.building_classification) {
        const importanceFactor = getImportanceFactorForClass(updates.building_classification);
        updated.importance_factor = importanceFactor;
        updated.risk_category = updates.building_classification; // Risk category aligns with building class
      }
      
      // Reset engineer approval when requirements change
      if (Object.keys(updates).some(key => key !== 'engineer_approved' && key !== 'approval_date' && key !== 'approval_engineer')) {
        updated.engineer_approved = false;
        updated.approval_date = undefined;
        updated.approval_engineer = undefined;
      }
      
      return updated;
    });
  };

  const resetToDefaults = () => {
    const defaultRequirements: ASCERequirements = {
      version: config.defaultValues.asce_version,
      exposure_category: config.defaultValues.exposure_category,
      building_classification: config.defaultValues.building_classification,
      risk_category: config.defaultValues.risk_category,
      importance_factor: config.defaultValues.importance_factor,
      engineer_approved: false
    };
    setSelectedRequirements(defaultRequirements);
  };

  const validateRequirements = (requirements: ASCERequirements): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!requirements.version) {
      errors.push('ASCE version is required');
    }

    if (!requirements.exposure_category) {
      errors.push('Exposure category is required');
    }

    if (!requirements.building_classification) {
      errors.push('Building classification is required');
    }

    if (!requirements.risk_category) {
      errors.push('Risk category is required');
    }

    if (requirements.importance_factor <= 0) {
      errors.push('Importance factor must be greater than 0');
    }

    if (config.manualOverride.validation_required && !requirements.engineer_approved) {
      errors.push('Engineer approval required for ASCE requirements');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const getImportanceFactorForClass = (classification: string): number => {
    const classConfig = config.buildingClassifications.find(c => c.class === classification);
    return classConfig?.importance_factor || 1.0;
  };

  const isHVHZLocation = (state: string, county?: string): boolean => {
    if (!config.hvhzRegions.states.includes(state)) {
      return false;
    }

    if (county && config.hvhzRegions.counties[state]) {
      return config.hvhzRegions.counties[state].includes(county);
    }

    // If no county specified but state is in HVHZ states, assume it might be HVHZ
    return true;
  };

  const getRecommendedASCEVersion = (year?: number): ASCEVersion => {
    if (year) {
      // Find the most recent ASCE version that was available in the given year
      const availableVersions = config.versions
        .filter(v => v.year <= year && v.isActive)
        .sort((a, b) => b.year - a.year);
      
      if (availableVersions.length > 0) {
        return availableVersions[0];
      }
    }

    // Return default version
    return config.versions.find(v => v.isDefault) || config.versions[0];
  };

  const requiresEngineerApproval = useMemo(() => {
    return config.manualOverride.enabled && config.manualOverride.validation_required;
  }, [config]);

  return {
    config,
    selectedRequirements,
    updateRequirements,
    resetToDefaults,
    validateRequirements,
    getImportanceFactorForClass,
    isHVHZLocation,
    getRecommendedASCEVersion,
    requiresEngineerApproval
  };
}

// Helper function to format ASCE requirements for display
export function formatASCERequirements(requirements: ASCERequirements): string {
  return `${requirements.version} | ${requirements.exposure_category} | Class ${requirements.building_classification} | I=${requirements.importance_factor}`;
}

// Helper function to generate ASCE requirements summary for SOW
export function generateASCERequirementsSummary(requirements: ASCERequirements): string {
  const parts = [
    `Design performed in accordance with ${requirements.version}`,
    `Exposure Category ${requirements.exposure_category}`,
    `Risk Category ${requirements.risk_category}`,
    `Importance Factor I = ${requirements.importance_factor}`
  ];

  if (requirements.wind_speed) {
    parts.push(`Design Wind Speed: ${requirements.wind_speed} mph`);
  }

  if (requirements.hvhz_applicable) {
    parts.push('High-Velocity Hurricane Zone (HVHZ) requirements applicable');
  }

  if (requirements.engineer_approved && requirements.approval_engineer) {
    parts.push(`Engineer Approved: ${requirements.approval_engineer} (${requirements.approval_date})`);
  }

  return parts.join('; ');
}

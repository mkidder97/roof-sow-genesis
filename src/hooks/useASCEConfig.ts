
import { useState, useCallback, useMemo } from 'react';
// ✅ Import unified ASCE interface
import { ASCERequirements, PartialASCERequirements } from '@/types/asceRequirements';

export interface ASCEVersion {
  version: string;
  year: number;
  description: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface ExposureCategory {
  category: string;
  description: string;
  windMultiplier: number;
}

export interface BuildingClassification {
  class: string;
  description: string;
  importance_factor: number;
  isDefault: boolean;
}

export interface ManualOverride {
  enabled: boolean;
  reason?: string;
}

export interface ASCEConfig {
  versions: ASCEVersion[];
  exposureCategories: ExposureCategory[];
  buildingClassifications: BuildingClassification[];
  manualOverride: ManualOverride;
}

const defaultConfig: ASCEConfig = {
  versions: [
    { version: 'ASCE 7-22', year: 2022, description: 'Latest ASCE 7-22 Standard', isDefault: true, isActive: true },
    { version: 'ASCE 7-16', year: 2016, description: 'ASCE 7-16 Standard', isDefault: false, isActive: true },
    { version: 'ASCE 7-10', year: 2010, description: 'ASCE 7-10 Standard', isDefault: false, isActive: true },
    { version: 'ASCE 7-05', year: 2005, description: 'ASCE 7-05 Standard', isDefault: false, isActive: false }
  ],
  exposureCategories: [
    { category: 'B', description: 'Urban and suburban areas with numerous closely spaced obstructions', windMultiplier: 0.7 },
    { category: 'C', description: 'Open terrain with scattered obstructions', windMultiplier: 1.0 },
    { category: 'D', description: 'Flat, unobstructed areas and water surfaces', windMultiplier: 1.15 }
  ],
  buildingClassifications: [
    { class: 'I', description: 'Low hazard to human life', importance_factor: 0.87, isDefault: false },
    { class: 'II', description: 'Standard occupancy', importance_factor: 1.0, isDefault: true },
    { class: 'III', description: 'Substantial hazard to human life', importance_factor: 1.15, isDefault: false },
    { class: 'IV', description: 'Essential facilities', importance_factor: 1.15, isDefault: false }
  ],
  manualOverride: {
    enabled: false,
    reason: ''
  }
};

export function useASCEConfig() {
  const [config, setConfig] = useState<ASCEConfig>(defaultConfig);
  
  // ✅ Use PartialASCERequirements for draft state, complete ASCERequirements for final
  const [selectedRequirements, setSelectedRequirements] = useState<PartialASCERequirements>({
    version: 'ASCE 7-22',
    exposure_category: 'C',
    building_classification: 'II',
    risk_category: 'II',
    importance_factor: 1.0,
    engineer_approved: false
  });

  const getRecommendedASCEVersion = useCallback((location?: { state?: string; city?: string; county?: string }) => {
    // Simple recommendation logic based on location
    if (location?.state === 'FL') {
      return 'ASCE 7-16'; // Florida Building Code uses ASCE 7-16
    }
    if (location?.state === 'TX') {
      return 'ASCE 7-22'; // Texas typically uses latest IBC
    }
    return 'ASCE 7-22'; // Default to latest
  }, []);

  const updateRequirements = useCallback((updates: Partial<PartialASCERequirements>) => {
    setSelectedRequirements(prev => {
      const newRequirements = { ...prev, ...updates };
      
      // Auto-update importance factor when building classification changes
      if (updates.building_classification) {
        const classification = config.buildingClassifications.find(c => c.class === updates.building_classification);
        if (classification) {
          newRequirements.importance_factor = classification.importance_factor;
          newRequirements.risk_category = updates.building_classification;
        }
      }
      
      return newRequirements;
    });
  }, [config]);

  const resetToDefaults = useCallback(() => {
    setSelectedRequirements({
      version: 'ASCE 7-22',
      exposure_category: 'C',
      building_classification: 'II',
      risk_category: 'II',
      importance_factor: 1.0,
      engineer_approved: false
    });
  }, []);

  const validateRequirements = useCallback((requirements: PartialASCERequirements) => {
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
    
    if (!requirements.importance_factor || requirements.importance_factor <= 0) {
      errors.push('Valid importance factor is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  const getImportanceFactorForClass = useCallback((classification: string): number => {
    const classConfig = config.buildingClassifications.find(c => c.class === classification);
    return classConfig?.importance_factor || 1.0;
  }, [config]);

  const isHVHZLocation = useCallback((state: string, county?: string): boolean => {
    // HVHZ detection for Florida
    if (state?.toUpperCase() === 'FL') {
      const hvhzCounties = ['Miami-Dade', 'Broward', 'Palm Beach', 'Monroe'];
      return county ? hvhzCounties.some(c => county.toLowerCase().includes(c.toLowerCase())) : false;
    }
    return false;
  }, []);

  const requiresEngineerApproval = useMemo(() => {
    return selectedRequirements.wind_speed ? selectedRequirements.wind_speed > 130 : true;
  }, [selectedRequirements.wind_speed]);

  return {
    config,
    selectedRequirements,
    updateRequirements,
    resetToDefaults,
    validateRequirements,
    getImportanceFactorForClass,
    isHVHZLocation,
    requiresEngineerApproval,
    getRecommendedASCEVersion
  };
}

export function formatASCERequirements(requirements: PartialASCERequirements): string {
  return `${requirements.version || 'TBD'} | ${requirements.wind_speed || 'TBD'} mph | Exposure ${requirements.exposure_category || 'TBD'} | Class ${requirements.building_classification || 'TBD'} (I=${requirements.importance_factor || 1.0})`;
}

export function generateASCERequirementsSummary(requirements?: PartialASCERequirements): string {
  if (!requirements) return 'ASCE requirements not specified';
  
  const parts = [
    `ASCE Version: ${requirements.version || 'TBD'}`,
    `Wind Speed: ${requirements.wind_speed || 'TBD'} mph`,
    `Exposure Category: ${requirements.exposure_category || 'TBD'}`,
    `Building Classification: ${requirements.building_classification || 'TBD'}`,
    `Importance Factor: ${requirements.importance_factor || 1.0}`,
    requirements.hvhz_applicable ? 'HVHZ Requirements Apply' : null,
    requirements.engineer_approved ? `Engineer Approved: ${requirements.approval_engineer || 'Yes'}` : 'Pending Engineer Approval'
  ].filter(Boolean);
  
  return parts.join('\n');
}


import { useState, useEffect } from 'react';
import { ASCERequirements, PartialASCERequirements } from '@/types/asceRequirements';

export type { ASCERequirements, PartialASCERequirements } from '@/types/asceRequirements';

// Configuration data structure
interface ASCEConfigData {
  versions: Array<{
    version: string;
    description: string;
    isActive: boolean;
    isDefault: boolean;
  }>;
  exposureCategories: Array<{
    category: string;
    description: string;
  }>;
  buildingClassifications: Array<{
    class: string;
    description: string;
    importance_factor: number;
    isDefault: boolean;
  }>;
  manualOverride: {
    enabled: boolean;
    reason: string;
  };
}

// Default configuration
const defaultConfig: ASCEConfigData = {
  versions: [
    { version: 'ASCE 7-22', description: 'Latest ASCE 7-22 Standard', isActive: true, isDefault: true },
    { version: 'ASCE 7-16', description: 'ASCE 7-16 Standard', isActive: true, isDefault: false },
    { version: 'ASCE 7-10', description: 'ASCE 7-10 Standard', isActive: true, isDefault: false },
  ],
  exposureCategories: [
    { category: 'B', description: 'Urban and suburban areas, wooded areas' },
    { category: 'C', description: 'Open terrain with scattered obstructions' },
    { category: 'D', description: 'Flat, unobstructed areas facing water' },
  ],
  buildingClassifications: [
    { class: 'I', description: 'Low hazard to human life', importance_factor: 0.87, isDefault: false },
    { class: 'II', description: 'Standard occupancy', importance_factor: 1.0, isDefault: true },
    { class: 'III', description: 'Substantial hazard to human life', importance_factor: 1.15, isDefault: false },
    { class: 'IV', description: 'Essential facilities', importance_factor: 1.15, isDefault: false },
  ],
  manualOverride: {
    enabled: false,
    reason: 'API service temporarily unavailable'
  }
};

// Default requirements
const defaultRequirements: PartialASCERequirements = {
  version: 'ASCE 7-22',
  exposure_category: 'C',
  building_classification: 'II',
  risk_category: 'II',
  importance_factor: 1.0,
  wind_speed: 140,
};

// Validation interface
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function useASCEConfig() {
  const [config] = useState<ASCEConfigData>(defaultConfig);
  const [selectedRequirements, setSelectedRequirements] = useState<PartialASCERequirements>(defaultRequirements);
  
  const updateRequirements = (updates: Partial<PartialASCERequirements>) => {
    setSelectedRequirements(prev => {
      const updated = { ...prev, ...updates };
      
      // Auto-update importance factor when building classification changes
      if (updates.building_classification) {
        const classification = config.buildingClassifications.find(c => c.class === updates.building_classification);
        if (classification) {
          updated.importance_factor = classification.importance_factor;
          updated.risk_category = updates.building_classification;
        }
      }
      
      return updated;
    });
  };

  const resetToDefaults = () => {
    setSelectedRequirements(defaultRequirements);
  };

  const validateRequirements = (requirements: PartialASCERequirements): ValidationResult => {
    const errors: string[] = [];
    
    if (!requirements.version) errors.push('ASCE version is required');
    if (!requirements.exposure_category) errors.push('Exposure category is required');
    if (!requirements.building_classification) errors.push('Building classification is required');
    if (!requirements.wind_speed || requirements.wind_speed < 85) errors.push('Valid wind speed is required (minimum 85 mph)');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const getImportanceFactorForClass = (buildingClass: string): number => {
    const classification = config.buildingClassifications.find(c => c.class === buildingClass);
    return classification?.importance_factor || 1.0;
  };

  const isHVHZLocation = (state?: string, county?: string): boolean => {
    if (!state) return false;
    
    const hvhzStates = ['FL', 'TX', 'LA', 'MS', 'AL', 'GA', 'SC', 'NC', 'VA'];
    const hvhzCounties = ['Miami-Dade', 'Broward', 'Palm Beach', 'Monroe'];
    
    if (state === 'FL' && county && hvhzCounties.some(hc => county.toLowerCase().includes(hc.toLowerCase()))) {
      return true;
    }
    
    return hvhzStates.includes(state.toUpperCase());
  };

  const getRecommendedASCEVersion = (location?: { state?: string; city?: string }): string => {
    // For newer jurisdictions, recommend ASCE 7-22
    if (location?.state && ['FL', 'TX', 'CA'].includes(location.state.toUpperCase())) {
      return 'ASCE 7-22';
    }
    return 'ASCE 7-16'; // Default recommendation
  };

  const requiresEngineerApproval = (requirements?: PartialASCERequirements): boolean => {
    if (!requirements) return false;
    
    // Require approval for high wind speeds or special conditions
    if (requirements.wind_speed && requirements.wind_speed > 150) return true;
    if (requirements.building_classification === 'IV') return true;
    if (requirements.hvhz_applicable) return true;
    
    return false;
  };

  return {
    config,
    selectedRequirements,
    updateRequirements,
    resetToDefaults,
    validateRequirements,
    getImportanceFactorForClass,
    isHVHZLocation,
    getRecommendedASCEVersion,
    requiresEngineerApproval,
  };
}

// Utility function to format ASCE requirements for display
export const formatASCERequirements = (requirements: PartialASCERequirements): string => {
  const parts = [];
  
  if (requirements.version) parts.push(requirements.version);
  if (requirements.exposure_category) parts.push(`Exp ${requirements.exposure_category}`);
  if (requirements.building_classification) parts.push(`Class ${requirements.building_classification}`);
  if (requirements.wind_speed) parts.push(`${requirements.wind_speed} mph`);
  
  return parts.join(', ') || 'No requirements configured';
};

export type { ASCERequirements };

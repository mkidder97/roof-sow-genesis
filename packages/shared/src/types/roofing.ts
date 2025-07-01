// Roofing-specific Types - Shared between frontend and backend

export type MembraneType = 'TPO' | 'EPDM' | 'PVC' | 'Modified Bitumen' | 'Built-Up' | 'Metal';
export type InsulationType = 'Polyiso' | 'EPS' | 'XPS' | 'Mineral Wool' | 'Perlite';
export type DeckType = 'Steel' | 'Concrete' | 'Wood' | 'Gypsum' | 'Lightweight Concrete';
export type ProjectType = 'Tearoff' | 'Recover' | 'New Construction' | 'Repair';
export type AttachmentMethod = 'Mechanically Attached' | 'Fully Adhered' | 'Ballasted' | 'Hybrid';

export interface RoofingMaterial {
  id: string;
  name: string;
  type: MembraneType | InsulationType | 'Accessory' | 'Flashing';
  manufacturer: string;
  thickness?: string;
  color?: string;
  rValue?: number;
  warranty?: number;
  cost?: number;
  coverage?: number;
  specifications: Record<string, any>;
}

export interface RoofSystem {
  id: string;
  name: string;
  description: string;
  membrane: RoofingMaterial;
  insulation?: RoofingMaterial[];
  coverBoard?: RoofingMaterial;
  attachmentMethod: AttachmentMethod;
  windUpliftRating: number;
  firRating?: string;
  warrantyTerm: number;
  manufacturer: string;
  approvals: string[];
  applicableStandards: string[];
}

export interface ManufacturerSystem {
  manufacturer: string;
  system: string;
  approvals: string[];
  windUpliftRating: number;
  components: RoofingMaterial[];
  specifications: Record<string, any>;
  liveDataSources?: string[];
  dataSource?: string;
  lastUpdated?: string;
}

export interface RoofingSpecification {
  projectType: ProjectType;
  deckType: DeckType;
  membraneType: MembraneType;
  insulationType?: InsulationType;
  attachmentMethod: AttachmentMethod;
  windUpliftRequirement: number;
  firRatingRequirement?: string;
  specialRequirements: string[];
  environmentalFactors: {
    hvhz: boolean;
    seismicZone?: string;
    freezeThaw: boolean;
    chemicalExposure: boolean;
  };
}

export interface RoofComponent {
  id: string;
  type: 'Drain' | 'Penetration' | 'HVAC' | 'Skylight' | 'Hatch' | 'Curb' | 'Flashing';
  quantity: number;
  specifications: Record<string, any>;
  material?: string;
  size?: string;
  location?: string;
  condition?: string;
  installationRequirements: string[];
  flashingRequirements?: string[];
}

export interface QualityAssurance {
  inspectionPoints: string[];
  testingRequirements: string[];
  documentation: string[];
  warrantyRequirements: string[];
  certificationNeeded: boolean;
}

export interface InstallationRequirements {
  weatherLimitations: {
    minTemperature: number;
    maxTemperature: number;
    maxWindSpeed: number;
    precipitationAllowed: boolean;
  };
  surfacePreparation: string[];
  toolsRequired: string[];
  laborRequirements: {
    certificationRequired: boolean;
    minimumExperience: string;
    trainingRequired: string[];
  };
  safetyRequirements: string[];
  qualityControl: QualityAssurance;
}

// Utility functions for roofing calculations
export function calculateWindUpliftRequirement(
  windSpeed: number,
  exposureCategory: string,
  buildingHeight: number
): number {
  // Simplified wind uplift calculation - actual implementation would be more complex
  const baseUplift = Math.pow(windSpeed / 100, 2) * 15;
  const exposureMultiplier = exposureCategory === 'D' ? 1.3 : exposureCategory === 'C' ? 1.0 : 0.8;
  const heightMultiplier = Math.min(1 + (buildingHeight - 30) / 100, 1.5);
  
  return Math.round(baseUplift * exposureMultiplier * heightMultiplier);
}

export function selectRoofingSystem(
  specification: RoofingSpecification,
  availableSystems: RoofSystem[]
): RoofSystem[] {
  return availableSystems.filter(system => {
    // Filter by membrane type
    if (system.membrane.type !== specification.membraneType) {
      return false;
    }
    
    // Filter by wind uplift requirement
    if (system.windUpliftRating < specification.windUpliftRequirement) {
      return false;
    }
    
    // Filter by attachment method
    if (system.attachmentMethod !== specification.attachmentMethod) {
      return false;
    }
    
    // Filter by fire rating if required
    if (specification.firRatingRequirement && 
        system.firRating !== specification.firRatingRequirement) {
      return false;
    }
    
    return true;
  }).sort((a, b) => b.windUpliftRating - a.windUpliftRating);
}
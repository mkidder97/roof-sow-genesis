// Enhanced Wind Pressure Integration with Zone Calculations
import { calculateWindPressures, WindPressureInputs } from './wind-pressure';
import { ProjectInputs } from './section-selector';

export interface ZoneDimensions {
  building: {
    length: number;
    width: number;
    area: number;
  };
  zones: {
    zone1Field: {
      area: number;
      percentage: number;
    };
    zone2Perimeter: {
      area: number;
      percentage: number;
      width: number; // Perimeter zone width
    };
    zone3Corner: {
      area: number;
      percentage: number;
      dimension: number; // Corner zone dimension
    };
  };
}

export interface CompleteWindAnalysis {
  pressures: {
    zone1Field: number;
    zone2Perimeter: number;
    zone3Corner: number;
  };
  zoneDimensions: ZoneDimensions;
  metadata: {
    asceVersion: string;
    codeCycle: string;
    hvhz: boolean;
    jurisdiction: string;
    basicWindSpeed: number;
    exposureCategory: string;
    buildingClassification: string;
    riskCategory: string;
  };
  recommendations: {
    fasteningZones: {
      zone1: string;
      zone2: string;
      zone3: string;
    };
    specialRequirements: string[];
    engineeringNotes: string[];
  };
}

export class WindEngineeringIntegrator {
  
  /**
   * Performs complete wind analysis including pressures and zone calculations
   */
  performCompleteAnalysis(inputs: ProjectInputs): CompleteWindAnalysis {
    console.log(`🌪️ Performing complete wind analysis for ${inputs.address}`);
    
    // Step 1: Calculate wind pressures
    const windInputs: WindPressureInputs = {
      buildingHeight: inputs.building_height,
      exposureCategory: this.determineExposureCategory(inputs),
      roofSlope: inputs.roof_slope || 0,
      elevation: inputs.elevation || 0,
      county: inputs.county,
      state: inputs.state,
      basicWindSpeed: undefined // Let system determine from jurisdiction
    };
    
    const windResult = calculateWindPressures(windInputs);
    
    // Step 2: Calculate zone dimensions
    const zoneDimensions = this.calculateZoneDimensions(
      inputs.square_footage,
      inputs.building_height,
      windResult.metadata.asceVersion
    );
    
    // Step 3: Generate recommendations
    const recommendations = this.generateRecommendations(
      windResult,
      zoneDimensions,
      inputs
    );
    
    return {
      pressures: windResult.windUpliftPressures,
      zoneDimensions,
      metadata: {
        ...windResult.metadata,
        buildingClassification: this.determineBuildingClassification(inputs),
        riskCategory: this.determineRiskCategory(inputs)
      },
      recommendations
    };
  }
  
  /**
   * Calculates zone dimensions per ASCE 7 requirements
   */
  private calculateZoneDimensions(
    squareFootage: number,
    buildingHeight: number,
    asceVersion: string
  ): ZoneDimensions {
    
    // Estimate building dimensions from square footage
    // Assume roughly square building for calculation purposes
    const estimatedSideLength = Math.sqrt(squareFootage);
    const length = estimatedSideLength * 1.2; // Slightly rectangular
    const width = squareFootage / length;
    
    console.log(`📐 Calculating zones for ${length.toFixed(0)}' x ${width.toFixed(0)}' building`);
    
    // Calculate zone dimensions per ASCE 7
    const zoneDimensions = this.calculateASCEZones(length, width, buildingHeight, asceVersion);
    
    return {
      building: {
        length: Math.round(length),
        width: Math.round(width),
        area: squareFootage
      },
      zones: zoneDimensions
    };
  }
  
  /**
   * Calculates ASCE 7 zone dimensions
   */
  private calculateASCEZones(
    length: number,
    width: number,
    height: number,
    asceVersion: string
  ) {
    const buildingArea = length * width;
    
    // Zone 3 (Corner) dimension = min(0.1*building dimension, 0.4*height, 3 ft)
    const cornerDimension = Math.max(
      3,
      Math.min(
        0.1 * Math.min(length, width),
        0.4 * height,
        40 // Maximum 40 ft for most buildings
      )
    );
    
    // Zone 2 (Perimeter) width = min(0.2*building dimension, 0.8*height, 6 ft)
    const perimeterWidth = Math.max(
      6,
      Math.min(
        0.2 * Math.min(length, width),
        0.8 * height,
        50 // Maximum 50 ft for most buildings
      )
    );
    
    // Calculate areas
    const zone3Area = 4 * cornerDimension * cornerDimension;
    
    const zone2Area = 
      2 * (length - 2 * cornerDimension) * perimeterWidth +
      2 * (width - 2 * cornerDimension) * perimeterWidth;
    
    const zone1Area = buildingArea - zone2Area - zone3Area;
    
    console.log(`📊 Zone areas: Z1=${Math.round(zone1Area).toLocaleString()} sf, Z2=${Math.round(zone2Area).toLocaleString()} sf, Z3=${Math.round(zone3Area).toLocaleString()} sf`);
    
    return {
      zone1Field: {
        area: Math.round(zone1Area),
        percentage: Math.round((zone1Area / buildingArea) * 100)
      },
      zone2Perimeter: {
        area: Math.round(zone2Area),
        percentage: Math.round((zone2Area / buildingArea) * 100),
        width: Math.round(perimeterWidth)
      },
      zone3Corner: {
        area: Math.round(zone3Area),
        percentage: Math.round((zone3Area / buildingArea) * 100),
        dimension: Math.round(cornerDimension)
      }
    };
  }
  
  /**
   * Determines exposure category based on project location
   */
  private determineExposureCategory(inputs: ProjectInputs): 'B' | 'C' | 'D' {
    const address = inputs.address.toLowerCase();
    const state = inputs.state.toUpperCase();
    
    // Coastal states - check for coastal exposure
    const coastalStates = ['FL', 'CA', 'TX', 'NY', 'NC', 'SC', 'GA', 'VA', 'MD', 'DE', 'NJ', 'CT', 'RI', 'MA', 'NH', 'ME'];
    
    if (coastalStates.includes(state)) {
      // Check if address indicates coastal location
      const coastalKeywords = ['beach', 'coast', 'ocean', 'gulf', 'bay', 'harbor', 'marina', 'waterfront'];
      if (coastalKeywords.some(keyword => address.includes(keyword))) {
        return 'D'; // Coastal exposure
      }
    }
    
    // Urban areas - check for urban keywords
    const urbanKeywords = ['downtown', 'city', 'metro', 'urban', 'plaza', 'avenue', 'boulevard'];
    if (urbanKeywords.some(keyword => address.includes(keyword))) {
      return 'B'; // Urban exposure
    }
    
    // Default to suburban/open terrain
    return 'C';
  }
  
  /**
   * Determines building classification for design
   */
  private determineBuildingClassification(inputs: ProjectInputs): string {
    // Based on building use and characteristics
    if (inputs.square_footage > 100000) {
      return 'Large Commercial';
    } else if (inputs.square_footage > 50000) {
      return 'Medium Commercial';
    } else {
      return 'Small Commercial';
    }
  }
  
  /**
   * Determines risk category per ASCE 7
   */
  private determineRiskCategory(inputs: ProjectInputs): string {
    // Most commercial buildings are Risk Category II
    // This could be enhanced with building use data
    return 'II';
  }
  
  /**
   * Generates engineering recommendations
   */
  private generateRecommendations(
    windResult: any,
    zoneDimensions: ZoneDimensions,
    inputs: ProjectInputs
  ) {
    const pressures = windResult.windUpliftPressures;
    const maxPressure = Math.abs(pressures.zone3Corner);
    
    // Fastening zone recommendations
    const fasteningZones = {
      zone1: this.getFasteningRecommendation(Math.abs(pressures.zone1Field), inputs.deck_type),
      zone2: this.getFasteningRecommendation(Math.abs(pressures.zone2Perimeter), inputs.deck_type),
      zone3: this.getFasteningRecommendation(Math.abs(pressures.zone3Corner), inputs.deck_type)
    };
    
    // Special requirements
    const specialRequirements: string[] = [];
    const engineeringNotes: string[] = [];
    
    if (windResult.metadata.hvhz) {
      specialRequirements.push('High Velocity Hurricane Zone (HVHZ) requirements apply');
      specialRequirements.push('NOA (Notice of Acceptance) required for roofing system');
      specialRequirements.push('Enhanced inspection and testing required');
    }
    
    if (maxPressure > 60) {
      specialRequirements.push('High wind pressure design - enhanced fastening required');
      engineeringNotes.push('Consider field testing for fastener pull-out verification');
    }
    
    if (inputs.building_height > 60) {
      specialRequirements.push('Mid-rise building - enhanced wind analysis required');
      engineeringNotes.push('Consider wind tunnel testing or detailed CFD analysis');
    }
    
    if (zoneDimensions.zones.zone3Corner.percentage > 25) {
      engineeringNotes.push('Large corner zone percentage - verify calculations');
    }
    
    engineeringNotes.push(
      `Zone dimensions: Corner=${zoneDimensions.zones.zone3Corner.dimension}', Perimeter=${zoneDimensions.zones.zone2Perimeter.width}'`
    );
    
    return {
      fasteningZones,
      specialRequirements,
      engineeringNotes
    };
  }
  
  /**
   * Gets fastening recommendation based on pressure and deck type
   */
  private getFasteningRecommendation(pressure: number, deckType: string): string {
    const deck = deckType.toLowerCase();
    
    if (deck.includes('steel')) {
      if (pressure > 60) return 'Enhanced pattern with 2" o.c. spacing';
      if (pressure > 40) return 'Standard pattern with 3" o.c. spacing';
      if (pressure > 25) return 'Standard pattern with 4" o.c. spacing';
      return 'Standard pattern with 6" o.c. spacing';
    } else if (deck.includes('gypsum')) {
      return 'Fully adhered system required';
    } else if (deck.includes('concrete')) {
      if (pressure > 50) return 'Enhanced concrete fastener pattern';
      if (pressure > 30) return 'Standard concrete fastener pattern';
      return 'Minimum concrete fastener pattern';
    }
    
    return 'Pattern to be determined by manufacturer';
  }
}

/**
 * Validates wind analysis results
 */
export function validateWindAnalysis(analysis: CompleteWindAnalysis): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Validate pressures
  const maxPressure = Math.abs(analysis.pressures.zone3Corner);
  if (maxPressure > 150) {
    warnings.push(`Extremely high wind pressure: ${maxPressure.toFixed(1)} psf - verify calculations`);
  }
  
  if (maxPressure < 10) {
    errors.push(`Unreasonably low wind pressure: ${maxPressure.toFixed(1)} psf`);
  }
  
  // Validate zone dimensions
  const totalZoneArea = 
    analysis.zoneDimensions.zones.zone1Field.area +
    analysis.zoneDimensions.zones.zone2Perimeter.area +
    analysis.zoneDimensions.zones.zone3Corner.area;
    
  const buildingArea = analysis.zoneDimensions.building.area;
  
  if (Math.abs(totalZoneArea - buildingArea) > buildingArea * 0.05) {
    errors.push('Zone area calculation error - total zones do not match building area');
  }
  
  // Validate zone percentages
  if (analysis.zoneDimensions.zones.zone1Field.percentage < 30) {
    warnings.push('Very small field zone - building may be too small for standard analysis');
  }
  
  if (analysis.zoneDimensions.zones.zone3Corner.percentage > 30) {
    warnings.push('Very large corner zones - verify building dimensions');
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}

// Factory function
export function createWindIntegrator(): WindEngineeringIntegrator {
  return new WindEngineeringIntegrator();
}
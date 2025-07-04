/**
 * ASCE 7-16/7-22 Compliant Wind Load Calculator
 * Implements precise wind pressure calculations for roofing systems
 */

export interface WindParameters {
  basicWindSpeed: number; // mph, 3-second gust
  exposureCategory: 'A' | 'B' | 'C' | 'D';
  buildingHeight: number; // feet
  buildingLength: number; // feet
  buildingWidth: number; // feet
  groundElevation?: number; // feet above sea level
  riskCategory: 'I' | 'II' | 'III' | 'IV';
  topographicEffects?: boolean;
  engineeringOverrides?: Record<string, any>;
}

export interface ZonePressures {
  field: number; // psf
  innerPerimeter: number; // psf
  outerPerimeter: number; // psf
  corner: number; // psf
}

export interface WindAnalysisResult {
  inputParameters: WindParameters;
  designWindSpeed: number; // mph
  velocityPressure: number; // psf
  zonePressures: ZonePressures;
  perimeterWidths: {
    innerPerimeter: number; // feet
    outerPerimeter: number; // feet
    corner: number; // feet
  };
  complianceFlags: {
    asceStandard: '7-16' | '7-22';
    hvhzCompliant: boolean;
    engineeringOverride: boolean;
  };
  calculationNotes: string[];
  metadata: {
    calculationDate: string;
    version: string;
    engineerId?: string;
  };
}

export class WindCalculator {
  private readonly version = "1.0.0";
  private readonly asceStandard = "7-22"; // Default to latest

  /**
   * Calculate comprehensive wind analysis per ASCE 7-22
   */
  async calculateWindLoads(params: WindParameters): Promise<WindAnalysisResult> {
    const notes: string[] = [];
    
    // Input validation
    this.validateInputs(params, notes);
    
    // Calculate design wind speed with all factors
    const designWindSpeed = this.calculateDesignWindSpeed(params, notes);
    
    // Calculate velocity pressure
    const velocityPressure = this.calculateVelocityPressure(designWindSpeed, params, notes);
    
    // Determine perimeter widths per ASCE 7-22 Figure 30.3-1
    const perimeterWidths = this.calculatePerimeterWidths(params, notes);
    
    // Calculate zone pressures
    const zonePressures = this.calculateZonePressures(velocityPressure, params, notes);
    
    // Check compliance flags
    const complianceFlags = this.checkCompliance(params, designWindSpeed, notes);
    
    return {
      inputParameters: params,
      designWindSpeed,
      velocityPressure,
      zonePressures,
      perimeterWidths,
      complianceFlags,
      calculationNotes: notes,
      metadata: {
        calculationDate: new Date().toISOString(),
        version: this.version,
        engineerId: params.engineeringOverrides?.engineerId
      }
    };
  }

  private validateInputs(params: WindParameters, notes: string[]): void {
    if (params.basicWindSpeed < 85 || params.basicWindSpeed > 200) {
      throw new Error(`Basic wind speed ${params.basicWindSpeed} mph is outside valid range (85-200 mph)`);
    }
    
    if (params.buildingHeight < 5 || params.buildingHeight > 500) {
      throw new Error(`Building height ${params.buildingHeight} ft is outside valid range (5-500 ft)`);
    }
    
    if (!['A', 'B', 'C', 'D'].includes(params.exposureCategory)) {
      throw new Error(`Invalid exposure category: ${params.exposureCategory}`);
    }
    
    if (!['I', 'II', 'III', 'IV'].includes(params.riskCategory)) {
      throw new Error(`Invalid risk category: ${params.riskCategory}`);
    }
    
    notes.push(`Input validation completed - Wind Speed: ${params.basicWindSpeed} mph, Exposure: ${params.exposureCategory}, Height: ${params.buildingHeight} ft`);
  }

  private calculateDesignWindSpeed(params: WindParameters, notes: string[]): number {
    // ASCE 7-22 Section 26.5: Basic wind speed is already ultimate (factored)
    let designWindSpeed = params.basicWindSpeed;
    
    // Apply risk category factor if needed (typically handled in basic wind speed maps)
    const importanceFactors = { 'I': 0.87, 'II': 1.00, 'III': 1.15, 'IV': 1.15 };
    const importanceFactor = importanceFactors[params.riskCategory];
    
    // For most applications, basic wind speed already includes importance factor
    // Apply only if specifically required by engineering override
    if (params.engineeringOverrides?.applyImportanceFactor) {
      designWindSpeed *= Math.sqrt(importanceFactor);
      notes.push(`Applied importance factor ${importanceFactor} for Risk Category ${params.riskCategory}`);
    }
    
    notes.push(`Design wind speed: ${designWindSpeed.toFixed(1)} mph`);
    return designWindSpeed;
  }

  private calculateVelocityPressure(windSpeed: number, params: WindParameters, notes: string[]): number {
    // ASCE 7-22 Equation 26.6-1: qz = 0.00256 * Kz * Kzt * Kd * V²
    
    // Velocity pressure exposure coefficient (Kz) - Table 26.10-1
    const Kz = this.getVelocityPressureCoefficient(params.exposureCategory, params.buildingHeight);
    
    // Topographic factor (Kzt) - Section 26.8
    const Kzt = params.topographicEffects ? 1.15 : 1.0;
    
    // Wind directionality factor (Kd) - Table 26.6-1 (MWFRS for buildings)
    const Kd = 0.85;
    
    const velocityPressure = 0.00256 * Kz * Kzt * Kd * Math.pow(windSpeed, 2);
    
    notes.push(`Velocity pressure calculation: qz = 0.00256 × ${Kz.toFixed(3)} × ${Kzt} × ${Kd} × ${windSpeed}² = ${velocityPressure.toFixed(2)} psf`);
    
    return velocityPressure;
  }

  private getVelocityPressureCoefficient(exposure: string, height: number): number {
    // ASCE 7-22 Table 26.10-1
    const coefficients: Record<string, (h: number) => number> = {
      'A': (h) => h <= 15 ? 0.32 : 0.32 * Math.pow(h / 15, 0.14),
      'B': (h) => h <= 30 ? 0.57 : 0.57 * Math.pow(h / 30, 0.20),
      'C': (h) => h <= 15 ? 0.85 : 0.85 * Math.pow(h / 15, 0.33),
      'D': (h) => h <= 15 ? 1.03 : 1.03 * Math.pow(h / 15, 0.45)
    };
    
    return coefficients[exposure](height);
  }

  private calculatePerimeterWidths(params: WindParameters, notes: string[]): { innerPerimeter: number; outerPerimeter: number; corner: number } {
    // ASCE 7-22 Figure 30.3-1: Perimeter widths based on building dimensions
    const width = Math.min(params.buildingWidth, params.buildingLength);
    const length = Math.max(params.buildingWidth, params.buildingLength);
    
    // Corner zone width: minimum of 10% of least dimension or 3 feet, but not more than 10 feet
    const corner = Math.max(3, Math.min(width * 0.1, 10));
    
    // Inner perimeter: 20% of least dimension but not less than 4% of least dimension or 3 feet
    const innerPerimeter = Math.max(3, Math.max(width * 0.04, width * 0.2));
    
    // Outer perimeter: extends to edge of roof
    const outerPerimeter = corner + innerPerimeter;
    
    notes.push(`Perimeter widths - Corner: ${corner.toFixed(1)} ft, Inner: ${innerPerimeter.toFixed(1)} ft, Outer: ${outerPerimeter.toFixed(1)} ft`);
    
    return { innerPerimeter, outerPerimeter, corner };
  }

  private calculateZonePressures(qz: number, params: WindParameters, notes: string[]): ZonePressures {
    // ASCE 7-22 Table 30.3-1: External pressure coefficients for roofs
    // Using Method 1 (Simplified) for typical low-rise buildings
    
    // Roof slope factor (assumed flat or low slope)
    const roofSlope = 0; // degrees, can be parameterized later
    
    // External pressure coefficients (GCp) for different zones
    const coefficients = {
      field: -0.9,        // Interior field zone
      innerPerimeter: -1.8, // Inner perimeter zone  
      outerPerimeter: -2.8, // Outer perimeter zone
      corner: -3.6        // Corner zone
    };
    
    // Apply engineering overrides if specified
    if (params.engineeringOverrides?.pressureCoefficients) {
      Object.assign(coefficients, params.engineeringOverrides.pressureCoefficients);
      notes.push('Applied engineering override for pressure coefficients');
    }
    
    const zonePressures: ZonePressures = {
      field: qz * coefficients.field,
      innerPerimeter: qz * coefficients.innerPerimeter,
      outerPerimeter: qz * coefficients.outerPerimeter,
      corner: qz * coefficients.corner
    };
    
    notes.push(`Zone pressures (psf) - Field: ${zonePressures.field.toFixed(1)}, Inner: ${zonePressures.innerPerimeter.toFixed(1)}, Outer: ${zonePressures.outerPerimeter.toFixed(1)}, Corner: ${zonePressures.corner.toFixed(1)}`);
    
    return zonePressures;
  }

  private checkCompliance(params: WindParameters, designWindSpeed: number, notes: string[]): { asceStandard: '7-16' | '7-22'; hvhzCompliant: boolean; engineeringOverride: boolean } {
    // Check HVHZ compliance (wind speeds > 150 mph typically require HVHZ)
    const hvhzCompliant = designWindSpeed <= 150 || !!params.engineeringOverrides?.hvhzApproved;
    
    // Flag engineering overrides
    const engineeringOverride = !!params.engineeringOverrides && Object.keys(params.engineeringOverrides).length > 0;
    
    if (hvhzCompliant && designWindSpeed > 150) {
      notes.push('HVHZ compliance achieved through engineering override');
    } else if (!hvhzCompliant) {
      notes.push('HVHZ compliance required - wind speed exceeds 150 mph');
    }
    
    if (engineeringOverride) {
      notes.push('Engineering overrides applied - requires professional review');
    }
    
    return {
      asceStandard: this.asceStandard as '7-16' | '7-22',
      hvhzCompliant,
      engineeringOverride
    };
  }
}

/**
 * Convenience function for direct wind calculation
 */
export async function calculateWindLoads(params: WindParameters): Promise<WindAnalysisResult> {
  const calculator = new WindCalculator();
  return calculator.calculateWindLoads(params);
}
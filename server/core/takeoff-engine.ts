// Takeoff Diagnostics Engine
// Analyzes takeoff quantities and flags potential issues and requirements

export interface TakeoffItems {
  drainCount: number;
  penetrationCount: number;
  flashingLinearFeet: number;
  accessoryCount: number;
  hvacUnits?: number;
  skylights?: number;
  roofHatches?: number;
  scuppers?: number;
  expansionJoints?: number;
  parapetHeight?: number;
  roofArea: number;
}

export interface TakeoffDiagnostics {
  highPenetrationDensity: boolean;
  drainOverflowRequired: boolean;
  linearFlashingExceedsTypical: boolean;
  excessiveAccessoryCount: boolean;
  inadequateDrainage: boolean;
  complexFlashingRequired: boolean;
  specialAttentionAreas: string[];
  recommendations: string[];
  warnings: string[];
  quantityFlags: {
    penetrationDensity: number; // per 1000 sq ft
    drainDensity: number; // per 1000 sq ft
    flashingRatio: number; // linear feet per sq ft
    accessoryRatio: number; // accessories per 1000 sq ft
  };
}

export interface TakeoffEngineInputs {
  takeoffItems: TakeoffItems;
  buildingDimensions?: {
    length: number;
    width: number;
  };
  projectType: 'recover' | 'tearoff' | 'new';
  membraneType?: string;
  hvhz?: boolean;
}

/**
 * Main takeoff diagnostics engine
 * Analyzes quantities and flags potential issues
 */
export function analyzeTakeoffDiagnostics(inputs: TakeoffEngineInputs): TakeoffDiagnostics {
  console.log('📋 Takeoff Diagnostics - Analyzing quantities...');
  
  const { takeoffItems } = inputs;
  const roofAreaInThousands = takeoffItems.roofArea / 1000;
  
  // Calculate density metrics
  const penetrationDensity = takeoffItems.penetrationCount / roofAreaInThousands;
  const drainDensity = takeoffItems.drainCount / roofAreaInThousands;
  const flashingRatio = takeoffItems.flashingLinearFeet / takeoffItems.roofArea;
  const accessoryRatio = takeoffItems.accessoryCount / roofAreaInThousands;
  
  console.log(`📊 Densities: Penetrations=${penetrationDensity.toFixed(1)}/1000sf, Drains=${drainDensity.toFixed(1)}/1000sf`);
  
  const specialAttentionAreas: string[] = [];
  const recommendations: string[] = [];
  const warnings: string[] = [];
  
  // Analyze high penetration density
  const highPenetrationDensity = penetrationDensity > 20;
  if (highPenetrationDensity) {
    specialAttentionAreas.push('High penetration density areas');
    recommendations.push('Consider additional detailing around penetration clusters');
    warnings.push(`High penetration density: ${penetrationDensity.toFixed(1)} per 1000 sq ft (>20 threshold)`);
  }
  
  // Analyze drainage adequacy
  const drainOverflowRequired = analyzeDrainageRequirements(takeoffItems, inputs);
  if (drainOverflowRequired) {
    specialAttentionAreas.push('Secondary drainage systems');
    recommendations.push('Verify overflow drainage provisions per building code');
  }
  
  // Analyze flashing requirements
  const linearFlashingExceedsTypical = analyzeFlashingRequirements(takeoffItems, inputs);
  if (linearFlashingExceedsTypical) {
    specialAttentionAreas.push('Extensive flashing work');
    recommendations.push('Plan for additional flashing materials and labor');
    warnings.push(`Flashing ratio ${flashingRatio.toFixed(3)} exceeds typical 0.05 ratio`);
  }
  
  // Analyze accessory count
  const excessiveAccessoryCount = accessoryRatio > 15;
  if (excessiveAccessoryCount) {
    specialAttentionAreas.push('Multiple roof accessories');
    recommendations.push('Coordinate accessory installation sequence');
    warnings.push(`High accessory count: ${accessoryRatio.toFixed(1)} per 1000 sq ft`);
  }
  
  // Analyze inadequate drainage
  const inadequateDrainage = drainDensity < 0.8; // Less than 0.8 drains per 1000 sq ft
  if (inadequateDrainage) {
    warnings.push('Potentially inadequate drainage density');
    recommendations.push('Verify drainage capacity calculations');
  }
  
  // Analyze complex flashing requirements
  const complexFlashingRequired = analyzeFlashingComplexity(takeoffItems, inputs);
  if (complexFlashingRequired) {
    specialAttentionAreas.push('Complex flashing details');
    recommendations.push('Plan for skilled flashing technicians');
  }
  
  // Generate additional recommendations based on project type
  generateProjectTypeRecommendations(inputs, recommendations, warnings);
  
  // Generate HVHZ-specific recommendations
  if (inputs.hvhz) {
    generateHVHZRecommendations(takeoffItems, recommendations, warnings);
  }
  
  const diagnostics: TakeoffDiagnostics = {
    highPenetrationDensity,
    drainOverflowRequired,
    linearFlashingExceedsTypical,
    excessiveAccessoryCount,
    inadequateDrainage,
    complexFlashingRequired,
    specialAttentionAreas,
    recommendations,
    warnings,
    quantityFlags: {
      penetrationDensity,
      drainDensity,
      flashingRatio,
      accessoryRatio
    }
  };
  
  console.log(`✅ Diagnostics complete: ${specialAttentionAreas.length} special attention areas identified`);
  
  return diagnostics;
}

/**
 * Analyze drainage requirements
 */
function analyzeDrainageRequirements(takeoffItems: TakeoffItems, inputs: TakeoffEngineInputs): boolean {
  const roofAreaInThousands = takeoffItems.roofArea / 1000;
  const drainDensity = takeoffItems.drainCount / roofAreaInThousands;
  
  // Building code typically requires 1 drain per 10,000 sq ft minimum
  const minimumDrains = Math.ceil(takeoffItems.roofArea / 10000);
  
  // Check if we have adequate primary drainage
  if (takeoffItems.drainCount < minimumDrains) {
    return true; // Overflow drains likely required
  }
  
  // Large roofs typically require overflow drainage
  if (takeoffItems.roofArea > 50000) {
    return true;
  }
  
  // Complex roof shapes may require additional drainage
  if (takeoffItems.expansionJoints && takeoffItems.expansionJoints > 2) {
    return true;
  }
  
  return false;
}

/**
 * Analyze flashing requirements
 */
function analyzeFlashingRequirements(takeoffItems: TakeoffItems, inputs: TakeoffEngineInputs): boolean {
  const flashingRatio = takeoffItems.flashingLinearFeet / takeoffItems.roofArea;
  
  // Typical flashing ratio is 0.03-0.05 linear feet per square foot
  // This accounts for perimeter, penetrations, and equipment
  const typicalFlashingRatio = 0.05;
  
  if (flashingRatio > typicalFlashingRatio * 1.5) {
    return true; // Exceeds typical by 50%
  }
  
  // High penetration count suggests complex flashing
  const penetrationDensity = takeoffItems.penetrationCount / (takeoffItems.roofArea / 1000);
  if (penetrationDensity > 15) {
    return true;
  }
  
  return false;
}

/**
 * Analyze flashing complexity
 */
function analyzeFlashingComplexity(takeoffItems: TakeoffItems, inputs: TakeoffEngineInputs): boolean {
  let complexityScore = 0;
  
  // High HVAC unit count increases complexity
  if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 5) {
    complexityScore += 2;
  }
  
  // Multiple skylights add complexity
  if (takeoffItems.skylights && takeoffItems.skylights > 3) {
    complexityScore += 2;
  }
  
  // Expansion joints are complex details
  if (takeoffItems.expansionJoints && takeoffItems.expansionJoints > 0) {
    complexityScore += 3;
  }
  
  // High parapets require more complex flashing
  if (takeoffItems.parapetHeight && takeoffItems.parapetHeight > 24) {
    complexityScore += 2;
  }
  
  // Scuppers add drainage complexity
  if (takeoffItems.scuppers && takeoffItems.scuppers > 2) {
    complexityScore += 1;
  }
  
  // High overall penetration count
  const penetrationDensity = takeoffItems.penetrationCount / (takeoffItems.roofArea / 1000);
  if (penetrationDensity > 25) {
    complexityScore += 3;
  }
  
  return complexityScore >= 5; // Threshold for complex flashing
}

/**
 * Generate project type specific recommendations
 */
function generateProjectTypeRecommendations(
  inputs: TakeoffEngineInputs,
  recommendations: string[],
  warnings: string[]
): void {
  const { projectType, takeoffItems } = inputs;
  
  switch (projectType) {
    case 'tearoff':
      recommendations.push('Plan for complete removal and disposal of existing materials');
      if (takeoffItems.penetrationCount > 20) {
        recommendations.push('Coordinate with trades for penetration re-work during tearoff');
      }
      if (takeoffItems.accessoryCount > 10) {
        warnings.push('Multiple accessories require careful removal and replacement sequencing');
      }
      break;
      
    case 'recover':
      recommendations.push('Verify existing roof condition and compatibility');
      if (takeoffItems.drainCount > 0) {
        recommendations.push('Assess existing drain compatibility with recover system');
      }
      if (takeoffItems.penetrationCount > 15) {
        warnings.push('High penetration count may complicate recover installation');
      }
      break;
      
    case 'new':
      recommendations.push('Coordinate new roof installation with building completion');
      if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 0) {
        recommendations.push('Plan HVAC equipment installation sequence with roofing');
      }
      break;
  }
}

/**
 * Generate HVHZ specific recommendations
 */
function generateHVHZRecommendations(
  takeoffItems: TakeoffItems,
  recommendations: string[],
  warnings: string[]
): void {
  recommendations.push('HVHZ installation procedures required for all components');
  recommendations.push('Special inspector oversight required');
  
  if (takeoffItems.penetrationCount > 10) {
    warnings.push('Multiple penetrations in HVHZ require enhanced detailing');
    recommendations.push('Use NOA-approved penetration flashing systems');
  }
  
  if (takeoffItems.skylights && takeoffItems.skylights > 0) {
    recommendations.push('Verify skylight impact resistance and NOA approval');
  }
  
  if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 0) {
    recommendations.push('HVAC equipment must meet HVHZ wind resistance requirements');
  }
  
  recommendations.push('All fasteners and plates must have NOA approval');
  recommendations.push('Enhanced quality control procedures required');
}

/**
 * Generate takeoff summary for reporting
 */
export function generateTakeoffSummary(diagnostics: TakeoffDiagnostics): {
  overallRisk: 'Low' | 'Medium' | 'High';
  keyIssues: string[];
  priorityRecommendations: string[];
  quantitySummary: string;
} {
  // Calculate overall risk based on flags
  let riskScore = 0;
  
  if (diagnostics.highPenetrationDensity) riskScore += 2;
  if (diagnostics.drainOverflowRequired) riskScore += 1;
  if (diagnostics.linearFlashingExceedsTypical) riskScore += 2;
  if (diagnostics.excessiveAccessoryCount) riskScore += 1;
  if (diagnostics.inadequateDrainage) riskScore += 2;
  if (diagnostics.complexFlashingRequired) riskScore += 2;
  
  const overallRisk = riskScore >= 6 ? 'High' : riskScore >= 3 ? 'Medium' : 'Low';
  
  // Identify key issues
  const keyIssues: string[] = [];
  if (diagnostics.highPenetrationDensity) keyIssues.push('High penetration density');
  if (diagnostics.inadequateDrainage) keyIssues.push('Inadequate drainage');
  if (diagnostics.complexFlashingRequired) keyIssues.push('Complex flashing requirements');
  if (diagnostics.linearFlashingExceedsTypical) keyIssues.push('Extensive flashing work');
  
  // Priority recommendations (first 3)
  const priorityRecommendations = diagnostics.recommendations.slice(0, 3);
  
  // Quantity summary
  const flags = diagnostics.quantityFlags;
  const quantitySummary = `Penetrations: ${flags.penetrationDensity.toFixed(1)}/1000sf, ` +
                         `Drains: ${flags.drainDensity.toFixed(1)}/1000sf, ` +
                         `Flashing ratio: ${flags.flashingRatio.toFixed(3)}`;
  
  return {
    overallRisk,
    keyIssues: keyIssues.length > 0 ? keyIssues : ['No significant issues identified'],
    priorityRecommendations,
    quantitySummary
  };
}

/**
 * Check for specific takeoff conditions
 */
export function checkTakeoffConditions(takeoffItems: TakeoffItems): {
  isLargeProject: boolean;
  isComplexProject: boolean;
  hasHeavyEquipment: boolean;
  requiresSpecialAccess: boolean;
} {
  const roofAreaInThousands = takeoffItems.roofArea / 1000;
  
  return {
    isLargeProject: takeoffItems.roofArea > 100000, // > 100,000 sq ft
    isComplexProject: (takeoffItems.penetrationCount / roofAreaInThousands) > 20 || 
                     (takeoffItems.expansionJoints || 0) > 2,
    hasHeavyEquipment: (takeoffItems.hvacUnits || 0) > 5,
    requiresSpecialAccess: (takeoffItems.skylights || 0) > 5 || 
                          (takeoffItems.roofHatches || 0) > 3
  };
}

/**
 * Estimate material waste factors based on takeoff complexity
 */
export function calculateWasteFactors(diagnostics: TakeoffDiagnostics): {
  membraneWaste: number; // percentage
  flashingWaste: number; // percentage
  fastenerWaste: number; // percentage
  reasoning: string[];
} {
  let membraneWaste = 5; // Base 5% waste
  let flashingWaste = 10; // Base 10% waste
  let fastenerWaste = 3; // Base 3% waste
  
  const reasoning: string[] = [];
  
  // Increase waste for high penetration density
  if (diagnostics.highPenetrationDensity) {
    membraneWaste += 3;
    flashingWaste += 5;
    fastenerWaste += 2;
    reasoning.push('High penetration density increases cutting waste');
  }
  
  // Increase waste for complex flashing
  if (diagnostics.complexFlashingRequired) {
    flashingWaste += 8;
    reasoning.push('Complex flashing details require additional material');
  }
  
  // Increase waste for excessive accessories
  if (diagnostics.excessiveAccessoryCount) {
    membraneWaste += 2;
    fastenerWaste += 1;
    reasoning.push('Multiple accessories increase installation complexity');
  }
  
  // Cap maximum waste percentages
  membraneWaste = Math.min(membraneWaste, 15);
  flashingWaste = Math.min(flashingWaste, 25);
  fastenerWaste = Math.min(fastenerWaste, 8);
  
  return {
    membraneWaste,
    flashingWaste,
    fastenerWaste,
    reasoning
  };
}

/**
 * Validate takeoff engine inputs
 */
export function validateTakeoffInputs(inputs: TakeoffEngineInputs): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const { takeoffItems } = inputs;
  
  // Required fields
  if (!takeoffItems) {
    errors.push('Takeoff items are required');
    return { valid: false, errors, warnings };
  }
  
  if (typeof takeoffItems.roofArea !== 'number' || takeoffItems.roofArea <= 0) {
    errors.push('Valid roof area is required');
  }
  
  if (typeof takeoffItems.drainCount !== 'number' || takeoffItems.drainCount < 0) {
    errors.push('Valid drain count is required');
  }
  
  if (typeof takeoffItems.penetrationCount !== 'number' || takeoffItems.penetrationCount < 0) {
    errors.push('Valid penetration count is required');
  }
  
  if (typeof takeoffItems.flashingLinearFeet !== 'number' || takeoffItems.flashingLinearFeet < 0) {
    errors.push('Valid flashing linear feet is required');
  }
  
  // Warnings for unusual values
  if (takeoffItems.roofArea > 500000) {
    warnings.push('Very large roof area - verify accuracy');
  }
  
  if (takeoffItems.drainCount === 0 && takeoffItems.roofArea > 1000) {
    warnings.push('No drains specified for significant roof area');
  }
  
  const penetrationDensity = takeoffItems.penetrationCount / (takeoffItems.roofArea / 1000);
  if (penetrationDensity > 50) {
    warnings.push('Extremely high penetration density - verify count');
  }
  
  const flashingRatio = takeoffItems.flashingLinearFeet / takeoffItems.roofArea;
  if (flashingRatio > 0.1) {
    warnings.push('Very high flashing ratio - verify quantities');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Manufacturer Analysis Engine for Live Fastening Pattern Selection
import manufacturerPatterns from '../data/manufacturer-patterns.json';
import { WindUpliftPressures } from './wind-pressure';

export interface ManufacturerSelectionInputs {
  selectedMembraneBrand?: string;
  membraneType: 'TPO' | 'PVC' | 'EPDM';
  windUpliftPressures: WindUpliftPressures;
  deckType: string;
  projectType: string;
  hvhz: boolean;
  jurisdiction: string;
}

export interface FasteningSpecifications {
  fieldSpacing: string;
  perimeterSpacing: string;
  cornerSpacing: string;
  penetrationDepth: string;
}

export interface ManufacturerAnalysisResult {
  selectedPattern: string;
  manufacturer: string;
  system: string;
  fasteningSpecifications: FasteningSpecifications;
  approvals: string[];
  hasApprovals: boolean;
  metadata: {
    pressureCapacity: {
      zone1Field: number;
      zone1Perimeter: number;
      zone2Perimeter: number;
      zone3Corner: number;
    };
    rejectedPatterns: Array<{
      pattern: string;
      reason: string;
    }>;
    selectionRationale: string;
  };
}

export function selectManufacturerPattern(inputs: ManufacturerSelectionInputs): ManufacturerAnalysisResult {
  console.log(`🏭 Selecting manufacturer pattern for ${inputs.membraneType} ${inputs.projectType}`);
  console.log(`💨 Max pressure: ${Math.abs(inputs.windUpliftPressures.zone3Corner).toFixed(1)} psf, HVHZ: ${inputs.hvhz}`);
  
  // Step 1: Filter compatible patterns by membrane type
  const compatiblePatterns = getCompatiblePatterns(inputs.membraneType);
  console.log(`📋 Found ${compatiblePatterns.length} compatible patterns for ${inputs.membraneType}`);
  
  // Step 2: Filter by project requirements
  const suitablePatterns = filterByRequirements(compatiblePatterns, inputs);
  console.log(`✅ ${suitablePatterns.length} patterns meet project requirements`);
  
  // Step 3: Filter by pressure capacity
  const adequatePatterns = filterByPressureCapacity(suitablePatterns, inputs.windUpliftPressures);
  console.log(`🎯 ${adequatePatterns.length} patterns meet pressure requirements`);
  
  // Step 4: Select best pattern based on priority
  const selectedPattern = selectBestPattern(adequatePatterns, inputs);
  
  if (!selectedPattern) {
    console.warn('⚠️ No suitable pattern found, using fallback');
    return createFallbackPattern(inputs);
  }
  
  console.log(`🏆 Selected: ${selectedPattern.patternId} - ${selectedPattern.pattern.manufacturer} ${selectedPattern.pattern.system}`);
  
  // Step 5: Generate selection metadata
  const rejectedPatterns = generateRejectionReasons(compatiblePatterns, selectedPattern.patternId, inputs);
  const selectionRationale = generateSelectionRationale(selectedPattern.pattern, inputs);
  
  return {
    selectedPattern: selectedPattern.patternId,
    manufacturer: selectedPattern.pattern.manufacturer,
    system: selectedPattern.pattern.system,
    fasteningSpecifications: selectedPattern.pattern.fasteningSpecifications,
    approvals: selectedPattern.pattern.approvals,
    hasApprovals: hasRequiredApprovals(selectedPattern.pattern, inputs.hvhz),
    metadata: {
      pressureCapacity: selectedPattern.pattern.pressureThresholds,
      rejectedPatterns,
      selectionRationale
    }
  };
}

function getCompatiblePatterns(membraneType: 'TPO' | 'PVC' | 'EPDM') {
  const compatiblePatternIds = manufacturerPatterns.membraneCompatibility[membraneType]?.compatible_patterns || [];
  
  return compatiblePatternIds.map(patternId => ({
    patternId,
    pattern: manufacturerPatterns.patterns[patternId]
  })).filter(item => item.pattern);
}

function filterByRequirements(patterns: any[], inputs: ManufacturerSelectionInputs) {
  return patterns.filter(({ pattern }) => {
    // Check deck type compatibility
    if (!pattern.deckTypes.includes(inputs.deckType.toLowerCase())) {
      return false;
    }
    
    // Check project type compatibility
    if (!pattern.projectTypes.includes(inputs.projectType.toLowerCase())) {
      return false;
    }
    
    // For HVHZ, require NOA approval
    if (inputs.hvhz) {
      const hasNOA = pattern.approvals.some((approval: string) => 
        approval.includes('NOA') || approval.includes('Miami-Dade')
      );
      if (!hasNOA && !pattern.specialRequirements?.includes('HVHZ-Approved')) {
        return false;
      }
    }
    
    return true;
  });
}

function filterByPressureCapacity(patterns: any[], windPressures: WindUpliftPressures) {
  const maxPressure = Math.abs(windPressures.zone3Corner);
  
  return patterns.filter(({ pattern }) => {
    const capacity = Math.abs(pattern.pressureThresholds.zone3Corner);
    return capacity >= maxPressure;
  });
}

function selectBestPattern(patterns: any[], inputs: ManufacturerSelectionInputs) {
  if (patterns.length === 0) return null;
  
  // Score patterns based on priority criteria
  const scoredPatterns = patterns.map(item => ({
    ...item,
    score: calculatePatternScore(item.pattern, inputs)
  }));
  
  // Sort by score (highest first)
  scoredPatterns.sort((a, b) => b.score - a.score);
  
  return scoredPatterns[0];
}

function calculatePatternScore(pattern: any, inputs: ManufacturerSelectionInputs): number {
  let score = 0;
  
  // HVHZ compliance (highest priority)
  if (inputs.hvhz && hasNOAApproval(pattern)) {
    score += 100;
  }
  
  // Miami-Dade NOA specifically
  if (pattern.approvals.some((approval: string) => approval.includes('NOA'))) {
    score += 50;
  }
  
  // FM approval hierarchy
  if (pattern.approvals.some((approval: string) => approval.includes('FM I-195'))) {
    score += 30;
  } else if (pattern.approvals.some((approval: string) => approval.includes('FM I-175'))) {
    score += 20;
  }
  
  // UL rating
  if (pattern.approvals.some((approval: string) => approval.includes('UL 580'))) {
    score += 15;
  }
  
  // Pressure margin (prefer higher capacity)
  const pressureMargin = Math.abs(pattern.pressureThresholds.zone3Corner) - Math.abs(inputs.windUpliftPressures.zone3Corner);
  score += Math.min(pressureMargin * 0.1, 10); // Max 10 points for pressure margin
  
  // Manufacturer preference (if brand specified)
  if (inputs.selectedMembraneBrand && 
      pattern.manufacturer.toLowerCase().includes(inputs.selectedMembraneBrand.toLowerCase())) {
    score += 25;
  }
  
  // Penalize generic patterns
  if (pattern.manufacturer === 'Generic') {
    score -= 20;
  }
  
  return score;
}

function hasNOAApproval(pattern: any): boolean {
  return pattern.approvals.some((approval: string) => 
    approval.includes('NOA') || 
    approval.includes('Miami-Dade') ||
    pattern.specialRequirements?.includes('HVHZ-Approved')
  );
}

function hasRequiredApprovals(pattern: any, hvhz: boolean): boolean {
  if (hvhz) {
    return hasNOAApproval(pattern);
  }
  
  // For non-HVHZ, require at least FM or UL approval
  return pattern.approvals.some((approval: string) => 
    approval.includes('FM') || approval.includes('UL')
  );
}

function generateRejectionReasons(allPatterns: any[], selectedPatternId: string, inputs: ManufacturerSelectionInputs) {
  const rejectedPatterns: Array<{ pattern: string; reason: string }> = [];
  
  allPatterns.forEach(({ patternId, pattern }) => {
    if (patternId === selectedPatternId) return;
    
    let reason = '';
    
    // Check pressure capacity
    if (Math.abs(pattern.pressureThresholds.zone3Corner) < Math.abs(inputs.windUpliftPressures.zone3Corner)) {
      reason = `Insufficient pressure capacity: ${Math.abs(pattern.pressureThresholds.zone3Corner)} psf < ${Math.abs(inputs.windUpliftPressures.zone3Corner).toFixed(1)} psf required`;
    }
    // Check HVHZ requirements
    else if (inputs.hvhz && !hasNOAApproval(pattern)) {
      reason = 'HVHZ location requires NOA approval';
    }
    // Check deck compatibility
    else if (!pattern.deckTypes.includes(inputs.deckType.toLowerCase())) {
      reason = `Not compatible with ${inputs.deckType} deck`;
    }
    // Check project type
    else if (!pattern.projectTypes.includes(inputs.projectType.toLowerCase())) {
      reason = `Not approved for ${inputs.projectType} projects`;
    }
    // Lower priority
    else {
      reason = 'Lower priority than selected pattern';
    }
    
    rejectedPatterns.push({
      pattern: `${pattern.manufacturer} ${pattern.system}`,
      reason
    });
  });
  
  return rejectedPatterns;
}

function generateSelectionRationale(pattern: any, inputs: ManufacturerSelectionInputs): string {
  const reasons: string[] = [];
  
  // Pressure capacity
  const capacity = Math.abs(pattern.pressureThresholds.zone3Corner);
  const required = Math.abs(inputs.windUpliftPressures.zone3Corner);
  const margin = capacity - required;
  
  reasons.push(`Selected for pressure capacity of ${capacity} psf (${margin.toFixed(1)} psf margin over ${required.toFixed(1)} psf requirement)`);
  
  // HVHZ compliance
  if (inputs.hvhz && hasNOAApproval(pattern)) {
    reasons.push('HVHZ compliant with required NOA approval');
  }
  
  // High-value approvals
  const premiumApprovals = pattern.approvals.filter((approval: string) => 
    approval.includes('FM I-195') || approval.includes('NOA')
  );
  if (premiumApprovals.length > 0) {
    reasons.push(`Premium approvals: ${premiumApprovals.join(', ')}`);
  }
  
  // Project suitability
  reasons.push(`Approved for ${inputs.projectType} projects on ${inputs.deckType} deck`);
  
  return reasons.join('. ');
}

function createFallbackPattern(inputs: ManufacturerSelectionInputs): ManufacturerAnalysisResult {
  console.warn('🚨 Using fallback pattern - no suitable patterns found');
  
  // Calculate fallback spacing based on pressure
  const maxPressure = Math.abs(inputs.windUpliftPressures.zone3Corner);
  
  let fieldSpacing = "15\" o.c.";
  let perimeterSpacing = "12\" o.c.";
  let cornerSpacing = "9\" o.c.";
  
  if (maxPressure > 50) {
    fieldSpacing = "9\" o.c.";
    perimeterSpacing = "6\" o.c.";
    cornerSpacing = "4\" o.c.";
  } else if (maxPressure > 30) {
    fieldSpacing = "12\" o.c.";
    perimeterSpacing = "8\" o.c.";
    cornerSpacing = "6\" o.c.";
  }
  
  return {
    selectedPattern: 'Fallback_Pattern',
    manufacturer: 'Engineering Calculated',
    system: 'Custom Fastening Pattern',
    fasteningSpecifications: {
      fieldSpacing,
      perimeterSpacing,
      cornerSpacing,
      penetrationDepth: "¾ inch min"
    },
    approvals: ['Engineering Calculated'],
    hasApprovals: false,
    metadata: {
      pressureCapacity: {
        zone1Field: inputs.windUpliftPressures.zone1Field,
        zone1Perimeter: inputs.windUpliftPressures.zone1Perimeter,
        zone2Perimeter: inputs.windUpliftPressures.zone2Perimeter,
        zone3Corner: inputs.windUpliftPressures.zone3Corner
      },
      rejectedPatterns: [],
      selectionRationale: `Custom fastening pattern calculated for ${maxPressure.toFixed(1)} psf pressure requirement. Professional engineering review recommended.`
    }
  };
}

// Helper function to get manufacturer recommendations
export function getManufacturerRecommendations(membraneType: 'TPO' | 'PVC' | 'EPDM', hvhz: boolean = false) {
  const compatiblePatterns = getCompatiblePatterns(membraneType);
  
  return compatiblePatterns
    .filter(({ pattern }) => {
      if (hvhz) {
        return hasNOAApproval(pattern);
      }
      return pattern.manufacturer !== 'Generic';
    })
    .map(({ pattern }) => ({
      manufacturer: pattern.manufacturer,
      system: pattern.system,
      approvals: pattern.approvals,
      maxPressure: Math.abs(pattern.pressureThresholds.zone3Corner)
    }))
    .sort((a, b) => b.maxPressure - a.maxPressure);
}

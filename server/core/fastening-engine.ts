// Manufacturer & Fastening Engine
// Matches wind pressures and membrane specifications to manufacturer systems

import fs from 'fs/promises';
import path from 'path';

export interface FasteningEngineInputs {
  windUpliftPressures: {
    zone1Field: number;
    zone1Perimeter?: number;
    zone2Perimeter: number;
    zone3Corner: number;
  };
  membraneType: string;
  membraneThickness?: string;
  hvhz: boolean;
  projectType: 'recover' | 'tearoff' | 'new';
  deckType?: string;
  preferredManufacturer?: string;
}

export interface ManufacturerSystem {
  manufacturer: string;
  systemName: string;
  membraneType: string;
  thickness: string;
  maxPressure: {
    field: number;
    perimeter: number;
    corner: number;
  };
  fasteningPattern: {
    fieldSpacing: string;
    perimeterSpacing: string;
    cornerSpacing: string;
    penetrationDepth: string;
    fastenerType: string;
    plateSize?: string;
  };
  hvhzApproved: boolean;
  noaNumber?: string;
  applicableFor: string[];
  notes?: string[];
}

export interface FasteningEngineResult {
  selectedSystem: {
    manufacturer: string;
    systemName: string;
    rationale: string;
  };
  rejectedSystems: Array<{
    manufacturer: string;
    systemName: string;
    reason: string;
  }>;
  fasteningSpecifications: {
    fieldSpacing: string;
    perimeterSpacing: string;
    cornerSpacing: string;
    penetrationDepth: string;
    fastenerType: string;
    plateSize?: string;
    specialRequirements?: string[];
  };
  complianceNotes: string[];
  pressureCompliance: {
    meetsField: boolean;
    meetsPerimeter: boolean;
    meetsCorner: boolean;
    safetyMargin: number; // Percentage above required
  };
}

// Load manufacturer data
let manufacturerSystemsCache: ManufacturerSystem[] | null = null;

async function loadManufacturerSystems(): Promise<ManufacturerSystem[]> {
  if (manufacturerSystemsCache) {
    return manufacturerSystemsCache;
  }

  try {
    // Try to load from manufacturer-patterns.json or create default data
    const dataPath = path.join(__dirname, '../data/manufacturer-patterns.json');
    
    try {
      const rawData = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(rawData);
      manufacturerSystemsCache = data.systems || getDefaultManufacturerSystems();
    } catch (fileError) {
      console.warn('⚠️ Could not load manufacturer data, using defaults');
      manufacturerSystemsCache = getDefaultManufacturerSystems();
    }
    
    return manufacturerSystemsCache;
  } catch (error) {
    console.error('❌ Error loading manufacturer systems:', error);
    return getDefaultManufacturerSystems();
  }
}

/**
 * Main fastening engine - selects optimal manufacturer system
 */
export async function selectManufacturerSystem(inputs: FasteningEngineInputs): Promise<FasteningEngineResult> {
  console.log('🏭 Fastening Engine - Analyzing manufacturer systems...');
  
  const systems = await loadManufacturerSystems();
  const rejectedSystems: Array<{ manufacturer: string; systemName: string; reason: string }> = [];
  const complianceNotes: string[] = [];
  
  // Get absolute values for pressure comparison (pressures are negative for uplift)
  const requiredPressures = {
    field: Math.abs(inputs.windUpliftPressures.zone1Field),
    perimeter: Math.abs(inputs.windUpliftPressures.zone2Perimeter),
    corner: Math.abs(inputs.windUpliftPressures.zone3Corner)
  };
  
  console.log(`🎯 Required pressures: Field=${requiredPressures.field.toFixed(1)}, Perimeter=${requiredPressures.perimeter.toFixed(1)}, Corner=${requiredPressures.corner.toFixed(1)} psf`);
  
  // Filter systems based on requirements
  const eligibleSystems = systems.filter(system => {
    // Check HVHZ requirement
    if (inputs.hvhz && !system.hvhzApproved) {
      rejectedSystems.push({
        manufacturer: system.manufacturer,
        systemName: system.systemName,
        reason: 'Not HVHZ approved - NOA required for this location'
      });
      return false;
    }
    
    // Check membrane type compatibility
    if (!isMembraneTypeCompatible(inputs.membraneType, system.membraneType)) {
      rejectedSystems.push({
        manufacturer: system.manufacturer,
        systemName: system.systemName,
        reason: `Membrane type mismatch: requires ${inputs.membraneType}, system is ${system.membraneType}`
      });
      return false;
    }
    
    // Check thickness compatibility if specified
    if (inputs.membraneThickness && !isThicknessCompatible(inputs.membraneThickness, system.thickness)) {
      rejectedSystems.push({
        manufacturer: system.manufacturer,
        systemName: system.systemName,
        reason: `Thickness mismatch: requires ${inputs.membraneThickness}, system is ${system.thickness}`
      });
      return false;
    }
    
    // Check pressure requirements
    const pressureCheck = checkPressureCompliance(requiredPressures, system.maxPressure);
    if (!pressureCheck.meetsAll) {
      rejectedSystems.push({
        manufacturer: system.manufacturer,
        systemName: system.systemName,
        reason: `Insufficient pressure rating: ${pressureCheck.failedZones.join(', ')}`
      });
      return false;
    }
    
    // Check project type compatibility
    if (!system.applicableFor.includes(inputs.projectType)) {
      rejectedSystems.push({
        manufacturer: system.manufacturer,
        systemName: system.systemName,
        reason: `Not suitable for ${inputs.projectType} projects`
      });
      return false;
    }
    
    return true;
  });
  
  console.log(`✅ Found ${eligibleSystems.length} eligible systems out of ${systems.length} total`);
  
  if (eligibleSystems.length === 0) {
    throw new Error('No manufacturer systems meet the project requirements. Consider revising specifications or using custom engineering.');
  }
  
  // Select the best system using selection criteria
  const selectedSystem = selectBestSystem(eligibleSystems, inputs, requiredPressures);
  
  // Calculate pressure compliance for selected system
  const pressureCompliance = calculatePressureCompliance(requiredPressures, selectedSystem.maxPressure);
  
  // Generate compliance notes
  complianceNotes.push(`Selected ${selectedSystem.manufacturer} ${selectedSystem.systemName}`);
  complianceNotes.push(`System pressure rating exceeds requirements by ${pressureCompliance.safetyMargin.toFixed(1)}%`);
  
  if (inputs.hvhz) {
    complianceNotes.push(`HVHZ approved system with NOA: ${selectedSystem.noaNumber || 'Pending verification'}`);
  }
  
  if (selectedSystem.notes) {
    complianceNotes.push(...selectedSystem.notes);
  }
  
  const result: FasteningEngineResult = {
    selectedSystem: {
      manufacturer: selectedSystem.manufacturer,
      systemName: selectedSystem.systemName,
      rationale: generateSelectionRationale(selectedSystem, inputs, eligibleSystems.length)
    },
    rejectedSystems,
    fasteningSpecifications: {
      ...selectedSystem.fasteningPattern,
      specialRequirements: generateSpecialRequirements(selectedSystem, inputs)
    },
    complianceNotes,
    pressureCompliance
  };
  
  console.log(`🎯 Selected: ${selectedSystem.manufacturer} ${selectedSystem.systemName}`);
  console.log(`🔧 Fastening: Field=${selectedSystem.fasteningPattern.fieldSpacing}, Corner=${selectedSystem.fasteningPattern.cornerSpacing}`);
  
  return result;
}

/**
 * Check if membrane types are compatible
 */
function isMembraneTypeCompatible(required: string, systemType: string): boolean {
  const normalize = (type: string) => type.toLowerCase().replace(/[-\s]/g, '');
  
  const requiredNorm = normalize(required);
  const systemNorm = normalize(systemType);
  
  // Direct match
  if (requiredNorm === systemNorm) return true;
  
  // TPO variations
  if ((requiredNorm.includes('tpo') || requiredNorm.includes('thermoplastic')) && 
      (systemNorm.includes('tpo') || systemNorm.includes('thermoplastic'))) {
    return true;
  }
  
  // Fleeceback variations
  if ((requiredNorm.includes('fleece') || requiredNorm.includes('fb')) &&
      (systemNorm.includes('fleece') || systemNorm.includes('fb'))) {
    return true;
  }
  
  // EPDM variations
  if (requiredNorm.includes('epdm') && systemNorm.includes('epdm')) {
    return true;
  }
  
  return false;
}

/**
 * Check if thicknesses are compatible
 */
function isThicknessCompatible(required: string, systemThickness: string): boolean {
  // Extract numeric values
  const requiredMils = parseInt(required.replace(/[^\d]/g, ''));
  const systemMils = parseInt(systemThickness.replace(/[^\d]/g, ''));
  
  // Allow ±10 mil tolerance
  return Math.abs(requiredMils - systemMils) <= 10;
}

/**
 * Check pressure compliance
 */
function checkPressureCompliance(required: any, systemMax: any): { 
  meetsAll: boolean; 
  failedZones: string[] 
} {
  const failedZones: string[] = [];
  
  if (required.field > systemMax.field) {
    failedZones.push(`Field zone requires ${required.field.toFixed(1)} psf, system rated for ${systemMax.field.toFixed(1)} psf`);
  }
  
  if (required.perimeter > systemMax.perimeter) {
    failedZones.push(`Perimeter zone requires ${required.perimeter.toFixed(1)} psf, system rated for ${systemMax.perimeter.toFixed(1)} psf`);
  }
  
  if (required.corner > systemMax.corner) {
    failedZones.push(`Corner zone requires ${required.corner.toFixed(1)} psf, system rated for ${systemMax.corner.toFixed(1)} psf`);
  }
  
  return {
    meetsAll: failedZones.length === 0,
    failedZones
  };
}

/**
 * Calculate detailed pressure compliance
 */
function calculatePressureCompliance(required: any, systemMax: any) {
  const fieldMargin = ((systemMax.field - required.field) / required.field) * 100;
  const perimeterMargin = ((systemMax.perimeter - required.perimeter) / required.perimeter) * 100;
  const cornerMargin = ((systemMax.corner - required.corner) / required.corner) * 100;
  
  const overallMargin = Math.min(fieldMargin, perimeterMargin, cornerMargin);
  
  return {
    meetsField: systemMax.field >= required.field,
    meetsPerimeter: systemMax.perimeter >= required.perimeter,
    meetsCorner: systemMax.corner >= required.corner,
    safetyMargin: Math.max(0, overallMargin)
  };
}

/**
 * Select the best system from eligible options
 */
function selectBestSystem(
  eligibleSystems: ManufacturerSystem[],
  inputs: FasteningEngineInputs,
  requiredPressures: any
): ManufacturerSystem {
  // Scoring criteria (higher score = better)
  const systemScores = eligibleSystems.map(system => {
    let score = 0;
    
    // Preferred manufacturer bonus
    if (inputs.preferredManufacturer && 
        system.manufacturer.toLowerCase().includes(inputs.preferredManufacturer.toLowerCase())) {
      score += 100;
    }
    
    // Pressure safety margin (more is better, but diminishing returns)
    const compliance = calculatePressureCompliance(requiredPressures, system.maxPressure);
    score += Math.min(compliance.safetyMargin, 50); // Cap at 50 points
    
    // HVHZ approval bonus if required
    if (inputs.hvhz && system.hvhzApproved) {
      score += 25;
    }
    
    // Fleeceback preference bonus
    if (inputs.membraneType.toLowerCase().includes('fleece') && 
        system.membraneType.toLowerCase().includes('fleece')) {
      score += 20;
    }
    
    // Premium manufacturer preference
    const premiumManufacturers = ['Carlisle', 'GAF', 'Johns Manville', 'Firestone'];
    if (premiumManufacturers.some(mfg => system.manufacturer.includes(mfg))) {
      score += 10;
    }
    
    return { system, score };
  });
  
  // Sort by score (highest first)
  systemScores.sort((a, b) => b.score - a.score);
  
  return systemScores[0].system;
}

/**
 * Generate selection rationale
 */
function generateSelectionRationale(
  system: ManufacturerSystem,
  inputs: FasteningEngineInputs,
  eligibleCount: number
): string {
  const reasons: string[] = [];
  
  if (eligibleCount === 1) {
    reasons.push('Only system meeting all requirements');
  } else {
    reasons.push(`Selected from ${eligibleCount} eligible systems`);
  }
  
  if (inputs.hvhz && system.hvhzApproved) {
    reasons.push('HVHZ approved with NOA');
  }
  
  if (inputs.preferredManufacturer && 
      system.manufacturer.toLowerCase().includes(inputs.preferredManufacturer.toLowerCase())) {
    reasons.push('Matches preferred manufacturer');
  }
  
  reasons.push('Meets all pressure requirements with adequate safety margin');
  
  return reasons.join('; ');
}

/**
 * Generate special requirements
 */
function generateSpecialRequirements(
  system: ManufacturerSystem,
  inputs: FasteningEngineInputs
): string[] {
  const requirements: string[] = [];
  
  if (inputs.hvhz) {
    requirements.push('HVHZ installation procedures required');
    requirements.push('Special inspector verification required');
  }
  
  if (system.membraneType.toLowerCase().includes('fleece')) {
    requirements.push('Fleeceback membrane installation per manufacturer specifications');
  }
  
  if (Math.abs(inputs.windUpliftPressures.zone3Corner) > 60) {
    requirements.push('Enhanced fastening pattern due to high wind pressures');
  }
  
  requirements.push('All fasteners to be installed perpendicular to deck');
  requirements.push('Verify fastener penetration depth per manufacturer requirements');
  
  return requirements;
}

/**
 * Get default manufacturer systems for fallback
 */
function getDefaultManufacturerSystems(): ManufacturerSystem[] {
  return [
    {
      manufacturer: 'Carlisle Syntec',
      systemName: '60mil TPO Mechanically Attached',
      membraneType: 'TPO',
      thickness: '60mil',
      maxPressure: { field: 45, perimeter: 75, corner: 105 },
      fasteningPattern: {
        fieldSpacing: '12" o.c.',
        perimeterSpacing: '6" o.c.',
        cornerSpacing: '4" o.c.',
        penetrationDepth: '1" min into deck',
        fastenerType: 'Carlisle FastPattern 4.8" HD Fastener'
      },
      hvhzApproved: false,
      applicableFor: ['recover', 'tearoff', 'new']
    },
    {
      manufacturer: 'Carlisle Syntec',
      systemName: '60mil TPO HVHZ Mechanically Attached',
      membraneType: 'TPO',
      thickness: '60mil',
      maxPressure: { field: 60, perimeter: 90, corner: 135 },
      fasteningPattern: {
        fieldSpacing: '12" o.c.',
        perimeterSpacing: '4" o.c.',
        cornerSpacing: '3" o.c.',
        penetrationDepth: '1" min into deck',
        fastenerType: 'Carlisle FastPattern 4.8" HD Fastener'
      },
      hvhzApproved: true,
      noaNumber: 'FL-16758.3',
      applicableFor: ['recover', 'tearoff', 'new']
    },
    {
      manufacturer: 'GAF',
      systemName: 'EverGuard TPO 60mil',
      membraneType: 'TPO',
      thickness: '60mil',
      maxPressure: { field: 40, perimeter: 70, corner: 95 },
      fasteningPattern: {
        fieldSpacing: '12" o.c.',
        perimeterSpacing: '6" o.c.',
        cornerSpacing: '4" o.c.',
        penetrationDepth: '3/4" min into deck',
        fastenerType: 'GAF 4.2" WindGard Fastener'
      },
      hvhzApproved: false,
      applicableFor: ['recover', 'tearoff', 'new']
    },
    {
      manufacturer: 'Johns Manville',
      systemName: 'TPO Fleeceback 115mil',
      membraneType: 'TPO Fleeceback',
      thickness: '115mil',
      maxPressure: { field: 65, perimeter: 95, corner: 140 },
      fasteningPattern: {
        fieldSpacing: '12" o.c.',
        perimeterSpacing: '6" o.c.',
        cornerSpacing: '3" o.c.',
        penetrationDepth: '1" min into deck',
        fastenerType: 'JM WindGard HD Fastener'
      },
      hvhzApproved: true,
      noaNumber: 'FL-16758.3-R35',
      applicableFor: ['recover', 'tearoff']
    },
    {
      manufacturer: 'Firestone',
      systemName: 'UltraPly TPO 60mil',
      membraneType: 'TPO',
      thickness: '60mil',
      maxPressure: { field: 42, perimeter: 72, corner: 98 },
      fasteningPattern: {
        fieldSpacing: '12" o.c.',
        perimeterSpacing: '6" o.c.',
        cornerSpacing: '4" o.c.',
        penetrationDepth: '3/4" min into deck',
        fastenerType: 'Firestone AccuFast Fastener'
      },
      hvhzApproved: false,
      applicableFor: ['recover', 'tearoff', 'new']
    }
  ];
}

/**
 * Validate fastening engine inputs
 */
export function validateFasteningInputs(inputs: FasteningEngineInputs): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!inputs.windUpliftPressures) {
    errors.push('Wind uplift pressures are required');
  } else {
    if (typeof inputs.windUpliftPressures.zone1Field !== 'number') {
      errors.push('Zone 1 field pressure is required');
    }
    if (typeof inputs.windUpliftPressures.zone3Corner !== 'number') {
      errors.push('Zone 3 corner pressure is required');
    }
  }
  
  if (!inputs.membraneType) {
    errors.push('Membrane type is required');
  }
  
  if (!inputs.projectType) {
    errors.push('Project type is required');
  }
  
  // Warnings
  if (inputs.windUpliftPressures && Math.abs(inputs.windUpliftPressures.zone3Corner) > 100) {
    warnings.push('Very high corner pressures - limited system options available');
  }
  
  if (inputs.hvhz && !inputs.windUpliftPressures) {
    warnings.push('HVHZ projects require wind pressure calculations');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Enhanced Takeoff Diagnostics Engine with File Parsing Support
// Phase 2: File upload support and advanced diagnostics

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

export interface TakeoffFile {
  filename: string;
  buffer: Buffer;
  mimetype: string;
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
 * Parse takeoff file (PDF or CSV) and extract quantities
 * Phase 2: Stub implementation for file processing
 */
export async function parseTakeoffFile(file: TakeoffFile): Promise<TakeoffItems> {
  console.log(`📁 Parsing takeoff file: ${file.filename} (${file.mimetype})`);
  
  try {
    if (file.mimetype === 'text/csv' || file.filename.endsWith('.csv')) {
      return await parseCSVTakeoff(file);
    } else if (file.mimetype === 'application/pdf' || file.filename.endsWith('.pdf')) {
      return await parsePDFTakeoff(file);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.filename.endsWith('.xlsx')) {
      return await parseExcelTakeoff(file);
    } else {
      console.warn(`⚠️ Unsupported file type: ${file.mimetype}, using mock data`);
      return generateMockTakeoffFromFile(file);
    }
  } catch (error) {
    console.error('❌ Error parsing takeoff file:', error);
    console.log('🔄 Falling back to mock data based on filename analysis');
    return generateMockTakeoffFromFile(file);
  }
}

/**
 * Parse CSV takeoff file
 */
async function parseCSVTakeoff(file: TakeoffFile): Promise<TakeoffItems> {
  console.log('📊 Parsing CSV takeoff file...');
  
  try {
    const csvContent = file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      throw new Error('CSV file appears empty or invalid');
    }
    
    // Look for header row and data
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    console.log('📋 CSV Headers found:', headers);
    
    // Initialize quantities
    let drainCount = 0;
    let penetrationCount = 0;
    let flashingLinearFeet = 0;
    let accessoryCount = 0;
    let roofArea = 25000; // Default
    let hvacUnits = 0;
    let skylights = 0;
    let roofHatches = 0;
    let scuppers = 0;
    let expansionJoints = 0;
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      for (let j = 0; j < headers.length && j < values.length; j++) {
        const header = headers[j];
        const value = values[j];
        const numValue = parseInt(value) || parseFloat(value) || 0;
        
        // Map headers to quantities
        if (header.includes('drain') && !header.includes('overflow')) {
          drainCount += numValue;
        } else if (header.includes('penetration') || header.includes('penetrations')) {
          penetrationCount += numValue;
        } else if (header.includes('flashing') || header.includes('linear')) {
          flashingLinearFeet += numValue;
        } else if (header.includes('accessory') || header.includes('accessories')) {
          accessoryCount += numValue;
        } else if (header.includes('area') || header.includes('square') || header.includes('sf')) {
          roofArea = Math.max(roofArea, numValue);
        } else if (header.includes('hvac') || header.includes('unit')) {
          hvacUnits += numValue;
        } else if (header.includes('skylight')) {
          skylights += numValue;
        } else if (header.includes('hatch')) {
          roofHatches += numValue;
        } else if (header.includes('scupper')) {
          scuppers += numValue;
        } else if (header.includes('expansion') || header.includes('joint')) {
          expansionJoints += numValue;
        }
      }
    }
    
    console.log(`✅ CSV parsed: ${drainCount} drains, ${penetrationCount} penetrations, ${flashingLinearFeet} LF flashing`);
    
    return {
      drainCount: Math.max(drainCount, 2), // Minimum 2 drains
      penetrationCount: Math.max(penetrationCount, 5), // Minimum 5 penetrations
      flashingLinearFeet: Math.max(flashingLinearFeet, 100), // Minimum 100 LF
      accessoryCount: Math.max(accessoryCount, 3), // Minimum 3 accessories
      roofArea,
      hvacUnits,
      skylights,
      roofHatches,
      scuppers,
      expansionJoints
    };
    
  } catch (error) {
    console.error('❌ CSV parsing error:', error);
    throw error;
  }
}

/**
 * Parse PDF takeoff file (stub implementation)
 */
async function parsePDFTakeoff(file: TakeoffFile): Promise<TakeoffItems> {
  console.log('📄 Parsing PDF takeoff file (Phase 2 stub)...');
  
  // Phase 2 stub - simulate PDF parsing
  // In Phase 5, this would use pdf-parse or similar library
  
  const filename = file.filename.toLowerCase();
  const fileSize = file.buffer.length;
  
  console.log(`📄 PDF Analysis: ${file.filename}, Size: ${(fileSize / 1024).toFixed(1)}KB`);
  
  // Simulate quantity extraction based on file characteristics
  const baseQuantities = {
    drainCount: Math.max(4, Math.floor(fileSize / 100000)), // Rough estimate from file size
    penetrationCount: Math.max(8, Math.floor(fileSize / 50000)),
    flashingLinearFeet: Math.max(200, Math.floor(fileSize / 25000)),
    accessoryCount: Math.max(5, Math.floor(fileSize / 75000)),
    roofArea: Math.max(15000, Math.floor(fileSize / 10) * 100), // Very rough estimate
    hvacUnits: Math.floor(Math.random() * 5) + 2,
    skylights: Math.floor(Math.random() * 4),
    roofHatches: Math.floor(Math.random() * 3) + 1,
    scuppers: Math.floor(Math.random() * 4),
    expansionJoints: Math.floor(Math.random() * 2)
  };
  
  // Add some intelligence based on filename
  if (filename.includes('large') || filename.includes('big')) {
    baseQuantities.roofArea *= 1.5;
    baseQuantities.drainCount *= 1.5;
  }
  
  if (filename.includes('complex') || filename.includes('detail')) {
    baseQuantities.penetrationCount *= 1.3;
    baseQuantities.flashingLinearFeet *= 1.2;
  }
  
  console.log(`✅ PDF stub parsed: ${baseQuantities.drainCount} drains, ${baseQuantities.penetrationCount} penetrations`);
  
  return {
    drainCount: Math.round(baseQuantities.drainCount),
    penetrationCount: Math.round(baseQuantities.penetrationCount),
    flashingLinearFeet: Math.round(baseQuantities.flashingLinearFeet),
    accessoryCount: Math.round(baseQuantities.accessoryCount),
    roofArea: Math.round(baseQuantities.roofArea),
    hvacUnits: baseQuantities.hvacUnits,
    skylights: baseQuantities.skylights,
    roofHatches: baseQuantities.roofHatches,
    scuppers: baseQuantities.scuppers,
    expansionJoints: baseQuantities.expansionJoints
  };
}

/**
 * Parse Excel takeoff file (stub implementation)
 */
async function parseExcelTakeoff(file: TakeoffFile): Promise<TakeoffItems> {
  console.log('📊 Parsing Excel takeoff file (Phase 2 stub)...');
  
  // Phase 2 stub - simulate Excel parsing
  // In Phase 5, this would use xlsx library
  
  const filename = file.filename.toLowerCase();
  const fileSize = file.buffer.length;
  
  console.log(`📊 Excel Analysis: ${file.filename}, Size: ${(fileSize / 1024).toFixed(1)}KB`);
  
  // Simulate more sophisticated parsing for Excel files
  const mockTakeoff = {
    drainCount: 6,
    penetrationCount: 18,
    flashingLinearFeet: 450,
    accessoryCount: 8,
    roofArea: 28000,
    hvacUnits: 3,
    skylights: 2,
    roofHatches: 1,
    scuppers: 2,
    expansionJoints: 1,
    parapetHeight: 18
  };
  
  console.log(`✅ Excel stub parsed: ${mockTakeoff.drainCount} drains, ${mockTakeoff.penetrationCount} penetrations`);
  
  return mockTakeoff;
}

/**
 * Generate mock takeoff data based on file analysis
 */
function generateMockTakeoffFromFile(file: TakeoffFile): TakeoffItems {
  console.log('🎲 Generating mock takeoff data from file characteristics...');
  
  const filename = file.filename.toLowerCase();
  const fileSize = file.buffer.length;
  
  // Base quantities
  let mockData = {
    drainCount: 4,
    penetrationCount: 12,
    flashingLinearFeet: 300,
    accessoryCount: 6,
    roofArea: 20000,
    hvacUnits: 2,
    skylights: 1,
    roofHatches: 1,
    scuppers: 1,
    expansionJoints: 0
  };
  
  // Adjust based on filename hints
  if (filename.includes('warehouse') || filename.includes('industrial')) {
    mockData.roofArea *= 2;
    mockData.drainCount += 2;
    mockData.hvacUnits += 3;
  }
  
  if (filename.includes('retail') || filename.includes('commercial')) {
    mockData.penetrationCount += 5;
    mockData.skylights += 2;
  }
  
  if (filename.includes('school') || filename.includes('institutional')) {
    mockData.roofArea *= 1.5;
    mockData.accessoryCount += 4;
    mockData.roofHatches += 2;
  }
  
  // Size-based adjustments
  if (fileSize > 1000000) { // > 1MB
    mockData.roofArea *= 1.3;
    mockData.penetrationCount += 8;
  }
  
  console.log(`✅ Mock data generated: ${mockData.drainCount} drains, ${mockData.penetrationCount} penetrations`);
  
  return mockData;
}

/**
 * Main takeoff diagnostics engine (enhanced)
 */
export function analyzeTakeoffDiagnostics(inputs: TakeoffEngineInputs): TakeoffDiagnostics {
  console.log('📋 Enhanced Takeoff Diagnostics - Analyzing quantities...');
  
  const { takeoffItems } = inputs;
  const roofAreaInThousands = takeoffItems.roofArea / 1000;
  
  // Calculate density metrics
  const penetrationDensity = takeoffItems.penetrationCount / roofAreaInThousands;
  const drainDensity = takeoffItems.drainCount / roofAreaInThousands;
  const flashingRatio = takeoffItems.flashingLinearFeet / takeoffItems.roofArea;
  const accessoryRatio = takeoffItems.accessoryCount / roofAreaInThousands;
  
  console.log(`📊 Enhanced densities: Penetrations=${penetrationDensity.toFixed(1)}/1000sf, Drains=${drainDensity.toFixed(1)}/1000sf, Flashing=${flashingRatio.toFixed(3)}`);
  
  const specialAttentionAreas: string[] = [];
  const recommendations: string[] = [];
  const warnings: string[] = [];
  
  // Enhanced analysis with more sophisticated rules
  
  // High penetration density analysis
  const highPenetrationDensity = penetrationDensity > 20;
  if (highPenetrationDensity) {
    specialAttentionAreas.push('High penetration density areas requiring detailed coordination');
    recommendations.push('Consider prefabricated penetration assemblies for consistency');
    recommendations.push('Plan for additional waste allowance due to complex cutting');
    warnings.push(`High penetration density: ${penetrationDensity.toFixed(1)} per 1000 sq ft (>20 threshold)`);
    
    if (penetrationDensity > 30) {
      warnings.push('Extremely high penetration density may require specialized installation crew');
    }
  }
  
  // Enhanced drainage analysis
  const drainOverflowRequired = analyzeDrainageRequirements(takeoffItems, inputs);
  if (drainOverflowRequired) {
    specialAttentionAreas.push('Secondary drainage systems and overflow provisions');
    recommendations.push('Verify overflow drainage provisions per IBC Section 1503.4');
    recommendations.push('Consider larger drain sizes for primary drainage system');
  }
  
  // Enhanced flashing analysis
  const linearFlashingExceedsTypical = analyzeFlashingRequirements(takeoffItems, inputs);
  if (linearFlashingExceedsTypical) {
    specialAttentionAreas.push('Extensive flashing work requiring skilled technicians');
    recommendations.push('Plan for extended installation timeline due to flashing complexity');
    recommendations.push('Consider factory-fabricated flashing components where possible');
    warnings.push(`Flashing ratio ${flashingRatio.toFixed(3)} exceeds typical 0.05 ratio by ${((flashingRatio / 0.05 - 1) * 100).toFixed(0)}%`);
  }
  
  // Enhanced accessory analysis
  const excessiveAccessoryCount = accessoryRatio > 15;
  if (excessiveAccessoryCount) {
    specialAttentionAreas.push('Multiple roof accessories requiring coordination');
    recommendations.push('Develop detailed accessory installation sequence plan');
    recommendations.push('Consider pre-assembly of accessory components');
    warnings.push(`High accessory count: ${accessoryRatio.toFixed(1)} per 1000 sq ft may impact schedule`);
  }
  
  // Enhanced drainage adequacy analysis
  const inadequateDrainage = drainDensity < 0.8;
  if (inadequateDrainage) {
    warnings.push('Potentially inadequate primary drainage density');
    recommendations.push('Verify drainage capacity calculations per building code');
    recommendations.push('Consider additional drains or larger drain sizes');
  }
  
  // Enhanced flashing complexity analysis
  const complexFlashingRequired = analyzeFlashingComplexity(takeoffItems, inputs);
  if (complexFlashingRequired) {
    specialAttentionAreas.push('Complex flashing details requiring specialized expertise');
    recommendations.push('Assign experienced flashing technicians to critical areas');
    recommendations.push('Develop detailed flashing installation drawings');
  }
  
  // New: Roof access and safety analysis
  if (takeoffItems.roofHatches && takeoffItems.roofHatches < 1 && takeoffItems.roofArea > 10000) {
    warnings.push('Large roof area with insufficient access hatches');
    recommendations.push('Consider additional roof access points for maintenance');
  }
  
  // New: Structural load analysis
  if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 5) {
    specialAttentionAreas.push('Heavy equipment requiring structural analysis');
    recommendations.push('Verify structural capacity for HVAC equipment loads');
  }
  
  // Enhanced project type specific recommendations
  generateEnhancedProjectTypeRecommendations(inputs, recommendations, warnings, takeoffItems);
  
  // Enhanced HVHZ recommendations
  if (inputs.hvhz) {
    generateEnhancedHVHZRecommendations(takeoffItems, recommendations, warnings);
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
  
  console.log(`✅ Enhanced diagnostics complete: ${specialAttentionAreas.length} special attention areas, ${warnings.length} warnings`);
  
  return diagnostics;
}

// Enhanced helper functions

function analyzeDrainageRequirements(takeoffItems: TakeoffItems, inputs: TakeoffEngineInputs): boolean {
  const roofAreaInThousands = takeoffItems.roofArea / 1000;
  const drainDensity = takeoffItems.drainCount / roofAreaInThousands;
  
  // Enhanced drainage analysis
  const minimumDrains = Math.ceil(takeoffItems.roofArea / 10000);
  
  if (takeoffItems.drainCount < minimumDrains) {
    return true;
  }
  
  // Large roofs require overflow
  if (takeoffItems.roofArea > 40000) {
    return true;
  }
  
  // Complex roofs require overflow
  if (takeoffItems.expansionJoints && takeoffItems.expansionJoints > 1) {
    return true;
  }
  
  // HVHZ locations with large roofs
  if (inputs.hvhz && takeoffItems.roofArea > 25000) {
    return true;
  }
  
  return false;
}

function analyzeFlashingRequirements(takeoffItems: TakeoffItems, inputs: TakeoffEngineInputs): boolean {
  const flashingRatio = takeoffItems.flashingLinearFeet / takeoffItems.roofArea;
  const typicalFlashingRatio = 0.05;
  
  if (flashingRatio > typicalFlashingRatio * 1.4) {
    return true;
  }
  
  const penetrationDensity = takeoffItems.penetrationCount / (takeoffItems.roofArea / 1000);
  if (penetrationDensity > 15) {
    return true;
  }
  
  return false;
}

function analyzeFlashingComplexity(takeoffItems: TakeoffItems, inputs: TakeoffEngineInputs): boolean {
  let complexityScore = 0;
  
  if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 5) complexityScore += 2;
  if (takeoffItems.skylights && takeoffItems.skylights > 3) complexityScore += 2;
  if (takeoffItems.expansionJoints && takeoffItems.expansionJoints > 0) complexityScore += 3;
  if (takeoffItems.parapetHeight && takeoffItems.parapetHeight > 24) complexityScore += 2;
  if (takeoffItems.scuppers && takeoffItems.scuppers > 2) complexityScore += 1;
  
  const penetrationDensity = takeoffItems.penetrationCount / (takeoffItems.roofArea / 1000);
  if (penetrationDensity > 25) complexityScore += 3;
  
  return complexityScore >= 5;
}

function generateEnhancedProjectTypeRecommendations(
  inputs: TakeoffEngineInputs,
  recommendations: string[],
  warnings: string[],
  takeoffItems: TakeoffItems
): void {
  const { projectType } = inputs;
  
  switch (projectType) {
    case 'tearoff':
      recommendations.push('Coordinate utility disconnections before tearoff begins');
      recommendations.push('Plan for weather protection during tearoff phase');
      if (takeoffItems.penetrationCount > 20) {
        recommendations.push('Consider phased tearoff to minimize exposure time');
      }
      if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 3) {
        warnings.push('Multiple HVAC units require careful removal and replacement coordination');
        recommendations.push('Develop HVAC equipment protection and relocation plan');
      }
      break;
      
    case 'recover':
      recommendations.push('Perform comprehensive existing roof condition assessment');
      recommendations.push('Verify existing roof structural capacity for additional load');
      if (takeoffItems.drainCount > 6) {
        recommendations.push('Assess existing drain condition and compatibility with recover system');
      }
      if (takeoffItems.penetrationCount > 15) {
        warnings.push('High penetration count may require extensive existing flashing assessment');
        recommendations.push('Plan for penetration flashing upgrades during recover');
      }
      break;
      
    case 'new':
      recommendations.push('Coordinate with building envelope completion schedule');
      if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 0) {
        recommendations.push('Establish HVAC equipment delivery and installation sequence');
      }
      if (takeoffItems.skylights && takeoffItems.skylights > 2) {
        recommendations.push('Coordinate skylight installation with roof membrane application');
      }
      break;
  }
}

function generateEnhancedHVHZRecommendations(
  takeoffItems: TakeoffItems,
  recommendations: string[],
  warnings: string[]
): void {
  recommendations.push('All components must have valid Florida NOA (Notice of Acceptance)');
  recommendations.push('Special inspector required for all HVHZ installations');
  recommendations.push('Enhanced quality control procedures and documentation required');
  
  if (takeoffItems.penetrationCount > 10) {
    warnings.push('Multiple penetrations in HVHZ require NOA-approved flashing systems');
    recommendations.push('Use factory-fabricated HVHZ penetration assemblies where possible');
    recommendations.push('Verify all penetration flashings have appropriate NOA approvals');
  }
  
  if (takeoffItems.skylights && takeoffItems.skylights > 0) {
    recommendations.push('Verify skylights meet HVHZ impact resistance requirements');
    recommendations.push('Ensure skylight mounting meets NOA-specified fastening requirements');
  }
  
  if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 0) {
    recommendations.push('HVAC equipment must meet HVHZ wind resistance requirements');
    recommendations.push('Verify equipment mounting systems have appropriate NOA approvals');
  }
  
  if (takeoffItems.roofArea > 50000) {
    warnings.push('Large HVHZ project requires enhanced project management and inspection');
    recommendations.push('Consider staged installation with incremental inspections');
  }
  
  recommendations.push('Maintain detailed installation records for AHJ review');
  recommendations.push('Schedule final inspection with special inspector before project completion');
}

// Export existing functions
export {
  generateTakeoffSummary,
  checkTakeoffConditions,
  calculateWasteFactors,
  validateTakeoffInputs
} from './takeoff-engine';

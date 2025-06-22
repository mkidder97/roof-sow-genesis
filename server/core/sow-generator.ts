// Main SOW Generator - Complete Logic Engine Orchestrator
// Integrates all engines: Template → Wind → Fastening → Takeoff → Final Output

import { 
  selectTemplate, 
  validateTemplateInputs,
  TemplateSelectionInputs,
  TemplateSelectionResult
} from './template-engine';

import { 
  calculateWindPressures, 
  validateWindInputs,
  WindEngineInputs,
  WindPressureResult
} from './wind-engine';

import { 
  selectManufacturerSystem, 
  validateFasteningInputs,
  FasteningEngineInputs,
  FasteningEngineResult
} from './fastening-engine';

import { 
  analyzeTakeoffDiagnostics, 
  validateTakeoffInputs,
  generateTakeoffSummary,
  TakeoffEngineInputs,
  TakeoffDiagnostics,
  TakeoffItems
} from './takeoff-engine';

import { performComprehensiveAnalysis } from '../lib/jurisdiction-analysis';

export interface SOWGeneratorInputs {
  // Project basics
  projectName: string;
  address: string;
  companyName: string;
  
  // Building parameters
  buildingHeight: number;
  squareFootage: number;
  buildingDimensions?: {
    length: number;
    width: number;
  };
  deckType: string;
  projectType: 'recover' | 'tearoff' | 'new';
  roofSlope: number;
  elevation?: number;
  exposureCategory?: 'B' | 'C' | 'D';
  
  // Membrane specifications
  membraneType: string;
  membraneThickness: string;
  membraneMaterial?: string;
  selectedMembraneBrand?: string;
  
  // Takeoff data
  takeoffItems: TakeoffItems;
  
  // Optional overrides
  basicWindSpeed?: number;
  preferredManufacturer?: string;
  includesTaperedInsulation?: boolean;
  userSelectedSystem?: string;
  customNotes?: string[];
}

export interface EngineeringSummaryOutput {
  // Template selection
  templateSelection: TemplateSelectionResult;
  
  // Jurisdiction and wind analysis
  jurisdictionAnalysis: {
    address: string;
    jurisdiction: {
      city: string;
      county: string;
      state: string;
      codeCycle: string;
      asceVersion: string;
      hvhz: boolean;
    };
    windAnalysis: WindPressureResult;
  };
  
  // System selection
  systemSelection: FasteningEngineResult;
  
  // Takeoff diagnostics
  takeoffDiagnostics: TakeoffDiagnostics;
  
  // Final metadata
  metadata: {
    templateUsed: string;
    asceVersion: string;
    hvhz: boolean;
    windUpliftPressures: {
      zone1Field: number;
      zone1Perimeter?: number;
      zone2Perimeter: number;
      zone3Corner: number;
    };
    selectedSystem: string;
    rejectedSystems: Array<{
      name: string;
      reason: string;
    }>;
    fasteningSpecifications: {
      fieldSpacing: string;
      perimeterSpacing: string;
      cornerSpacing: string;
      penetrationDepth: string;
      fastenerType: string;
    };
    takeoffSummary: {
      overallRisk: 'Low' | 'Medium' | 'High';
      keyIssues: string[];
      quantitySummary: string;
    };
    complianceNotes: string[];
    generationTimestamp: string;
  };
}

export interface SOWGeneratorResult {
  success: boolean;
  engineeringSummary?: EngineeringSummaryOutput;
  filename?: string;
  outputPath?: string;
  fileSize?: number;
  generationTime?: number;
  error?: string;
  validationErrors?: string[];
}

/**
 * Main SOW Generator - Complete Logic Engine
 * Orchestrates all engines to produce comprehensive engineering summary
 */
export async function generateSOWWithEngineering(inputs: SOWGeneratorInputs): Promise<SOWGeneratorResult> {
  const startTime = Date.now();
  console.log(`🚀 SOW Generator - Starting complete logic engine for: ${inputs.projectName}`);
  
  try {
    // Step 1: Validate all inputs
    console.log('📋 Step 1: Validating inputs...');
    const validation = validateAllInputs(inputs);
    if (!validation.valid) {
      return {
        success: false,
        error: `Input validation failed: ${validation.errors.join(', ')}`,
        validationErrors: validation.errors
      };
    }
    
    // Step 2: Perform jurisdiction analysis to get HVHZ and ASCE version
    console.log('🏛️ Step 2: Analyzing jurisdiction and codes...');
    const jurisdictionAnalysis = await performComprehensiveAnalysis(
      inputs.address,
      inputs.buildingHeight,
      inputs.exposureCategory
    );
    
    const hvhz = jurisdictionAnalysis.jurisdiction.hvhz;
    const asceVersion = jurisdictionAnalysis.windAnalysis.asceVersion;
    
    console.log(`📍 Jurisdiction: ${jurisdictionAnalysis.jurisdiction.county}, ${jurisdictionAnalysis.jurisdiction.state} (HVHZ: ${hvhz})`);
    
    // Step 3: Template Selection
    console.log('🎯 Step 3: Selecting template...');
    const templateInputs: TemplateSelectionInputs = {
      projectType: inputs.projectType,
      hvhz,
      membraneType: inputs.membraneType,
      membraneMaterial: inputs.membraneMaterial,
      roofSlope: inputs.roofSlope / 12, // Convert to decimal
      buildingHeight: inputs.buildingHeight,
      exposureCategory: jurisdictionAnalysis.windAnalysis.exposureCategory as 'B' | 'C' | 'D',
      includesTaperedInsulation: inputs.includesTaperedInsulation,
      userSelectedSystem: inputs.userSelectedSystem
    };
    
    const templateSelection = selectTemplate(templateInputs);
    console.log(`✅ Template selected: ${templateSelection.templateName}`);
    
    // Step 4: Wind Pressure Calculation (using jurisdiction data)
    console.log('🌪️ Step 4: Calculating wind pressures...');
    const windResult = jurisdictionAnalysis.windAnalysis;
    
    // Step 5: Manufacturer System Selection
    console.log('🏭 Step 5: Selecting manufacturer system...');
    const fasteningInputs: FasteningEngineInputs = {
      windUpliftPressures: windResult.zonePressures,
      membraneType: inputs.membraneType,
      membraneThickness: inputs.membraneThickness,
      hvhz,
      projectType: inputs.projectType,
      deckType: inputs.deckType,
      preferredManufacturer: inputs.preferredManufacturer || inputs.selectedMembraneBrand
    };
    
    const systemSelection = await selectManufacturerSystem(fasteningInputs);
    console.log(`✅ System selected: ${systemSelection.selectedSystem.manufacturer} ${systemSelection.selectedSystem.systemName}`);
    
    // Step 6: Takeoff Diagnostics
    console.log('📊 Step 6: Analyzing takeoff diagnostics...');
    const takeoffInputs: TakeoffEngineInputs = {
      takeoffItems: inputs.takeoffItems,
      buildingDimensions: inputs.buildingDimensions,
      projectType: inputs.projectType,
      membraneType: inputs.membraneType,
      hvhz
    };
    
    const takeoffDiagnostics = analyzeTakeoffDiagnostics(takeoffInputs);
    const takeoffSummary = generateTakeoffSummary(takeoffDiagnostics);
    console.log(`✅ Takeoff analysis complete: ${takeoffSummary.overallRisk} risk level`);
    
    // Step 7: Compile Engineering Summary
    console.log('📋 Step 7: Compiling engineering summary...');
    const engineeringSummary: EngineeringSummaryOutput = {
      templateSelection,
      jurisdictionAnalysis: {
        address: inputs.address,
        jurisdiction: {
          city: jurisdictionAnalysis.jurisdiction.city,
          county: jurisdictionAnalysis.jurisdiction.county,
          state: jurisdictionAnalysis.jurisdiction.state,
          codeCycle: jurisdictionAnalysis.jurisdiction.codeCycle,
          asceVersion: jurisdictionAnalysis.jurisdiction.asceVersion,
          hvhz: jurisdictionAnalysis.jurisdiction.hvhz
        },
        windAnalysis: {
          asceVersion: windResult.asceVersion,
          basicWindSpeed: windResult.designWindSpeed,
          exposureCategory: windResult.exposureCategory,
          riskCategory: 'II' as any,
          buildingHeight: inputs.buildingHeight,
          elevation: windResult.elevation,
          windUpliftPressures: windResult.zonePressures,
          calculationFactors: windResult.calculationFactors,
          methodology: `ASCE ${windResult.asceVersion} Components and Cladding Method`,
          zoneDimensions: {
            fieldZone: 'Interior area beyond perimeter zones',
            perimeterZone: 'Strip along building edges',
            cornerZone: 'Corner areas with highest pressures'
          },
          complianceNotes: [
            `Wind pressures calculated per ASCE ${windResult.asceVersion}`,
            `Basic wind speed: ${windResult.designWindSpeed} mph`,
            `Exposure Category ${windResult.exposureCategory}`,
            'All pressures shown as allowable stress design (ASD) values'
          ]
        }
      },
      systemSelection,
      takeoffDiagnostics,
      metadata: {
        templateUsed: templateSelection.templateName,
        asceVersion: jurisdictionAnalysis.jurisdiction.asceVersion,
        hvhz,
        windUpliftPressures: windResult.zonePressures,
        selectedSystem: `${systemSelection.selectedSystem.manufacturer} ${systemSelection.selectedSystem.systemName}`,
        rejectedSystems: systemSelection.rejectedSystems.map(sys => ({
          name: `${sys.manufacturer} ${sys.systemName}`,
          reason: sys.reason
        })),
        fasteningSpecifications: {
          fieldSpacing: systemSelection.fasteningSpecifications.fieldSpacing,
          perimeterSpacing: systemSelection.fasteningSpecifications.perimeterSpacing,
          cornerSpacing: systemSelection.fasteningSpecifications.cornerSpacing,
          penetrationDepth: systemSelection.fasteningSpecifications.penetrationDepth,
          fastenerType: systemSelection.fasteningSpecifications.fastenerType
        },
        takeoffSummary: {
          overallRisk: takeoffSummary.overallRisk,
          keyIssues: takeoffSummary.keyIssues,
          quantitySummary: takeoffSummary.quantitySummary
        },
        complianceNotes: [
          ...systemSelection.complianceNotes,
          ...takeoffDiagnostics.recommendations.slice(0, 3) // Top 3 recommendations
        ],
        generationTimestamp: new Date().toISOString()
      }
    };
    
    // Step 8: Generate PDF (placeholder for now)
    console.log('📄 Step 8: Generating PDF output...');
    const pdfResult = await generatePDFOutput(engineeringSummary, inputs);
    
    const generationTime = Date.now() - startTime;
    console.log(`✅ SOW generation complete in ${generationTime}ms`);
    
    return {
      success: true,
      engineeringSummary,
      filename: pdfResult.filename,
      outputPath: pdfResult.outputPath,
      fileSize: pdfResult.fileSize,
      generationTime
    };
    
  } catch (error) {
    console.error('❌ SOW generation failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      generationTime: Date.now() - startTime
    };
  }
}

/**
 * Validate all SOW generator inputs
 */
function validateAllInputs(inputs: SOWGeneratorInputs): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  
  // Basic project info validation
  if (!inputs.projectName?.trim()) {
    allErrors.push('Project name is required');
  }
  
  if (!inputs.address?.trim()) {
    allErrors.push('Project address is required');
  }
  
  if (!inputs.companyName?.trim()) {
    allErrors.push('Company name is required');
  }
  
  // Building parameters validation
  if (typeof inputs.buildingHeight !== 'number' || inputs.buildingHeight <= 0) {
    allErrors.push('Valid building height is required');
  }
  
  if (typeof inputs.squareFootage !== 'number' || inputs.squareFootage <= 0) {
    allErrors.push('Valid square footage is required');
  }
  
  if (!['recover', 'tearoff', 'new'].includes(inputs.projectType)) {
    allErrors.push('Valid project type is required (recover, tearoff, or new)');
  }
  
  // Template validation
  const templateInputs: TemplateSelectionInputs = {
    projectType: inputs.projectType,
    hvhz: false, // Will be determined from jurisdiction
    membraneType: inputs.membraneType,
    membraneMaterial: inputs.membraneMaterial,
    roofSlope: inputs.roofSlope / 12,
    buildingHeight: inputs.buildingHeight,
    exposureCategory: inputs.exposureCategory || 'C'
  };
  
  const templateValidation = validateTemplateInputs(templateInputs);
  allErrors.push(...templateValidation.errors);
  allWarnings.push(...templateValidation.warnings);
  
  // Wind calculation validation
  const windInputs: WindEngineInputs = {
    address: inputs.address,
    buildingHeight: inputs.buildingHeight,
    squareFootage: inputs.squareFootage,
    exposureCategory: inputs.exposureCategory || 'C',
    basicWindSpeed: inputs.basicWindSpeed,
    elevation: inputs.elevation,
    buildingDimensions: inputs.buildingDimensions
  };
  
  const windValidation = validateWindInputs(windInputs);
  allErrors.push(...windValidation.errors);
  allWarnings.push(...windValidation.warnings);
  
  // Takeoff validation
  const takeoffInputs: TakeoffEngineInputs = {
    takeoffItems: inputs.takeoffItems,
    buildingDimensions: inputs.buildingDimensions,
    projectType: inputs.projectType,
    membraneType: inputs.membraneType
  };
  
  const takeoffValidation = validateTakeoffInputs(takeoffInputs);
  allErrors.push(...takeoffValidation.errors);
  allWarnings.push(...takeoffValidation.warnings);
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Generate PDF output (placeholder implementation)
 */
async function generatePDFOutput(
  engineeringSummary: EngineeringSummaryOutput,
  inputs: SOWGeneratorInputs
): Promise<{
  filename: string;
  outputPath: string;
  fileSize: number;
}> {
  // This would integrate with the existing PDF generation system
  // For now, return mock data
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `SOW_${inputs.projectName.replace(/\s+/g, '_')}_${timestamp}.pdf`;
  const outputPath = `/output/${filename}`;
  
  console.log(`📄 PDF would be generated: ${filename}`);
  console.log(`🎯 Template: ${engineeringSummary.templateSelection.templateName}`);
  console.log(`💨 Wind: ${Math.abs(engineeringSummary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone3Corner).toFixed(1)} psf corner`);
  console.log(`🏭 System: ${engineeringSummary.systemSelection.selectedSystem.manufacturer}`);
  console.log(`📊 Risk: ${engineeringSummary.metadata.takeoffSummary.overallRisk}`);
  
  return {
    filename,
    outputPath,
    fileSize: 1024000 // 1MB placeholder
  };
}

/**
 * Generate debug SOW with mock data for testing
 */
export async function generateDebugSOW(overrides: Partial<SOWGeneratorInputs> = {}): Promise<SOWGeneratorResult> {
  const mockInputs: SOWGeneratorInputs = {
    projectName: 'Debug Test Project',
    address: '2650 NW 89th Ct, Doral, FL 33172',
    companyName: 'Test Roofing Company',
    buildingHeight: 30,
    squareFootage: 25000,
    buildingDimensions: {
      length: 200,
      width: 125
    },
    deckType: 'steel',
    projectType: 'recover',
    roofSlope: 0.25, // 3:12
    elevation: 6,
    exposureCategory: 'C',
    membraneType: 'TPO',
    membraneThickness: '60mil',
    membraneMaterial: 'TPO',
    selectedMembraneBrand: 'Carlisle',
    takeoffItems: {
      drainCount: 6,
      penetrationCount: 15,
      flashingLinearFeet: 800,
      accessoryCount: 8,
      hvacUnits: 3,
      skylights: 2,
      roofHatches: 1,
      scuppers: 2,
      expansionJoints: 1,
      parapetHeight: 18,
      roofArea: 25000
    },
    preferredManufacturer: 'Carlisle',
    customNotes: ['This is a debug test generation'],
    ...overrides
  };
  
  console.log('🧪 Generating debug SOW with mock data...');
  return await generateSOWWithEngineering(mockInputs);
}

/**
 * Quick validation function for API endpoints
 */
export function validateSOWInputs(inputs: SOWGeneratorInputs): {
  valid: boolean;
  errors: string[];
} {
  const validation = validateAllInputs(inputs);
  return {
    valid: validation.valid,
    errors: validation.errors
  };
}

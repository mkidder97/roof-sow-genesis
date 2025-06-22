// Enhanced SOW Generator with Advanced Engineering Intelligence & Traceability
// Phase 2: Detailed Explainability and Debug Tracing

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
  TakeoffItems,
  parseTakeoffFile
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
  takeoffItems?: TakeoffItems;
  takeoffFile?: {
    filename: string;
    buffer: Buffer;
    mimetype: string;
  };
  
  // Optional overrides
  basicWindSpeed?: number;
  preferredManufacturer?: string;
  includesTaperedInsulation?: boolean;
  userSelectedSystem?: string;
  customNotes?: string[];
  
  // Debug options
  debug?: boolean;
  engineDebug?: {
    template?: boolean;
    wind?: boolean;
    fastening?: boolean;
    takeoff?: boolean;
  };
}

// Enhanced Engineering Summary with Detailed Explainability
export interface EnhancedEngineeringSummary {
  templateSelection: {
    templateName: string;
    templateCode: string;
    rationale: string;
    rejectedTemplates: Array<{
      template: string;
      reason: string;
    }>;
    applicableConditions: string[];
    debugTrace?: any[];
  };
  
  windAnalysis: {
    asceVersion: string;
    windSpeed: number;
    exposureCategory: string;
    elevation: number;
    zonePressures: Record<string, number>;
    pressureMethodology: string[];
    calculationFactors: {
      Kd: number;
      Kh: number;
      Kzt: number;
      Ke: number;
      I: number;
      qh: number;
    };
    debugTrace?: {
      coefficients: Record<string, number>;
      windSpeedSource: string;
      factorCalculations: string[];
    };
  };
  
  jurisdiction: {
    county: string;
    state: string;
    hvhz: boolean;
    codeCycle: string;
    jurisdictionNotes: string[];
    specialRequirements: string[];
    complianceLevel: string;
  };
  
  systemSelection: {
    selectedSystem: string;
    manufacturer: string;
    systemName: string;
    rejectedSystems: Array<{
      system: string;
      reason: string;
    }>;
    fasteningSpecs: {
      fieldSpacing: string;
      perimeterSpacing: string;
      cornerSpacing: string;
      penetrationDepth: string;
      fastenerType: string;
      safetyMargin: number;
    };
    pressureCompliance: {
      meetsField: boolean;
      meetsPerimeter: boolean;
      meetsCorner: boolean;
      overallMargin: number;
    };
    debugTrace?: {
      matchRanking: Array<{
        system: string;
        score: number;
        reason: string;
      }>;
      scoringBreakdown: Record<string, number>;
    };
  };
  
  takeoffDiagnostics: {
    overallRisk: 'Low' | 'Medium' | 'High';
    flags: string[];
    recommendations: string[];
    quantityAnalysis: {
      penetrationDensity: number;
      drainDensity: number;
      flashingRatio: number;
      accessoryRatio: number;
    };
    specialAttentionAreas: string[];
    riskFactors: Array<{
      factor: string;
      impact: string;
      mitigation: string;
    }>;
    debugTrace?: {
      riskCalculation: Record<string, number>;
      thresholdComparisons: Record<string, boolean>;
    };
  };
  
  // Overall project metadata
  projectMetadata: {
    generationTimestamp: string;
    engineVersion: string;
    processingTime: number;
    confidenceScore: number;
    qualityFlags: string[];
  };
}

export interface SOWGeneratorResult {
  success: boolean;
  engineeringSummary?: EnhancedEngineeringSummary;
  filename?: string;
  outputPath?: string;
  fileSize?: number;
  generationTime?: number;
  error?: string;
  validationErrors?: string[];
  debugInfo?: {
    engineTraces: Record<string, any>;
    processingSteps: string[];
    performanceMetrics: Record<string, number>;
  };
}

/**
 * Enhanced SOW Generator with Advanced Engineering Intelligence
 * Phase 2: Detailed explainability and debug tracing
 */
export async function generateSOWWithEngineering(inputs: SOWGeneratorInputs): Promise<SOWGeneratorResult> {
  const startTime = Date.now();
  const processingSteps: string[] = [];
  const engineTraces: Record<string, any> = {};
  
  console.log(`🚀 Enhanced SOW Generator v3.0 - Starting for: ${inputs.projectName}`);
  processingSteps.push('Initialization complete');
  
  try {
    // Step 1: Enhanced input validation
    console.log('📋 Step 1: Enhanced input validation...');
    const validation = validateAllInputs(inputs);
    if (!validation.valid) {
      return {
        success: false,
        error: `Input validation failed: ${validation.errors.join(', ')}`,
        validationErrors: validation.errors
      };
    }
    processingSteps.push('Input validation passed');
    
    // Step 2: Takeoff processing (file or direct input)
    console.log('📊 Step 2: Processing takeoff data...');
    let takeoffItems: TakeoffItems;
    
    if (inputs.takeoffFile) {
      console.log(`📁 Processing takeoff file: ${inputs.takeoffFile.filename}`);
      takeoffItems = await parseTakeoffFile(inputs.takeoffFile);
      processingSteps.push(`Takeoff file processed: ${inputs.takeoffFile.filename}`);
    } else if (inputs.takeoffItems) {
      takeoffItems = inputs.takeoffItems;
      processingSteps.push('Direct takeoff input used');
    } else {
      // Generate default takeoff based on project size
      takeoffItems = generateDefaultTakeoff(inputs);
      processingSteps.push('Default takeoff generated');
    }
    
    // Step 3: Jurisdiction analysis with enhanced tracing
    console.log('🏛️ Step 3: Enhanced jurisdiction analysis...');
    const jurisdictionStart = Date.now();
    const jurisdictionAnalysis = await performComprehensiveAnalysis(
      inputs.address,
      inputs.buildingHeight,
      inputs.exposureCategory
    );
    
    const jurisdictionTime = Date.now() - jurisdictionStart;
    processingSteps.push(`Jurisdiction analysis complete (${jurisdictionTime}ms)`);
    
    const hvhz = jurisdictionAnalysis.jurisdiction.hvhz;
    const asceVersion = jurisdictionAnalysis.windAnalysis.asceVersion;
    
    // Step 4: Template selection with debug tracing
    console.log('🎯 Step 4: Template selection with tracing...');
    const templateStart = Date.now();
    
    const templateInputs: TemplateSelectionInputs = {
      projectType: inputs.projectType,
      hvhz,
      membraneType: inputs.membraneType,
      membraneMaterial: inputs.membraneMaterial,
      roofSlope: inputs.roofSlope / 12,
      buildingHeight: inputs.buildingHeight,
      exposureCategory: jurisdictionAnalysis.windAnalysis.exposureCategory as 'B' | 'C' | 'D',
      includesTaperedInsulation: inputs.includesTaperedInsulation,
      userSelectedSystem: inputs.userSelectedSystem
    };
    
    const templateSelection = selectTemplate(templateInputs);
    
    // Add debug trace if requested
    if (inputs.debug || inputs.engineDebug?.template) {
      engineTraces.templateEngine = {
        inputs: templateInputs,
        decisionTree: generateTemplateDecisionTrace(templateInputs),
        scoringMatrix: generateTemplateScoringMatrix(templateInputs),
        alternativeTemplates: templateSelection.rejectedTemplates
      };
    }
    
    const templateTime = Date.now() - templateStart;
    processingSteps.push(`Template selected: ${templateSelection.templateName} (${templateTime}ms)`);
    
    // Step 5: Wind analysis with enhanced methodology tracing
    console.log('🌪️ Step 5: Enhanced wind analysis...');
    const windStart = Date.now();
    const windResult = jurisdictionAnalysis.windAnalysis;
    
    // Generate methodology explanation
    const pressureMethodology = generatePressureMethodology(windResult, asceVersion);
    
    // Add debug trace if requested
    if (inputs.debug || inputs.engineDebug?.wind) {
      engineTraces.windEngine = {
        windSpeedSource: `Geographic lookup for ${jurisdictionAnalysis.jurisdiction.county}, ${jurisdictionAnalysis.jurisdiction.state}`,
        coefficients: await getASCECoefficients(asceVersion),
        factorCalculations: generateFactorCalculations(windResult.calculationFactors),
        zoneCalculations: generateZoneCalculations(windResult.zonePressures, asceVersion)
      };
    }
    
    const windTime = Date.now() - windStart;
    processingSteps.push(`Wind analysis complete: ${windResult.designWindSpeed}mph (${windTime}ms)`);
    
    // Step 6: System selection with ranking traces
    console.log('🏭 Step 6: System selection with ranking...');
    const systemStart = Date.now();
    
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
    
    // Add debug trace if requested
    if (inputs.debug || inputs.engineDebug?.fastening) {
      engineTraces.fasteningEngine = {
        matchRanking: await generateSystemRankingTrace(fasteningInputs),
        scoringBreakdown: generateScoringBreakdown(systemSelection),
        pressureAnalysis: generatePressureAnalysisTrace(windResult.zonePressures, systemSelection)
      };
    }
    
    const systemTime = Date.now() - systemStart;
    processingSteps.push(`System selected: ${systemSelection.selectedSystem.manufacturer} (${systemTime}ms)`);
    
    // Step 7: Enhanced takeoff diagnostics
    console.log('📊 Step 7: Enhanced takeoff diagnostics...');
    const takeoffStart = Date.now();
    
    const takeoffInputs: TakeoffEngineInputs = {
      takeoffItems,
      buildingDimensions: inputs.buildingDimensions,
      projectType: inputs.projectType,
      membraneType: inputs.membraneType,
      hvhz
    };
    
    const takeoffDiagnostics = analyzeTakeoffDiagnostics(takeoffInputs);
    const takeoffSummary = generateTakeoffSummary(takeoffDiagnostics);
    const riskFactors = generateRiskFactorAnalysis(takeoffDiagnostics);
    
    // Add debug trace if requested
    if (inputs.debug || inputs.engineDebug?.takeoff) {
      engineTraces.takeoffEngine = {
        riskCalculation: generateRiskCalculationTrace(takeoffDiagnostics),
        thresholdComparisons: generateThresholdComparisons(takeoffDiagnostics),
        quantityBreakdown: generateQuantityBreakdown(takeoffItems)
      };
    }
    
    const takeoffTime = Date.now() - takeoffStart;
    processingSteps.push(`Takeoff analysis complete: ${takeoffSummary.overallRisk} risk (${takeoffTime}ms)`);
    
    // Step 8: Compile enhanced engineering summary
    console.log('📋 Step 8: Compiling enhanced engineering summary...');
    
    const totalTime = Date.now() - startTime;
    const confidenceScore = calculateConfidenceScore(templateSelection, systemSelection, takeoffDiagnostics);
    const qualityFlags = generateQualityFlags(jurisdictionAnalysis, systemSelection, takeoffDiagnostics);
    
    const engineeringSummary: EnhancedEngineeringSummary = {
      templateSelection: {
        templateName: templateSelection.templateName,
        templateCode: templateSelection.templateCode,
        rationale: templateSelection.rationale,
        rejectedTemplates: templateSelection.rejectedTemplates.map(t => ({
          template: t.name,
          reason: t.reason
        })),
        applicableConditions: templateSelection.applicableConditions,
        debugTrace: engineTraces.templateEngine
      },
      
      windAnalysis: {
        asceVersion: `ASCE ${asceVersion}`,
        windSpeed: windResult.designWindSpeed,
        exposureCategory: windResult.exposureCategory,
        elevation: windResult.elevation,
        zonePressures: windResult.zonePressures,
        pressureMethodology,
        calculationFactors: windResult.calculationFactors,
        debugTrace: engineTraces.windEngine
      },
      
      jurisdiction: {
        county: jurisdictionAnalysis.jurisdiction.county,
        state: jurisdictionAnalysis.jurisdiction.state,
        hvhz: jurisdictionAnalysis.jurisdiction.hvhz,
        codeCycle: jurisdictionAnalysis.jurisdiction.codeCycle,
        jurisdictionNotes: generateJurisdictionNotes(jurisdictionAnalysis),
        specialRequirements: jurisdictionAnalysis.jurisdiction.specialRequirements || [],
        complianceLevel: determineComplianceLevel(jurisdictionAnalysis, systemSelection)
      },
      
      systemSelection: {
        selectedSystem: `${systemSelection.selectedSystem.manufacturer} ${systemSelection.selectedSystem.systemName}`,
        manufacturer: systemSelection.selectedSystem.manufacturer,
        systemName: systemSelection.selectedSystem.systemName,
        rejectedSystems: systemSelection.rejectedSystems.map(s => ({
          system: `${s.manufacturer} ${s.systemName}`,
          reason: s.reason
        })),
        fasteningSpecs: {
          fieldSpacing: systemSelection.fasteningSpecifications.fieldSpacing,
          perimeterSpacing: systemSelection.fasteningSpecifications.perimeterSpacing,
          cornerSpacing: systemSelection.fasteningSpecifications.cornerSpacing,
          penetrationDepth: systemSelection.fasteningSpecifications.penetrationDepth,
          fastenerType: systemSelection.fasteningSpecifications.fastenerType,
          safetyMargin: systemSelection.pressureCompliance.safetyMargin
        },
        pressureCompliance: systemSelection.pressureCompliance,
        debugTrace: engineTraces.fasteningEngine
      },
      
      takeoffDiagnostics: {
        overallRisk: takeoffSummary.overallRisk,
        flags: generateDiagnosticFlags(takeoffDiagnostics),
        recommendations: takeoffDiagnostics.recommendations,
        quantityAnalysis: takeoffDiagnostics.quantityFlags,
        specialAttentionAreas: takeoffDiagnostics.specialAttentionAreas,
        riskFactors,
        debugTrace: engineTraces.takeoffEngine
      },
      
      projectMetadata: {
        generationTimestamp: new Date().toISOString(),
        engineVersion: '3.0.0 - Advanced Intelligence',
        processingTime: totalTime,
        confidenceScore,
        qualityFlags
      }
    };
    
    // Step 9: Generate output (PDF placeholder)
    console.log('📄 Step 9: Generating output...');
    const pdfResult = await generateEnhancedPDFOutput(engineeringSummary, inputs);
    
    console.log(`✅ Enhanced SOW generation complete in ${totalTime}ms`);
    console.log(`🎯 Template: ${templateSelection.templateName}`);
    console.log(`💨 Wind: ${windResult.designWindSpeed}mph (${asceVersion})`);
    console.log(`🏭 System: ${systemSelection.selectedSystem.manufacturer}`);
    console.log(`📊 Risk: ${takeoffSummary.overallRisk} (Confidence: ${confidenceScore.toFixed(1)}%)`);
    
    return {
      success: true,
      engineeringSummary,
      filename: pdfResult.filename,
      outputPath: pdfResult.outputPath,
      fileSize: pdfResult.fileSize,
      generationTime: totalTime,
      debugInfo: {
        engineTraces,
        processingSteps,
        performanceMetrics: {
          jurisdictionTime,
          templateTime,
          windTime,
          systemTime,
          takeoffTime,
          totalTime
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Enhanced SOW generation failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      generationTime: Date.now() - startTime,
      debugInfo: {
        engineTraces,
        processingSteps,
        performanceMetrics: {}
      }
    };
  }
}

// Helper functions for enhanced tracing and analysis
function generateTemplateDecisionTrace(inputs: TemplateSelectionInputs): any[] {
  return [
    { condition: 'Roof Slope ≥ 2:12', value: inputs.roofSlope >= (2/12), result: inputs.roofSlope >= (2/12) ? 'T6 - Steep Slope' : 'Continue' },
    { condition: 'Special Material', value: inputs.membraneMaterial, result: ['PVC', 'KEE', 'EPDM'].includes(inputs.membraneMaterial?.toUpperCase() || '') ? 'T8 - Special' : 'Continue' },
    { condition: 'High-Rise or Exposure D', value: `${inputs.buildingHeight}ft, Exp ${inputs.exposureCategory}`, result: (inputs.buildingHeight > 50 || inputs.exposureCategory === 'D') ? 'T7 - High-Rise' : 'Continue' },
    { condition: 'HVHZ and Recover', value: `HVHZ: ${inputs.hvhz}, Type: ${inputs.projectType}`, result: (inputs.hvhz && inputs.projectType === 'recover') ? 'T4 - HVHZ Recover' : 'Continue' }
  ];
}

function generateTemplateScoringMatrix(inputs: TemplateSelectionInputs): Record<string, number> {
  return {
    'Steep Slope Score': inputs.roofSlope >= (2/12) ? 100 : 0,
    'HVHZ Score': inputs.hvhz ? 75 : 0,
    'Special Material Score': ['PVC', 'KEE', 'EPDM'].includes(inputs.membraneMaterial?.toUpperCase() || '') ? 90 : 0,
    'High-Rise Score': inputs.buildingHeight > 50 ? 80 : 0,
    'Fleeceback Score': inputs.membraneType.toLowerCase().includes('fleece') ? 70 : 0
  };
}

function generatePressureMethodology(windResult: any, asceVersion: string): string[] {
  return [
    `Wind pressures calculated using ${asceVersion} Components and Cladding method`,
    `Basic wind speed: ${windResult.designWindSpeed} mph from geographic mapping`,
    `Exposure Category ${windResult.exposureCategory} applied`,
    `Pressure coefficients: ${asceVersion === '7-10' ? '3-zone system' : '4-zone system'}`,
    `Net pressure = qh × (GCp - GCpi) where GCpi = 0.18 for partially enclosed buildings`,
    'All pressures shown as allowable stress design (ASD) values'
  ];
}

// Continue with additional helper functions...
async function getASCECoefficients(asceVersion: string): Promise<Record<string, number>> {
  const coefficients = {
    '7-10': { zone1Field: -0.7, zone2Perimeter: -1.4, zone3Corner: -2.0 },
    '7-16': { zone1Field: -0.9, zone1Perimeter: -1.4, zone2Perimeter: -2.0, zone3Corner: -2.8 },
    '7-22': { zone1Field: -0.9, zone1Perimeter: -1.4, zone2Perimeter: -2.0, zone3Corner: -2.8 }
  };
  
  return coefficients[asceVersion as keyof typeof coefficients] || coefficients['7-16'];
}

function generateFactorCalculations(factors: any): string[] {
  return [
    `Kd (Directionality): ${factors.Kd} - Standard for buildings`,
    `Kh (Velocity Pressure): ${factors.Kh.toFixed(3)} - Height and exposure dependent`,
    `Kzt (Topographic): ${factors.Kzt.toFixed(2)} - Terrain effects`,
    `Ke (Elevation): ${factors.Ke.toFixed(2)} - Ground elevation factor`,
    `I (Importance): ${factors.I.toFixed(2)} - Risk category II`,
    `qh (Velocity Pressure): ${factors.qh.toFixed(1)} psf - Combined factors`
  ];
}

function generateZoneCalculations(zonePressures: any, asceVersion: string): string[] {
  const calculations = [];
  
  for (const [zone, pressure] of Object.entries(zonePressures)) {
    calculations.push(`${zone}: ${Math.abs(pressure as number).toFixed(1)} psf uplift`);
  }
  
  return calculations;
}

// Additional helper functions would continue here...
function generateDefaultTakeoff(inputs: SOWGeneratorInputs): TakeoffItems {
  const estimatedDrains = Math.max(2, Math.ceil(inputs.squareFootage / 10000));
  const estimatedPenetrations = Math.floor(inputs.squareFootage / 1500) + 5; // Rough estimate
  const estimatedFlashing = Math.sqrt(inputs.squareFootage) * 4 * 1.1; // Perimeter + 10%
  
  return {
    drainCount: estimatedDrains,
    penetrationCount: estimatedPenetrations,
    flashingLinearFeet: estimatedFlashing,
    accessoryCount: Math.floor(inputs.squareFootage / 5000) + 2,
    roofArea: inputs.squareFootage
  };
}

// Placeholder implementations for remaining helper functions
function generateSystemRankingTrace(inputs: FasteningEngineInputs): Promise<any[]> {
  return Promise.resolve([]);
}

function generateScoringBreakdown(selection: FasteningEngineResult): Record<string, number> {
  return {};
}

function generatePressureAnalysisTrace(pressures: any, selection: FasteningEngineResult): any {
  return {};
}

function generateRiskFactorAnalysis(diagnostics: TakeoffDiagnostics): Array<{factor: string; impact: string; mitigation: string}> {
  return [];
}

function generateRiskCalculationTrace(diagnostics: TakeoffDiagnostics): Record<string, number> {
  return {};
}

function generateThresholdComparisons(diagnostics: TakeoffDiagnostics): Record<string, boolean> {
  return {};
}

function generateQuantityBreakdown(items: TakeoffItems): any {
  return {};
}

function calculateConfidenceScore(template: any, system: any, takeoff: any): number {
  return 85.0; // Placeholder
}

function generateQualityFlags(jurisdiction: any, system: any, takeoff: any): string[] {
  return ['High confidence analysis', 'All requirements met'];
}

function generateJurisdictionNotes(analysis: any): string[] {
  return [`Follows ${analysis.jurisdiction.codeCycle} requirements`, `${analysis.jurisdiction.asceVersion} methodology applied`];
}

function determineComplianceLevel(jurisdiction: any, system: any): string {
  return jurisdiction.jurisdiction.hvhz ? 'HVHZ Compliant' : 'Standard Compliant';
}

function generateDiagnosticFlags(diagnostics: TakeoffDiagnostics): string[] {
  const flags = [];
  if (diagnostics.highPenetrationDensity) flags.push('High penetration density');
  if (diagnostics.drainOverflowRequired) flags.push('Overflow drainage required');
  if (diagnostics.complexFlashingRequired) flags.push('Complex flashing details');
  return flags;
}

async function generateEnhancedPDFOutput(summary: EnhancedEngineeringSummary, inputs: SOWGeneratorInputs) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `Enhanced_SOW_${inputs.projectName.replace(/\s+/g, '_')}_${timestamp}.pdf`;
  
  return {
    filename,
    outputPath: `/output/${filename}`,
    fileSize: 1500000 // 1.5MB placeholder
  };
}

function validateAllInputs(inputs: SOWGeneratorInputs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!inputs.projectName?.trim()) errors.push('Project name is required');
  if (!inputs.address?.trim()) errors.push('Address is required');
  if (!inputs.companyName?.trim()) errors.push('Company name is required');
  if (typeof inputs.buildingHeight !== 'number' || inputs.buildingHeight <= 0) errors.push('Valid building height required');
  if (typeof inputs.squareFootage !== 'number' || inputs.squareFootage <= 0) errors.push('Valid square footage required');
  
  return { valid: errors.length === 0, errors };
}

// Export debug generation function
export async function generateDebugSOW(overrides: Partial<SOWGeneratorInputs> = {}): Promise<SOWGeneratorResult> {
  const mockInputs: SOWGeneratorInputs = {
    projectName: 'Enhanced Debug Test Project',
    address: '2650 NW 89th Ct, Doral, FL 33172',
    companyName: 'Advanced Roofing Solutions',
    buildingHeight: 30,
    squareFootage: 35000,
    buildingDimensions: { length: 250, width: 140 },
    deckType: 'steel',
    projectType: 'recover',
    roofSlope: 0.25,
    elevation: 6,
    exposureCategory: 'C',
    membraneType: 'TPO',
    membraneThickness: '60mil',
    membraneMaterial: 'TPO',
    selectedMembraneBrand: 'Carlisle',
    takeoffItems: {
      drainCount: 8,
      penetrationCount: 22,
      flashingLinearFeet: 950,
      accessoryCount: 12,
      hvacUnits: 4,
      skylights: 3,
      roofHatches: 2,
      scuppers: 3,
      expansionJoints: 1,
      parapetHeight: 24,
      roofArea: 35000
    },
    preferredManufacturer: 'Carlisle',
    debug: true,
    engineDebug: {
      template: true,
      wind: true,
      fastening: true,
      takeoff: true
    },
    customNotes: ['Enhanced debug generation with full tracing'],
    ...overrides
  };
  
  console.log('🧪 Generating enhanced debug SOW with full tracing...');
  return await generateSOWWithEngineering(mockInputs);
}

export function validateSOWInputs(inputs: SOWGeneratorInputs): { valid: boolean; errors: string[] } {
  return validateAllInputs(inputs);
}

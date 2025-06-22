import { v4 as uuidv4 } from 'uuid';
import {
  SOWPayload,
  EngineeringSummaryData,
  SelfHealingAction,
  SectionAnalysis
} from '../server/types/index';
import { TemplateEngine } from './template-engine';
import { WindAnalysisEngine } from './wind-analysis-engine';
import { FasteningEngine } from './fastening-engine';
import { JurisdictionEngine } from './jurisdiction-engine';
import { TakeoffEngine } from './takeoff-engine';
import { SectionEngine } from './section-engine';

interface EngineDebugConfig {
  template?: boolean;
  wind?: boolean;
  fastening?: boolean;
  takeoff?: boolean;
  sections?: boolean;
}

interface SOWGeneratorParams extends SOWPayload {
  debug?: boolean;
  engineDebug?: EngineDebugConfig;
}

interface SOWGeneratorResult {
  success: boolean;
  filename?: string;
  outputPath?: string;
  fileSize?: number;
  generationTime?: number;
  metadata?: {
    projectName: string;
    template: string;
    windPressure: string;
    attachmentMethod?: string;
    jurisdiction?: {
      county: string;
      state: string;
      codeCycle: string;
      asceVersion: string;
      hvhz: boolean;
    };
    engineeringSummary?: EngineeringSummaryData;
  };
  uploadedFiles?: string[];
  error?: string;
  debugInfo?: {
    processingSteps: string[];
    engineTraces: Record<string, any>;
  };
}

export async function generateSOWWithEngineering(params: SOWGeneratorParams): Promise<SOWGeneratorResult> {
  const startTime = Date.now();
  const processingSteps: string[] = [];
  const engineTraces: Record<string, any> = {};

  try {
    // 1. Validate Inputs
    processingSteps.push('Validating inputs...');
    validateSOWInputs(params);

    // 2. Geocode Address
    processingSteps.push('Geocoding address...');
    const geocodeResult = await JurisdictionEngine.geocodeAddress(params.address);
    if (!geocodeResult) {
      throw new Error('Geocoding failed: Could not determine location.');
    }

    // 3. Determine Jurisdiction
    processingSteps.push('Determining jurisdiction...');
    const jurisdictionData = await JurisdictionEngine.determineJurisdiction(geocodeResult.latitude, geocodeResult.longitude);
    if (!jurisdictionData) {
      throw new Error('Jurisdiction determination failed.');
    }

    // 4. Wind Analysis
    processingSteps.push('Performing wind analysis...');
    const windAnalysisParams = {
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      elevation: params.elevation || geocodeResult.elevation,
      exposureCategory: params.exposureCategory || 'C',
      buildingHeight: params.buildingHeight,
      asceVersion: jurisdictionData.asceVersion,
    };

    if (params.debug && params.engineDebug?.wind) {
      engineTraces.windEngine = windAnalysisParams;
    }

    const windAnalysisResult = await WindAnalysisEngine.performWindAnalysis(windAnalysisParams);
    if (!windAnalysisResult) {
      throw new Error('Wind analysis failed.');
    }

    // 5. Template Selection
    processingSteps.push('Selecting template...');
    const templateSelectionParams = {
      projectType: params.projectType,
      deckType: params.deckType,
      membraneThickness: params.membraneThickness,
      hvhz: jurisdictionData.hvhz,
      windPressures: windAnalysisResult.zonePressures,
    };

    if (params.debug && params.engineDebug?.template) {
      engineTraces.templateEngine = templateSelectionParams;
    }

    const templateSelectionResult = await TemplateEngine.selectTemplate(templateSelectionParams);
    if (!templateSelectionResult) {
      throw new Error('Template selection failed.');
    }

    // 6. Fastening Specs
    processingSteps.push('Calculating fastening specifications...');
    const fasteningParams = {
      windSpeed: windAnalysisResult.designWindSpeed,
      zonePressures: windAnalysisResult.zonePressures,
      template: templateSelectionResult.template,
      hvhz: jurisdictionData.hvhz,
    };

    if (params.debug && params.engineDebug?.fastening) {
      engineTraces.fasteningEngine = fasteningParams;
    }

    const fasteningSpecs = await FasteningEngine.calculateFastening(fasteningParams);
    if (!fasteningSpecs) {
      throw new Error('Fastening calculation failed.');
    }

    // 7. Takeoff Analysis
    processingSteps.push('Performing takeoff analysis...');
    const takeoffParams = {
      squareFootage: params.squareFootage,
      buildingHeight: params.buildingHeight,
      buildingDimensions: params.buildingDimensions,
      projectType: params.projectType,
    };

    if (params.debug && params.engineDebug?.takeoff) {
      engineTraces.takeoffEngine = takeoffParams;
    }

    const takeoffDiagnostics = await TakeoffEngine.analyzeTakeoff(takeoffParams);

    // 8. Section Engine
    processingSteps.push('Running section engine...');
    const sectionEngineParams = {
      projectType: params.projectType,
      buildingHeight: params.buildingHeight,
      roofSlope: params.roofSlope,
      hvhz: jurisdictionData.hvhz,
      windSpeed: windAnalysisResult.designWindSpeed,
    };

    if (params.debug && params.engineDebug?.sections) {
      engineTraces.sectionEngine = sectionEngineParams;
    }

    const sectionAnalysis = await SectionEngine.analyzeSections(sectionEngineParams);

    // 9. Engineering Summary
    processingSteps.push('Compiling engineering summary...');
    const engineeringSummary: EngineeringSummaryData = {
      jurisdiction: {
        city: geocodeResult.city,
        county: geocodeResult.county,
        state: geocodeResult.state,
        codeCycle: jurisdictionData.codeCycle,
        asceVersion: jurisdictionData.asceVersion,
        hvhz: jurisdictionData.hvhz,
      },
      windAnalysis: {
        windSpeed: String(windAnalysisResult.designWindSpeed),
        exposure: windAnalysisResult.exposureCategory,
        elevation: String(windAnalysisResult.elevation),
        zonePressures: {
          zone1Field: String(windAnalysisResult.zonePressures.zone1Field),
          zone1Perimeter: String(windAnalysisResult.zonePressures.zone1Perimeter),
          zone2Perimeter: String(windAnalysisResult.zonePressures.zone2Perimeter),
          zone3Corner: String(windAnalysisResult.zonePressures.zone3Corner),
        },
      },
      systemSelection: {
        selectedTemplate: templateSelectionResult.template,
        rationale: templateSelectionResult.rationale,
        rejectedManufacturers: [],
        approvalSource: [],
      },
      attachmentSpec: {
        fieldSpacing: fasteningSpecs.fieldSpacing,
        perimeterSpacing: fasteningSpecs.perimeterSpacing,
        cornerSpacing: fasteningSpecs.cornerSpacing,
        penetrationDepth: '3 inches',
        notes: 'Standard fastening pattern',
      },
      sectionAnalysis: {
        includedSections: sectionAnalysis.includedSections.map(section => ({
          id: section.id,
          title: section.title,
          rationale: section.rationale,
        })),
        excludedSections: sectionAnalysis.excludedSections.map(section => ({
          id: section.id,
          title: section.title,
          rationale: section.rationale,
        })),
        reasoningMap: sectionAnalysis.reasoningMap,
        selfHealingActions: [],
        confidenceScore: 0.95,
      }
    };

    // 10. Generate SOW Document (Mock)
    processingSteps.push('Generating SOW document (mock)...');
    const filename = `${params.projectName.replace(/\s+/g, '_')}_SOW_${uuidv4()}.pdf`;
    const outputPath = `/tmp/${filename}`;

    // Simulate file creation
    processingSteps.push('Simulating file creation...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = {
      success: true,
      filename: filename,
      outputPath: outputPath,
      fileSize: 123456,
      generationTime: Date.now() - startTime,
      metadata: {
        projectName: params.projectName,
        template: templateSelectionResult.template,
        windPressure: String(windAnalysisResult.designWindSpeed),
        attachmentMethod: templateSelectionResult.attachmentMethod,
        jurisdiction: {
          county: geocodeResult.county,
          state: geocodeResult.state,
          codeCycle: jurisdictionData.codeCycle,
          asceVersion: jurisdictionData.asceVersion,
          hvhz: jurisdictionData.hvhz,
        },
        engineeringSummary: engineeringSummary,
      },
      debugInfo: params.debug ? { processingSteps, engineTraces } : undefined,
    };

    console.log('✅ SOW Generation completed successfully.');
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ SOW Generation failed:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      generationTime: Date.now() - startTime
    };
  }
}

export async function generateDebugSOW(params: SOWGeneratorParams): Promise<SOWGeneratorResult> {
  const startTime = Date.now();
  const processingSteps: string[] = [];
  const engineTraces: Record<string, any> = {};

  try {
    // 1. Validate Inputs
    processingSteps.push('Validating inputs...');
    validateSOWInputs(params);

    // 2. Geocode Address
    processingSteps.push('Geocoding address...');
    const geocodeResult = await JurisdictionEngine.geocodeAddress(params.address);
    if (!geocodeResult) {
      throw new Error('Geocoding failed: Could not determine location.');
    }

    // 3. Determine Jurisdiction
    processingSteps.push('Determining jurisdiction...');
    const jurisdictionData = await JurisdictionEngine.determineJurisdiction(geocodeResult.latitude, geocodeResult.longitude);
    if (!jurisdictionData) {
      throw new Error('Jurisdiction determination failed.');
    }

    // 4. Wind Analysis
    processingSteps.push('Performing wind analysis...');
    const windAnalysisParams = {
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      elevation: params.elevation || geocodeResult.elevation,
      exposureCategory: params.exposureCategory || 'C',
      buildingHeight: params.buildingHeight,
      asceVersion: jurisdictionData.asceVersion,
    };

    if (params.debug && params.engineDebug?.wind) {
      engineTraces.windEngine = windAnalysisParams;
    }

    const windAnalysisResult = await WindAnalysisEngine.performWindAnalysis(windAnalysisParams);
    if (!windAnalysisResult) {
      throw new Error('Wind analysis failed.');
    }

    // 5. Template Selection
    processingSteps.push('Selecting template...');
    const templateSelectionParams = {
      projectType: params.projectType,
      deckType: params.deckType,
      membraneThickness: params.membraneThickness,
      hvhz: jurisdictionData.hvhz,
      windPressures: windAnalysisResult.zonePressures,
    };

    if (params.debug && params.engineDebug?.template) {
      engineTraces.templateEngine = templateSelectionParams;
    }

    const templateSelectionResult = await TemplateEngine.selectTemplate(templateSelectionParams);
    if (!templateSelectionResult) {
      throw new Error('Template selection failed.');
    }

    // 6. Fastening Specs
    processingSteps.push('Calculating fastening specifications...');
    const fasteningParams = {
      windSpeed: windAnalysisResult.designWindSpeed,
      zonePressures: windAnalysisResult.zonePressures,
      template: templateSelectionResult.template,
      hvhz: jurisdictionData.hvhz,
    };

    if (params.debug && params.engineDebug?.fastening) {
      engineTraces.fasteningEngine = fasteningParams;
    }

    const fasteningSpecs = await FasteningEngine.calculateFastening(fasteningParams);
    if (!fasteningSpecs) {
      throw new Error('Fastening calculation failed.');
    }

    // 7. Takeoff Analysis
    processingSteps.push('Performing takeoff analysis...');
    const takeoffParams = {
      squareFootage: params.squareFootage,
      buildingHeight: params.buildingHeight,
      buildingDimensions: params.buildingDimensions,
      projectType: params.projectType,
    };

    if (params.debug && params.engineDebug?.takeoff) {
      engineTraces.takeoffEngine = takeoffParams;
    }

    const takeoffDiagnostics = await TakeoffEngine.analyzeTakeoff(takeoffParams);

    // 8. Section Engine
    processingSteps.push('Running section engine...');
    const sectionEngineParams = {
      projectType: params.projectType,
      buildingHeight: params.buildingHeight,
      roofSlope: params.roofSlope,
      hvhz: jurisdictionData.hvhz,
      windSpeed: windAnalysisResult.designWindSpeed,
    };

    if (params.debug && params.engineDebug?.sections) {
      engineTraces.sectionEngine = sectionEngineParams;
    }

    const sectionAnalysis = await SectionEngine.analyzeSections(sectionEngineParams);

    // 9. Engineering Summary
    processingSteps.push('Compiling engineering summary...');
    const engineeringSummary: EngineeringSummaryData = {
      jurisdiction: {
        city: geocodeResult.city,
        county: geocodeResult.county,
        state: geocodeResult.state,
        codeCycle: jurisdictionData.codeCycle,
        asceVersion: jurisdictionData.asceVersion,
        hvhz: jurisdictionData.hvhz,
      },
      windAnalysis: {
        windSpeed: String(windAnalysisResult.designWindSpeed),
        exposure: windAnalysisResult.exposureCategory,
        elevation: String(windAnalysisResult.elevation),
        zonePressures: {
          zone1Field: String(windAnalysisResult.zonePressures.zone1Field),
          zone1Perimeter: String(windAnalysisResult.zonePressures.zone1Perimeter),
          zone2Perimeter: String(windAnalysisResult.zonePressures.zone2Perimeter),
          zone3Corner: String(windAnalysisResult.zonePressures.zone3Corner),
        },
      },
      systemSelection: {
        selectedTemplate: templateSelectionResult.template,
        rationale: templateSelectionResult.rationale,
        rejectedManufacturers: [],
        approvalSource: [],
      },
      attachmentSpec: {
        fieldSpacing: fasteningSpecs.fieldSpacing,
        perimeterSpacing: fasteningSpecs.perimeterSpacing,
        cornerSpacing: fasteningSpecs.cornerSpacing,
        penetrationDepth: '3 inches',
        notes: 'Standard fastening pattern',
      },
      sectionAnalysis: {
        includedSections: sectionAnalysis.includedSections.map(section => ({
          id: section.id,
          title: section.title,
          rationale: section.rationale,
        })),
        excludedSections: sectionAnalysis.excludedSections.map(section => ({
          id: section.id,
          title: section.title,
          rationale: section.rationale,
        })),
        reasoningMap: sectionAnalysis.reasoningMap,
        selfHealingActions: [],
        confidenceScore: 0.95,
      }
    };

    // 10. Generate SOW Document (Mock)
    processingSteps.push('Generating SOW document (mock)...');
    const filename = `${params.projectName.replace(/\s+/g, '_')}_SOW_${uuidv4()}.pdf`;
    const outputPath = `/tmp/${filename}`;

    // Simulate file creation
    processingSteps.push('Simulating file creation...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = {
      success: true,
      filename: filename,
      outputPath: outputPath,
      fileSize: 123456,
      generationTime: Date.now() - startTime,
      metadata: {
        projectName: params.projectName,
        template: templateSelectionResult.template,
        windPressure: String(windAnalysisResult.designWindSpeed),
        attachmentMethod: templateSelectionResult.attachmentMethod,
        jurisdiction: {
          county: geocodeResult.county,
          state: geocodeResult.state,
          codeCycle: jurisdictionData.codeCycle,
          asceVersion: jurisdictionData.asceVersion,
          hvhz: jurisdictionData.hvhz,
        },
        engineeringSummary: engineeringSummary,
      },
      debugInfo: params.debug ? { processingSteps, engineTraces } : undefined,
    };

    console.log('✅ SOW Generation completed successfully.');
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ SOW Generation failed:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      generationTime: Date.now() - startTime
    };
  }
}

export function validateSOWInputs(params: SOWPayload): void {
  if (!params.projectName) {
    throw new Error('Project name is required.');
  }

  if (!params.address) {
    throw new Error('Project address is required.');
  }

  if (params.squareFootage <= 0) {
    throw new Error('Square footage must be greater than zero.');
  }

  if (params.buildingHeight <= 0) {
    throw new Error('Building height must be greater than zero.');
  }
}

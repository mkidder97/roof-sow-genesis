// Core SOW Generator - Main Logic Driver
import { calculateWindPressures, WindPressureInputs, WindPressureResult } from '../logic/wind-pressure';
import { selectManufacturerPattern, ManufacturerSelectionInputs, ManufacturerAnalysisResult } from '../manufacturer/ManufacturerAnalysisEngine';
import { analyzeTakeoffData, TakeoffItems, TakeoffDiagnostics, SectionOverrides } from '../logic/section-populator';
import { geocodeAddress } from '../lib/geocoding';
import { generatePDF } from '../lib/pdf-generator';

export interface SOWGeneratorInputs {
  // Project basics
  projectName: string;
  address: string;
  companyName: string;
  
  // Building parameters
  buildingHeight: number;
  squareFootage: number;
  deckType: string;
  projectType: string;
  roofSlope?: number;
  elevation?: number;
  exposureCategory?: 'B' | 'C' | 'D';
  
  // Membrane specifications
  membraneType: 'TPO' | 'PVC' | 'EPDM';
  membraneThickness: string;
  selectedMembraneBrand?: string;
  
  // Takeoff data
  takeoffItems: TakeoffItems;
  
  // Optional overrides
  basicWindSpeed?: number;
  customNotes?: string[];
}

export interface SOWGeneratorResult {
  success: boolean;
  finalOutput: {
    metadata: {
      template: string;
      windPressure: string;
      asceVersion: string;
      codeCycle: string;
      jurisdiction: string;
      hvhz: boolean;
      windUpliftPressures: {
        zone1Field: number;
        zone1Perimeter: number;
        zone2Perimeter: number;
        zone3Corner: number;
      };
      fasteningSpecifications: {
        fieldSpacing: string;
        perimeterSpacing: string;
        cornerSpacing: string;
        penetrationDepth: string;
      };
      takeoffDiagnostics: TakeoffDiagnostics;
      manufacturerInfo: {
        selectedPattern: string;
        manufacturer: string;
        system: string;
        approvals: string[];
        hasApprovals: boolean;
      };
    };
    pdfData: any;
  };
  generationTime: number;
  filename?: string;
  outputPath?: string;
  fileSize?: number;
  error?: string;
}

export async function generateSOW(inputs: SOWGeneratorInputs): Promise<SOWGeneratorResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Starting SOW generation for: ${inputs.projectName}`);
    console.log(`📍 Address: ${inputs.address}`);
    console.log(`🏗️ Project: ${inputs.squareFootage} sf ${inputs.projectType} on ${inputs.deckType}`);
    
    // Step 1: Geocoding and Location Analysis
    console.log('\n📍 STEP 1: Geocoding and Location Analysis');
    const geocodeResult = await geocodeAddress(inputs.address);
    console.log(`✅ Geocoded to: ${geocodeResult.city}, ${geocodeResult.county}, ${geocodeResult.state}`);
    
    // Step 2: Wind Pressure Calculations
    console.log('\n💨 STEP 2: Wind Pressure Calculations');
    const windInputs: WindPressureInputs = {
      buildingHeight: inputs.buildingHeight,
      exposureCategory: inputs.exposureCategory || 'C', // Default to C if not specified
      roofSlope: inputs.roofSlope || 0,
      elevation: inputs.elevation || geocodeResult.elevation,
      county: geocodeResult.county,
      state: geocodeResult.state,
      basicWindSpeed: inputs.basicWindSpeed
    };
    
    const windResult: WindPressureResult = calculateWindPressures(windInputs);
    console.log(`✅ Wind analysis complete: ${windResult.metadata.asceVersion}, Max pressure: ${Math.abs(windResult.windUpliftPressures.zone3Corner).toFixed(1)} psf`);
    
    // Step 3: Manufacturer Pattern Selection
    console.log('\n🏭 STEP 3: Manufacturer Pattern Selection');
    const manufacturerInputs: ManufacturerSelectionInputs = {
      selectedMembraneBrand: inputs.selectedMembraneBrand,
      membraneType: inputs.membraneType,
      windUpliftPressures: windResult.windUpliftPressures,
      deckType: inputs.deckType,
      projectType: inputs.projectType,
      hvhz: windResult.metadata.hvhz,
      jurisdiction: windResult.metadata.jurisdiction
    };
    
    const manufacturerResult: ManufacturerAnalysisResult = selectManufacturerPattern(manufacturerInputs);
    console.log(`✅ Selected: ${manufacturerResult.manufacturer} ${manufacturerResult.system}`);
    console.log(`🔧 Fastening: ${manufacturerResult.fasteningSpecifications.cornerSpacing} corners`);
    
    // Step 4: Takeoff Analysis and Section Population
    console.log('\n📊 STEP 4: Takeoff Analysis and Section Population');
    const projectData = {
      squareFootage: inputs.squareFootage,
      projectType: inputs.projectType,
      windPressure: Math.abs(windResult.windUpliftPressures.zone3Corner),
      hvhz: windResult.metadata.hvhz
    };
    
    const { diagnostics, overrides } = analyzeTakeoffData(inputs.takeoffItems, projectData);
    console.log(`✅ Takeoff analysis complete: ${Object.values(diagnostics).filter(Boolean).length} flags, ${overrides.customNotes.length} custom notes`);
    
    // Step 5: Template and System Selection
    console.log('\n🎯 STEP 5: Template Selection');
    const template = determineTemplate(inputs, windResult, manufacturerResult, diagnostics);
    console.log(`✅ Selected template: ${template}`);
    
    // Step 6: Compile Final Metadata
    console.log('\n📋 STEP 6: Compiling Metadata');
    const metadata = {
      template,
      windPressure: `${Math.abs(windResult.windUpliftPressures.zone3Corner).toFixed(1)} psf`,
      asceVersion: windResult.metadata.asceVersion,
      codeCycle: windResult.metadata.codeCycle,
      jurisdiction: windResult.metadata.jurisdiction,
      hvhz: windResult.metadata.hvhz,
      windUpliftPressures: {
        zone1Field: windResult.windUpliftPressures.zone1Field,
        zone1Perimeter: windResult.windUpliftPressures.zone1Perimeter,
        zone2Perimeter: windResult.windUpliftPressures.zone2Perimeter,
        zone3Corner: windResult.windUpliftPressures.zone3Corner
      },
      fasteningSpecifications: manufacturerResult.fasteningSpecifications,
      takeoffDiagnostics: diagnostics,
      manufacturerInfo: {
        selectedPattern: manufacturerResult.selectedPattern,
        manufacturer: manufacturerResult.manufacturer,
        system: manufacturerResult.system,
        approvals: manufacturerResult.approvals,
        hasApprovals: manufacturerResult.hasApprovals
      }
    };
    
    // Step 7: Generate PDF Data Structure
    console.log('\n📄 STEP 7: Preparing PDF Data');
    const pdfData = compilePDFData(inputs, windResult, manufacturerResult, overrides, geocodeResult);
    
    // Step 8: Generate PDF Document
    console.log('\n🖨️ STEP 8: Generating PDF Document');
    const pdfResult = await generatePDF(pdfData);
    console.log(`✅ PDF generated: ${pdfResult.filename}`);
    
    const generationTime = Date.now() - startTime;
    console.log(`\n🎉 SOW generation complete in ${generationTime}ms`);
    
    return {
      success: true,
      finalOutput: {
        metadata,
        pdfData
      },
      generationTime,
      filename: pdfResult.filename,
      outputPath: pdfResult.outputPath,
      fileSize: pdfResult.fileSize
    };
    
  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error(`❌ SOW generation failed after ${generationTime}ms:`, error);
    
    return {
      success: false,
      finalOutput: {
        metadata: {} as any,
        pdfData: null
      },
      generationTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

function determineTemplate(
  inputs: SOWGeneratorInputs,
  windResult: WindPressureResult,
  manufacturerResult: ManufacturerAnalysisResult,
  diagnostics: TakeoffDiagnostics
): string {
  const maxPressure = Math.abs(windResult.windUpliftPressures.zone3Corner);
  const hvhz = windResult.metadata.hvhz;
  const projectType = inputs.projectType.toLowerCase();
  
  let baseTemplate = '';
  
  // Base template selection
  if (projectType.includes('recover')) {
    if (inputs.membraneThickness === '115' || manufacturerResult.system.includes('Fleeceback')) {
      baseTemplate = 'T5 - TPO Recover with Fleeceback';
    } else if (maxPressure > 40) {
      baseTemplate = 'T4 - Enhanced TPO Recover';
    } else {
      baseTemplate = 'T4 - TPO Recover with ISO';
    }
  } else if (projectType.includes('tear')) {
    if (maxPressure > 60) {
      baseTemplate = 'T8 - High-Wind Tearoff System';
    } else if (maxPressure > 35) {
      baseTemplate = 'T7 - Enhanced Tearoff';
    } else {
      baseTemplate = 'T6 - Standard Tearoff';
    }
  } else {
    // New construction or replacement
    if (maxPressure > 50) {
      baseTemplate = 'T3 - High-Performance New Construction';
    } else {
      baseTemplate = 'T2 - Standard New Construction';
    }
  }
  
  // Modify template based on special conditions
  if (hvhz) {
    baseTemplate += ' (HVHZ)';
  }
  
  if (diagnostics.highPenetrationDensity) {
    baseTemplate += ' - Enhanced Details';
  }
  
  if (manufacturerResult.system.includes('Adhered')) {
    baseTemplate += ' - Fully Adhered';
  }
  
  return baseTemplate;
}

function compilePDFData(
  inputs: SOWGeneratorInputs,
  windResult: WindPressureResult,
  manufacturerResult: ManufacturerAnalysisResult,
  overrides: SectionOverrides,
  geocodeResult: any
) {
  return {
    // Project information
    payload: {
      projectName: inputs.projectName,
      address: inputs.address,
      companyName: inputs.companyName,
      squareFootage: inputs.squareFootage,
      buildingHeight: inputs.buildingHeight,
      projectType: inputs.projectType,
      membraneThickness: inputs.membraneThickness
    },
    
    // Jurisdiction data
    jurisdiction: {
      city: geocodeResult.city,
      county: geocodeResult.county,
      state: geocodeResult.state,
      codeCycle: windResult.metadata.codeCycle,
      asceVersion: windResult.metadata.asceVersion,
      hvhz: windResult.metadata.hvhz
    },
    
    // Wind analysis results
    windAnalysis: {
      designWindSpeed: windResult.metadata.basicWindSpeed,
      exposureCategory: windResult.metadata.exposureCategory,
      elevation: windResult.metadata.elevation || geocodeResult.elevation,
      zonePressures: windResult.windUpliftPressures,
      velocityPressure: windResult.metadata.velocityPressure
    },
    
    // Template and manufacturer selection
    templateSelection: {
      template: determineTemplate(inputs, windResult, manufacturerResult, overrides.customNotes.length > 5 ? { highPenetrationDensity: true } as TakeoffDiagnostics : {} as TakeoffDiagnostics),
      manufacturer: manufacturerResult.manufacturer,
      system: manufacturerResult.system,
      rationale: manufacturerResult.metadata.selectionRationale
    },
    
    // Manufacturer approvals
    approvals: {
      approvedSources: manufacturerResult.approvals,
      rejectedManufacturers: manufacturerResult.metadata.rejectedPatterns.map(r => r.pattern)
    },
    
    // Fastening specifications
    attachmentSpecs: {
      fieldSpacing: manufacturerResult.fasteningSpecifications.fieldSpacing,
      perimeterSpacing: manufacturerResult.fasteningSpecifications.perimeterSpacing,
      cornerSpacing: manufacturerResult.fasteningSpecifications.cornerSpacing,
      penetrationDepth: manufacturerResult.fasteningSpecifications.penetrationDepth,
      notes: `Fastening pattern selected based on ${Math.abs(windResult.windUpliftPressures.zone3Corner).toFixed(1)} psf maximum uplift pressure. All fasteners must achieve minimum pullout resistance per manufacturer specifications.`
    },
    
    // Custom notes from takeoff analysis
    customNotes: overrides.customNotes,
    specialRequirements: overrides.specialRequirements,
    warningFlags: overrides.warningFlags,
    
    // Takeoff data
    takeoffItems: inputs.takeoffItems
  };
}

// Debug endpoint helper function
export async function generateDebugSOW(mockPayload?: Partial<SOWGeneratorInputs>): Promise<SOWGeneratorResult> {
  const defaultPayload: SOWGeneratorInputs = {
    projectName: 'Debug Test Project',
    address: '123 Main Street, Dallas, TX 75201',
    companyName: 'Test Roofing Company',
    buildingHeight: 35,
    squareFootage: 50000,
    deckType: 'steel',
    projectType: 'recover',
    membraneType: 'TPO',
    membraneThickness: '60',
    selectedMembraneBrand: 'GAF',
    takeoffItems: {
      drainCount: 6,
      penetrationCount: 12,
      flashingLinearFeet: 110,
      accessoryCount: 4,
      hvacUnits: 2,
      skylights: 1,
      scuppers: 2,
      expansionJoints: 0,
      parapetHeight: 18
    },
    customNotes: ['This is a debug test generation']
  };
  
  const mergedPayload = { ...defaultPayload, ...mockPayload };
  
  console.log('🧪 Running debug SOW generation with payload:', JSON.stringify(mergedPayload, null, 2));
  
  return generateSOW(mergedPayload);
}

// Validation helper function
export function validateSOWInputs(inputs: SOWGeneratorInputs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!inputs.projectName?.trim()) {
    errors.push('Project name is required');
  }
  
  if (!inputs.address?.trim()) {
    errors.push('Project address is required');
  }
  
  if (!inputs.buildingHeight || inputs.buildingHeight <= 0) {
    errors.push('Building height must be greater than 0');
  }
  
  if (!inputs.squareFootage || inputs.squareFootage <= 0) {
    errors.push('Square footage must be greater than 0');
  }
  
  if (!['TPO', 'PVC', 'EPDM'].includes(inputs.membraneType)) {
    errors.push('Invalid membrane type');
  }
  
  if (!['recover', 'tearoff', 'new', 'replacement'].includes(inputs.projectType.toLowerCase())) {
    errors.push('Invalid project type');
  }
  
  // Validate takeoff items structure
  if (!inputs.takeoffItems) {
    errors.push('Takeoff items are required');
  } else {
    if (inputs.takeoffItems.drainCount < 0) {
      errors.push('Drain count cannot be negative');
    }
    if (inputs.takeoffItems.penetrationCount < 0) {
      errors.push('Penetration count cannot be negative');
    }
  }
  
  // Validate building parameters
  if (inputs.buildingHeight > 500) {
    errors.push('Building height seems excessive - please verify');
  }
  
  if (inputs.squareFootage > 1000000) {
    errors.push('Square footage seems excessive - please verify');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

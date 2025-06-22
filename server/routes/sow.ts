// Enhanced SOW Generation Routes with Complete Logic Engine Integration
import { Request, Response } from 'express';
import { 
  generateSOWWithEngineering, 
  generateDebugSOW, 
  validateSOWInputs, 
  SOWGeneratorInputs,
  EngineeringSummaryOutput
} from '../core/sow-generator';

export async function healthCheck(req: Request, res: Response) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0 - Complete Logic Engine',
    features: [
      'Template Selection Engine (T1-T8)',
      'Multi-Version ASCE Wind Calculations (7-10/7-16/7-22)',
      'Manufacturer System Selection with HVHZ Support',
      'Takeoff Diagnostics and Risk Analysis',
      'Comprehensive Engineering Summary Generation',
      'Jurisdiction-Based Code Logic',
      'Live Fastening Pattern Selection',
      'PDF Generation with Metadata Injection'
    ],
    engines: {
      'template-engine': 'Selects T1-T8 templates based on project conditions',
      'wind-engine': 'ASCE 7-10/16/22 pressure calculations',
      'fastening-engine': 'Manufacturer system selection and compliance',
      'takeoff-engine': 'Quantity analysis and risk assessment'
    },
    endpoints: {
      'POST /api/generate-sow': 'Complete SOW generation with engineering summary',
      'POST /api/debug-sow': 'Debug endpoint with comprehensive diagnostics',
      'GET /health': 'Health check and system status'
    }
  });
}

export async function generateSOWWithSummary(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Convert frontend payload to SOW generator inputs
    const inputs = mapFrontendToSOWInputs(req.body);
    console.log('🔄 Processing enhanced SOW request:', inputs.projectName);
    
    // Validate inputs using the new validation system
    const validation = validateSOWInputs(inputs);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        validationErrors: validation.errors
      });
    }
    
    // Generate SOW using complete logic engine
    const result = await generateSOWWithEngineering(inputs);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        validationErrors: result.validationErrors
      });
    }
    
    const generationTime = Date.now() - startTime;
    console.log(`✅ Enhanced SOW generated successfully in ${generationTime}ms`);
    
    // Return comprehensive response with engineering summary
    const response = {
      success: true,
      filename: result.filename,
      outputPath: result.outputPath,
      fileSize: result.fileSize,
      generationTime: result.generationTime,
      metadata: {
        projectName: inputs.projectName,
        template: result.engineeringSummary!.metadata.templateUsed,
        windPressure: `${Math.abs(result.engineeringSummary!.metadata.windUpliftPressures.zone3Corner).toFixed(1)} psf corner`,
        attachmentMethod: getAttachmentMethodFromSpecs(result.engineeringSummary!.metadata.fasteningSpecifications),
        jurisdiction: {
          county: result.engineeringSummary!.jurisdictionAnalysis.jurisdiction.county,
          state: result.engineeringSummary!.jurisdictionAnalysis.jurisdiction.state,
          codeCycle: result.engineeringSummary!.jurisdictionAnalysis.jurisdiction.codeCycle,
          asceVersion: result.engineeringSummary!.jurisdictionAnalysis.jurisdiction.asceVersion,
          hvhz: result.engineeringSummary!.jurisdictionAnalysis.jurisdiction.hvhz
        },
        // Enhanced engineering summary with all engine outputs
        engineeringSummary: formatEngineeringSummaryForFrontend(result.engineeringSummary!)
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Enhanced SOW generation failed:', error);
    
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    res.status(500).json(response);
  }
}

export async function debugSOW(req: Request, res: Response) {
  try {
    console.log('🧪 Debug SOW generation with complete logic engine...');
    
    // Use mock payload or merge with request body
    const mockOverrides = req.body || {};
    const result = await generateDebugSOW(mockOverrides);
    
    // Return comprehensive debug information
    const response = {
      success: result.success,
      debug: true,
      generationTime: result.generationTime,
      
      // Core metadata
      metadata: result.engineeringSummary?.metadata,
      
      // PDF info
      pdfInfo: {
        filename: result.filename,
        outputPath: result.outputPath,
        fileSize: result.fileSize
      },
      
      // Detailed engine outputs for debugging
      engineDiagnostics: result.engineeringSummary ? {
        templateSelection: {
          selected: result.engineeringSummary.templateSelection.templateName,
          rationale: result.engineeringSummary.templateSelection.rationale,
          rejectedTemplates: result.engineeringSummary.templateSelection.rejectedTemplates.length,
          applicableConditions: result.engineeringSummary.templateSelection.applicableConditions
        },
        
        windAnalysis: {
          asceVersion: result.engineeringSummary.jurisdictionAnalysis.windAnalysis.asceVersion,
          windSpeed: result.engineeringSummary.jurisdictionAnalysis.windAnalysis.basicWindSpeed,
          pressures: result.engineeringSummary.jurisdictionAnalysis.windAnalysis.windUpliftPressures,
          methodology: result.engineeringSummary.jurisdictionAnalysis.windAnalysis.methodology,
          calculationFactors: result.engineeringSummary.jurisdictionAnalysis.windAnalysis.calculationFactors
        },
        
        systemSelection: {
          selected: result.engineeringSummary.systemSelection.selectedSystem,
          rejected: result.engineeringSummary.systemSelection.rejectedSystems.length,
          fasteningSpecs: result.engineeringSummary.systemSelection.fasteningSpecifications,
          pressureCompliance: result.engineeringSummary.systemSelection.pressureCompliance
        },
        
        takeoffDiagnostics: {
          overallRisk: result.engineeringSummary.metadata.takeoffSummary.overallRisk,
          keyIssues: result.engineeringSummary.metadata.takeoffSummary.keyIssues,
          flags: result.engineeringSummary.takeoffDiagnostics.quantityFlags,
          specialAttentionAreas: result.engineeringSummary.takeoffDiagnostics.specialAttentionAreas.length
        },
        
        jurisdiction: {
          location: result.engineeringSummary.jurisdictionAnalysis.jurisdiction,
          compliance: result.engineeringSummary.metadata.complianceNotes.length + ' notes'
        }
      } : null,
      
      error: result.error,
      validationErrors: result.validationErrors
    };
    
    if (result.success) {
      console.log(`✅ Debug SOW generated: ${result.filename}`);
      console.log(`🎯 Template: ${result.engineeringSummary?.templateSelection.templateName}`);
      console.log(`💨 Wind: ${result.engineeringSummary?.jurisdictionAnalysis.windAnalysis.basicWindSpeed}mph`);
      console.log(`🏭 System: ${result.engineeringSummary?.systemSelection.selectedSystem.manufacturer}`);
      console.log(`📊 Risk: ${result.engineeringSummary?.metadata.takeoffSummary.overallRisk}`);
      res.json(response);
    } else {
      console.error(`❌ Debug SOW failed: ${result.error}`);
      res.status(500).json(response);
    }
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      debug: true,
      error: error instanceof Error ? error.message : 'Debug endpoint error'
    });
  }
}

// Helper function to map frontend payload to SOW generator inputs
function mapFrontendToSOWInputs(frontendPayload: any): SOWGeneratorInputs {
  return {
    // Project basics
    projectName: frontendPayload.projectName || 'Untitled Project',
    address: frontendPayload.address || '',
    companyName: frontendPayload.companyName || 'Unknown Company',
    
    // Building parameters
    buildingHeight: frontendPayload.buildingHeight || 25,
    squareFootage: frontendPayload.squareFootage || 10000,
    buildingDimensions: frontendPayload.buildingDimensions || calculateDimensionsFromSF(frontendPayload.squareFootage),
    deckType: frontendPayload.deckType || 'steel',
    projectType: frontendPayload.projectType || 'recover',
    roofSlope: frontendPayload.roofSlope || 0.25, // Default 3:12
    elevation: frontendPayload.elevation,
    exposureCategory: frontendPayload.exposureCategory,
    
    // Membrane specifications
    membraneType: frontendPayload.membraneType || 'TPO',
    membraneThickness: frontendPayload.membraneThickness || '60mil',
    membraneMaterial: frontendPayload.membraneMaterial || extractMaterialFromType(frontendPayload.membraneType),
    selectedMembraneBrand: frontendPayload.selectedMembraneBrand || frontendPayload.membraneBrand || 'Carlisle',
    
    // Takeoff data
    takeoffItems: {
      drainCount: frontendPayload.numberOfDrains || frontendPayload.drainCount || estimateDrains(frontendPayload.squareFootage),
      penetrationCount: frontendPayload.numberOfPenetrations || frontendPayload.penetrationCount || 8,
      flashingLinearFeet: frontendPayload.flashingLinearFeet || calculateFlashingFromDimensions(frontendPayload),
      accessoryCount: frontendPayload.accessoryCount || calculateAccessoryCount(frontendPayload),
      hvacUnits: frontendPayload.hvacUnits || 0,
      skylights: frontendPayload.skylights || 0,
      roofHatches: frontendPayload.roofHatches || 0,
      scuppers: frontendPayload.scuppers || 0,
      expansionJoints: frontendPayload.expansionJoints || 0,
      parapetHeight: frontendPayload.parapetHeight || 0,
      roofArea: frontendPayload.squareFootage || 10000
    },
    
    // Optional overrides
    basicWindSpeed: frontendPayload.basicWindSpeed,
    preferredManufacturer: frontendPayload.preferredManufacturer || frontendPayload.selectedMembraneBrand,
    includesTaperedInsulation: frontendPayload.includesTaperedInsulation || false,
    userSelectedSystem: frontendPayload.userSelectedSystem,
    customNotes: frontendPayload.customNotes || []
  };
}

// Helper functions for data processing
function calculateDimensionsFromSF(squareFootage: number): { length: number; width: number } {
  if (!squareFootage || squareFootage <= 0) {
    return { length: 100, width: 100 };
  }
  
  // Assume roughly rectangular building with 1.5:1 aspect ratio
  const width = Math.sqrt(squareFootage / 1.5);
  const length = squareFootage / width;
  
  return {
    length: Math.round(length),
    width: Math.round(width)
  };
}

function extractMaterialFromType(membraneType: string): string {
  if (!membraneType) return 'TPO';
  
  const type = membraneType.toUpperCase();
  if (type.includes('TPO')) return 'TPO';
  if (type.includes('EPDM')) return 'EPDM';
  if (type.includes('PVC')) return 'PVC';
  if (type.includes('KEE')) return 'KEE';
  if (type.includes('MODIFIED')) return 'Modified Bitumen';
  
  return 'TPO'; // Default
}

function estimateDrains(squareFootage: number): number {
  if (!squareFootage) return 2;
  
  // Estimate 1 drain per 10,000 sq ft, minimum 2
  return Math.max(2, Math.ceil(squareFootage / 10000));
}

function calculateFlashingFromDimensions(payload: any): number {
  // Try to get from building dimensions
  if (payload.buildingDimensions?.length && payload.buildingDimensions?.width) {
    const perimeter = 2 * (payload.buildingDimensions.length + payload.buildingDimensions.width);
    return Math.round(perimeter * 1.2); // Add 20% for complexity
  }
  
  // Estimate from square footage
  if (payload.squareFootage) {
    const estimatedPerimeter = 4 * Math.sqrt(payload.squareFootage);
    return Math.round(estimatedPerimeter * 1.1); // Add 10% for typical complexity
  }
  
  return 200; // Default fallback
}

function calculateAccessoryCount(payload: any): number {
  let count = 0;
  
  // Count various accessories
  count += payload.hvacUnits || 0;
  count += payload.skylights || 0;
  count += payload.roofHatches || 0;
  count += payload.exhaustFans || 0;
  
  // Estimate from penetrations if high count
  if (payload.numberOfPenetrations > 20) {
    count += Math.floor(payload.numberOfPenetrations / 10);
  }
  
  return Math.max(count, 3); // Minimum 3 accessories for typical commercial roof
}

function getAttachmentMethodFromSpecs(specs: any): string {
  const fieldSpacing = specs.fieldSpacing || '';
  const cornerSpacing = specs.cornerSpacing || '';
  
  if (fieldSpacing.toLowerCase().includes('adhered')) {
    return 'Fully Adhered';
  } else if (cornerSpacing.includes('3"') || cornerSpacing.includes('2"')) {
    return 'Enhanced Mechanical';
  } else {
    return 'Mechanically Attached';
  }
}

function formatEngineeringSummaryForFrontend(summary: EngineeringSummaryOutput) {
  return {
    templateSelection: {
      selectedTemplate: summary.templateSelection.templateName,
      rationale: summary.templateSelection.rationale,
      applicableConditions: summary.templateSelection.applicableConditions,
      rejectedTemplates: summary.templateSelection.rejectedTemplates.map(t => `${t.name}: ${t.reason}`)
    },
    
    jurisdiction: {
      city: summary.jurisdictionAnalysis.jurisdiction.city,
      county: summary.jurisdictionAnalysis.jurisdiction.county,
      state: summary.jurisdictionAnalysis.jurisdiction.state,
      codeCycle: summary.jurisdictionAnalysis.jurisdiction.codeCycle,
      asceVersion: summary.jurisdictionAnalysis.jurisdiction.asceVersion,
      hvhz: summary.jurisdictionAnalysis.jurisdiction.hvhz
    },
    
    windAnalysis: {
      windSpeed: `${summary.jurisdictionAnalysis.windAnalysis.basicWindSpeed} mph`,
      exposure: summary.jurisdictionAnalysis.windAnalysis.exposureCategory,
      elevation: `${summary.jurisdictionAnalysis.windAnalysis.elevation} ft`,
      asceVersion: summary.jurisdictionAnalysis.windAnalysis.asceVersion,
      methodology: summary.jurisdictionAnalysis.windAnalysis.methodology,
      zonePressures: {
        zone1Field: `${Math.abs(summary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone1Field).toFixed(1)} psf`,
        zone1Perimeter: summary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone1Perimeter ? 
          `${Math.abs(summary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone1Perimeter).toFixed(1)} psf` : undefined,
        zone2Perimeter: `${Math.abs(summary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone2Perimeter).toFixed(1)} psf`,
        zone3Corner: `${Math.abs(summary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone3Corner).toFixed(1)} psf`
      },
      calculationFactors: summary.jurisdictionAnalysis.windAnalysis.calculationFactors
    },
    
    systemSelection: {
      selectedSystem: summary.systemSelection.selectedSystem,
      rejectedSystems: summary.systemSelection.rejectedSystems,
      approvalSource: summary.systemSelection.complianceNotes.filter(note => note.includes('NOA') || note.includes('approval')),
      pressureCompliance: summary.systemSelection.pressureCompliance
    },
    
    attachmentSpec: {
      fieldSpacing: summary.systemSelection.fasteningSpecifications.fieldSpacing,
      perimeterSpacing: summary.systemSelection.fasteningSpecifications.perimeterSpacing,
      cornerSpacing: summary.systemSelection.fasteningSpecifications.cornerSpacing,
      penetrationDepth: summary.systemSelection.fasteningSpecifications.penetrationDepth,
      fastenerType: summary.systemSelection.fasteningSpecifications.fastenerType,
      specialRequirements: summary.systemSelection.fasteningSpecifications.specialRequirements,
      notes: summary.systemSelection.complianceNotes.join('; ')
    },
    
    takeoffDiagnostics: {
      overallRisk: summary.metadata.takeoffSummary.overallRisk,
      keyIssues: summary.metadata.takeoffSummary.keyIssues,
      quantitySummary: summary.metadata.takeoffSummary.quantitySummary,
      specialAttentionAreas: summary.takeoffDiagnostics.specialAttentionAreas,
      recommendations: summary.takeoffDiagnostics.recommendations.slice(0, 5), // Top 5
      warnings: summary.takeoffDiagnostics.warnings,
      quantityFlags: summary.takeoffDiagnostics.quantityFlags
    },
    
    complianceSummary: {
      hvhzRequired: summary.jurisdictionAnalysis.jurisdiction.hvhz,
      specialRequirements: summary.systemSelection.fasteningSpecifications.specialRequirements || [],
      codeReferences: [
        summary.jurisdictionAnalysis.jurisdiction.codeCycle,
        summary.jurisdictionAnalysis.jurisdiction.asceVersion
      ],
      complianceNotes: summary.metadata.complianceNotes
    }
  };
}

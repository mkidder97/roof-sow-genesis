// Updated SOW Generation Routes with New Core Logic
import { Request, Response } from 'express';
import { generateSOW, generateDebugSOW, validateSOWInputs, SOWGeneratorInputs } from '../core/sow-generator';

export async function healthCheck(req: Request, res: Response) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0 - Phase 1 Complete',
    features: [
      'Dynamic ASCE Wind Pressure Calculations',
      'Live Manufacturer Fastening Pattern Selection', 
      'Smart Takeoff-Based Section Logic Injection',
      'Geocoding with Fallback',
      'Jurisdiction Mapping',
      'Template Selection',
      'Engineering Summary',
      'PDF Generation'
    ],
    endpoints: {
      'POST /api/generate-sow': 'Main SOW generation endpoint',
      'POST /api/debug-sow': 'Debug endpoint with mock data',
      'GET /health': 'Health check and system status'
    }
  });
}

export async function generateSOWWithSummary(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Convert frontend payload to core generator inputs
    const inputs = mapFrontendToCore(req.body);
    console.log('🔄 Processing SOW request:', inputs.projectName);
    
    // Validate inputs
    const validation = validateSOWInputs(inputs);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      });
    }
    
    // Generate SOW using new core logic
    const result = await generateSOW(inputs);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    const generationTime = Date.now() - startTime;
    console.log(`✅ SOW generated successfully in ${generationTime}ms`);
    
    // Return response in expected frontend format
    const response = {
      success: true,
      filename: result.filename,
      outputPath: result.outputPath,
      fileSize: result.fileSize,
      generationTime: result.generationTime,
      metadata: {
        projectName: inputs.projectName,
        template: result.finalOutput.metadata.template,
        windPressure: result.finalOutput.metadata.windPressure,
        attachmentMethod: getAttachmentMethod(result.finalOutput.metadata.fasteningSpecifications),
        jurisdiction: {
          county: result.finalOutput.metadata.jurisdiction.split(', ')[0],
          state: result.finalOutput.metadata.jurisdiction.split(', ')[1],
          codeCycle: result.finalOutput.metadata.codeCycle,
          asceVersion: result.finalOutput.metadata.asceVersion,
          hvhz: result.finalOutput.metadata.hvhz
        },
        // NEW: Complete engineering summary metadata
        engineeringSummary: {
          jurisdiction: {
            city: result.finalOutput.pdfData.jurisdiction.city,
            county: result.finalOutput.pdfData.jurisdiction.county,
            state: result.finalOutput.pdfData.jurisdiction.state,
            codeCycle: result.finalOutput.metadata.codeCycle,
            asceVersion: result.finalOutput.metadata.asceVersion,
            hvhz: result.finalOutput.metadata.hvhz
          },
          windAnalysis: {
            windSpeed: `${result.finalOutput.pdfData.windAnalysis.designWindSpeed} mph`,
            exposure: result.finalOutput.pdfData.windAnalysis.exposureCategory,
            elevation: `${result.finalOutput.pdfData.windAnalysis.elevation} ft`,
            zonePressures: {
              zone1Field: `${result.finalOutput.metadata.windUpliftPressures.zone1Field.toFixed(1)} psf`,
              zone1Perimeter: `${result.finalOutput.metadata.windUpliftPressures.zone1Perimeter.toFixed(1)} psf`,
              zone2Perimeter: `${result.finalOutput.metadata.windUpliftPressures.zone2Perimeter.toFixed(1)} psf`,
              zone3Corner: `${result.finalOutput.metadata.windUpliftPressures.zone3Corner.toFixed(1)} psf`
            }
          },
          systemSelection: {
            selectedTemplate: result.finalOutput.metadata.template,
            rationale: result.finalOutput.pdfData.templateSelection.rationale,
            rejectedManufacturers: result.finalOutput.pdfData.approvals.rejectedManufacturers,
            approvalSource: result.finalOutput.metadata.manufacturerInfo.approvals
          },
          attachmentSpec: {
            fieldSpacing: result.finalOutput.metadata.fasteningSpecifications.fieldSpacing,
            perimeterSpacing: result.finalOutput.metadata.fasteningSpecifications.perimeterSpacing,
            cornerSpacing: result.finalOutput.metadata.fasteningSpecifications.cornerSpacing,
            penetrationDepth: result.finalOutput.metadata.fasteningSpecifications.penetrationDepth,
            notes: result.finalOutput.pdfData.attachmentSpecs.notes
          }
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ SOW generation failed:', error);
    
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    res.status(500).json(response);
  }
}

// NEW: Debug endpoint for testing
export async function debugSOW(req: Request, res: Response) {
  try {
    console.log('🧪 Debug SOW generation requested');
    
    // Use mock payload or merge with request body
    const mockOverrides = req.body || {};
    const result = await generateDebugSOW(mockOverrides);
    
    // Return full debug information
    const response = {
      success: result.success,
      debug: true,
      generationTime: result.generationTime,
      metadata: result.finalOutput.metadata,
      pdfInfo: {
        filename: result.filename,
        outputPath: result.outputPath,
        fileSize: result.fileSize
      },
      diagnostics: {
        windUpliftPressures: result.finalOutput.metadata.windUpliftPressures,
        fasteningSpecifications: result.finalOutput.metadata.fasteningSpecifications,
        takeoffDiagnostics: result.finalOutput.metadata.takeoffDiagnostics,
        manufacturerInfo: result.finalOutput.metadata.manufacturerInfo
      },
      error: result.error
    };
    
    if (result.success) {
      console.log(`✅ Debug SOW generated: ${result.filename}`);
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

// Helper function to map frontend payload to core generator inputs
function mapFrontendToCore(frontendPayload: any): SOWGeneratorInputs {
  return {
    // Project basics
    projectName: frontendPayload.projectName || 'Untitled Project',
    address: frontendPayload.address || '',
    companyName: frontendPayload.companyName || 'Unknown Company',
    
    // Building parameters
    buildingHeight: frontendPayload.buildingHeight || 25,
    squareFootage: frontendPayload.squareFootage || 10000,
    deckType: frontendPayload.deckType || 'steel',
    projectType: frontendPayload.projectType || 'recover',
    roofSlope: frontendPayload.roofSlope || 0,
    elevation: frontendPayload.elevation,
    exposureCategory: frontendPayload.exposureCategory,
    
    // Membrane specifications
    membraneType: 'TPO', // Default for now
    membraneThickness: frontendPayload.membraneThickness || '60',
    selectedMembraneBrand: extractBrandFromPayload(frontendPayload),
    
    // Takeoff data - extract from frontend or use defaults
    takeoffItems: {
      drainCount: frontendPayload.numberOfDrains || 4,
      penetrationCount: frontendPayload.numberOfPenetrations || 8,
      flashingLinearFeet: calculateFlashingFromDimensions(frontendPayload),
      accessoryCount: calculateAccessoryCount(frontendPayload),
      hvacUnits: frontendPayload.hvacUnits || 0,
      skylights: frontendPayload.skylights || 0,
      scuppers: frontendPayload.scuppers || 0,
      expansionJoints: frontendPayload.expansionJoints || 0,
      parapetHeight: frontendPayload.parapetHeight || 0,
      roofArea: frontendPayload.squareFootage
    },
    
    // Optional overrides
    basicWindSpeed: frontendPayload.basicWindSpeed,
    customNotes: frontendPayload.customNotes || []
  };
}

function extractBrandFromPayload(payload: any): string | undefined {
  // Try to extract brand from various potential fields
  if (payload.membraneBrand) return payload.membraneBrand;
  if (payload.selectedMembraneBrand) return payload.selectedMembraneBrand;
  if (payload.manufacturer) return payload.manufacturer;
  
  // Default based on common patterns
  return 'GAF';
}

function calculateFlashingFromDimensions(payload: any): number {
  // Estimate flashing linear feet from building dimensions
  if (payload.buildingDimensions?.length && payload.buildingDimensions?.width) {
    const perimeter = 2 * (payload.buildingDimensions.length + payload.buildingDimensions.width);
    return Math.round(perimeter * 1.1); // Add 10% for corners and complexity
  }
  
  // Fallback: estimate from square footage
  if (payload.squareFootage) {
    const estimatedPerimeter = 4 * Math.sqrt(payload.squareFootage);
    return Math.round(estimatedPerimeter);
  }
  
  return 100; // Default fallback
}

function calculateAccessoryCount(payload: any): number {
  let count = 0;
  
  // Count various accessories
  count += payload.hvacUnits || 0;
  count += payload.skylights || 0;
  count += payload.roofHatches || 0;
  count += (payload.numberOfPenetrations > 10 ? Math.floor(payload.numberOfPenetrations / 5) : 0);
  
  return Math.max(count, 2); // Minimum 2 accessories
}

function getAttachmentMethod(fasteningSpecs: any): string {
  if (fasteningSpecs.fieldSpacing.includes('Adhered')) {
    return 'Fully Adhered';
  } else if (fasteningSpecs.cornerSpacing.includes('3"') || fasteningSpecs.cornerSpacing.includes('2"')) {
    return 'Enhanced Mechanical';
  } else {
    return 'Mechanically Attached';
  }
}

// SOW Generation Routes
import { Request, Response } from 'express';
import { SOWPayload, SOWResponse, EngineeringSummaryData } from '../types';
import { geocodeAddress } from '../lib/geocoding';
import { getJurisdictionData } from '../lib/jurisdiction-mapping';
import { calculateWindPressures } from '../lib/wind-analysis';
import { selectTemplate, getManufacturerApprovals } from '../lib/template-selection';
import { generateAttachmentSpecs } from '../lib/attachment-specs';
import { generatePDF } from '../lib/pdf-generator';

export async function healthCheck(req: Request, res: Response) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'Wind Analysis (ASCE 7-16)',
      'Geocoding',
      'Jurisdiction Mapping',
      'Template Selection',
      'Engineering Summary',
      'PDF Generation'
    ]
  });
}

export async function generateSOWWithSummary(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    const payload: SOWPayload = req.body;
    console.log('🔄 Processing SOW request:', payload.projectName);

    // Step 1: Geocoding and Jurisdiction Analysis
    console.log('📍 Step 1: Geocoding address...');
    const geocodeResult = await geocodeAddress(payload.address);
    const jurisdiction = await getJurisdictionData(geocodeResult.county, geocodeResult.state);
    
    // Step 2: Wind Analysis
    console.log('💨 Step 2: Calculating wind pressures...');
    const windAnalysis = await calculateWindPressures({
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      elevation: payload.elevation || geocodeResult.elevation,
      exposureCategory: payload.exposureCategory || 'B',
      buildingHeight: payload.buildingHeight,
      asceVersion: jurisdiction.asceVersion
    });

    // Step 3: Template Selection
    console.log('🏗️ Step 3: Selecting appropriate template...');
    const templateSelection = await selectTemplate({
      projectType: payload.projectType,
      deckType: payload.deckType,
      membraneThickness: payload.membraneThickness,
      hvhz: jurisdiction.hvhz,
      windPressures: windAnalysis.zonePressures
    });

    // Step 4: Manufacturer Approvals
    console.log('🏭 Step 4: Getting manufacturer approvals...');
    const approvals = await getManufacturerApprovals({
      template: templateSelection.template,
      windPressures: windAnalysis.zonePressures,
      hvhz: jurisdiction.hvhz,
      county: geocodeResult.county,
      state: geocodeResult.state
    });

    // Step 5: Attachment Specifications
    console.log('🔧 Step 5: Calculating attachment specifications...');
    const attachmentSpecs = await generateAttachmentSpecs({
      windPressures: windAnalysis.zonePressures,
      template: templateSelection.template,
      approvals: approvals.approvedSources
    });

    // Step 6: Generate PDF
    console.log('📄 Step 6: Generating PDF...');
    const pdfResult = await generatePDF({
      payload,
      jurisdiction,
      windAnalysis,
      templateSelection,
      approvals,
      attachmentSpecs
    });

    // Step 7: Compile Engineering Summary
    const engineeringSummary: EngineeringSummaryData = {
      jurisdiction: {
        city: geocodeResult.city,
        county: geocodeResult.county,
        state: geocodeResult.state,
        codeCycle: jurisdiction.codeCycle,
        asceVersion: jurisdiction.asceVersion,
        hvhz: jurisdiction.hvhz
      },
      windAnalysis: {
        windSpeed: `${windAnalysis.designWindSpeed} mph`,
        exposure: windAnalysis.exposureCategory,
        elevation: `${windAnalysis.elevation} ft`,
        zonePressures: {
          zone1Field: `${windAnalysis.zonePressures.zone1Field.toFixed(1)} psf`,
          zone1Perimeter: `${windAnalysis.zonePressures.zone1Perimeter.toFixed(1)} psf`,
          zone2Perimeter: `${windAnalysis.zonePressures.zone2Perimeter.toFixed(1)} psf`,
          zone3Corner: `${windAnalysis.zonePressures.zone3Corner.toFixed(1)} psf`
        }
      },
      systemSelection: {
        selectedTemplate: templateSelection.template,
        rationale: templateSelection.rationale,
        rejectedManufacturers: approvals.rejectedManufacturers,
        approvalSource: approvals.approvedSources
      },
      attachmentSpec: {
        fieldSpacing: attachmentSpecs.fieldSpacing,
        perimeterSpacing: attachmentSpecs.perimeterSpacing,
        cornerSpacing: attachmentSpecs.cornerSpacing,
        penetrationDepth: attachmentSpecs.penetrationDepth,
        notes: attachmentSpecs.notes
      }
    };

    const generationTime = Date.now() - startTime;
    console.log(`✅ SOW generated successfully in ${generationTime}ms`);

    // Handle uploaded files if any
    const uploadedFiles: string[] = [];
    if (req.file) {
      uploadedFiles.push(req.file.originalname);
    }

    const response: SOWResponse = {
      success: true,
      filename: pdfResult.filename,
      outputPath: pdfResult.outputPath,
      fileSize: pdfResult.fileSize,
      generationTime,
      metadata: {
        projectName: payload.projectName,
        template: templateSelection.template,
        windPressure: `Zone 3: ${windAnalysis.zonePressures.zone3Corner.toFixed(1)} psf`,
        attachmentMethod: templateSelection.attachmentMethod,
        jurisdiction: {
          county: geocodeResult.county,
          state: geocodeResult.state,
          codeCycle: jurisdiction.codeCycle,
          asceVersion: jurisdiction.asceVersion,
          hvhz: jurisdiction.hvhz
        },
        // NEW: Engineering Summary Data
        engineeringSummary
      },
      uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined
    };

    res.json(response);

  } catch (error) {
    console.error('❌ SOW generation failed:', error);
    
    const response: SOWResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    res.status(500).json(response);
  }
}

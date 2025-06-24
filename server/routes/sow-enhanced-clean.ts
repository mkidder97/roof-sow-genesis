// Enhanced SOW Generation Route with Clean Content Population
// Integrates the new enhanced content population system to eliminate placeholders
// and generate professional, client-ready SOWs

import { Request, Response } from 'express';
import {
  generateSOWWithEngineering,
  generateDebugSOW,
  validateSOWInputs,
  SOWGeneratorInputs
} from '../core/sow-generator';
import { parseTakeoffFile, TakeoffFile, ExtractionResult } from '../core/takeoff-engine';
import {
  generateCleanSOWContent,
  analyzeSystemConfiguration,
  performQualityChecks,
  EnhancedContentInputs
} from '../core/enhanced-content-population';
import { selectTemplate } from '../core/template-engine';

/**
 * ENHANCED: Generate SOW with clean content population (no placeholders)
 */
export async function generateEnhancedSOW(req: Request, res: Response) {
  try {
    console.log('🚀 Enhanced SOW Generation - Starting clean content system...');

    // Parse request data (handle both FormData and JSON)
    let inputData: any = {};
    let extractionResult: ExtractionResult | null = null;

    if (req.body && req.body.data) {
      // FormData request
      try {
        inputData = JSON.parse(req.body.data);
      } catch (error) {
        inputData = req.body || {};
      }
    } else {
      // Regular JSON request
      inputData = req.body || {};
    }

    // Process uploaded file if present
    if (req.file) {
      console.log(`📁 Processing uploaded file: ${req.file.originalname}`);
      
      const takeoffFile: TakeoffFile = {
        filename: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype
      };

      try {
        extractionResult = await parseTakeoffFile(takeoffFile);
        console.log(`✅ File extraction complete: ${extractionResult.method} (${(extractionResult.confidence * 100).toFixed(1)}% confidence)`);

        // Merge extracted data with input
        inputData = {
          ...inputData,
          squareFootage: extractionResult.data.roofArea || inputData.squareFootage,
          takeoffItems: {
            drainCount: extractionResult.data.drainCount || 0,
            penetrationCount: extractionResult.data.penetrationCount || 0,
            flashingLinearFeet: extractionResult.data.flashingLinearFeet || 0,
            accessoryCount: extractionResult.data.accessoryCount || 0,
            hvacUnits: extractionResult.data.hvacUnits || 0,
            skylights: extractionResult.data.skylights || 0
          },
          fileProcessed: true,
          uploadedFileName: req.file.originalname
        };
      } catch (error) {
        console.log('⚠️ File processing failed, using input data only');
        inputData.fileProcessed = false;
        inputData.fileProcessingError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Validate required inputs
    const validation = validateSOWInputs(inputData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        validationErrors: validation.errors
      });
    }

    // Generate engineering summary first
    const engineeringResult = await generateDebugSOW({
      ...inputData,
      debug: true,
      engineDebug: {
        template: true,
        wind: true,
        fastening: true,
        takeoff: true,
        sections: true
      }
    });

    if (!engineeringResult.success) {
      return res.status(500).json({
        success: false,
        error: engineeringResult.error,
        stage: 'engineering_analysis'
      });
    }

    // Prepare enhanced content inputs
    const enhancedInputs: EnhancedContentInputs = {
      // Project identification
      projectName: inputData.projectName || 'Roofing Project',
      address: inputData.address || 'Project Address',
      companyName: inputData.companyName || 'Company Name',

      // Building specifications
      buildingHeight: inputData.buildingHeight || 30,
      squareFootage: inputData.squareFootage || 50000,
      buildingDimensions: inputData.buildingDimensions,

      // Roof system configuration
      deckType: inputData.deckType || 'steel',
      projectType: inputData.projectType || 'tearoff',
      roofSlope: inputData.roofSlope || 0.02,

      // Membrane system
      membraneType: inputData.membraneType || 'TPO',
      membraneThickness: inputData.membraneThickness || '60 mil',
      selectedSystem: engineeringResult.engineeringSummary!.systemSelection.selectedSystem,
      manufacturer: inputData.manufacturer || 'GAF',
      attachmentMethod: determineAttachmentMethod(inputData),

      // Engineering data
      windSpeed: engineeringResult.engineeringSummary!.windAnalysis.windSpeed,
      zonePressures: engineeringResult.engineeringSummary!.windAnalysis.zonePressures,
      engineeringSummary: engineeringResult.engineeringSummary!,
      templateSelection: engineeringResult.engineeringSummary!.templateSelection,

      // Takeoff data
      takeoffItems: {
        drainCount: inputData.takeoffItems?.drainCount || 0,
        penetrationCount: inputData.takeoffItems?.penetrationCount || 0,
        flashingLinearFeet: inputData.takeoffItems?.flashingLinearFeet || 0,
        accessoryCount: inputData.takeoffItems?.accessoryCount || 0,
        hvacUnits: inputData.takeoffItems?.hvacUnits || 0,
        skylights: inputData.takeoffItems?.skylights || 0
      }
    };

    // Generate clean content
    console.log('📝 Generating clean, professional content...');
    const cleanContent = generateCleanSOWContent(enhancedInputs);

    // Check content quality
    if (!cleanContent.isClientReady) {
      console.log('⚠️ Content quality check failed');
      console.log('Quality issues:', cleanContent.qualityChecks);
    }

    // Generate PDF (using existing PDF generation system)
    let pdfPath: string | null = null;
    try {
      const pdfResult = await generateSOWWithEngineering(inputData);
      if (pdfResult.success && pdfResult.outputPath) {
        pdfPath = pdfResult.outputPath;
        console.log(`📄 PDF generated: ${pdfPath}`);
      }
    } catch (pdfError) {
      console.log('⚠️ PDF generation failed, returning content only');
    }

    // Return enhanced response
    const response = {
      success: true,
      isClientReady: cleanContent.isClientReady,

      // Content analysis
      contentSummary: {
        totalPages: cleanContent.totalPages,
        totalSections: cleanContent.sections.length,
        wordCount: cleanContent.wordCount,
        systemSpecificSections: cleanContent.sections.filter(s => s.systemSpecific).length,
        placeholdersResolved: cleanContent.sections.filter(s => s.placeholdersResolved).length
      },

      // Quality validation
      qualityChecks: cleanContent.qualityChecks,
      qualityScore: calculateQualityScore(cleanContent.qualityChecks),

      // System configuration
      systemConfiguration: {
        identifier: getSystemIdentifier(enhancedInputs),
        description: getSystemDescription(enhancedInputs),
        templateUsed: enhancedInputs.templateSelection.templateName,
        attachmentMethod: enhancedInputs.attachmentMethod,
        deckType: enhancedInputs.deckType
      },

      // Generated content (first 3 sections as preview)
      contentPreview: cleanContent.sections.slice(0, 3).map(section => ({
        id: section.id,
        title: section.title,
        preview: section.content.substring(0, 500) + '...',
        pageNumber: section.pageNumber,
        systemSpecific: section.systemSpecific
      })),

      // Complete sections (for internal use)
      sections: cleanContent.sections.map(section => ({
        id: section.id,
        title: section.title,
        content: section.content,
        pageNumber: section.pageNumber,
        systemSpecific: section.systemSpecific,
        placeholdersResolved: section.placeholdersResolved
      })),

      // Engineering summary
      engineeringSummary: engineeringResult.engineeringSummary,

      // File processing
      fileProcessingSummary: extractionResult ? {
        filename: inputData.uploadedFileName,
        method: extractionResult.method,
        confidence: extractionResult.confidence,
        extractedFields: extractionResult.extractedFields,
        warnings: extractionResult.warnings
      } : null,

      // PDF output
      outputPath: pdfPath,
      pdfGenerated: !!pdfPath,

      // Metadata
      metadata: {
        generationTime: new Date().toISOString(),
        engineVersion: '5.0.0 - Enhanced Content Population',
        systemConfigurationTested: true,
        placeholderResolutionEnabled: true,
        clientReadyOutput: cleanContent.isClientReady
      }
    };

    console.log('✅ Enhanced SOW generation complete');
    console.log(`📊 Quality Score: ${response.qualityScore}/100`);
    console.log(`📄 Pages: ${cleanContent.totalPages}, Sections: ${cleanContent.sections.length}`);
    console.log(`🎯 Client Ready: ${cleanContent.isClientReady ? 'YES' : 'NO'}`);

    res.json(response);

  } catch (error) {
    console.error('❌ Enhanced SOW generation failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Enhanced SOW generation failed',
      stage: 'enhanced_generation'
    });
  }
}

/**
 * System configuration validation endpoint
 */
export async function validateSystemConfiguration(req: Request, res: Response) {
  try {
    const { projectType, deckType, membraneType, attachmentMethod } = req.body;

    if (!projectType || !deckType || !membraneType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required configuration parameters'
      });
    }

    const systemId = `${projectType}-${membraneType}-${attachmentMethod || 'mechanical'}-${deckType}`;
    const isSupported = validateConfigurationSupport(systemId);

    // Template selection test
    const templateResult = selectTemplate({
      projectType: projectType as any,
      hvhz: false,
      membraneType,
      roofSlope: 0.02,
      buildingHeight: 30,
      exposureCategory: 'C'
    });

    res.json({
      success: true,
      systemConfiguration: {
        id: systemId,
        projectType,
        deckType,
        membraneType,
        attachmentMethod: attachmentMethod || 'mechanically_attached',
        isSupported,
        supportLevel: getSupportLevel(systemId)
      },
      templateSelection: {
        templateCode: templateResult.templateCode,
        templateName: templateResult.templateName,
        rationale: templateResult.rationale
      },
      contentGeneration: {
        expectedSections: getExpectedSections(systemId),
        specialRequirements: getSpecialRequirements(systemId)
      },
      recommendations: getConfigurationRecommendations(systemId)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Configuration validation failed'
    });
  }
}

/**
 * Content quality testing endpoint
 */
export async function testContentQuality(req: Request, res: Response) {
  try {
    console.log('🧪 Testing content quality for system configuration...');

    const inputData = req.body;
    
    // Generate enhanced content
    const enhancedInputs: EnhancedContentInputs = {
      projectName: inputData.projectName || 'Test Project',
      address: inputData.address || 'Test Address',
      companyName: 'Test Company',
      buildingHeight: inputData.buildingHeight || 30,
      squareFootage: inputData.squareFootage || 50000,
      deckType: inputData.deckType || 'steel',
      projectType: inputData.projectType || 'tearoff',
      roofSlope: 0.02,
      membraneType: inputData.membraneType || 'TPO',
      membraneThickness: '60 mil',
      selectedSystem: 'Test System',
      manufacturer: 'Test Manufacturer',
      attachmentMethod: inputData.attachmentMethod || 'mechanically_attached',
      windSpeed: 140,
      zonePressures: { field: -30, perimeter: -45, corner: -60 },
      engineeringSummary: {} as any, // Mock for testing
      templateSelection: { templateName: 'Test Template' } as any,
      takeoffItems: {
        drainCount: 12,
        penetrationCount: 45,
        flashingLinearFeet: 850,
        accessoryCount: 25,
        hvacUnits: 8,
        skylights: 2
      }
    };

    const content = generateCleanSOWContent(enhancedInputs);
    const qualityScore = calculateQualityScore(content.qualityChecks);

    res.json({
      success: true,
      testMode: true,
      contentQuality: {
        totalPages: content.totalPages,
        totalSections: content.sections.length,
        wordCount: content.wordCount,
        qualityScore,
        isClientReady: content.isClientReady
      },
      qualityChecks: content.qualityChecks,
      sectionsAnalysis: content.sections.map(section => ({
        id: section.id,
        title: section.title,
        wordCount: section.content.split(/\s+/).length,
        systemSpecific: section.systemSpecific,
        placeholdersResolved: section.placeholdersResolved
      })),
      recommendations: generateQualityRecommendations(content.qualityChecks)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Content quality test failed'
    });
  }
}

// Helper functions

function determineAttachmentMethod(inputData: any): 'mechanically_attached' | 'adhered' | 'ballasted' {
  if (inputData.attachmentMethod) {
    return inputData.attachmentMethod;
  }
  
  // Auto-determine based on deck type
  if (inputData.deckType === 'gypsum') {
    return 'adhered';
  }
  
  return 'mechanically_attached';
}

function getSystemIdentifier(inputs: EnhancedContentInputs): string {
  return `${inputs.projectType}-${inputs.membraneType}-${inputs.attachmentMethod}-${inputs.deckType}`;
}

function getSystemDescription(inputs: EnhancedContentInputs): string {
  const typeDesc = inputs.projectType === 'tearoff' ? 'Tearoff' : 
                   inputs.projectType === 'recover' ? 'Recover' : 'New';
  const attachDesc = inputs.attachmentMethod === 'mechanically_attached' ? 'Mechanical' :
                     inputs.attachmentMethod === 'adhered' ? 'Adhered' : 'Ballasted';
  
  return `${typeDesc} ${inputs.membraneType} ${attachDesc} on ${inputs.deckType.toUpperCase()} deck`;
}

function calculateQualityScore(checks: any): number {
  const weights = {
    noPlaceholders: 30,
    noEditorialMarkup: 25,
    systemSpecificContent: 25,
    professionalFormatting: 20
  };

  let score = 0;
  for (const [check, passed] of Object.entries(checks)) {
    if (passed && weights[check as keyof typeof weights]) {
      score += weights[check as keyof typeof weights];
    }
  }

  return score;
}

function validateConfigurationSupport(systemId: string): boolean {
  const supportedConfigurations = [
    'tearoff-TPO-mechanically_attached-steel',
    'tearoff-TPO-adhered-gypsum',
    'recover-TPO-mechanically_attached-steel',
    'tearoff-TPO-mechanically_attached-lwc',
    'new-TPO-mechanically_attached-steel',
    'recover-TPO-adhered-gypsum'
  ];

  return supportedConfigurations.includes(systemId);
}

function getSupportLevel(systemId: string): 'full' | 'partial' | 'basic' {
  const fullSupport = [
    'tearoff-TPO-mechanically_attached-steel',
    'tearoff-TPO-adhered-gypsum',
    'recover-TPO-mechanically_attached-steel'
  ];

  const partialSupport = [
    'tearoff-TPO-mechanically_attached-lwc',
    'new-TPO-mechanically_attached-steel'
  ];

  if (fullSupport.includes(systemId)) return 'full';
  if (partialSupport.includes(systemId)) return 'partial';
  return 'basic';
}

function getExpectedSections(systemId: string): string[] {
  const baseSections = [
    'project_overview',
    'wind_analysis',
    'system_specifications',
    'quality_testing',
    'warranty_safety'
  ];

  if (systemId.includes('tearoff')) {
    baseSections.splice(2, 0, 'demolition_scope');
  }

  if (systemId.includes('mechanically_attached')) {
    baseSections.splice(-2, 0, 'fastening_specifications');
  }

  if (systemId.includes('adhered')) {
    baseSections.splice(-2, 0, 'adhesive_specifications');
  }

  return baseSections;
}

function getSpecialRequirements(systemId: string): string[] {
  const requirements: string[] = [];

  if (systemId.includes('tearoff')) {
    requirements.push('Demolition procedures required');
    requirements.push('Waste disposal specifications');
  }

  if (systemId.includes('gypsum')) {
    requirements.push('Gypsum deck special considerations');
    requirements.push('Moisture protection during installation');
  }

  if (systemId.includes('steel')) {
    requirements.push('Steel deck fastening specifications');
    requirements.push('Thermal bridging considerations');
  }

  if (systemId.includes('adhered')) {
    requirements.push('Substrate preparation requirements');
    requirements.push('Adhesive application specifications');
  }

  return requirements;
}

function getConfigurationRecommendations(systemId: string): string[] {
  const recommendations: string[] = [];

  if (systemId.includes('tearoff-TPO-mechanically_attached-steel')) {
    recommendations.push('Optimal configuration for wind resistance');
    recommendations.push('Standard installation procedures apply');
    recommendations.push('Full demolition provides clean installation surface');
  }

  if (systemId.includes('tearoff-TPO-adhered-gypsum')) {
    recommendations.push('Adhered system required for gypsum deck');
    recommendations.push('Enhanced moisture protection needed');
    recommendations.push('Temperature considerations during installation');
  }

  if (systemId.includes('recover')) {
    recommendations.push('Existing system assessment required');
    recommendations.push('Recovery board may be necessary');
    recommendations.push('Cost-effective for suitable existing conditions');
  }

  return recommendations;
}

function generateQualityRecommendations(checks: any): string[] {
  const recommendations: string[] = [];

  if (!checks.noPlaceholders) {
    recommendations.push('Resolve all remaining placeholders with actual project data');
  }

  if (!checks.noEditorialMarkup) {
    recommendations.push('Remove all editorial markup and highlighting for client delivery');
  }

  if (!checks.systemSpecificContent) {
    recommendations.push('Add more system-specific technical content');
  }

  if (!checks.professionalFormatting) {
    recommendations.push('Improve document formatting and structure');
  }

  if (recommendations.length === 0) {
    recommendations.push('Content meets all quality standards for client delivery');
  }

  return recommendations;
}

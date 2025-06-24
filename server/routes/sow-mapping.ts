// Enhanced SOW Generation Routes with Section-Input Mapping
// Provides comprehensive SOW generation using the new mapping system
// Includes detailed audit trails and validation reporting

import { Request, Response } from 'express';
import { 
  selectSectionsEnhanced, 
  EnhancedSectionEngineInputs,
  EnhancedSectionAnalysis
} from '../core/enhanced-section-engine.js';
import { 
  createSectionMappingEngine,
  validateRequiredSections,
  getAvailableSectionMappings,
  findMappingsForInput
} from '../core/section-input-mapping.js';
import { populateSOWContent } from '../core/content-population-engine.js';
import { generateSOWPDF } from '../core/enhanced-pdf-generator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate SOW with enhanced section-input mapping
 */
export async function generateSOWWithMapping(req: Request, res: Response) {
  try {
    console.log('🚀 Enhanced SOW Generation with Section-Input Mapping');
    console.log('=====================================================');
    
    const startTime = Date.now();
    const inputs: EnhancedSectionEngineInputs = req.body;
    
    // Step 1: Validate inputs
    console.log('📋 Step 1: Validating inputs...');
    const validationResult = validateRequiredSections(inputs);
    
    if (!validationResult.isValid && validationResult.missingRequiredSections.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Too many required inputs missing',
        details: {
          missingRequiredSections: validationResult.missingRequiredSections,
          summary: validationResult.summary
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Step 2: Run enhanced section analysis
    console.log('🔍 Step 2: Running enhanced section analysis...');
    const sectionAnalysis = selectSectionsEnhanced(inputs);
    
    // Step 3: Generate section content
    console.log('📝 Step 3: Populating section content...');
    const populatedContent = populateSOWContent({
      projectName: inputs.projectName,
      address: inputs.address,
      companyName: inputs.companyName || 'General Contractor',
      buildingHeight: inputs.buildingHeight,
      squareFootage: inputs.squareFootage,
      buildingDimensions: inputs.buildingDimensions,
      deckType: inputs.deckType,
      projectType: inputs.projectType,
      roofSlope: inputs.roofSlope || 0.25,
      membraneType: inputs.membraneType,
      membraneThickness: inputs.membraneThickness,
      selectedSystem: inputs.selectedSystem,
      manufacturer: inputs.manufacturer,
      windSpeed: inputs.designWindSpeed,
      zonePressures: inputs.windPressures,
      takeoffItems: inputs.takeoffItems,
      engineeringSummary: createEngineeringSummaryFromMapping(sectionAnalysis),
      templateSelection: {
        templateName: inputs.decisionTreeResult?.template_selection?.template_id || 'T1',
        rationale: 'Template selected based on project requirements'
      }
    });
    
    // Step 4: Generate PDF
    console.log('📄 Step 4: Generating PDF...');
    const outputDir = path.join(__dirname, '../../output');
    const filename = `SOW_${inputs.projectName?.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);
    
    await generateSOWPDF({
      content: populatedContent.sections,
      projectInfo: {
        projectName: inputs.projectName,
        address: inputs.address,
        companyName: inputs.companyName || 'General Contractor'
      },
      outputPath,
      includeAuditTrail: true,
      auditData: {
        sectionAnalysis,
        inputMappings: sectionAnalysis.inputMappingResults,
        validationSummary: sectionAnalysis.inputValidationSummary
      }
    });
    
    const generationTime = Date.now() - startTime;
    
    console.log('✅ Enhanced SOW Generation Complete');
    console.log(`   📁 File: ${filename}`);
    console.log(`   ⏱️ Time: ${generationTime}ms`);
    console.log(`   📊 Sections: ${sectionAnalysis.includedSections.length} included`);
    console.log(`   🗺️ Mappings: ${sectionAnalysis.inputMappingResults.length} processed`);
    console.log(`   ✅ Inputs: ${sectionAnalysis.inputValidationSummary.resolvedInputs}/${sectionAnalysis.inputValidationSummary.totalInputs} resolved`);
    
    res.json({
      success: true,
      message: 'Enhanced SOW generated successfully',
      filename,
      outputPath: `/output/${filename}`,
      generationTime,
      
      // Enhanced metadata with mapping details
      sectionAnalysis: {
        includedSections: sectionAnalysis.includedSections.length,
        excludedSections: sectionAnalysis.excludedSections.length,
        confidenceScore: sectionAnalysis.confidenceScore,
        selfHealingActions: sectionAnalysis.selfHealingActions.length
      },
      
      inputMappingResults: {
        totalMappings: sectionAnalysis.inputMappingResults.length,
        resolvedMappings: sectionAnalysis.inputMappingResults.filter(m => m.hasAllRequiredInputs).length,
        missingInputs: sectionAnalysis.inputValidationSummary.missingRequiredInputs,
        validationErrors: sectionAnalysis.inputValidationSummary.validationErrors
      },
      
      contentMetadata: {
        totalPages: populatedContent.totalPages,
        wordCount: populatedContent.wordCount,
        hasPlaceholders: populatedContent.hasPlaceholders,
        placeholderCount: populatedContent.placeholderCount
      },
      
      auditTrail: {
        inputResolutionEntries: sectionAnalysis.auditTrail.inputResolution.length,
        sectionGenerationEntries: sectionAnalysis.auditTrail.sectionGeneration.length,
        contentPopulationEntries: sectionAnalysis.auditTrail.contentPopulation.length
      },
      
      systemInfo: {
        version: '1.0.0-mapping-engine',
        features: [
          'enhanced-section-input-mapping',
          'comprehensive-validation',
          'input-transformation',
          'audit-trail-generation',
          'self-healing-fallbacks',
          'content-population-engine'
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ Enhanced SOW generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Enhanced SOW generation failed',
      timestamp: new Date().toISOString(),
      systemInfo: {
        version: '1.0.0-mapping-engine',
        errorContext: 'enhanced-sow-generation'
      }
    });
  }
}

/**
 * Debug endpoint for section-input mapping analysis
 */
export async function debugSectionMapping(req: Request, res: Response) {
  try {
    console.log('🔍 Debug: Section-Input Mapping Analysis');
    
    const inputs = req.body;
    const mappingEngine = createSectionMappingEngine({
      enableAuditTrail: true,
      enableValidation: true,
      enableTransformations: true,
      enableFallbacks: true,
      strictMode: false
    });
    
    // Run mapping analysis
    const mappingResults = mappingEngine.resolveSectionMappings(inputs);
    const auditTrail = mappingEngine.getAuditTrail();
    
    // Analyze input coverage
    const availableMappings = getAvailableSectionMappings();
    const inputCoverage = analyzeMappingCoverage(inputs, availableMappings);
    
    res.json({
      success: true,
      debugMode: true,
      timestamp: new Date().toISOString(),
      
      mappingResults: mappingResults.map(result => ({
        sectionId: result.sectionId,
        sectionTitle: result.sectionTitle,
        hasAllRequiredInputs: result.hasAllRequiredInputs,
        missingRequiredInputs: result.missingRequiredInputs,
        sectionPriority: result.sectionPriority,
        relevantInputs: result.relevantInputs.map(input => ({
          inputName: input.inputName,
          inputPath: input.inputPath,
          isResolved: input.isResolved,
          fallbackUsed: input.fallbackUsed,
          transformedValue: input.transformedValue,
          validationResults: input.validationResults.map(v => ({
            passed: v.passed,
            message: v.message
          }))
        }))
      })),
      
      auditTrail: auditTrail.map(entry => ({
        timestamp: entry.timestamp,
        inputPath: entry.inputPath,
        action: entry.action,
        details: entry.details
      })),
      
      inputCoverage: inputCoverage,
      
      systemAnalysis: {
        totalMappings: availableMappings.length,
        processedMappings: mappingResults.length,
        resolvedMappings: mappingResults.filter(m => m.hasAllRequiredInputs).length,
        failedMappings: mappingResults.filter(m => !m.hasAllRequiredInputs).length,
        auditEntries: auditTrail.length
      }
    });
    
  } catch (error) {
    console.error('❌ Debug section mapping error:', error);
    res.status(500).json({
      success: false,
      debugMode: true,
      error: error instanceof Error ? error.message : 'Debug section mapping failed'
    });
  }
}

/**
 * Get available section mappings
 */
export async function getAvailableMappings(req: Request, res: Response) {
  try {
    const mappings = getAvailableSectionMappings();
    
    res.json({
      success: true,
      mappings: mappings.map(mapping => ({
        section: mapping.section,
        relevantInput: mapping.relevantInput,
        inputPath: mapping.inputPath,
        isRequired: mapping.isRequired,
        hasTransformation: !!mapping.transformFunction,
        hasFallback: mapping.fallbackValue !== undefined,
        hasValidation: !!mapping.validationRules?.length
      })),
      summary: {
        totalMappings: mappings.length,
        requiredMappings: mappings.filter(m => m.isRequired).length,
        optionalMappings: mappings.filter(m => !m.isRequired).length,
        mappingsWithTransforms: mappings.filter(m => m.transformFunction).length,
        mappingsWithFallbacks: mappings.filter(m => m.fallbackValue !== undefined).length,
        mappingsWithValidation: mappings.filter(m => m.validationRules?.length).length
      }
    });
    
  } catch (error) {
    console.error('❌ Get available mappings error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available mappings'
    });
  }
}

/**
 * Find mappings for specific input
 */
export async function findInputMappings(req: Request, res: Response) {
  try {
    const { inputPath } = req.params;
    
    if (!inputPath) {
      return res.status(400).json({
        success: false,
        error: 'Input path parameter is required'
      });
    }
    
    const mappings = findMappingsForInput(inputPath);
    
    res.json({
      success: true,
      inputPath,
      mappings: mappings.map(mapping => ({
        section: mapping.section,
        relevantInput: mapping.relevantInput,
        inputPath: mapping.inputPath,
        isRequired: mapping.isRequired,
        transformFunction: mapping.transformFunction,
        fallbackValue: mapping.fallbackValue,
        validationRules: mapping.validationRules
      })),
      summary: {
        totalMappings: mappings.length,
        requiredMappings: mappings.filter(m => m.isRequired).length
      }
    });
    
  } catch (error) {
    console.error('❌ Find input mappings error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find input mappings'
    });
  }
}

/**
 * Validate inputs against mapping requirements
 */
export async function validateInputMapping(req: Request, res: Response) {
  try {
    const inputs = req.body;
    const validationResult = validateRequiredSections(inputs);
    
    // Run detailed mapping analysis
    const mappingEngine = createSectionMappingEngine({ strictMode: true });
    const mappingResults = mappingEngine.resolveSectionMappings(inputs);
    
    // Analyze validation failures
    const validationDetails = mappingResults.map(result => ({
      sectionId: result.sectionId,
      sectionTitle: result.sectionTitle,
      isValid: result.hasAllRequiredInputs,
      missingInputs: result.missingRequiredInputs,
      inputValidations: result.relevantInputs.map(input => ({
        inputPath: input.inputPath,
        isResolved: input.isResolved,
        validationResults: input.validationResults
      }))
    }));
    
    res.json({
      success: true,
      validationMode: true,
      overallValid: validationResult.isValid,
      
      summary: validationResult.summary,
      missingRequiredSections: validationResult.missingRequiredSections,
      
      detailedValidation: validationDetails,
      
      recommendations: generateValidationRecommendations(mappingResults),
      
      systemCheck: {
        mappingEngineVersion: '1.0.0',
        totalValidationRules: mappingResults.reduce((sum, m) => 
          sum + m.relevantInputs.reduce((iSum, i) => iSum + i.validationResults.length, 0), 0),
        passedValidations: mappingResults.reduce((sum, m) => 
          sum + m.relevantInputs.reduce((iSum, i) => 
            iSum + i.validationResults.filter(v => v.passed).length, 0), 0),
        failedValidations: mappingResults.reduce((sum, m) => 
          sum + m.relevantInputs.reduce((iSum, i) => 
            iSum + i.validationResults.filter(v => !v.passed).length, 0), 0)
      }
    });
    
  } catch (error) {
    console.error('❌ Validate input mapping error:', error);
    res.status(500).json({
      success: false,
      validationMode: true,
      error: error instanceof Error ? error.message : 'Input validation failed'
    });
  }
}

/**
 * Generate comprehensive SOW mapping report
 */
export async function generateMappingReport(req: Request, res: Response) {
  try {
    const inputs = req.body;
    
    // Run comprehensive analysis
    const sectionAnalysis = selectSectionsEnhanced(inputs);
    const availableMappings = getAvailableSectionMappings();
    const inputCoverage = analyzeMappingCoverage(inputs, availableMappings);
    
    // Generate detailed report
    const report = {
      reportGenerated: new Date().toISOString(),
      projectInfo: {
        projectName: inputs.projectName || 'Unnamed Project',
        projectType: inputs.projectType || 'Unknown',
        squareFootage: inputs.squareFootage || 0
      },
      
      sectionAnalysis: {
        totalSectionsAvailable: availableMappings.length,
        sectionsIncluded: sectionAnalysis.includedSections.length,
        sectionsExcluded: sectionAnalysis.excludedSections.length,
        confidenceScore: sectionAnalysis.confidenceScore,
        
        includedSections: sectionAnalysis.includedSections.map(section => ({
          id: section.id,
          title: section.title,
          rationale: section.rationale,
          priority: section.priority,
          hasContent: !!section.content,
          contentLength: section.content?.length || 0
        })),
        
        excludedSections: sectionAnalysis.excludedSections.map(section => ({
          id: section.id,
          title: section.title,
          rationale: section.rationale
        }))
      },
      
      inputMappingAnalysis: {
        totalMappings: sectionAnalysis.inputMappingResults.length,
        resolvedMappings: sectionAnalysis.inputMappingResults.filter(m => m.hasAllRequiredInputs).length,
        partiallyResolvedMappings: sectionAnalysis.inputMappingResults.filter(m => 
          !m.hasAllRequiredInputs && m.relevantInputs.some(i => i.isResolved)).length,
        unresolvedMappings: sectionAnalysis.inputMappingResults.filter(m => 
          !m.relevantInputs.some(i => i.isResolved)).length,
        
        mappingDetails: sectionAnalysis.inputMappingResults.map(mapping => ({
          sectionId: mapping.sectionId,
          sectionTitle: mapping.sectionTitle,
          isFullyResolved: mapping.hasAllRequiredInputs,
          missingInputs: mapping.missingRequiredInputs,
          inputCount: mapping.relevantInputs.length,
          resolvedInputCount: mapping.relevantInputs.filter(i => i.isResolved).length,
          fallbacksUsed: mapping.relevantInputs.filter(i => i.fallbackUsed).length
        }))
      },
      
      validationSummary: sectionAnalysis.inputValidationSummary,
      
      recommendations: {
        criticalMissingInputs: sectionAnalysis.inputValidationSummary.missingRequiredInputs.slice(0, 5),
        improvementSuggestions: generateImprovementSuggestions(sectionAnalysis),
        dataQualityScore: calculateDataQualityScore(sectionAnalysis),
        nextSteps: generateNextSteps(sectionAnalysis)
      },
      
      auditSummary: {
        inputResolutionEntries: sectionAnalysis.auditTrail.inputResolution.length,
        sectionGenerationEntries: sectionAnalysis.auditTrail.sectionGeneration.length,
        contentPopulationEntries: sectionAnalysis.auditTrail.contentPopulation.length,
        selfHealingActions: sectionAnalysis.selfHealingActions.length
      }
    };
    
    res.json({
      success: true,
      reportMode: true,
      report
    });
    
  } catch (error) {
    console.error('❌ Generate mapping report error:', error);
    res.status(500).json({
      success: false,
      reportMode: true,
      error: error instanceof Error ? error.message : 'Failed to generate mapping report'
    });
  }
}

// Helper functions

function createEngineeringSummaryFromMapping(sectionAnalysis: EnhancedSectionAnalysis): any {
  return {
    templateSelection: {
      templateName: 'Enhanced Template',
      rationale: 'Template selected based on comprehensive input mapping analysis'
    },
    windAnalysis: {
      asceVersion: 'ASCE 7-16',
      exposureCategory: 'B',
      pressureMethodology: ['Comprehensive wind analysis performed']
    },
    jurisdiction: {
      county: 'Unknown',
      state: 'Unknown',
      hvhz: false,
      jurisdictionNotes: [],
      codeCycle: '2021 IBC',
      specialRequirements: []
    },
    systemSelection: {
      selectedSystem: 'TPO Membrane System',
      rejectedSystems: [],
      fasteningSpecs: {
        fieldSpacing: '12" o.c.',
        perimeterSpacing: '6" o.c.',
        cornerSpacing: '4" o.c.',
        penetrationDepth: '1.25" minimum',
        safetyMargin: '2.0x',
        fastenerType: 'Steel fasteners'
      }
    },
    takeoffDiagnostics: {
      overallRisk: 'Low',
      flags: [],
      recommendations: []
    },
    sectionAnalysis: {
      includedSections: sectionAnalysis.includedSections,
      excludedSections: sectionAnalysis.excludedSections,
      reasoningMap: sectionAnalysis.reasoningMap,
      selfHealingActions: sectionAnalysis.selfHealingActions,
      confidenceScore: sectionAnalysis.confidenceScore
    },
    selfHealingReport: {
      totalActions: sectionAnalysis.selfHealingActions.length,
      highImpactActions: sectionAnalysis.selfHealingActions.filter((action: any) => action.confidence > 0.8),
      recommendations: ['Review missing inputs', 'Verify fallback values'],
      overallConfidence: sectionAnalysis.confidenceScore,
      requiresUserReview: sectionAnalysis.selfHealingActions.length > 0
    }
  };
}

function analyzeMappingCoverage(inputs: any, availableMappings: any[]): any {
  const inputPaths = extractInputPaths(inputs);
  const mappedPaths = availableMappings.map(m => m.inputPath);
  
  const coverage = {
    totalInputPaths: inputPaths.length,
    mappedInputPaths: inputPaths.filter(path => mappedPaths.includes(path)).length,
    unmappedInputPaths: inputPaths.filter(path => !mappedPaths.includes(path)),
    coveragePercentage: inputPaths.length > 0 ? 
      (inputPaths.filter(path => mappedPaths.includes(path)).length / inputPaths.length * 100) : 0
  };
  
  return coverage;
}

function extractInputPaths(obj: any, prefix = ''): string[] {
  const paths: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...extractInputPaths(value, currentPath));
    } else {
      paths.push(currentPath);
    }
  }
  
  return paths;
}

function generateValidationRecommendations(mappingResults: any[]): string[] {
  const recommendations: string[] = [];
  
  const missingInputCount = mappingResults.filter(m => !m.hasAllRequiredInputs).length;
  if (missingInputCount > 0) {
    recommendations.push(`Provide missing inputs for ${missingInputCount} sections to improve SOW completeness`);
  }
  
  const validationFailures = mappingResults.reduce((sum, m) => 
    sum + m.relevantInputs.reduce((iSum: number, i: any) => 
      iSum + i.validationResults.filter((v: any) => !v.passed).length, 0), 0);
  
  if (validationFailures > 0) {
    recommendations.push(`Address ${validationFailures} validation failures to improve data quality`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All validations passed - SOW can be generated with high confidence');
  }
  
  return recommendations;
}

function generateImprovementSuggestions(sectionAnalysis: EnhancedSectionAnalysis): string[] {
  const suggestions: string[] = [];
  
  if (sectionAnalysis.confidenceScore < 0.8) {
    suggestions.push('Consider providing additional project details to improve confidence score');
  }
  
  if (sectionAnalysis.selfHealingActions.length > 3) {
    suggestions.push('Multiple fallback values were used - verify project data for accuracy');
  }
  
  const unresolvedMappings = sectionAnalysis.inputMappingResults.filter(m => !m.hasAllRequiredInputs);
  if (unresolvedMappings.length > 0) {
    suggestions.push(`Focus on resolving inputs for: ${unresolvedMappings.slice(0, 3).map(m => m.sectionTitle).join(', ')}`);
  }
  
  return suggestions;
}

function calculateDataQualityScore(sectionAnalysis: EnhancedSectionAnalysis): number {
  const totalMappings = sectionAnalysis.inputMappingResults.length;
  const resolvedMappings = sectionAnalysis.inputMappingResults.filter(m => m.hasAllRequiredInputs).length;
  const fallbacksUsed = sectionAnalysis.selfHealingActions.length;
  
  const baseScore = totalMappings > 0 ? (resolvedMappings / totalMappings) : 0;
  const fallbackPenalty = Math.min(fallbacksUsed * 0.05, 0.2);
  
  return Math.max(0, Math.min(1, baseScore - fallbackPenalty));
}

function generateNextSteps(sectionAnalysis: EnhancedSectionAnalysis): string[] {
  const steps: string[] = [];
  
  if (sectionAnalysis.inputValidationSummary.missingRequiredInputs.length > 0) {
    steps.push('Gather missing required project information');
  }
  
  if (sectionAnalysis.selfHealingActions.length > 0) {
    steps.push('Review and confirm automatically applied fallback values');
  }
  
  if (sectionAnalysis.confidenceScore > 0.8) {
    steps.push('Proceed with SOW generation - data quality is sufficient');
  } else {
    steps.push('Improve data quality before generating final SOW');
  }
  
  return steps;
}

export {
  generateSOWWithMapping,
  debugSectionMapping,
  getAvailableMappings,
  findInputMappings,
  validateInputMapping,
  generateMappingReport
};

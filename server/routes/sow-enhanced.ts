// Enhanced SOW Routes - Phase 3 Implementation
// Section Engine & Self-Healing Integration
import { Request, Response } from 'express';
import { 
  generateSOWWithEngineering, 
  generateDebugSOW, 
  validateSOWInputs, 
  SOWGeneratorInputs
} from '../core/sow-generator';

/**
 * PHASE 3: Debug endpoint with Section Analysis & Self-Healing
 * Returns complete engineeringSummary with section analysis
 */
export async function debugSOWEnhanced(req: Request, res: Response) {
  try {
    console.log('🧪 Enhanced Debug SOW - Phase 3 Section Engine & Self-Healing');
    
    // Use request body or generate mock data
    const mockOverrides = req.body || {};
    const result = await generateDebugSOW({
      ...mockOverrides,
      debug: true, // Force debug mode
      engineDebug: {
        template: true,
        wind: true,
        fastening: true,
        takeoff: true,
        sections: true // NEW: Section engine debug
      }
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        debugMode: true
      });
    }
    
    // Phase 3: Enhanced Engineering Summary Response with Section Analysis
    const enhancedResponse = {
      success: true,
      debugMode: true,
      
      // Core engineering summary with explainability
      engineeringSummary: {
        templateSelection: {
          templateName: result.engineeringSummary!.templateSelection.templateName,
          rationale: result.engineeringSummary!.templateSelection.rationale,
          rejectedTemplates: result.engineeringSummary!.templateSelection.rejectedTemplates
        },
        
        windAnalysis: {
          asceVersion: result.engineeringSummary!.windAnalysis.asceVersion,
          windSpeed: result.engineeringSummary!.windAnalysis.windSpeed,
          zonePressures: result.engineeringSummary!.windAnalysis.zonePressures,
          pressureMethodology: result.engineeringSummary!.windAnalysis.pressureMethodology
        },
        
        jurisdiction: {
          county: result.engineeringSummary!.jurisdiction.county,
          state: result.engineeringSummary!.jurisdiction.state,
          hvhz: result.engineeringSummary!.jurisdiction.hvhz,
          jurisdictionNotes: result.engineeringSummary!.jurisdiction.jurisdictionNotes
        },
        
        systemSelection: {
          selectedSystem: result.engineeringSummary!.systemSelection.selectedSystem,
          rejectedSystems: result.engineeringSummary!.systemSelection.rejectedSystems,
          fasteningSpecs: {
            fieldSpacing: result.engineeringSummary!.systemSelection.fasteningSpecs.fieldSpacing,
            cornerSpacing: result.engineeringSummary!.systemSelection.fasteningSpecs.cornerSpacing,
            safetyMargin: result.engineeringSummary!.systemSelection.fasteningSpecs.safetyMargin
          }
        },
        
        takeoffDiagnostics: {
          overallRisk: result.engineeringSummary!.takeoffDiagnostics.overallRisk,
          flags: result.engineeringSummary!.takeoffDiagnostics.flags,
          recommendations: result.engineeringSummary!.takeoffDiagnostics.recommendations
        },

        // NEW: Section Analysis
        sectionAnalysis: {
          includedSections: result.engineeringSummary!.sectionAnalysis.includedSections,
          excludedSections: result.engineeringSummary!.sectionAnalysis.excludedSections,
          reasoningMap: result.engineeringSummary!.sectionAnalysis.reasoningMap,
          selfHealingActions: result.engineeringSummary!.sectionAnalysis.selfHealingActions,
          confidenceScore: result.engineeringSummary!.sectionAnalysis.confidenceScore
        },

        // NEW: Self-Healing Report  
        selfHealingReport: {
          totalActions: result.engineeringSummary!.selfHealingReport.totalActions,
          highImpactActions: result.engineeringSummary!.selfHealingReport.highImpactActions,
          recommendations: result.engineeringSummary!.selfHealingReport.recommendations,
          overallConfidence: result.engineeringSummary!.selfHealingReport.overallConfidence,
          requiresUserReview: result.engineeringSummary!.selfHealingReport.requiresUserReview
        }
      },
      
      // Enhanced debug information
      debugInfo: result.debugInfo,
      
      // Processing metadata
      metadata: {
        generationTime: result.generationTime,
        processingSteps: result.debugInfo?.processingSteps?.length || 0,
        engineTraces: Object.keys(result.debugInfo?.engineTraces || {}),
        sectionsIncluded: result.engineeringSummary!.sectionAnalysis.includedSections.length,
        sectionsExcluded: result.engineeringSummary!.sectionAnalysis.excludedSections.length,
        selfHealingActions: result.engineeringSummary!.selfHealingReport.totalActions
      }
    };
    
    console.log('✅ Enhanced debug SOW completed');
    console.log(`📊 Template: ${enhancedResponse.engineeringSummary.templateSelection.templateName}`);
    console.log(`💨 Wind: ${enhancedResponse.engineeringSummary.windAnalysis.windSpeed}mph`);
    console.log(`🏭 System: ${enhancedResponse.engineeringSummary.systemSelection.selectedSystem}`);
    console.log(`📋 Sections: ${enhancedResponse.metadata.sectionsIncluded} included, ${enhancedResponse.metadata.sectionsExcluded} excluded`);
    console.log(`🔧 Self-healing: ${enhancedResponse.metadata.selfHealingActions} actions`);
    
    res.json(enhancedResponse);
    
  } catch (error) {
    console.error('❌ Enhanced debug endpoint error:', error);
    res.status(500).json({
      success: false,
      debugMode: true,
      error: error instanceof Error ? error.message : 'Enhanced debug endpoint error'
    });
  }
}

/**
 * NEW PHASE 3: Section-specific analysis endpoint
 * Returns detailed section mapping and reasoning
 */
export async function debugSectionAnalysis(req: Request, res: Response) {
  try {
    console.log('🔍 Section Analysis Debug Mode');
    
    const inputData = req.body || {};
    const result = await generateDebugSOW({
      ...inputData,
      debug: true,
      engineDebug: { sections: true }
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const sectionAnalysis = result.engineeringSummary!.sectionAnalysis;
    const sectionEngine = result.debugInfo?.engineTraces?.sectionEngine;
    
    res.json({
      success: true,
      sectionAnalysis: {
        summary: {
          totalSections: sectionAnalysis.includedSections.length + sectionAnalysis.excludedSections.length,
          includedCount: sectionAnalysis.includedSections.length,
          excludedCount: sectionAnalysis.excludedSections.length,
          confidenceScore: sectionAnalysis.confidenceScore,
          selfHealingActions: sectionAnalysis.selfHealingActions.length
        },
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
        })),
        reasoningMap: sectionAnalysis.reasoningMap,
        selfHealingActions: sectionAnalysis.selfHealingActions,
        debugTrace: sectionEngine
      },
      metadata: {
        timestamp: new Date().toISOString(),
        engineVersion: '4.0.0 - Section Engine',
        debugMode: true
      }
    });
    
  } catch (error) {
    console.error('❌ Section analysis debug error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Section analysis debug failed'
    });
  }
}

/**
 * NEW PHASE 3: Self-healing report endpoint
 * Returns detailed self-healing actions and recommendations
 */
export async function debugSelfHealing(req: Request, res: Response) {
  try {
    console.log('🔧 Self-Healing Analysis Debug Mode');
    
    const inputData = req.body || {};
    const result = await generateDebugSOW({
      ...inputData,
      debug: true
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const healingReport = result.engineeringSummary!.selfHealingReport;
    
    res.json({
      success: true,
      selfHealingReport: {
        summary: {
          totalActions: healingReport.totalActions,
          highImpactCount: healingReport.highImpactActions.length,
          overallConfidence: healingReport.overallConfidence,
          requiresUserReview: healingReport.requiresUserReview
        },
        actions: healingReport.highImpactActions.map(action => ({
          type: action.type,
          field: action.field,
          originalValue: action.originalValue,
          correctedValue: action.correctedValue,
          reason: action.reason,
          confidence: action.confidence,
          impact: action.impact
        })),
        recommendations: healingReport.recommendations,
        actionsByType: categorizeActionsByType(healingReport.highImpactActions),
        actionsByImpact: categorizeActionsByImpact(healingReport.highImpactActions)
      },
      metadata: {
        timestamp: new Date().toISOString(),
        engineVersion: '4.0.0 - Self-Healing',
        debugMode: true
      }
    });
    
  } catch (error) {
    console.error('❌ Self-healing debug error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Self-healing debug failed'
    });
  }
}

/**
 * PHASE 4: Template content rendering endpoint (updated for sections)
 * Returns rendered template content with dynamic sections
 */
export async function renderTemplateContent(req: Request, res: Response) {
  try {
    const { templateId, engineeringSummary } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId is required'
      });
    }
    
    console.log(`📄 Rendering template content for ${templateId} with sections...`);
    
    // Phase 4: Template rendering with section integration
    const renderedContent = await renderTemplateWithSections(templateId, engineeringSummary);
    
    res.json({
      success: true,
      templateId,
      templateName: renderedContent.templateName,
      renderedSections: renderedContent.sections,
      dynamicSections: renderedContent.dynamicSections,
      placeholdersReplaced: renderedContent.placeholders,
      renderTimestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Template rendering error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Template rendering failed'
    });
  }
}

/**
 * PHASE 3: Per-engine debug mode endpoint (updated)
 */
export async function debugEngineTrace(req: Request, res: Response) {
  try {
    const { engine, inputs } = req.body;
    
    if (!engine || !['template', 'wind', 'fastening', 'takeoff', 'sections'].includes(engine)) {
      return res.status(400).json({
        success: false,
        error: 'Valid engine type required: template, wind, fastening, takeoff, or sections'
      });
    }
    
    console.log(`🔍 Debug trace for ${engine} engine...`);
    
    // Generate SOW with specific engine debug enabled
    const debugConfig = {
      debug: true,
      engineDebug: {
        [engine]: true
      }
    };
    
    const result = await generateDebugSOW({ ...inputs, ...debugConfig });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    // Return specific engine trace
    const engineTrace = result.debugInfo?.engineTraces?.[`${engine}Engine`];
    
    res.json({
      success: true,
      engine,
      trace: engineTrace,
      metadata: {
        generationTime: result.generationTime,
        engineSpecific: true
      }
    });
    
  } catch (error) {
    console.error(`❌ Engine trace error for ${req.body.engine}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Engine trace failed'
    });
  }
}

/**
 * PHASE 4: Template mapping endpoint
 */
export async function getTemplateMap(req: Request, res: Response) {
  try {
    res.json({
      success: true,
      templateMap: TEMPLATE_MAP,
      supportedTemplates: Object.keys(TEMPLATE_MAP),
      version: '4.0.0 - Section Engine & Template System'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve template map'
    });
  }
}

// Helper functions for categorizing self-healing actions
function categorizeActionsByType(actions: any[]): Record<string, number> {
  const categories: Record<string, number> = {};
  actions.forEach(action => {
    categories[action.type] = (categories[action.type] || 0) + 1;
  });
  return categories;
}

function categorizeActionsByImpact(actions: any[]): Record<string, number> {
  const impacts: Record<string, number> = {};
  actions.forEach(action => {
    impacts[action.impact] = (impacts[action.impact] || 0) + 1;
  });
  return impacts;
}

// Enhanced template rendering with section integration
async function renderTemplateWithSections(templateId: string, engineeringSummary: any) {
  const template = TEMPLATE_MAP[templateId as keyof typeof TEMPLATE_MAP];
  
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  // Get base template content
  const mockTemplateContent = getTemplateContent(templateId);
  
  // Get dynamic sections from section analysis
  const dynamicSections = extractDynamicSections(engineeringSummary?.sectionAnalysis);
  
  // Replace placeholders with actual values
  const renderedContent = replacePlaceholders(mockTemplateContent, engineeringSummary);
  
  return {
    templateName: template.name,
    sections: renderedContent,
    dynamicSections,
    placeholders: extractPlaceholders(mockTemplateContent)
  };
}

function extractDynamicSections(sectionAnalysis: any): any[] {
  if (!sectionAnalysis?.includedSections) return [];
  
  return sectionAnalysis.includedSections.map((section: any) => ({
    id: section.id,
    title: section.title,
    content: section.content || `[${section.title} content would be generated here]`,
    priority: section.priority || 0,
    rationale: section.rationale
  })).sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));
}

// Phase 4: Template Map Implementation (updated)
const TEMPLATE_MAP = {
  T1: { name: "Recover", file: "T1-recover.txt", type: "recover" },
  T2: { name: "Tear-off", file: "T2-tearoff.txt", type: "tearoff" },
  T3: { name: "Fleeceback", file: "T3-fleeceback.txt", type: "fleeceback" },
  T4: { name: "HVHZ Recover", file: "T4-hvhz.txt", type: "hvhz_recover" },
  T5: { name: "Tapered Insulation", file: "T5-tapered.txt", type: "tapered" },
  T6: { name: "Steep Slope", file: "T6-steep.txt", type: "steep_slope" },
  T7: { name: "High-Rise", file: "T7-highrise.txt", type: "high_rise" },
  T8: { name: "Special Conditions", file: "T8-special.txt", type: "special" }
};

/**
 * Phase 4: Mock template content generator (updated for sections)
 */
function getTemplateContent(templateId: string): Record<string, string> {
  const templates = {
    T1: {
      opening: "This project involves a **{{selectedSystem}}** roof recover system over the existing roof assembly.",
      scope: "The scope includes installation of {{zonePressures}} compliant fastening patterns with {{fasteningSpecs}} specifications.",
      rationale: "Template selected based on: {{rationale}}",
      sections_note: "Dynamic sections will be inserted based on project requirements and section analysis."
    },
    T2: {
      opening: "This project involves complete tear-off and replacement with **{{selectedSystem}}** roof system.",
      scope: "Wind pressures calculated using {{asceVersion}} methodology with {{zonePressures}} requirements.",
      rationale: "{{rationale}}",
      sections_note: "Project-specific sections included based on takeoff analysis."
    },
    T4: {
      opening: "This **HVHZ compliant** project requires enhanced wind resistance per {{jurisdictionNotes}}.",
      scope: "System selection: {{selectedSystem}} with enhanced fastening: {{fasteningSpecs}}.",
      rationale: "HVHZ template selected: {{rationale}}",
      sections_note: "Enhanced HVHZ-specific sections included automatically."
    },
    T6: {
      opening: "This steep slope project requires specialized installation procedures.",
      scope: "Steep slope attachment with {{selectedSystem}} and {{fasteningSpecs}}.",
      rationale: "Steep slope template: {{rationale}}",
      sections_note: "Steep slope specific sections and safety requirements included."
    }
  };
  
  return templates[templateId as keyof typeof templates] || templates.T1;
}

/**
 * Phase 4: Placeholder replacement function
 */
function replacePlaceholders(content: Record<string, string>, summary: any): Record<string, string> {
  const replacements = {
    '{{selectedSystem}}': summary?.systemSelection?.selectedSystem || 'TPO Membrane System',
    '{{zonePressures}}': formatZonePressures(summary?.windAnalysis?.zonePressures),
    '{{fasteningSpecs}}': formatFasteningSpecs(summary?.systemSelection?.fasteningSpecs),
    '{{rationale}}': summary?.templateSelection?.rationale || 'Standard template selection',
    '{{asceVersion}}': summary?.windAnalysis?.asceVersion || 'ASCE 7-16',
    '{{jurisdictionNotes}}': summary?.jurisdiction?.jurisdictionNotes?.join('; ') || 'Standard requirements'
  };
  
  const rendered: Record<string, string> = {};
  
  for (const [section, text] of Object.entries(content)) {
    let renderedText = text;
    
    // Replace all placeholders
    for (const [placeholder, value] of Object.entries(replacements)) {
      renderedText = renderedText.replace(new RegExp(placeholder, 'g'), value);
    }
    
    rendered[section] = renderedText;
  }
  
  return rendered;
}

/**
 * Helper functions for formatting
 */
function formatZonePressures(pressures: any): string {
  if (!pressures) return 'standard wind pressures';
  
  const formatted = [];
  if (pressures.zone1Field) formatted.push(`Field: ${Math.abs(pressures.zone1Field)}psf`);
  if (pressures.zone3Corner) formatted.push(`Corner: ${Math.abs(pressures.zone3Corner)}psf`);
  
  return formatted.join(', ') || 'calculated wind pressures';
}

function formatFasteningSpecs(specs: any): string {
  if (!specs) return 'standard fastening specifications';
  
  return `${specs.fieldSpacing || '12" o.c.'} field, ${specs.cornerSpacing || '6" o.c.'} corner`;
}

function extractPlaceholders(content: Record<string, string>): string[] {
  const placeholders = new Set<string>();
  
  for (const text of Object.values(content)) {
    const matches = text.match(/\{\{[^}]+\}\}/g);
    if (matches) {
      matches.forEach(match => placeholders.add(match));
    }
  }
  
  return Array.from(placeholders);
}

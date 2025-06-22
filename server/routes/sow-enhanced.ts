// Enhanced SOW Routes - Phase 2 & 4 Implementation
// Advanced Engineering Intelligence & Traceability + Template System
import { Request, Response } from 'express';
import { 
  generateSOWWithEngineering, 
  generateDebugSOW, 
  validateSOWInputs, 
  SOWGeneratorInputs
} from '../core/sow-generator';

/**
 * PHASE 2: Debug endpoint without PDF generation
 * Returns engineeringSummary block with full explainability
 */
export async function debugSOWEnhanced(req: Request, res: Response) {
  try {
    console.log('🧪 Enhanced Debug SOW - Phase 2 Explainability');
    
    // Use request body or generate mock data
    const mockOverrides = req.body || {};
    const result = await generateDebugSOW({
      ...mockOverrides,
      debug: true, // Force debug mode
      engineDebug: {
        template: true,
        wind: true,
        fastening: true,
        takeoff: true
      }
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        debugMode: true
      });
    }
    
    // Phase 2: Enhanced Engineering Summary Response
    const enhancedResponse = {
      success: true,
      debugMode: true,
      
      // Core engineering summary with explainability
      engineeringSummary: {
        templateSelection: {
          templateName: result.engineeringSummary!.templateSelection.templateName,
          rationale: result.engineeringSummary!.templateSelection.rationale,
          rejectedTemplates: result.engineeringSummary!.templateSelection.rejectedTemplates.map(t => ({
            template: t.name,
            reason: t.reason
          }))
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
        }
      },
      
      // Enhanced debug information
      debugInfo: result.debugInfo,
      
      // Processing metadata
      metadata: {
        generationTime: result.generationTime,
        processingSteps: result.debugInfo?.processingSteps?.length || 0,
        engineTraces: Object.keys(result.debugInfo?.engineTraces || {})
      }
    };
    
    console.log('✅ Enhanced debug SOW completed');
    console.log(`📊 Template: ${enhancedResponse.engineeringSummary.templateSelection.templateName}`);
    console.log(`💨 Wind: ${enhancedResponse.engineeringSummary.windAnalysis.windSpeed}mph`);
    console.log(`🏭 System: ${enhancedResponse.engineeringSummary.systemSelection.selectedSystem}`);
    
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
 * PHASE 4: Template content rendering endpoint
 * Returns rendered template content with placeholders filled
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
    
    console.log(`📄 Rendering template content for ${templateId}...`);
    
    // Phase 4: Template rendering implementation
    const renderedContent = await renderTemplate(templateId, engineeringSummary);
    
    res.json({
      success: true,
      templateId,
      templateName: renderedContent.templateName,
      renderedSections: renderedContent.sections,
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

// Phase 4: Template Map Implementation
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
 * Phase 4: Template renderer function
 */
async function renderTemplate(templateId: string, engineeringSummary: any) {
  const template = TEMPLATE_MAP[templateId as keyof typeof TEMPLATE_MAP];
  
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  // For now, return mock template content with placeholders
  // This would be replaced with actual file reading in full implementation
  const mockTemplateContent = getTemplateContent(templateId);
  
  // Replace placeholders with actual values
  const renderedContent = replacePlaceholders(mockTemplateContent, engineeringSummary);
  
  return {
    templateName: template.name,
    sections: renderedContent,
    placeholders: extractPlaceholders(mockTemplateContent)
  };
}

/**
 * Phase 4: Mock template content generator
 */
function getTemplateContent(templateId: string): Record<string, string> {
  const templates = {
    T1: {
      opening: "This project involves a **{{selectedSystem}}** roof recover system over the existing roof assembly.",
      scope: "The scope includes installation of {{zonePressures}} compliant fastening patterns with {{fasteningSpecs}} specifications.",
      rationale: "Template selected based on: {{rationale}}"
    },
    T2: {
      opening: "This project involves complete tear-off and replacement with **{{selectedSystem}}** roof system.",
      scope: "Wind pressures calculated using {{asceVersion}} methodology with {{zonePressures}} requirements.",
      rationale: "{{rationale}}"
    },
    T4: {
      opening: "This **HVHZ compliant** project requires enhanced wind resistance per {{jurisdictionNotes}}.",
      scope: "System selection: {{selectedSystem}} with enhanced fastening: {{fasteningSpecs}}.",
      rationale: "HVHZ template selected: {{rationale}}"
    },
    T6: {
      opening: "This steep slope project ({{roofSlope}}) requires specialized installation procedures.",
      scope: "Steep slope attachment with {{selectedSystem}} and {{fasteningSpecs}}.",
      rationale: "Steep slope template: {{rationale}}"
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
  if (pressures.zone_1) formatted.push(`Field: ${Math.abs(pressures.zone_1)}psf`);
  if (pressures.zone_3) formatted.push(`Corner: ${Math.abs(pressures.zone_3)}psf`);
  
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

/**
 * PHASE 2: Per-engine debug mode endpoint
 */
export async function debugEngineTrace(req: Request, res: Response) {
  try {
    const { engine, inputs } = req.body;
    
    if (!engine || !['template', 'wind', 'fastening', 'takeoff'].includes(engine)) {
      return res.status(400).json({
        success: false,
        error: 'Valid engine type required: template, wind, fastening, or takeoff'
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
      version: '4.0.0 - Template System'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve template map'
    });
  }
}

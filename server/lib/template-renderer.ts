/**
 * TEMPLATE RENDERER - PHASE 4 IMPLEMENTATION
 * Dynamic template rendering with placeholder replacement
 * Reads template files and merges with engineering data
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

export interface TemplateRenderResult {
  templateId: string;
  templateName: string;
  sections: Record<string, string>;
  placeholders: string[];
  metadata: {
    renderTimestamp: string;
    templateVersion: string;
    placeholdersReplaced: number;
  };
}

/**
 * Master Template Map (T1-T8)
 */
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
 * Main template rendering function
 */
export async function renderTemplate(
  templateId: string, 
  engineeringSummary: any
): Promise<TemplateRenderResult> {
  
  console.log(`📄 Rendering template ${templateId}...`);
  
  const template = TEMPLATE_MAP[templateId as keyof typeof TEMPLATE_MAP];
  if (!template) {
    throw new Error(`Template ${templateId} not found in template map`);
  }
  
  try {
    // Load template file
    const templatePath = join(__dirname, '../templates/text', template.file);
    let templateContent: string;
    
    try {
      templateContent = await readFile(templatePath, 'utf-8');
    } catch (fileError) {
      console.warn(`⚠️ Template file not found: ${templatePath}, using fallback`);
      templateContent = getFallbackTemplate(templateId);
    }
    
    // Extract sections from template
    const sections = parseTemplateSections(templateContent);
    
    // Create replacement mapping from engineering summary
    const replacementMap = createReplacementMap(engineeringSummary);
    
    // Replace placeholders in each section
    const renderedSections = replacePlaceholders(sections, replacementMap);
    
    // Extract placeholders that were found
    const placeholders = extractPlaceholders(templateContent);
    
    const result: TemplateRenderResult = {
      templateId,
      templateName: template.name,
      sections: renderedSections,
      placeholders,
      metadata: {
        renderTimestamp: new Date().toISOString(),
        templateVersion: '4.0.0',
        placeholdersReplaced: Object.keys(replacementMap).length
      }
    };
    
    console.log(`✅ Template ${templateId} rendered successfully`);
    console.log(`📝 Replaced ${result.metadata.placeholdersReplaced} placeholders`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Template rendering failed for ${templateId}:`, error);
    throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse template into sections
 */
function parseTemplateSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  
  // Split by headers (## headings)
  const headerPattern = /^## (.+)$/gm;
  const parts = content.split(headerPattern);
  
  if (parts.length > 1) {
    // Template has sections
    for (let i = 1; i < parts.length; i += 2) {
      const sectionName = parts[i].trim();
      const sectionContent = parts[i + 1]?.trim() || '';
      sections[sectionName] = sectionContent;
    }
  } else {
    // No sections, treat as single content
    sections['content'] = content;
  }
  
  return sections;
}

/**
 * Create replacement map from engineering summary
 */
function createReplacementMap(summary: any): Record<string, string> {
  const replacements: Record<string, string> = {};
  
  // Basic project info
  replacements['{{projectAddress}}'] = summary?.metadata?.address || 'Project Address';
  replacements['{{projectName}}'] = summary?.metadata?.projectName || 'Project Name';
  replacements['{{generationTimestamp}}'] = new Date().toISOString();
  replacements['{{templateVersion}}'] = '4.0.0';
  
  // Template selection
  replacements['{{rationale}}'] = summary?.templateSelection?.rationale || 'Template selected based on project requirements';
  
  // System selection
  replacements['{{selectedSystem}}'] = summary?.systemSelection?.selectedSystem || 'TPO Membrane System';
  
  // Wind analysis
  replacements['{{asceVersion}}'] = summary?.windAnalysis?.asceVersion || 'ASCE 7-16';
  replacements['{{windSpeed}}'] = `${summary?.windAnalysis?.windSpeed || 115} mph`;
  replacements['{{windCalculationSummary}}'] = formatWindCalculationSummary(summary?.windAnalysis);
  replacements['{{zonePressures}}'] = formatZonePressures(summary?.windAnalysis?.zonePressures);
  replacements['{{zonePressureDetails}}'] = formatZonePressureDetails(summary?.windAnalysis?.zonePressures);
  
  // Jurisdiction
  replacements['{{jurisdictionNotes}}'] = summary?.jurisdiction?.jurisdictionNotes?.join('; ') || 'Standard building code requirements';
  replacements['{{codeCycle}}'] = summary?.jurisdiction?.codeCycle || 'Current Building Code';
  
  // Fastening specifications
  const fasteningSpecs = summary?.systemSelection?.fasteningSpecs;
  replacements['{{fasteningSpecs}}'] = formatFasteningSpecs(fasteningSpecs);
  replacements['{{fieldSpacing}}'] = fasteningSpecs?.fieldSpacing || '12" o.c.';
  replacements['{{perimeterSpacing}}'] = fasteningSpecs?.perimeterSpacing || '8" o.c.';
  replacements['{{cornerSpacing}}'] = fasteningSpecs?.cornerSpacing || '6" o.c.';
  replacements['{{fastenerType}}'] = fasteningSpecs?.fastenerType || 'Standard Fasteners';
  replacements['{{penetrationDepth}}'] = fasteningSpecs?.penetrationDepth || '1.5" minimum';
  
  // Special requirements
  replacements['{{specialRequirements}}'] = formatSpecialRequirements(summary);
  replacements['{{complianceNotes}}'] = formatComplianceNotes(summary);
  
  // HVHZ specific
  replacements['{{noaRequired}}'] = summary?.jurisdiction?.hvhz ? 'Yes - NOA approval required' : 'Not required';
  
  // Slope specific
  const roofSlope = summary?.projectInputs?.roofSlope || 0.25;
  replacements['{{roofSlope}}'] = `${(roofSlope * 12).toFixed(1)}:12`;
  
  return replacements;
}

/**
 * Replace placeholders in sections
 */
function replacePlaceholders(
  sections: Record<string, string>, 
  replacements: Record<string, string>
): Record<string, string> {
  
  const rendered: Record<string, string> = {};
  
  for (const [sectionName, content] of Object.entries(sections)) {
    let renderedContent = content;
    
    // Replace all placeholders
    for (const [placeholder, value] of Object.entries(replacements)) {
      renderedContent = renderedContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    
    rendered[sectionName] = renderedContent;
  }
  
  return rendered;
}

/**
 * Extract all placeholders from template content
 */
function extractPlaceholders(content: string): string[] {
  const placeholderPattern = /\{\{[^}]+\}\}/g;
  const matches = content.match(placeholderPattern);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Formatting helper functions
 */
function formatWindCalculationSummary(windAnalysis: any): string {
  if (!windAnalysis) return 'Wind analysis completed per applicable standards';
  
  return `${windAnalysis.windSpeed || 115} mph basic wind speed, ${windAnalysis.exposureCategory || 'C'} exposure, calculated per ${windAnalysis.asceVersion || 'ASCE 7-16'}`;
}

function formatZonePressures(pressures: any): string {
  if (!pressures) return 'standard wind pressures';
  
  const formatted = [];
  if (pressures.zone_1 || pressures.zone1Field) {
    formatted.push(`Field: ${Math.abs(pressures.zone_1 || pressures.zone1Field).toFixed(1)} psf`);
  }
  if (pressures.zone_2 || pressures.zone2Perimeter) {
    formatted.push(`Perimeter: ${Math.abs(pressures.zone_2 || pressures.zone2Perimeter).toFixed(1)} psf`);
  }
  if (pressures.zone_3 || pressures.zone3Corner) {
    formatted.push(`Corner: ${Math.abs(pressures.zone_3 || pressures.zone3Corner).toFixed(1)} psf`);
  }
  
  return formatted.join(', ') || 'calculated wind pressures';
}

function formatZonePressureDetails(pressures: any): string {
  if (!pressures) return 'Zone pressures calculated per applicable standards';
  
  const details = [];
  if (pressures.zone_1 || pressures.zone1Field) {
    details.push(`- **Field Zone**: ${Math.abs(pressures.zone_1 || pressures.zone1Field).toFixed(1)} psf uplift`);
  }
  if (pressures.zone_2 || pressures.zone2Perimeter) {
    details.push(`- **Perimeter Zone**: ${Math.abs(pressures.zone_2 || pressures.zone2Perimeter).toFixed(1)} psf uplift`);
  }
  if (pressures.zone_3 || pressures.zone3Corner) {
    details.push(`- **Corner Zone**: ${Math.abs(pressures.zone_3 || pressures.zone3Corner).toFixed(1)} psf uplift`);
  }
  
  return details.join('\\n') || 'Zone pressures calculated per applicable standards';
}

function formatFasteningSpecs(specs: any): string {
  if (!specs) return 'standard fastening specifications';
  
  return `${specs.fieldSpacing || '12" o.c.'} field, ${specs.perimeterSpacing || '8" o.c.'} perimeter, ${specs.cornerSpacing || '6" o.c.'} corner`;
}

function formatSpecialRequirements(summary: any): string {
  const requirements = [];
  
  if (summary?.jurisdiction?.hvhz) {
    requirements.push('HVHZ compliance required');
  }
  
  if (summary?.takeoffDiagnostics?.overallRisk === 'High') {
    requirements.push('Enhanced quality control due to project complexity');
  }
  
  if (summary?.windAnalysis?.windSpeed > 150) {
    requirements.push('High wind speed design considerations');
  }
  
  return requirements.length > 0 ? requirements.join('\\n- ') : 'Standard installation requirements apply';
}

function formatComplianceNotes(summary: any): string {
  const notes = [];
  
  if (summary?.jurisdiction?.hvhz) {
    notes.push(`HVHZ compliant system with valid NOA approval`);
  }
  
  notes.push(`Designed to meet ${summary?.windAnalysis?.asceVersion || 'ASCE 7-16'} wind load requirements`);
  
  if (summary?.systemSelection?.pressureCompliance?.overallMargin > 1.2) {
    notes.push(`System provides ${(summary.systemSelection.pressureCompliance.overallMargin * 100).toFixed(0)}% safety margin over required pressures`);
  }
  
  return notes.join('\\n\\n');
}

/**
 * Fallback templates for when files aren't available
 */
function getFallbackTemplate(templateId: string): string {
  const fallbacks: Record<string, string> = {
    T1: `# SOW Template T1 - Recover System
## Project Overview
{{selectedSystem}} recover system with {{fasteningSpecs}} specifications.
## Rationale
{{rationale}}`,
    
    T4: `# SOW Template T4 - HVHZ Recover
## HVHZ Requirements
{{selectedSystem}} HVHZ system meeting {{windSpeed}} requirements.
## Compliance
{{noaRequired}} - {{complianceNotes}}`,
    
    T6: `# SOW Template T6 - Steep Slope
## Steep Slope System
{{selectedSystem}} for {{roofSlope}} slope application.
## Special Requirements
{{specialRequirements}}`
  };
  
  return fallbacks[templateId] || fallbacks.T1;
}

/**
 * Get available templates
 */
export function getAvailableTemplates(): typeof TEMPLATE_MAP {
  return TEMPLATE_MAP;
}

/**
 * Validate template ID
 */
export function validateTemplateId(templateId: string): boolean {
  return templateId in TEMPLATE_MAP;
}

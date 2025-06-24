// Enhanced Section Engine with Integrated Input Mapping
// Combines existing section logic with new input-to-section mapping system
// Provides comprehensive SOW section generation with audit trails

import { SectionEngineInputs, SectionOutput, SectionAnalysis } from './section-engine.js';
import { 
  SectionInputMappingEngine, 
  SectionMappingResult, 
  createSectionMappingEngine,
  validateRequiredSections,
  getAvailableSectionMappings
} from './section-input-mapping.js';

export interface EnhancedSectionEngineInputs extends SectionEngineInputs {
  // Additional structured data that follows the CSV mapping format
  decisionTreeResult?: {
    template_selection?: {
      template_id?: string;
      assembly_description?: string;
    };
    decision_tree?: {
      projectType?: string;
      deckType?: string;
      existingRoofSystem?: string;
    };
    enhanced_specifications?: {
      materials?: {
        membrane?: any;
        insulation?: any;
        coverboard_required?: boolean;
      };
      fastening?: {
        enhanced_patterns?: any;
      };
      special_considerations?: any;
    };
  };
  windAnalysis?: {
    zones?: any;
    asceVersion?: string;
    pressures?: {
      zones?: any;
    };
  };
  buildingCodes?: {
    applicable_codes?: {
      primary_code?: string;
    };
    special_requirements?: any;
  };
  zonesAndFastening?: {
    fastening_schedule?: any;
  };
  manufacturerAnalysis?: {
    miami_dade_requirements?: any;
    icc_esr_requirements?: any;
    system_specifications?: any;
    warranty_information?: any;
  };
}

export interface EnhancedSectionAnalysis extends SectionAnalysis {
  inputMappingResults: SectionMappingResult[];
  inputValidationSummary: {
    totalInputs: number;
    resolvedInputs: number;
    missingRequiredInputs: string[];
    validationErrors: string[];
  };
  sectionToInputMap: Record<string, string[]>;
  auditTrail: {
    inputResolution: any[];
    sectionGeneration: any[];
    contentPopulation: any[];
  };
}

/**
 * Enhanced section selection with integrated input mapping
 */
export function selectSectionsEnhanced(inputs: EnhancedSectionEngineInputs): EnhancedSectionAnalysis {
  console.log('🚀 Enhanced Section Engine: Starting comprehensive analysis...');
  console.log(`   📊 Project: ${inputs.projectName}`);
  console.log(`   🏗️ Type: ${inputs.projectType}`);
  console.log(`   📐 Size: ${inputs.squareFootage?.toLocaleString()} sq ft`);

  // Step 1: Initialize input mapping engine
  const mappingEngine = createSectionMappingEngine({
    enableAuditTrail: true,
    enableValidation: true,
    enableTransformations: true,
    enableFallbacks: true,
    strictMode: false
  });

  // Step 2: Resolve all input mappings
  console.log('🗺️ Step 1: Resolving input mappings...');
  const inputMappingResults = mappingEngine.resolveSectionMappings(inputs);
  
  // Step 3: Validate required sections can be generated
  console.log('✅ Step 2: Validating required sections...');
  const validationSummary = validateRequiredSections(inputs);
  
  // Step 4: Generate legacy section analysis (for compatibility)
  console.log('⚙️ Step 3: Running legacy section analysis...');
  const legacySectionAnalysis = selectSectionsLegacy(inputs);
  
  // Step 5: Merge mapping-driven sections with legacy sections
  console.log('🔗 Step 4: Merging section analyses...');
  const mergedSections = mergeSectionAnalyses(inputMappingResults, legacySectionAnalysis);
  
  // Step 6: Generate content for all included sections
  console.log('📝 Step 5: Generating section content...');
  const sectionsWithContent = generateSectionContent(mergedSections, inputs, inputMappingResults);
  
  // Step 7: Create audit trail and metadata
  console.log('📋 Step 6: Creating audit trail...');
  const auditTrail = {
    inputResolution: mappingEngine.getAuditTrail(),
    sectionGeneration: generateSectionAuditTrail(sectionsWithContent),
    contentPopulation: generateContentAuditTrail(sectionsWithContent, inputMappingResults)
  };

  // Step 8: Build section-to-input mapping
  const sectionToInputMap = buildSectionInputMap(inputMappingResults, sectionsWithContent);

  const result: EnhancedSectionAnalysis = {
    includedSections: sectionsWithContent.filter(s => s.included),
    excludedSections: sectionsWithContent.filter(s => !s.included),
    reasoningMap: generateReasoningMap(sectionsWithContent, inputMappingResults),
    selfHealingActions: extractSelfHealingActions(legacySectionAnalysis, inputMappingResults),
    confidenceScore: calculateEnhancedConfidenceScore(sectionsWithContent, inputMappingResults),
    inputMappingResults,
    inputValidationSummary: {
      totalInputs: inputMappingResults.length,
      resolvedInputs: inputMappingResults.filter(r => r.hasAllRequiredInputs).length,
      missingRequiredInputs: validationSummary.missingRequiredSections,
      validationErrors: extractValidationErrors(inputMappingResults)
    },
    sectionToInputMap,
    auditTrail
  };

  console.log('✅ Enhanced Section Engine complete:');
  console.log(`   📋 ${result.includedSections.length} sections included`);
  console.log(`   ❌ ${result.excludedSections.length} sections excluded`);
  console.log(`   🗺️ ${result.inputMappingResults.length} input mappings processed`);
  console.log(`   ✅ ${result.inputValidationSummary.resolvedInputs}/${result.inputValidationSummary.totalInputs} inputs resolved`);
  console.log(`   🎯 Confidence: ${(result.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   📝 ${result.auditTrail.inputResolution.length} audit entries`);

  return result;
}

/**
 * Legacy section selection (maintained for compatibility)
 */
function selectSectionsLegacy(inputs: EnhancedSectionEngineInputs): SectionAnalysis {
  // Import the existing section selection logic
  const { selectSections } = require('./section-engine.js');
  return selectSections(inputs);
}

/**
 * Merge input mapping results with legacy section analysis
 */
function mergeSectionAnalyses(
  inputMappingResults: SectionMappingResult[], 
  legacyAnalysis: SectionAnalysis
): SectionOutput[] {
  const mergedSections: SectionOutput[] = [];
  const legacySectionIds = new Set(legacyAnalysis.includedSections.map(s => s.id));

  // Add all legacy sections
  mergedSections.push(...legacyAnalysis.includedSections);
  mergedSections.push(...legacyAnalysis.excludedSections);

  // Add mapping-driven sections that aren't already present
  for (const mappingResult of inputMappingResults) {
    if (!legacySectionIds.has(mappingResult.sectionId)) {
      const newSection: SectionOutput = {
        id: mappingResult.sectionId,
        title: mappingResult.sectionTitle,
        included: mappingResult.hasAllRequiredInputs,
        rationale: mappingResult.hasAllRequiredInputs ? 
          'Section included based on input mapping analysis' :
          `Section excluded: missing inputs ${mappingResult.missingRequiredInputs.join(', ')}`,
        priority: mappingResult.sectionPriority,
        dependencies: mappingResult.relevantInputs.map(input => input.inputPath),
        warnings: mappingResult.missingRequiredInputs.length > 0 ? 
          [`Missing required inputs: ${mappingResult.missingRequiredInputs.join(', ')}`] : undefined
      };
      
      mergedSections.push(newSection);
    }
  }

  return mergedSections;
}

/**
 * Generate content for sections using input mappings
 */
function generateSectionContent(
  sections: SectionOutput[], 
  inputs: EnhancedSectionEngineInputs,
  mappingResults: SectionMappingResult[]
): SectionOutput[] {
  return sections.map(section => {
    if (!section.included || section.content) {
      return section; // Already has content or not included
    }

    // Find relevant mapping result for this section
    const mappingResult = mappingResults.find(m => m.sectionId === section.id);
    
    if (mappingResult) {
      // Generate content using mapped inputs
      section.content = generateMappingBasedContent(section, mappingResult, inputs);
    } else {
      // Use existing content generation if available
      section.content = generateFallbackContent(section, inputs);
    }

    return section;
  });
}

/**
 * Generate content based on input mappings
 */
function generateMappingBasedContent(
  section: SectionOutput, 
  mappingResult: SectionMappingResult, 
  inputs: EnhancedSectionEngineInputs
): string {
  const contentGenerators: Record<string, (section: SectionOutput, mapping: SectionMappingResult, inputs: any) => string> = {
    'project_title': generateProjectTitleContent,
    'project_address': generateProjectAddressContent,
    'company_name': generateCompanyNameContent,
    'square_footage': generateSquareFootageContent,
    'template_selection': generateTemplateSelectionContent,
    'assembly_description': generateAssemblyDescriptionContent,
    'project_type': generateProjectTypeContent,
    'substrate_type': generateSubstrateTypeContent,
    'membrane_specifications': generateMembraneSpecificationsContent,
    'insulation_specifications': generateInsulationSpecificationsContent,
    'wind_zone_requirements': generateWindZoneRequirementsContent,
    'asce_version': generateASCEVersionContent,
    'uplift_pressures': generateUpliftPressuresContent,
    'fastening_patterns': generateFasteningPatternsContent,
    'building_code_version': generateBuildingCodeVersionContent,
    'hvhz_requirements': generateHVHZRequirementsContent,
    'noa_requirements': generateNOARequirementsContent,
    'esr_requirements': generateESRRequirementsContent,
    'manufacturer_system': generateManufacturerSystemContent,
    'warranty_requirements': generateWarrantyRequirementsContent,
    'special_instructions': generateSpecialInstructionsContent
  };

  const generator = contentGenerators[section.id];
  if (generator) {
    return generator(section, mappingResult, inputs);
  }

  // Generic content generation
  const resolvedInputs = mappingResult.relevantInputs
    .filter(input => input.isResolved)
    .map(input => `${input.inputName}: ${input.transformedValue}`)
    .join('\n');

  return `**${section.title.toUpperCase()}**\n\n${resolvedInputs}\n\nThis section has been generated based on the available project inputs.`;
}

/**
 * Generate fallback content for sections without mappings
 */
function generateFallbackContent(section: SectionOutput, inputs: EnhancedSectionEngineInputs): string {
  return `**${section.title.toUpperCase()}**\n\nThis section requires manual review and completion based on project-specific requirements.\n\nProject: ${inputs.projectName}\nType: ${inputs.projectType}\nSize: ${inputs.squareFootage?.toLocaleString()} sq ft`;
}

// Content generation functions for each mapped section
function generateProjectTitleContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const projectName = mapping.relevantInputs.find(i => i.inputPath === 'projectName')?.transformedValue || 'Unnamed Project';
  return `**PROJECT TITLE**\n\n${projectName}\n\nThis scope of work defines the requirements for the roofing project as specified herein.`;
}

function generateProjectAddressContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const address = mapping.relevantInputs.find(i => i.inputPath === 'address')?.transformedValue || 'Address to be confirmed';
  return `**PROJECT LOCATION**\n\n${address}\n\nAll work shall be performed at the above-referenced location in accordance with local building codes and regulations.`;
}

function generateCompanyNameContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const company = mapping.relevantInputs.find(i => i.inputPath === 'companyName')?.transformedValue || 'General Contractor';
  return `**CONTRACTOR INFORMATION**\n\n${company}\n\nThe contractor shall be responsible for all work performed under this scope of work and shall maintain all required licenses and insurance.`;
}

function generateSquareFootageContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const sqft = mapping.relevantInputs.find(i => i.inputPath === 'squareFootage')?.transformedValue || 'To be field verified';
  return `**PROJECT SIZE**\n\nTotal roof area: ${sqft}\n\nAll quantities are approximate and contractor shall verify all dimensions prior to material ordering.`;
}

function generateTemplateSelectionContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const template = mapping.relevantInputs.find(i => i.inputPath.includes('template_id'))?.transformedValue || 'Standard template';
  return `**SYSTEM TEMPLATE**\n\nSelected template: ${template}\n\nThis template has been selected based on project requirements and conditions.`;
}

function generateAssemblyDescriptionContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const description = mapping.relevantInputs.find(i => i.inputPath.includes('assembly_description'))?.transformedValue || 'Standard roof assembly';
  return `**ASSEMBLY DESCRIPTION**\n\n${description}\n\nThe roof assembly shall be installed in accordance with manufacturer specifications and building code requirements.`;
}

function generateProjectTypeContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const projectType = mapping.relevantInputs.find(i => i.inputPath.includes('projectType'))?.transformedValue || 'recover';
  const typeDescription = projectType === 'tearoff' ? 'complete tear-off and replacement' :
                         projectType === 'recover' ? 'recover system installation' : 'new construction';
  
  return `**PROJECT TYPE**\n\n${typeDescription.charAt(0).toUpperCase() + typeDescription.slice(1)}\n\nWork shall include all necessary preparation and installation procedures for this project type.`;
}

function generateSubstrateTypeContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const deckType = mapping.relevantInputs.find(i => i.inputPath.includes('deckType'))?.transformedValue || 'steel deck';
  return `**SUBSTRATE TYPE**\n\n${deckType}\n\nAll work shall be performed over the existing ${deckType.toLowerCase()} substrate with appropriate attachment methods.`;
}

function generateMembraneSpecificationsContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const membrane = mapping.relevantInputs.find(i => i.inputPath.includes('membrane'))?.transformedValue || 'TPO membrane system';
  return `**MEMBRANE SPECIFICATIONS**\n\n${membrane}\n\nThe membrane system shall comply with all applicable standards and manufacturer requirements.`;
}

function generateInsulationSpecificationsContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const insulation = mapping.relevantInputs.find(i => i.inputPath.includes('insulation'))?.transformedValue || 'Standard insulation';
  return `**INSULATION SPECIFICATIONS**\n\n${insulation}\n\nInsulation shall be installed in accordance with manufacturer specifications and energy code requirements.`;
}

function generateWindZoneRequirementsContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const zones = mapping.relevantInputs.find(i => i.inputPath.includes('zones'))?.transformedValue || 'Standard wind zones';
  return `**WIND ZONE REQUIREMENTS**\n\n${zones}\n\nWind zones have been calculated in accordance with applicable building codes and shall govern attachment requirements.`;
}

function generateASCEVersionContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const asceVersion = mapping.relevantInputs.find(i => i.inputPath.includes('asceVersion'))?.transformedValue || 'ASCE 7-16';
  return `**DESIGN STANDARD**\n\n${asceVersion}\n\nAll wind load calculations and design criteria shall comply with ${asceVersion} requirements.`;
}

function generateUpliftPressuresContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const pressures = mapping.relevantInputs.find(i => i.inputPath.includes('pressures'))?.transformedValue || 'Calculated wind pressures';
  return `**UPLIFT PRESSURES**\n\n${pressures}\n\nThe roof system shall be designed to resist the calculated uplift pressures in all zones.`;
}

function generateFasteningPatternsContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const patterns = mapping.relevantInputs.find(i => i.inputPath.includes('fastening'))?.transformedValue || 'Standard fastening patterns';
  return `**FASTENING PATTERNS**\n\n${patterns}\n\nFastening patterns shall meet or exceed the most stringent requirements from engineering analysis, manufacturer specifications, and building codes.`;
}

function generateBuildingCodeVersionContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const code = mapping.relevantInputs.find(i => i.inputPath.includes('primary_code'))?.transformedValue || '2021 IBC';
  return `**BUILDING CODE COMPLIANCE**\n\n${code}\n\nAll work shall comply with the applicable building code version and local amendments.`;
}

function generateHVHZRequirementsContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const hvhzReqs = mapping.relevantInputs.find(i => i.inputPath.includes('special_requirements'))?.transformedValue || 'Standard requirements';
  return `**HIGH VELOCITY HURRICANE ZONE REQUIREMENTS**\n\n${hvhzReqs}\n\nEnhanced wind resistance requirements apply for this HVHZ location.`;
}

function generateNOARequirementsContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const noa = mapping.relevantInputs.find(i => i.inputPath.includes('miami_dade'))?.transformedValue || 'NOA compliance required';
  return `**NOTICE OF ACCEPTANCE (NOA) REQUIREMENTS**\n\n${noa}\n\nMiami-Dade NOA compliance is required for all specified materials and systems.`;
}

function generateESRRequirementsContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const esr = mapping.relevantInputs.find(i => i.inputPath.includes('icc_esr'))?.transformedValue || 'ESR compliance required';
  return `**EVALUATION SERVICE REPORT (ESR) REQUIREMENTS**\n\n${esr}\n\nICC-ES evaluation reports are required for specified materials and systems.`;
}

function generateManufacturerSystemContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const system = mapping.relevantInputs.find(i => i.inputPath.includes('system_specifications'))?.transformedValue || 'Manufacturer system';
  return `**MANUFACTURER SYSTEM SPECIFICATIONS**\n\n${system}\n\nThe system shall be installed strictly in accordance with manufacturer specifications and approved installation instructions.`;
}

function generateWarrantyRequirementsContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const warranty = mapping.relevantInputs.find(i => i.inputPath.includes('warranty_information'))?.transformedValue || 'Standard warranty terms';
  return `**WARRANTY REQUIREMENTS**\n\n${warranty}\n\nManufacturer warranty shall be obtained and properly registered upon project completion.`;
}

function generateSpecialInstructionsContent(section: SectionOutput, mapping: SectionMappingResult, inputs: any): string {
  const instructions = mapping.relevantInputs.find(i => i.inputPath.includes('special_considerations'))?.transformedValue || 'Standard installation procedures';
  return `**SPECIAL INSTRUCTIONS**\n\n${instructions}\n\nSpecial considerations and requirements that apply to this specific project.`;
}

// Helper functions
function generateReasoningMap(sections: SectionOutput[], mappingResults: SectionMappingResult[]): Record<string, string> {
  const reasoningMap: Record<string, string> = {};
  
  for (const section of sections) {
    reasoningMap[section.id] = section.rationale;
  }
  
  return reasoningMap;
}

function extractSelfHealingActions(legacyAnalysis: SectionAnalysis, mappingResults: SectionMappingResult[]): any[] {
  const actions = [...legacyAnalysis.selfHealingActions];
  
  // Add mapping-based healing actions
  for (const mapping of mappingResults) {
    for (const input of mapping.relevantInputs) {
      if (input.fallbackUsed) {
        actions.push({
          action: `Applied fallback value for ${input.inputName}`,
          reason: `Original input not available: ${input.inputPath}`,
          confidence: 0.6
        });
      }
    }
  }
  
  return actions;
}

function calculateEnhancedConfidenceScore(sections: SectionOutput[], mappingResults: SectionMappingResult[]): number {
  const baseConfidence = 0.85;
  
  // Penalize missing inputs
  const missingInputs = mappingResults.filter(m => !m.hasAllRequiredInputs).length;
  const missingInputPenalty = missingInputs * 0.05;
  
  // Penalize sections with warnings
  const sectionsWithWarnings = sections.filter(s => s.warnings?.length > 0).length;
  const warningPenalty = sectionsWithWarnings * 0.03;
  
  // Bonus for complete mapping coverage
  const mappingCoverage = mappingResults.filter(m => m.hasAllRequiredInputs).length / mappingResults.length;
  const mappingBonus = mappingCoverage * 0.1;
  
  return Math.max(0.5, Math.min(1.0, baseConfidence - missingInputPenalty - warningPenalty + mappingBonus));
}

function extractValidationErrors(mappingResults: SectionMappingResult[]): string[] {
  const errors: string[] = [];
  
  for (const mapping of mappingResults) {
    for (const input of mapping.relevantInputs) {
      for (const validation of input.validationResults) {
        if (!validation.passed && validation.message) {
          errors.push(`${input.inputName}: ${validation.message}`);
        }
      }
    }
  }
  
  return errors;
}

function buildSectionInputMap(mappingResults: SectionMappingResult[], sections: SectionOutput[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  
  for (const mapping of mappingResults) {
    map[mapping.sectionId] = mapping.relevantInputs.map(input => input.inputPath);
  }
  
  // Add dependencies from legacy sections
  for (const section of sections) {
    if (section.dependencies && section.dependencies.length > 0) {
      if (map[section.id]) {
        map[section.id] = [...new Set([...map[section.id], ...section.dependencies])];
      } else {
        map[section.id] = section.dependencies;
      }
    }
  }
  
  return map;
}

function generateSectionAuditTrail(sections: SectionOutput[]): any[] {
  return sections.map(section => ({
    timestamp: new Date().toISOString(),
    sectionId: section.id,
    sectionTitle: section.title,
    included: section.included,
    rationale: section.rationale,
    hasContent: !!section.content,
    contentLength: section.content?.length || 0,
    priority: section.priority
  }));
}

function generateContentAuditTrail(sections: SectionOutput[], mappingResults: SectionMappingResult[]): any[] {
  return sections
    .filter(s => s.included && s.content)
    .map(section => {
      const mapping = mappingResults.find(m => m.sectionId === section.id);
      return {
        timestamp: new Date().toISOString(),
        sectionId: section.id,
        contentGenerated: true,
        contentLength: section.content?.length || 0,
        inputsMapped: mapping?.relevantInputs.length || 0,
        inputsResolved: mapping?.relevantInputs.filter(i => i.isResolved).length || 0
      };
    });
}

/**
 * Export utility functions for testing and debugging
 */
export {
  mergeSectionAnalyses,
  generateMappingBasedContent,
  calculateEnhancedConfidenceScore,
  buildSectionInputMap
};

// Section Engine - Dynamic SOW Paragraph Selection and Content Generation
// Analyzes project data and selects appropriate SOW sections with content injection

import { TakeoffItems } from './takeoff-engine';

export interface SectionEngineInputs {
  // Project data
  projectType: 'recover' | 'tearoff' | 'new';
  projectName: string;
  address: string;
  squareFootage: number;
  buildingHeight: number;
  
  // Building characteristics
  deckType: string;
  roofSlope: number;
  existingMembrane?: string;
  parapetHeight?: number;
  
  // System specifications
  membraneType: string;
  membraneThickness: string;
  selectedSystem: string;
  manufacturer: string;
  attachmentMethod: string;
  
  // Jurisdiction and compliance
  hvhz: boolean;
  codeCycle: string;
  asceVersion: string;
  specialRequirements: string[];
  
  // Takeoff data
  takeoffItems: TakeoffItems;
  
  // Calculated values
  windPressures: {
    zone1Field: number;
    zone1Perimeter: number;
    zone2Perimeter: number;
    zone3Corner: number;
  };
  
  // Environmental factors
  exposureCategory: string;
  designWindSpeed: number;
  
  // Optional user preferences
  fallProtectionRequired?: boolean;
  walkwayPadRequested?: boolean;
  sensitiveTenants?: boolean;
  sharedParkingAccess?: boolean;
  customNotes?: string[];
}

export interface SectionOutput {
  id: string;
  title: string;
  included: boolean;
  rationale: string;
  content?: string;
  priority?: number;
  dependencies?: string[];
  warnings?: string[];
}

export interface SectionAnalysis {
  includedSections: SectionOutput[];
  excludedSections: SectionOutput[];
  reasoningMap: Record<string, string>;
  selfHealingActions: Array<{
    action: string;
    reason: string;
    confidence: number;
  }>;
  confidenceScore: number;
}

/**
 * Main section engine function - analyzes inputs and returns section selections
 */
export function selectSections(inputs: SectionEngineInputs): SectionAnalysis {
  console.log(`🔍 Section Engine: Analyzing ${inputs.projectName}...`);
  
  const sections: SectionOutput[] = [];
  const selfHealingActions: Array<{ action: string; reason: string; confidence: number }> = [];
  
  // Base scope section (always included)
  sections.push(generateBaseScope(inputs));
  
  // Core system sections
  sections.push(generateSystemSpecification(inputs));
  sections.push(generateWindPressureSection(inputs));
  sections.push(generateAttachmentSection(inputs, selfHealingActions));
  
  // Conditional sections based on project characteristics
  sections.push(...generateConditionalSections(inputs, selfHealingActions));
  
  // Flashing and accessory sections
  sections.push(...generateFlashingSections(inputs, selfHealingActions));
  
  // Compliance and administrative sections
  sections.push(...generateComplianceSections(inputs));
  
  // Quality and warranty sections
  sections.push(...generateQualitySections(inputs));
  
  // Separate included vs excluded
  const includedSections = sections.filter(s => s.included);
  const excludedSections = sections.filter(s => !s.included);
  
  // Generate reasoning map
  const reasoningMap: Record<string, string> = {};
  sections.forEach(section => {
    reasoningMap[section.id] = section.rationale;
  });
  
  // Calculate overall confidence
  const confidenceScore = calculateConfidenceScore(includedSections, selfHealingActions);
  
  console.log(`✅ Section Engine: ${includedSections.length} sections included, ${excludedSections.length} excluded`);
  console.log(`🔧 Self-healing actions: ${selfHealingActions.length}`);
  
  return {
    includedSections,
    excludedSections,
    reasoningMap,
    selfHealingActions,
    confidenceScore
  };
}

/**
 * Generate base scope section (always included)
 */
function generateBaseScope(inputs: SectionEngineInputs): SectionOutput {
  const projectTypeText = inputs.projectType === 'recover' ? 'roof re-cover' : 
                         inputs.projectType === 'tearoff' ? 'roof replacement' : 'new roof construction';
  
  const systemDescription = generateSystemDescription(inputs);
  
  const content = `
This project includes the installation of a ${systemDescription} roof system, encompassing approximately ${inputs.squareFootage.toLocaleString()} square feet.

The scope of work for this project is a **${projectTypeText}**, including ${getProjectTypeSpecificWork(inputs.projectType)} and installation of new roof system components per this Scope of Work.

• **The roof system specified herein is based on roof assembly wind uplift testing/approval for field of roof, with enhanced perimeter and corner attachment per this Scope of Work.**

• **The Contractor will be responsible for providing any/all engineering services and documents required by the Authority Having Jurisdiction (AHJ), as required to obtain applicable permits and/or for project close-out.**
  `.trim();

  return {
    id: 'base_scope',
    title: 'Base Scope of Work',
    included: true,
    rationale: `Base scope always included for ${inputs.projectType} projects`,
    content,
    priority: 1
  };
}

/**
 * Generate system specification section
 */
function generateSystemSpecification(inputs: SectionEngineInputs): SectionOutput {
  const content = `
**ROOF SYSTEM SPECIFICATION**

Primary membrane: ${inputs.membraneThickness} ${inputs.membraneType} membrane
Manufacturer: ${inputs.manufacturer}
System: ${inputs.selectedSystem}
Attachment method: ${inputs.attachmentMethod}
Deck type: ${inputs.deckType}

The roof system components shall comply with all applicable building codes and manufacturer requirements, with installation per manufacturer's specifications and this Scope of Work.
  `.trim();

  return {
    id: 'system_specification',
    title: 'System Specification',
    included: true,
    rationale: 'System specification required for all projects',
    content,
    priority: 2
  };
}

/**
 * Generate wind pressure analysis section
 */
function generateWindPressureSection(inputs: SectionEngineInputs): SectionOutput {
  const content = `
**WIND PRESSURE ANALYSIS**

Design wind speed: ${inputs.designWindSpeed} mph
Exposure category: ${inputs.exposureCategory}
Code compliance: ${inputs.codeCycle} with ${inputs.asceVersion} methodology

Calculated uplift pressures:
• Zone 1 (Field): ${Math.abs(inputs.windPressures.zone1Field).toFixed(1)} psf
• Zone 1 (Inner Perimeter): ${Math.abs(inputs.windPressures.zone1Perimeter).toFixed(1)} psf
• Zone 2 (Outer Perimeter): ${Math.abs(inputs.windPressures.zone2Perimeter).toFixed(1)} psf
• Zone 3 (Corner): ${Math.abs(inputs.windPressures.zone3Corner).toFixed(1)} psf

${inputs.hvhz ? '**PROJECT LOCATED IN HIGH VELOCITY HURRICANE ZONE (HVHZ) - Enhanced requirements apply.**' : ''}
  `.trim();

  return {
    id: 'wind_pressures',
    title: 'Wind Pressure Analysis',
    included: true,
    rationale: 'Wind pressure analysis required for all projects',
    content,
    priority: 3
  };
}

/**
 * Generate attachment specification section
 */
function generateAttachmentSection(inputs: SectionEngineInputs, selfHealingActions: Array<{ action: string; reason: string; confidence: number }>): SectionOutput {
  // Self-healing: If attachment method is unclear, provide fallback
  let attachmentMethod = inputs.attachmentMethod;
  if (!attachmentMethod || attachmentMethod === 'unknown') {
    attachmentMethod = inputs.membraneType === 'TPO' ? 'mechanically attached' : 'fully adhered';
    selfHealingActions.push({
      action: `Assumed attachment method: ${attachmentMethod}`,
      reason: 'Attachment method not specified, used default for membrane type',
      confidence: 0.7
    });
  }

  const content = `
**MEMBRANE ATTACHMENT SPECIFICATION**

Attachment method: ${attachmentMethod}
Fastening pattern varies by roof zone per engineering analysis and manufacturer requirements.

Zone definitions for this project:
• Zone 1 (Field): Interior field areas
• Zone 2 (Perimeter): ${getPerimeterWidth(inputs)} wide perimeter zone
• Zone 3 (Corner): ${getCornerDimensions(inputs)} corner zones

All fastening patterns shall meet or exceed the most stringent requirement from:
1. Engineering wind uplift analysis
2. Manufacturer's system requirements  
3. Building code requirements
4. Testing agency approvals
  `.trim();

  return {
    id: 'attachment_specification',
    title: 'Membrane Attachment',
    included: true,
    rationale: 'Attachment specification required for all membrane systems',
    content,
    priority: 4
  };
}

/**
 * Generate conditional sections based on project data
 */
function generateConditionalSections(inputs: SectionEngineInputs, selfHealingActions: Array<{ action: string; reason: string; confidence: number }>): SectionOutput[] {
  const sections: SectionOutput[] = [];
  
  // Fall protection
  const fallProtectionRequired = inputs.fallProtectionRequired || 
                                inputs.buildingHeight > 30 || 
                                inputs.takeoffItems.roofHatches > 0;
  
  if (fallProtectionRequired) {
    sections.push({
      id: 'fall_protection',
      title: 'Fall Protection Requirements',
      included: true,
      rationale: inputs.fallProtectionRequired ? 'Fall protection explicitly required' : 
                inputs.buildingHeight > 30 ? 'Building height requires fall protection' :
                'Roof access points require fall protection',
      content: generateFallProtectionContent(inputs),
      priority: 5
    });
  } else {
    sections.push({
      id: 'fall_protection',
      title: 'Fall Protection Requirements',
      included: false,
      rationale: 'No fall protection requirements identified'
    });
  }
  
  // Expansion joints
  const hasExpansionJoints = (inputs.takeoffItems.expansionJoints || 0) > 0;
  sections.push({
    id: 'expansion_joints',
    title: 'Expansion Joint Treatment',
    included: hasExpansionJoints,
    rationale: hasExpansionJoints ? 
      `${inputs.takeoffItems.expansionJoints} expansion joints identified in takeoff` :
      'No expansion joints present',
    content: hasExpansionJoints ? generateExpansionJointContent(inputs) : undefined,
    priority: 6
  });
  
  // Demolition (tearoff projects only)
  const includeDemolition = inputs.projectType === 'tearoff';
  sections.push({
    id: 'demolition',
    title: 'Existing Roof Removal',
    included: includeDemolition,
    rationale: includeDemolition ? 'Tearoff project requires demolition section' : 'Recover/new project - no demolition',
    content: includeDemolition ? generateDemolitionContent(inputs) : undefined,
    priority: 2.5
  });
  
  // Crickets and slope corrections
  const needsCrickets = inputs.roofSlope < 0.25 || 
                       (inputs.takeoffItems.drainCount || 0) > (inputs.squareFootage / 15000);
  sections.push({
    id: 'crickets',
    title: 'Crickets and Slope Corrections',
    included: needsCrickets,
    rationale: needsCrickets ? 
      inputs.roofSlope < 0.25 ? 'Low slope requires drainage improvements' :
      'High drain density may require crickets' :
      'Adequate slope and drainage layout',
    content: needsCrickets ? generateCricketContent(inputs) : undefined,
    priority: 7
  });
  
  // Scupper modifications
  const hasScuppers = (inputs.takeoffItems.scuppers || 0) > 0;
  sections.push({
    id: 'scupper_mods',
    title: 'Scupper Modifications',
    included: hasScuppers,
    rationale: hasScuppers ? 
      `${inputs.takeoffItems.scuppers} scuppers require flashing modifications` :
      'No scuppers present',
    content: hasScuppers ? generateScupperContent(inputs) : undefined,
    priority: 8
  });
  
  // HVAC controls and coordination
  const hasHVAC = (inputs.takeoffItems.hvacUnits || 0) > 0;
  sections.push({
    id: 'hvac_controls',
    title: 'HVAC Coordination',
    included: hasHVAC,
    rationale: hasHVAC ? 
      `${inputs.takeoffItems.hvacUnits} HVAC units require coordination` :
      'No HVAC equipment present',
    content: hasHVAC ? generateHVACContent(inputs) : undefined,
    priority: 9
  });
  
  // Walkway pads
  const needsWalkways = inputs.walkwayPadRequested || hasHVAC;
  sections.push({
    id: 'walkway_pads',
    title: 'Walkway Protection',
    included: needsWalkways,
    rationale: needsWalkways ?
      inputs.walkwayPadRequested ? 'Walkway pads explicitly requested' :
      'HVAC equipment requires walkway protection' :
      'No walkway protection required',
    content: needsWalkways ? generateWalkwayContent(inputs) : undefined,
    priority: 10
  });
  
  // Special coordination
  const needsSpecialCoordination = inputs.sensitiveTenants || inputs.sharedParkingAccess;
  sections.push({
    id: 'special_coordination',
    title: 'Special Coordination Requirements',
    included: needsSpecialCoordination,
    rationale: needsSpecialCoordination ?
      'Sensitive operations or shared access requires special coordination' :
      'Standard coordination procedures apply',
    content: needsSpecialCoordination ? generateSpecialCoordinationContent(inputs) : undefined,
    priority: 11
  });
  
  return sections;
}

/**
 * Generate flashing sections based on takeoff data
 */
function generateFlashingSections(inputs: SectionEngineInputs, selfHealingActions: Array<{ action: string; reason: string; confidence: number }>): SectionOutput[] {
  const sections: SectionOutput[] = [];
  
  // Parapet flashing
  const hasParapets = (inputs.parapetHeight || 0) > 0;
  sections.push({
    id: 'parapet_flashing',
    title: 'Parapet Wall Flashing',
    included: hasParapets,
    rationale: hasParapets ? 
      `Parapet walls (${inputs.parapetHeight}" high) require specialized flashing` :
      'No parapet walls present',
    content: hasParapets ? generateParapetFlashingContent(inputs) : undefined,
    priority: 12
  });
  
  // Coping details
  const needsCoping = hasParapets && (inputs.parapetHeight || 0) > 18;
  sections.push({
    id: 'coping_detail',
    title: 'Coping Installation',
    included: needsCoping,
    rationale: needsCoping ? 
      'Parapet height requires coping protection' :
      'Parapet height does not require coping or no parapets present',
    content: needsCoping ? generateCopingContent(inputs) : undefined,
    priority: 13
  });
  
  // Penetration flashing
  const hasPenetrations = (inputs.takeoffItems.penetrationCount || 0) > 0;
  sections.push({
    id: 'penetration_flashing',
    title: 'Penetration Flashing',
    included: hasPenetrations,
    rationale: hasPenetrations ? 
      `${inputs.takeoffItems.penetrationCount} penetrations require individual flashing` :
      'No penetrations identified',
    content: hasPenetrations ? generatePenetrationFlashingContent(inputs) : undefined,
    priority: 14
  });
  
  return sections;
}

/**
 * Generate compliance sections
 */
function generateComplianceSections(inputs: SectionEngineInputs): SectionOutput[] {
  const sections: SectionOutput[] = [];
  
  // HVHZ compliance
  if (inputs.hvhz) {
    sections.push({
      id: 'hvhz_compliance',
      title: 'HVHZ Compliance Requirements',
      included: true,
      rationale: 'Project located in High Velocity Hurricane Zone',
      content: generateHVHZComplianceContent(inputs),
      priority: 15
    });
  }
  
  // Special requirements
  if (inputs.specialRequirements?.length > 0) {
    sections.push({
      id: 'special_requirements',
      title: 'Jurisdiction Special Requirements',
      included: true,
      rationale: `Jurisdiction has ${inputs.specialRequirements.length} special requirements`,
      content: generateSpecialRequirementsContent(inputs),
      priority: 16
    });
  }
  
  return sections;
}

/**
 * Generate quality and warranty sections
 */
function generateQualitySections(inputs: SectionEngineInputs): SectionOutput[] {
  return [
    {
      id: 'quality_control',
      title: 'Quality Control Requirements',
      included: true,
      rationale: 'Quality control required for all projects',
      content: generateQualityControlContent(inputs),
      priority: 20
    },
    {
      id: 'warranty_requirements',
      title: 'Warranty Requirements',
      included: true,
      rationale: 'Warranty requirements specified for all projects',
      content: generateWarrantyContent(inputs),
      priority: 21
    },
    {
      id: 'closeout_requirements',
      title: 'Project Closeout',
      included: true,
      rationale: 'Closeout requirements for all projects',
      content: generateCloseoutContent(inputs),
      priority: 22
    }
  ];
}

// Helper functions for content generation

function generateSystemDescription(inputs: SectionEngineInputs): string {
  const attachment = inputs.attachmentMethod?.includes('mechanical') ? 'mechanically attached' :
                    inputs.attachmentMethod?.includes('adhered') ? 'fully adhered' :
                    'mechanically attached';
  
  return `${attachment}, ${inputs.membraneThickness} ${inputs.membraneType}`;
}

function getProjectTypeSpecificWork(projectType: string): string {
  switch (projectType) {
    case 'tearoff':
      return 'removal of all existing roof system materials down to the structural deck';
    case 'recover':
      return 'preparation of the existing roof assembly';
    case 'new':
      return 'preparation of the structural deck';
    default:
      return 'preparation of the substrate';
  }
}

function getPerimeterWidth(inputs: SectionEngineInputs): string {
  // ASCE 7-16/22 typically uses 10% of building width or 40ft, whichever is less
  const estimatedWidth = Math.min(40, Math.sqrt(inputs.squareFootage) * 0.1);
  return estimatedWidth > 20 ? "20'-0\"" : "15'-0\"";
}

function getCornerDimensions(inputs: SectionEngineInputs): string {
  const width = getPerimeterWidth(inputs).replace('"', '');
  return `${width} x ${width}`;
}

// Content generation functions (simplified for MVP)
function generateFallProtectionContent(inputs: SectionEngineInputs): string {
  return `Contractor shall furnish temporary OSHA-compliant fall arrest systems and training for all personnel working above 6 feet. Permanent fall protection systems shall be installed per OSHA requirements where roof access is provided.`;
}

function generateExpansionJointContent(inputs: SectionEngineInputs): string {
  return `Existing expansion joints shall be maintained and properly flashed. New expansion joint covers shall be installed with proper membrane termination and weatherproofing.`;
}

function generateDemolitionContent(inputs: SectionEngineInputs): string {
  return `All existing roof system materials shall be removed down to the ${inputs.deckType} deck. Existing materials shall be disposed of in accordance with local regulations. Deck shall be cleaned and prepared for new roof system installation.`;
}

function generateCricketContent(inputs: SectionEngineInputs): string {
  return `Tapered insulation crickets shall be installed to provide positive drainage to all drains. Minimum slope of 1/4" per foot shall be maintained to all drainage points.`;
}

function generateScupperContent(inputs: SectionEngineInputs): string {
  return `Existing scuppers shall be cleaned, repaired as necessary, and properly flashed with new membrane system. Scupper drains shall be tested for proper drainage.`;
}

function generateHVACContent(inputs: SectionEngineInputs): string {
  return `Coordination with HVAC contractor required for equipment shutdown, protection, and reconnection. All HVAC equipment shall be properly supported and flashed.`;
}

function generateWalkwayContent(inputs: SectionEngineInputs): string {
  return `Walkway protection membrane shall be installed in traffic areas and around equipment. Minimum 2'-0" wide walkways shall be provided to all equipment requiring service access.`;
}

function generateSpecialCoordinationContent(inputs: SectionEngineInputs): string {
  return `Special coordination required for occupied buildings. Work hours may be restricted, and tenant notification procedures shall be followed. Dust and noise control measures shall be implemented.`;
}

function generateParapetFlashingContent(inputs: SectionEngineInputs): string {
  return `Parapet walls shall be flashed with base flashing extending minimum 8" above finished roof surface and cap flashing covering the top of the parapet wall.`;
}

function generateCopingContent(inputs: SectionEngineInputs): string {
  return `Metal coping shall be installed on all parapet walls. Coping shall be properly fastened and sealed to prevent water infiltration.`;
}

function generatePenetrationFlashingContent(inputs: SectionEngineInputs): string {
  return `All roof penetrations shall be properly flashed and sealed. Penetration flashing shall extend minimum 6" beyond the penetration in all directions.`;
}

function generateHVHZComplianceContent(inputs: SectionEngineInputs): string {
  return `This project is located in a High Velocity Hurricane Zone and must comply with enhanced wind resistance requirements. All materials and installation methods must have appropriate HVHZ approvals.`;
}

function generateSpecialRequirementsContent(inputs: SectionEngineInputs): string {
  return `Additional jurisdiction requirements: ${inputs.specialRequirements.join(', ')}. Contractor shall comply with all local code amendments and special provisions.`;
}

function generateQualityControlContent(inputs: SectionEngineInputs): string {
  return `Quality control inspections shall be performed at critical installation milestones. All work shall be inspected and approved before proceeding to subsequent phases.`;
}

function generateWarrantyContent(inputs: SectionEngineInputs): string {
  return `Contractor shall provide minimum 5-year warranty on workmanship. Manufacturer's material warranty shall be obtained and transferred to Owner upon project completion.`;
}

function generateCloseoutContent(inputs: SectionEngineInputs): string {
  return `Final project closeout shall include submission of all warranties, operation and maintenance manuals, and as-built documentation. Final inspection shall be completed prior to project acceptance.`;
}

function calculateConfidenceScore(sections: SectionOutput[], healingActions: Array<{ action: string; reason: string; confidence: number }>): number {
  const baseConfidence = 0.85;
  const healingPenalty = healingActions.reduce((sum, action) => sum + (1 - action.confidence) * 0.1, 0);
  const missingDataPenalty = sections.filter(s => s.warnings?.length > 0).length * 0.05;
  
  return Math.max(0.5, Math.min(1.0, baseConfidence - healingPenalty - missingDataPenalty));
}

/**
 * Validate section engine inputs
 */
export function validateSectionInputs(inputs: SectionEngineInputs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!inputs.projectName?.trim()) errors.push('Project name is required');
  if (!inputs.projectType) errors.push('Project type is required');
  if (!inputs.membraneType?.trim()) errors.push('Membrane type is required');
  if (typeof inputs.squareFootage !== 'number' || inputs.squareFootage <= 0) errors.push('Valid square footage required');
  if (!inputs.takeoffItems) errors.push('Takeoff data is required');
  if (!inputs.windPressures) errors.push('Wind pressure data is required');
  
  return { valid: errors.length === 0, errors };
}

/**
 * Generate section mapping for debugging
 */
export function generateSectionMapping(): Record<string, { includeIf: string; description: string }> {
  return {
    'fall_protection': {
      includeIf: 'fall_protection_required = true OR building_height > 30 OR roof_hatches > 0',
      description: 'OSHA fall protection requirements'
    },
    'expansion_joints': {
      includeIf: 'expansion_joints > 0',
      description: 'Expansion joint treatment and flashing'
    },
    'demolition': {
      includeIf: 'project_type = "tearoff"',
      description: 'Existing roof system removal'
    },
    'crickets': {
      includeIf: 'roof_slope < 0.25 OR drain_density > threshold',
      description: 'Drainage improvements and slope corrections'
    },
    'scupper_mods': {
      includeIf: 'scuppers > 0',
      description: 'Scupper modifications and flashing'
    },
    'coping_detail': {
      includeIf: 'parapet_height > 18',
      description: 'Metal coping installation on tall parapets'
    },
    'hvac_controls': {
      includeIf: 'hvac_units > 0',
      description: 'HVAC coordination and equipment support'
    },
    'walkway_pads': {
      includeIf: 'walkway_pad_requested = true OR hvac_units > 0',
      description: 'Traffic protection membrane systems'
    },
    'special_coordination': {
      includeIf: 'sensitive_tenants = true OR shared_parking_access = true',
      description: 'Enhanced coordination for occupied buildings'
    }
  };
}

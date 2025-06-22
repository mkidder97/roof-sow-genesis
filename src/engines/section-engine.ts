/**
 * Section Engine - Dynamic Paragraph Mapping & Content Selection
 * 
 * This engine analyzes project data and dynamically selects which sections
 * to include in the final SOW based on takeoff form data, template requirements,
 * and intelligent fallback logic.
 */

import { ProjectData, TakeoffData, TemplateResult, WindResult, FasteningResult } from '../types.js';

export interface SectionResult {
  id: string;
  title: string;
  included: boolean;
  rationale: string;
  content: string;
  priority: 'required' | 'recommended' | 'optional';
  confidence: number; // 0-1 confidence score
  fallbackApplied?: boolean;
  warnings?: string[];
}

export interface SectionAnalysis {
  includedSections: SectionResult[];
  excludedSections: SectionResult[];
  reasoningMap: Record<string, string>;
  totalSections: number;
  confidence: number;
  selfHealingActions: SelfHealingAction[];
}

export interface SelfHealingAction {
  type: 'missing_field' | 'low_confidence' | 'fallback_selection' | 'auto_correction';
  field: string;
  originalValue?: any;
  correctedValue?: any;
  description: string;
  confidence: number;
}

interface SectionDefinition {
  id: string;
  title: string;
  priority: 'required' | 'recommended' | 'optional';
  includeWhen: (data: CombinedData) => boolean;
  getContent: (data: CombinedData) => string;
  fallbackContent?: string;
  requiredFields?: string[];
}

interface CombinedData {
  project: ProjectData;
  takeoff: TakeoffData;
  template: TemplateResult;
  wind: WindResult;
  fastening: FasteningResult;
}

export class SectionEngine {
  private sections: SectionDefinition[] = [];
  private selfHealingActions: SelfHealingAction[] = [];

  constructor() {
    this.initializeSections();
  }

  /**
   * Main analysis method - determines which sections to include
   */
  async analyzeSections(data: CombinedData): Promise<SectionAnalysis> {
    this.selfHealingActions = [];
    const results: SectionResult[] = [];

    // Validate and heal input data first
    const healedData = this.healInputData(data);

    // Process each section
    for (const section of this.sections) {
      const result = this.processSection(section, healedData);
      results.push(result);
    }

    // Separate included vs excluded
    const includedSections = results.filter(r => r.included);
    const excludedSections = results.filter(r => !r.included);

    // Build reasoning map
    const reasoningMap: Record<string, string> = {};
    results.forEach(r => {
      reasoningMap[r.id] = r.rationale;
    });

    // Calculate overall confidence
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = totalConfidence / results.length;

    return {
      includedSections,
      excludedSections,
      reasoningMap,
      totalSections: results.length,
      confidence: avgConfidence,
      selfHealingActions: this.selfHealingActions
    };
  }

  /**
   * Initialize all section definitions with their logic
   */
  private initializeSections(): void {
    this.sections = [
      // Base Scope Section
      {
        id: 'base_scope',
        title: 'Base Scope of Work',
        priority: 'required',
        includeWhen: () => true, // Always included
        getContent: (data) => this.getBaseScopeContent(data),
        requiredFields: ['project.address', 'template.selectedTemplate']
      },

      // Fall Protection
      {
        id: 'fall_protection',
        title: 'Fall Protection Requirements',
        priority: 'required',
        includeWhen: (data) => {
          return data.takeoff.fall_protection_required === true ||
                 data.project.building_height > 30 ||
                 data.takeoff.roof_access_type === 'ladder';
        },
        getContent: (data) => this.getFallProtectionContent(data),
        fallbackContent: `Contractor shall furnish temporary OSHA-compliant fall arrest systems during construction activities. All personnel working on roof areas shall utilize appropriate fall protection equipment in accordance with OSHA 1926.501 requirements.`,
        requiredFields: ['takeoff.fall_protection_required']
      },

      // Expansion Joints
      {
        id: 'expansion_joints',
        title: 'Expansion Joint Treatment',
        priority: 'recommended',
        includeWhen: (data) => {
          return (data.takeoff.expansion_joints || 0) > 0 ||
                 data.takeoff.curbed_expansion_joints === true ||
                 data.project.roof_sections > 1;
        },
        getContent: (data) => this.getExpansionJointContent(data),
        fallbackContent: `Remove existing expansion joint materials and install new flexible expansion joint system compatible with new roof membrane.`,
        requiredFields: ['takeoff.expansion_joints']
      },

      // Demolition Work
      {
        id: 'demolition',
        title: 'Demolition and Removal',
        priority: 'required',
        includeWhen: (data) => {
          return data.template.selectedTemplate.includes('Tearoff') ||
                 data.project.project_type === 'tearoff' ||
                 data.project.project_type === 'replacement';
        },
        getContent: (data) => this.getDemolitionContent(data),
        requiredFields: ['project.project_type']
      },

      // Crickets and Slope Modifications
      {
        id: 'crickets',
        title: 'Cricket Installation',
        priority: 'recommended',
        includeWhen: (data) => {
          return data.takeoff.crickets_present === true ||
                 data.takeoff.roof_slope < 0.25 ||
                 data.takeoff.drainage_issues === true;
        },
        getContent: (data) => this.getCricketContent(data),
        fallbackContent: `Install tapered insulation crickets at all roof low points and behind equipment to promote positive drainage.`,
        requiredFields: ['takeoff.crickets_present']
      },

      // Scupper Modifications
      {
        id: 'scupper_mods',
        title: 'Scupper Installation and Modification',
        priority: 'optional',
        includeWhen: (data) => {
          return data.takeoff.scuppers_primary > 0 ||
                 data.takeoff.scuppers_secondary > 0 ||
                 data.takeoff.drain_types?.includes('scupper');
        },
        getContent: (data) => this.getScupperContent(data),
        requiredFields: ['takeoff.scuppers_primary', 'takeoff.scuppers_secondary']
      },

      // Coping Details
      {
        id: 'coping_detail',
        title: 'Parapet Coping Installation',
        priority: 'recommended',
        includeWhen: (data) => {
          return data.takeoff.parapet_height > 18 ||
                 data.takeoff.parapet_wall_continuous === true ||
                 data.takeoff.coping_replacement_required === true;
        },
        getContent: (data) => this.getCopingContent(data),
        fallbackContent: `Install new aluminum coping system with proper drainage and attachment per manufacturer specifications.`,
        requiredFields: ['takeoff.parapet_height']
      },

      // HVAC Controls and Equipment
      {
        id: 'hvac_controls',
        title: 'HVAC Equipment Integration',
        priority: 'recommended',
        includeWhen: (data) => {
          return (data.takeoff.hvac_units || 0) > 0 ||
                 data.takeoff.condensing_units > 0 ||
                 data.takeoff.roof_mounted_equipment === true;
        },
        getContent: (data) => this.getHVACContent(data),
        fallbackContent: `Coordinate with existing HVAC equipment. Provide proper flashing and support modifications as required.`,
        requiredFields: ['takeoff.hvac_units']
      },

      // Walkway Pads
      {
        id: 'walkway_pads',
        title: 'Walkway Protection Systems',
        priority: 'optional',
        includeWhen: (data) => {
          return data.takeoff.walkway_pad_requested === true ||
                 data.takeoff.hvac_units > 0 ||
                 data.takeoff.roof_access_type !== 'none';
        },
        getContent: (data) => this.getWalkwayContent(data),
        fallbackContent: `Install TPO protection walk pads at equipment service areas and high-traffic zones.`,
        requiredFields: ['takeoff.walkway_pad_requested']
      },

      // Special Coordination
      {
        id: 'special_coordination',
        title: 'Special Coordination Requirements',
        priority: 'optional',
        includeWhen: (data) => {
          return data.takeoff.sensitive_tenants === true ||
                 data.takeoff.shared_parking_access === true ||
                 data.takeoff.food_drug_manufacturing === true ||
                 data.project.coordination_requirements?.length > 0;
        },
        getContent: (data) => this.getSpecialCoordinationContent(data),
        requiredFields: ['takeoff.sensitive_tenants']
      },

      // Submittal Requirements
      {
        id: 'submittals',
        title: 'Submittal Requirements',
        priority: 'required',
        includeWhen: () => true, // Always required
        getContent: (data) => this.getSubmittalContent(data),
        requiredFields: ['template.selectedTemplate']
      }
    ];
  }

  /**
   * Process individual section and return result
   */
  private processSection(section: SectionDefinition, data: CombinedData): SectionResult {
    // Check if section should be included
    const shouldInclude = section.includeWhen(data);
    
    // Check for missing required fields
    const missingFields = this.checkRequiredFields(section, data);
    let content = '';
    let confidence = 1.0;
    let fallbackApplied = false;
    const warnings: string[] = [];

    if (shouldInclude) {
      if (missingFields.length > 0) {
        // Apply fallback content if available
        if (section.fallbackContent) {
          content = section.fallbackContent;
          fallbackApplied = true;
          confidence = 0.6;
          warnings.push(`Missing fields: ${missingFields.join(', ')}. Using fallback content.`);
          
          this.selfHealingActions.push({
            type: 'fallback_selection',
            field: section.id,
            description: `Applied fallback content for ${section.title} due to missing fields: ${missingFields.join(', ')}`,
            confidence: 0.6
          });
        } else {
          content = `[CONTENT REQUIRES: ${missingFields.join(', ')}]`;
          confidence = 0.3;
          warnings.push(`Cannot generate content due to missing required fields: ${missingFields.join(', ')}`);
        }
      } else {
        // Generate full content
        try {
          content = section.getContent(data);
          confidence = 0.95;
        } catch (error) {
          content = section.fallbackContent || `[ERROR GENERATING CONTENT: ${error}]`;
          fallbackApplied = true;
          confidence = 0.4;
          warnings.push(`Error generating content: ${error}`);
        }
      }
    }

    // Generate rationale
    const rationale = this.generateRationale(section, data, shouldInclude, missingFields);

    return {
      id: section.id,
      title: section.title,
      included: shouldInclude,
      rationale,
      content,
      priority: section.priority,
      confidence,
      fallbackApplied,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Check for missing required fields
   */
  private checkRequiredFields(section: SectionDefinition, data: CombinedData): string[] {
    if (!section.requiredFields) return [];

    const missing: string[] = [];
    
    for (const fieldPath of section.requiredFields) {
      const value = this.getNestedValue(data, fieldPath);
      if (value === undefined || value === null || value === '') {
        missing.push(fieldPath);
      }
    }

    return missing;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate rationale for section inclusion/exclusion
   */
  private generateRationale(
    section: SectionDefinition, 
    data: CombinedData, 
    included: boolean, 
    missingFields: string[]
  ): string {
    if (!included) {
      // Determine why it was excluded
      if (section.id === 'fall_protection') {
        return 'Fall protection not required based on building height and access type';
      } else if (section.id === 'expansion_joints') {
        return 'No expansion joints present in takeoff data';
      } else if (section.id === 'scupper_mods') {
        return 'No scuppers present in drainage configuration';
      } else if (section.id === 'crickets') {
        return 'Adequate slope present, no crickets required';
      } else if (section.id === 'hvac_controls') {
        return 'No HVAC equipment present on roof';
      } else if (section.id === 'walkway_pads') {
        return 'Walkway protection not requested';
      } else if (section.id === 'special_coordination') {
        return 'No special coordination requirements identified';
      }
      return 'Section requirements not met by project parameters';
    }

    // Generate inclusion rationale
    const reasons: string[] = [];
    
    if (section.id === 'base_scope') {
      reasons.push(`Template ${data.template.selectedTemplate} base requirements`);
    } else if (section.id === 'fall_protection') {
      if (data.takeoff.fall_protection_required) reasons.push('Fall protection explicitly required in takeoff');
      if (data.project.building_height > 30) reasons.push(`Building height ${data.project.building_height}ft requires fall protection`);
    } else if (section.id === 'expansion_joints') {
      if (data.takeoff.expansion_joints > 0) reasons.push(`${data.takeoff.expansion_joints} expansion joints identified`);
      if (data.project.roof_sections > 1) reasons.push(`${data.project.roof_sections} roof sections require joint treatment`);
    } else if (section.id === 'demolition') {
      reasons.push(`${data.project.project_type} project requires demolition work`);
    } else if (section.id === 'scupper_mods') {
      if (data.takeoff.scuppers_primary > 0) reasons.push(`${data.takeoff.scuppers_primary} primary scuppers`);
      if (data.takeoff.scuppers_secondary > 0) reasons.push(`${data.takeoff.scuppers_secondary} secondary scuppers`);
    } else if (section.id === 'hvac_controls') {
      reasons.push(`${data.takeoff.hvac_units || 0} HVAC units require coordination`);
    }

    if (missingFields.length > 0) {
      reasons.push(`Using fallback content due to missing: ${missingFields.join(', ')}`);
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Section requirements met by project configuration';
  }

  /**
   * Heal input data with intelligent defaults and corrections
   */
  private healInputData(data: CombinedData): CombinedData {
    const healed = JSON.parse(JSON.stringify(data)); // Deep clone

    // Heal missing project data
    if (!healed.project.building_height && healed.takeoff.building_height) {
      healed.project.building_height = healed.takeoff.building_height;
      this.addSelfHealingAction('auto_correction', 'building_height', undefined, healed.takeoff.building_height, 
        'Copied building height from takeoff to project data', 0.9);
    }

    // Heal deck type ambiguity
    if (!healed.project.deck_type && healed.takeoff.deck_type) {
      healed.project.deck_type = healed.takeoff.deck_type;
      this.addSelfHealingAction('auto_correction', 'deck_type', undefined, healed.takeoff.deck_type,
        'Inferred deck type from takeoff core samples', 0.8);
    }

    // Heal missing drain counts
    if (!healed.takeoff.total_drains) {
      const primary = healed.takeoff.drains_primary || 0;
      const secondary = healed.takeoff.drains_secondary || 0;
      healed.takeoff.total_drains = primary + secondary;
      this.addSelfHealingAction('auto_correction', 'total_drains', undefined, primary + secondary,
        'Calculated total drains from primary and secondary counts', 0.95);
    }

    // Heal missing square footage
    if (!healed.project.square_footage && healed.takeoff.square_footage) {
      healed.project.square_footage = healed.takeoff.square_footage;
      this.addSelfHealingAction('auto_correction', 'square_footage', undefined, healed.takeoff.square_footage,
        'Used takeoff square footage for project total', 0.9);
    }

    // Default roof slope if missing
    if (!healed.takeoff.roof_slope) {
      healed.takeoff.roof_slope = 0.25; // 1/4" per foot default
      this.addSelfHealingAction('missing_field', 'roof_slope', undefined, 0.25,
        'Assumed standard 1/4" per foot roof slope', 0.6);
    }

    // Default parapet height if missing but wall is continuous
    if (!healed.takeoff.parapet_height && healed.takeoff.parapet_wall_continuous) {
      healed.takeoff.parapet_height = 24; // Assume 24" default
      this.addSelfHealingAction('missing_field', 'parapet_height', undefined, 24,
        'Assumed 24" parapet height for continuous wall', 0.5);
    }

    return healed;
  }

  /**
   * Add self-healing action to tracking array
   */
  private addSelfHealingAction(
    type: SelfHealingAction['type'], 
    field: string, 
    originalValue: any, 
    correctedValue: any, 
    description: string, 
    confidence: number
  ): void {
    this.selfHealingActions.push({
      type,
      field,
      originalValue,
      correctedValue,
      description,
      confidence
    });
  }

  // Content generation methods for each section type

  private getBaseScopeContent(data: CombinedData): string {
    const template = data.template.selectedTemplate;
    const address = data.project.address;
    const sqft = data.project.square_footage || data.takeoff.square_footage || '[SQUARE FOOTAGE TBD]';
    const sections = data.project.roof_sections || 1;
    
    let projectType = 'roof system installation';
    if (template.includes('Tearoff')) {
      projectType = 'roof replacement';
    } else if (template.includes('Recover')) {
      projectType = 'roof recover system';
    }

    const deckType = data.project.deck_type || data.takeoff.deck_type || 'structural deck';
    const membraneType = data.template.membrane?.type || 'TPO membrane';

    return `The Scope of Work for **${address}**, as provided in this Section, is briefly described but not limited to the following:

• This building has ${sections === 1 ? 'one (1) roof section' : `${sections} roof sections`}, encompassing approximately ${sqft.toLocaleString()} total square feet. **(Note: This information is provided for convenience only and Bidder/Contractor is responsible for verifying all existing components and conditions)**

• The scope of work for this project is a **${projectType}**, including ${this.getProjectScopeDescription(data)}.

• **The roof system specified herein is based on roof assembly wind uplift testing/approval for field of roof, with enhanced perimeter and corner attachment per this Scope of Work.**

• **The Contractor will be responsible for providing any/all engineering services and documents required by the Authority Having Jurisdiction (AHJ), as required to obtain applicable permits and/or for project close-out. All required engineering services are to be performed by an engineer licensed in the appropriate State or as otherwise acceptable to the AHJ.**`;
  }

  private getProjectScopeDescription(data: CombinedData): string {
    const template = data.template.selectedTemplate;
    const membrane = data.template.membrane?.type || 'TPO';
    const thickness = data.template.membrane?.thickness || '60-mil';
    const attachment = template.includes('MA') ? 'mechanically attached' : 'fully-adhered';
    const insulation = data.template.insulation || 'polyisocyanurate insulation board';

    if (template.includes('Tearoff')) {
      return `removal of all existing roof system materials down to the structural deck and installation of new roof system, consisting of new ${insulation} and new ${attachment}, ${thickness}, ${membrane} roof membrane system, including flashings, accessories and related work`;
    } else if (template.includes('Recover')) {
      return `installation of new ${attachment} ${membrane} recover roof system over existing roof assembly, including new fasteners, plates, and related flashings and accessories`;
    } else {
      return `installation of new ${attachment}, ${thickness}, ${membrane} roof membrane system with ${insulation}, including flashings, accessories and related work`;
    }
  }

  private getFallProtectionContent(data: CombinedData): string {
    const height = data.project.building_height || data.takeoff.building_height || 'building height';
    
    return `**Fall Protection Requirements:**

Contractor shall furnish temporary OSHA-compliant fall arrest systems during all construction activities performed at heights exceeding 6 feet above ground level. All personnel working on roof areas shall utilize appropriate fall protection equipment in accordance with OSHA 1926.501 requirements.

• Install temporary guardrail systems along roof perimeters where workers will be present
• Provide personal fall arrest systems for all workers not protected by guardrail systems
• Establish controlled access zones for low-slope roof work
• All fall protection equipment shall be inspected daily and certified by qualified personnel

**Building height of ${height} feet requires enhanced fall protection protocols and coordination with building management.**`;
  }

  private getExpansionJointContent(data: CombinedData): string {
    const joints = data.takeoff.expansion_joints || 0;
    const height = data.takeoff.expansion_joint_height || 'field-verified height';
    
    return `**Expansion Joint Treatment:**

Remove existing expansion joint materials and install new flexible expansion joint system compatible with new roof membrane system.

• Number of expansion joints: ${joints}
• Joint height: ${height}
• Install new expansion joint covers with proper flashing integration
• Coordinate joint treatment with membrane installation sequence
• Provide proper termination at roof perimeters and penetrations

All expansion joint work shall maintain building movement capabilities while providing weatherproof seal.`;
  }

  private getDemolitionContent(data: CombinedData): string {
    const template = data.template.selectedTemplate;
    const deckType = data.project.deck_type || data.takeoff.deck_type || 'structural deck';
    
    if (template.includes('Tearoff')) {
      return `**Demolition and Removal:**

Remove all existing roof system materials down to the ${deckType}, including:
• All existing membrane materials
• All existing insulation and cover board materials  
• All existing base sheet and vapor barrier materials
• All existing fasteners, adhesives, and sealants
• All existing roof edge materials and flashings

Disposal of all removed materials shall be in accordance with local regulations. Contractor shall protect interior spaces during removal operations and coordinate debris removal to minimize impact on building operations.

**Note:** Contractor is responsible for verifying all existing roof system components prior to removal and shall notify Owner of any unexpected conditions.`;
    }
    
    return `**Selective Demolition:**

Remove and replace damaged or incompatible roof system components as required for proper installation of new roof system. Coordinate selective removal with new system installation to maintain weather protection.`;
  }

  private getCricketContent(data: CombinedData): string {
    const slope = data.takeoff.roof_slope || 0.25;
    
    return `**Cricket Installation:**

Install tapered insulation crickets at all roof low points and behind equipment to promote positive drainage. Current roof slope: ${slope}" per foot.

• Provide minimum 1/4" per foot slope to drains
• Install crickets behind all rooftop equipment
• Coordinate cricket installation with drain locations
• Use compatible tapered insulation materials

All crickets shall be designed to provide positive drainage and eliminate ponding water conditions.`;
  }

  private getScupperContent(data: CombinedData): string {
    const primary = data.takeoff.scuppers_primary || 0;
    const secondary = data.takeoff.scuppers_secondary || 0;
    
    return `**Scupper Installation and Modification:**

Fabricate and install new TPO-clad, galvanized steel scuppers to accommodate drainage requirements.

• Primary scuppers: ${primary}
• Secondary (overflow) scuppers: ${secondary}
• All scuppers to include continuous flanges and proper membrane integration
• Install exterior face plates with hemmed edges and sealant ledges
• Coordinate scupper sizing with hydraulic calculations

All scupper work shall provide weatherproof installation and proper drainage capacity.`;
  }

  private getCopingContent(data: CombinedData): string {
    const height = data.takeoff.parapet_height || 24;
    
    return `**Parapet Coping Installation:**

Install new aluminum coping system with proper drainage and attachment per manufacturer specifications.

• Parapet height: ${height} inches
• Provide continuous coping with thermal movement joints
• Install proper flashing and sealant systems
• Coordinate with existing wall construction
• Color selection by Owner

All coping work shall provide weatherproof seal and accommodate thermal movement.`;
  }

  private getHVACContent(data: CombinedData): string {
    const units = data.takeoff.hvac_units || 0;
    
    return `**HVAC Equipment Integration:**

Coordinate roof work with existing HVAC equipment and provide proper integration.

• Number of units: ${units}
• Provide equipment isolation and protection during construction
• Install proper flashing and support modifications as required
• Coordinate condensate drain connections
• Maintain equipment access and service clearances

All HVAC coordination shall maintain equipment functionality and provide proper weatherproofing.`;
  }

  private getWalkwayContent(data: CombinedData): string {
    return `**Walkway Protection Systems:**

Install TPO protection walk pads, hot-air-welded around the entire perimeter, at the following locations:

• On "serviceable" sides of all HVAC and condensing units
• Under all HVAC unit condensate discharge pipes, 12" x 24" (min.) centered under pipes
• At roof access areas, 5'-0 wide
• Install individual walk pads in maximum lengths of 5'-0", with 2" drainage gaps between adjacent sections

All walkway protection shall provide durable walking surface while maintaining roof warranty compliance.`;
  }

  private getSpecialCoordinationContent(data: CombinedData): string {
    const requirements: string[] = [];
    
    if (data.takeoff.sensitive_tenants) {
      requirements.push('• Coordinate with sensitive tenant operations and provide advance notice');
    }
    if (data.takeoff.shared_parking_access) {
      requirements.push('• Maintain shared parking access and coordinate material deliveries');
    }
    if (data.takeoff.food_drug_manufacturing) {
      requirements.push('• Comply with food/drug manufacturing cleanliness requirements');
    }
    
    return `**Special Coordination Requirements:**

${requirements.join('\n')}

• Provide detailed construction schedule and coordinate with building operations
• Minimize impact on tenant operations and maintain required access
• Implement enhanced safety and cleanliness protocols as required

All coordination shall be documented and approved by building management prior to work commencement.`;
  }

  private getSubmittalContent(data: CombinedData): string {
    const template = data.template.selectedTemplate;
    const isFloridaProject = data.project.state?.toLowerCase() === 'florida' || 
                           data.project.jurisdiction?.includes('FL');
    
    return `**Submittal Requirements:**

**PROJECT-CRITICAL SUBMITTALS**
1. MANUFACTURER'S SYSTEM APPROVAL LETTER
2. MANUFACTURER'S PRODUCT DATA SHEETS for PRIMARY ROOF SYSTEM COMPONENTS
   • ROOF MEMBRANE
   • ROOF MEMBRANE FASTENERS & PLATES
   ${template.includes('adhered') ? '• ROOF MEMBRANE ADHESIVE' : ''}
   • INSULATION BOARD
   • INSULATION BOARD FASTENERS & PLATES
3. ${isFloridaProject ? 'ROOF SYSTEM FLORIDA PRODUCT APPROVAL' : 'ENGINEERING & TESTING REPORTS'}
4. ROOF MEMBRANE LAYOUT / FASTENING PLAN (ROOF SPECIFIC)

**PRE-CONSTRUCTION SUBMITTALS**
5. MANUFACTURER'S PRODUCT DATA SHEETS for ACCESSORY COMPONENTS
6. MATERIAL SAFETY DATA SHEETS (SDS)
7. "SAMPLE" CONTRACTOR'S WARRANTY (5-Year)
8. "SAMPLE" MANUFACTURER'S GUARANTY/WARRANTY (20-Year NDL)
9. COPY OF BUILDING PERMIT
10. CRITICAL PATH SCHEDULE

**CLOSE-OUT SUBMITTALS**
11. EXECUTED CONTRACTOR WARRANTY (5-Year)
12. EXECUTED MANUFACTURER'S GUARANTY/WARRANTY (20-Year NDL)
13. CONSENT OF SURETY TO FINAL PAYMENT (Required only for projects with P&P Bond)`;
  }
}

// Enhanced Section Selection Engine for SOW Generation - ALL 8 TEMPLATES (T1-T8)
// Updated to use enhanced mapping file for complete template support
import enhancedMapping from '../data/sow-section-mapping-enhanced.json';

export interface ProjectInputs {
  // Basic Project Info
  project_type: 'tearoff' | 'recover';
  square_footage: number;
  building_height: number;
  
  // Roof Characteristics
  deck_type: 'Steel' | 'Gypsum' | 'Lightweight Concrete' | 'Concrete';
  roof_slope: number;
  
  // Existing Conditions
  existing_membrane_type?: string;
  existing_membrane_condition?: number;
  existing_system?: 'BUR' | 'Modified Bitumen' | 'Single Ply' | 'Built-up Roof';
  insulation_condition?: string;
  
  // New System Specifications
  membrane_type: 'TPO' | 'TPO Fleece-back' | 'TPO Rhino' | 'EPDM';
  membrane_thickness: string;
  attachment_method?: 'mechanical' | 'fully_adhered' | 'SSR';
  insulation_type: string;
  insulation_thickness: number;
  insulation_r_value: number;
  cover_board_type?: string;
  
  // Environmental Factors
  hvhz: boolean;
  wind_pressures?: {
    zone1Field: number;
    zone2Perimeter: number;
    zone3Corner: number;
  };
  climate_zone?: string;
  
  // Building Features
  number_of_drains: number;
  drain_types: string[];
  hvac_units: number;
  penetrations: number;
  skylights: number;
  roof_hatches: number;
  walkway_pad_requested: boolean;
  gutter_type?: string;
  downspouts?: number;
  
  // Location Info
  address: string;
  county: string;
  state: string;
  
  // Project-specific
  manufacturer?: string;
  warranty_requirements?: string;
}

export interface SelectedSection {
  id: string;
  name: string;
  required: boolean;
  priority: number;
  dependencies: string[];
  content?: string;
  variables?: Record<string, any>;
}

export interface SectionSelectionResult {
  templateType: string;
  templateDescription: string;
  targetPages: string;
  selectedSections: SelectedSection[];
  missingDependencies: string[];
  warnings: string[];
  metadata: {
    totalSections: number;
    requiredSections: number;
    optionalSections: number;
    completeness: number;
    estimatedComplexity: 'Simple' | 'Standard' | 'Complex';
  };
}

export class SectionSelector {
  private mapping = enhancedMapping;
  
  /**
   * Determines the appropriate template type based on project inputs
   * Now supports ALL 8 templates (T1-T8) with enhanced logic
   */
  determineTemplateType(inputs: ProjectInputs): string {
    const { project_type, deck_type, membrane_type, existing_system, cover_board_type, attachment_method } = inputs;
    
    console.log(`🎯 Determining template for: ${project_type}, ${deck_type}, ${membrane_type}, existing: ${existing_system}`);
    
    // RECOVER SYSTEMS (T1-T5)
    if (project_type === 'recover') {
      
      // T5: Recover-TPO(Rhino)-iso-EPS flute fill-SSR
      if (membrane_type === 'TPO Rhino' || 
          attachment_method === 'SSR' ||
          inputs.insulation_type?.toLowerCase().includes('eps flute') ||
          inputs.insulation_type?.toLowerCase().includes('rhino')) {
        return 'T5';
      }
      
      // T3 & T4: TPO Fleece-back systems
      if (membrane_type === 'TPO Fleece-back' || inputs.membrane_thickness === '115') {
        if (cover_board_type?.toLowerCase().includes('lwc') || 
            cover_board_type?.toLowerCase().includes('lightweight')) {
          return 'T4'; // T4: Recover-TPOfleece(MA)-BUR-lwc-steel
        } else {
          return 'T3'; // T3: Recover-TPOfleece(MA)-BUR-insul-steel
        }
      }
      
      // T1 & T2: Standard TPO systems
      if (membrane_type === 'TPO' && existing_system === 'BUR' && deck_type === 'Steel') {
        if (cover_board_type?.toLowerCase().includes('lwc') || 
            cover_board_type?.toLowerCase().includes('lightweight')) {
          return 'T2'; // T2: Recover-TPO(MA)-cvr bd-BUR-lwc-steel
        } else {
          return 'T1'; // T1: Recover-TPO(MA)-cvr bd-BUR-insul-steel
        }
      }
      
      // Default recover system
      return 'T1';
    }
    
    // TEAROFF SYSTEMS (T6-T8)
    if (project_type === 'tearoff') {
      
      // T8: Tearoff-TPO(adhered)-insul(adhered)-gypsum
      if (deck_type === 'Gypsum' || attachment_method === 'fully_adhered') {
        return 'T8';
      }
      
      // T6 & T7: Steel deck systems
      if (deck_type === 'Steel') {
        if (cover_board_type?.toLowerCase().includes('lwc') || 
            cover_board_type?.toLowerCase().includes('lightweight')) {
          return 'T7'; // T7: Tearoff-TPO(MA)-insul-lwc-steel
        } else {
          return 'T6'; // T6: Tearoff-TPO(MA)-insul-steel
        }
      }
    }
    
    // Default fallback
    console.warn(`⚠️ No specific template found for inputs, defaulting to T6`);
    return 'T6';
  }
  
  /**
   * Selects appropriate sections based on template and project inputs
   */
  selectSections(inputs: ProjectInputs): SectionSelectionResult {
    const templateType = this.determineTemplateType(inputs);
    const template = this.mapping.templateSections[templateType];
    
    if (!template) {
      throw new Error(`Template ${templateType} not found in enhanced mapping`);
    }
    
    console.log(`📋 Selecting sections for template ${templateType} (${template.name})`);
    console.log(`📄 Target output: ${template.pages} pages`);
    
    const selectedSections: SelectedSection[] = [];
    const missingDependencies: string[] = [];
    const warnings: string[] = [];
    
    // Process required sections
    for (const sectionId of template.requiredSections) {
      const sectionConfig = this.mapping.sectionMapping[sectionId];
      if (!sectionConfig) {
        warnings.push(`Section configuration not found: ${sectionId}`);
        continue;
      }
      
      const { satisfied, missing } = this.checkDependencies(sectionId, inputs);
      
      selectedSections.push({
        id: sectionId,
        name: sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        required: true,
        priority: sectionConfig.priority,
        dependencies: sectionConfig.dependencies,
        variables: this.extractSectionVariables(sectionId, inputs, templateType, template)
      });
      
      if (!satisfied) {
        missingDependencies.push(...missing);
      }
    }
    
    // Process optional sections
    for (const sectionId of template.optionalSections || []) {
      const sectionConfig = this.mapping.sectionMapping[sectionId];
      if (!sectionConfig) {
        continue;
      }
      
      // Check if optional section should be included
      if (this.shouldIncludeOptionalSection(sectionId, inputs)) {
        const { satisfied, missing } = this.checkDependencies(sectionId, inputs);
        
        selectedSections.push({
          id: sectionId,
          name: sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          required: false,
          priority: sectionConfig.priority,
          dependencies: sectionConfig.dependencies,
          variables: this.extractSectionVariables(sectionId, inputs, templateType, template)
        });
        
        if (!satisfied) {
          missingDependencies.push(...missing);
        }
      }
    }
    
    // Sort sections by priority
    selectedSections.sort((a, b) => a.priority - b.priority);
    
    const requiredCount = selectedSections.filter(s => s.required).length;
    const optionalCount = selectedSections.filter(s => !s.required).length;
    const completeness = (selectedSections.length - missingDependencies.length) / selectedSections.length;
    
    // Determine complexity based on template and features
    const estimatedComplexity = this.determineComplexity(templateType, inputs, selectedSections.length);
    
    console.log(`✅ Selected ${selectedSections.length} sections (${requiredCount} required, ${optionalCount} optional)`);
    console.log(`📊 Complexity: ${estimatedComplexity}, Target: ${template.pages} pages`);
    
    return {
      templateType,
      templateDescription: template.description,
      targetPages: template.pages,
      selectedSections,
      missingDependencies: [...new Set(missingDependencies)],
      warnings,
      metadata: {
        totalSections: selectedSections.length,
        requiredSections: requiredCount,
        optionalSections: optionalCount,
        completeness: Math.round(completeness * 100) / 100,
        estimatedComplexity
      }
    };
  }
  
  /**
   * Determines project complexity for better content generation
   */
  private determineComplexity(templateType: string, inputs: ProjectInputs, sectionCount: number): 'Simple' | 'Standard' | 'Complex' {
    let complexityScore = 0;
    
    // Template complexity
    if (['T4', 'T5', 'T8'].includes(templateType)) complexityScore += 2;
    else if (['T2', 'T3', 'T7'].includes(templateType)) complexityScore += 1;
    
    // Project size
    if (inputs.square_footage > 100000) complexityScore += 2;
    else if (inputs.square_footage > 50000) complexityScore += 1;
    
    // Building features
    if (inputs.hvac_units > 5) complexityScore += 1;
    if (inputs.penetrations > 15) complexityScore += 1;
    if (inputs.skylights > 3) complexityScore += 1;
    if (inputs.hvhz) complexityScore += 2;
    
    // Special systems
    if (inputs.attachment_method === 'SSR') complexityScore += 2;
    if (inputs.attachment_method === 'fully_adhered') complexityScore += 1;
    if (inputs.membrane_type === 'TPO Rhino') complexityScore += 1;
    
    // Section count
    if (sectionCount > 12) complexityScore += 1;
    
    if (complexityScore >= 6) return 'Complex';
    if (complexityScore >= 3) return 'Standard';
    return 'Simple';
  }
  
  /**
   * Checks if all dependencies for a section are satisfied
   */
  private checkDependencies(sectionId: string, inputs: ProjectInputs): {
    satisfied: boolean;
    missing: string[];
  } {
    const sectionConfig = this.mapping.sectionMapping[sectionId];
    if (!sectionConfig) {
      return { satisfied: false, missing: ['section_config'] };
    }
    
    const missing: string[] = [];
    
    for (const dependency of sectionConfig.dependencies) {
      if (!this.hasDependency(dependency, inputs)) {
        missing.push(dependency);
      }
    }
    
    return {
      satisfied: missing.length === 0,
      missing
    };
  }
  
  /**
   * Checks if a specific dependency is satisfied in the inputs
   */
  private hasDependency(dependency: string, inputs: ProjectInputs): boolean {
    // Handle special dependencies
    switch (dependency) {
      case 'wind_pressures':
        return !!inputs.wind_pressures;
      case 'zone_dimensions':
        return !!inputs.building_height && !!inputs.square_footage;
      case 'attachment_requirements':
        return !!inputs.deck_type;
      case 'manufacturer_patterns':
        return !!inputs.manufacturer;
      case 'energy_code_requirements':
        return !!inputs.climate_zone;
      case 'maintenance_access':
        return !!inputs.hvac_units || !!inputs.penetrations;
      case 'warranty_requirements':
        return !!inputs.warranty_requirements;
      
      // Submittal-related dependencies
      case 'project_critical_submittals':
      case 'pre_construction_submittals':
      case 'in_progress_submittals':
      case 'closeout_submittals':
        return true; // These are always required for complete SOW
      case 'manufacturer_system_approval':
      case 'product_data_sheets':
      case 'engineering_reports':
      case 'fastening_plan':
        return !!inputs.manufacturer;
      case 'florida_product_approval':
        return inputs.state === 'FL';
      case 'project_specific_details':
      case 'accessory_data_sheets':
      case 'msds_sheets':
      case 'warranties':
      case 'building_permit':
      case 'schedule':
        return true; // Standard requirements
      case 'metal_color_selections':
      case 'shop_drawings':
        return inputs.gutter_type !== 'None' || inputs.downspouts > 0;
      case 'executed_warranties':
      case 'executed_guaranties':
      case 'consent_of_surety':
      case 'closed_permit':
      case 'punchlist_verification':
        return true; // Standard closeout requirements
        
      default:
        // Check direct property existence
        return inputs[dependency] !== undefined && inputs[dependency] !== null;
    }
  }
  
  /**
   * Determines if an optional section should be included
   */
  private shouldIncludeOptionalSection(sectionId: string, inputs: ProjectInputs): boolean {
    switch (sectionId) {
      case 'drainage_systems':
        return inputs.number_of_drains > 0 || !!inputs.gutter_type;
      case 'in_progress_submittals':
        return inputs.gutter_type !== 'None' || inputs.downspouts > 0;
      case 'walkway_pads':
        return inputs.walkway_pad_requested || inputs.hvac_units > 0;
      default:
        return true;
    }
  }
  
  /**
   * Extracts variables for a specific section with template-specific enhancement
   */
  private extractSectionVariables(sectionId: string, inputs: ProjectInputs, templateType: string, template: any): Record<string, any> {
    const variables: Record<string, any> = {};
    
    // Common variables
    variables.project_type = inputs.project_type;
    variables.deck_type = inputs.deck_type;
    variables.membrane_type = inputs.membrane_type;
    variables.square_footage = inputs.square_footage;
    variables.building_height = inputs.building_height;
    variables.attachment_method = inputs.attachment_method;
    variables.existing_system = inputs.existing_system;
    variables.templateType = templateType;
    variables.templateDescription = template.description;
    
    // Section-specific variables
    switch (sectionId) {
      case 'project_scope':
        variables.scope_description = this.mapping.contentRules.project_scope[inputs.project_type]?.description;
        variables.scope_verb = this.mapping.contentRules.project_scope[inputs.project_type]?.verb?.replace('{deck_type}', inputs.deck_type.toLowerCase());
        break;
        
      case 'new_roof_system':
        variables.membrane_spec = this.mapping.contentRules.membrane_specifications[inputs.membrane_type]?.[inputs.membrane_thickness];
        variables.insulation_spec = this.mapping.contentRules.insulation_specifications[inputs.insulation_type]?.[inputs.insulation_thickness];
        break;
        
      case 'wind_uplift_requirements':
        variables.hvhz = inputs.hvhz;
        variables.wind_pressures = inputs.wind_pressures;
        break;
        
      case 'submittal_requirements':
      case 'project_critical_submittals':
        variables.submittal_categories = this.mapping.contentRules.submittal_categories;
        variables.florida_project = inputs.state === 'FL';
        break;
        
      case 'flashings_and_accessories':
        variables.hvac_count = inputs.hvac_units;
        variables.penetration_count = inputs.penetrations;
        variables.skylight_count = inputs.skylights;
        variables.hatch_count = inputs.roof_hatches;
        break;
        
      case 'drainage_systems':
        variables.drain_count = inputs.number_of_drains;
        variables.drain_types = inputs.drain_types;
        variables.gutter_type = inputs.gutter_type;
        break;
    }
    
    return variables;
  }
}

// Helper function to validate project inputs for all 8 templates
export function validateProjectInputs(inputs: ProjectInputs): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!inputs.project_type) errors.push('Project type is required');
  if (!inputs.square_footage || inputs.square_footage <= 0) errors.push('Valid square footage is required');
  if (!inputs.building_height || inputs.building_height <= 0) errors.push('Valid building height is required');
  if (!inputs.deck_type) errors.push('Deck type is required');
  if (!inputs.membrane_type) errors.push('Membrane type is required');
  if (!inputs.membrane_thickness) errors.push('Membrane thickness is required');
  
  // Template-specific validations
  if (inputs.project_type === 'recover' && !inputs.existing_system) {
    warnings.push('Existing system type recommended for recover projects (BUR, Modified Bitumen, etc.)');
  }
  
  if (inputs.deck_type === 'Gypsum' && inputs.attachment_method !== 'fully_adhered') {
    warnings.push('Gypsum decks typically require fully adhered systems');
  }
  
  if (inputs.membrane_type === 'TPO Rhino' && inputs.attachment_method !== 'SSR') {
    warnings.push('TPO Rhino membranes are typically used with SSR systems');
  }
  
  // Logical validations
  if (inputs.building_height > 200) {
    warnings.push('Building height over 200 feet - verify accuracy');
  }
  
  if (inputs.square_footage > 500000) {
    warnings.push('Square footage over 500,000 - verify accuracy');
  }
  
  if (inputs.hvhz && inputs.state !== 'FL') {
    warnings.push('HVHZ requirements typically apply only to Florida projects');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Factory function
export function createSectionSelector(): SectionSelector {
  return new SectionSelector();
}
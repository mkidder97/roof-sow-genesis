// Dynamic Section Selection Engine for SOW Generation
import sectionMapping from '../data/sow-section-mapping.json';

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
  insulation_condition?: string;
  
  // New System Specifications
  membrane_type: 'TPO' | 'EPDM';
  membrane_thickness: string;
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
  selectedSections: SelectedSection[];
  missingDependencies: string[];
  warnings: string[];
  metadata: {
    totalSections: number;
    requiredSections: number;
    optionalSections: number;
    completeness: number;
  };
}

export class SectionSelector {
  private mapping = sectionMapping;
  
  /**
   * Determines the appropriate template type based on project inputs
   */
  determineTemplateType(inputs: ProjectInputs): string {
    const { project_type, deck_type, membrane_type } = inputs;
    
    console.log(`🎯 Determining template for: ${project_type}, ${deck_type}, ${membrane_type}`);
    
    // Template selection logic
    if (project_type === 'tearoff') {
      if (deck_type === 'Steel') {
        if (inputs.cover_board_type?.toLowerCase().includes('lwc') || 
            inputs.cover_board_type?.toLowerCase().includes('lightweight')) {
          return 'T7'; // LWC Steel Tearoff
        }
        return 'T6'; // Standard Steel Tearoff
      } else if (deck_type === 'Gypsum') {
        return 'T8'; // Gypsum Tearoff (fully adhered)
      }
    } else if (project_type === 'recover') {
      return 'T5'; // Standard Recover
    }
    
    // Default fallback
    console.warn(`⚠️ No specific template found, defaulting to T6`);
    return 'T6';
  }
  
  /**
   * Selects appropriate sections based on template and project inputs
   */
  selectSections(inputs: ProjectInputs): SectionSelectionResult {
    const templateType = this.determineTemplateType(inputs);
    const template = this.mapping.templateSections[templateType];
    
    if (!template) {
      throw new Error(`Template ${templateType} not found in mapping`);
    }
    
    console.log(`📋 Selecting sections for template ${templateType} (${template.name})`);
    
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
      
      selectedSections.push({\n        id: sectionId,\n        name: sectionId.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),\n        required: true,\n        priority: sectionConfig.priority,\n        dependencies: sectionConfig.dependencies,\n        variables: this.extractSectionVariables(sectionId, inputs)\n      });
      
      if (!satisfied) {\n        missingDependencies.push(...missing);\n      }\n    }\n    \n    // Process optional sections\n    for (const sectionId of template.optionalSections) {\n      const sectionConfig = this.mapping.sectionMapping[sectionId];\n      if (!sectionConfig) {\n        continue;\n      }\n      \n      // Check if optional section should be included\n      if (this.shouldIncludeOptionalSection(sectionId, inputs)) {\n        const { satisfied, missing } = this.checkDependencies(sectionId, inputs);\n        \n        selectedSections.push({\n          id: sectionId,\n          name: sectionId.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),\n          required: false,\n          priority: sectionConfig.priority,\n          dependencies: sectionConfig.dependencies,\n          variables: this.extractSectionVariables(sectionId, inputs)\n        });\n        \n        if (!satisfied) {\n          missingDependencies.push(...missing);\n        }\n      }\n    }\n    \n    // Sort sections by priority\n    selectedSections.sort((a, b) => a.priority - b.priority);\n    \n    const requiredCount = selectedSections.filter(s => s.required).length;\n    const optionalCount = selectedSections.filter(s => !s.required).length;\n    const completeness = (selectedSections.length - missingDependencies.length) / selectedSections.length;\n    \n    console.log(`✅ Selected ${selectedSections.length} sections (${requiredCount} required, ${optionalCount} optional)`);\n    \n    return {\n      templateType,\n      selectedSections,\n      missingDependencies: [...new Set(missingDependencies)],\n      warnings,\n      metadata: {\n        totalSections: selectedSections.length,\n        requiredSections: requiredCount,\n        optionalSections: optionalCount,\n        completeness: Math.round(completeness * 100) / 100\n      }\n    };\n  }\n  \n  /**\n   * Checks if all dependencies for a section are satisfied\n   */\n  private checkDependencies(sectionId: string, inputs: ProjectInputs): {\n    satisfied: boolean;\n    missing: string[];\n  } {\n    const sectionConfig = this.mapping.sectionMapping[sectionId];\n    if (!sectionConfig) {\n      return { satisfied: false, missing: ['section_config'] };\n    }\n    \n    const missing: string[] = [];\n    \n    for (const dependency of sectionConfig.dependencies) {\n      if (!this.hasDependency(dependency, inputs)) {\n        missing.push(dependency);\n      }\n    }\n    \n    return {\n      satisfied: missing.length === 0,\n      missing\n    };\n  }\n  \n  /**\n   * Checks if a specific dependency is satisfied in the inputs\n   */\n  private hasDependency(dependency: string, inputs: ProjectInputs): boolean {\n    // Handle special dependencies\n    switch (dependency) {\n      case 'wind_pressures':\n        return !!inputs.wind_pressures;\n      case 'zone_dimensions':\n        return !!inputs.building_height && !!inputs.square_footage;\n      case 'attachment_requirements':\n        return !!inputs.deck_type;\n      case 'manufacturer_patterns':\n        return !!inputs.manufacturer;\n      case 'energy_code_requirements':\n        return !!inputs.climate_zone;\n      case 'maintenance_access':\n        return !!inputs.hvac_units || !!inputs.penetrations;\n      case 'warranty_requirements':\n        return !!inputs.warranty_requirements;\n      default:\n        // Check direct property existence\n        return inputs[dependency] !== undefined && inputs[dependency] !== null;\n    }\n  }\n  \n  /**\n   * Determines if an optional section should be included\n   */\n  private shouldIncludeOptionalSection(sectionId: string, inputs: ProjectInputs): boolean {\n    switch (sectionId) {\n      case 'drainage_systems':\n        return inputs.number_of_drains > 0 || !!inputs.gutter_type;\n      case 'vapor_barrier':\n        return !!inputs.climate_zone && parseInt(inputs.climate_zone) >= 4;\n      case 'walkway_pads':\n        return inputs.walkway_pad_requested || inputs.hvac_units > 0;\n      default:\n        return true;\n    }\n  }\n  \n  /**\n   * Extracts variables for a specific section\n   */\n  private extractSectionVariables(sectionId: string, inputs: ProjectInputs): Record<string, any> {\n    const variables: Record<string, any> = {};\n    \n    // Common variables\n    variables.project_type = inputs.project_type;\n    variables.deck_type = inputs.deck_type;\n    variables.membrane_type = inputs.membrane_type;\n    variables.square_footage = inputs.square_footage;\n    variables.building_height = inputs.building_height;\n    \n    // Section-specific variables\n    switch (sectionId) {\n      case 'project_scope':\n        variables.scope_description = this.mapping.contentRules.project_scope[inputs.project_type]?.description;\n        variables.scope_verb = this.mapping.contentRules.project_scope[inputs.project_type]?.verb?.replace('{deck_type}', inputs.deck_type.toLowerCase());\n        break;\n        \n      case 'new_roof_system':\n        variables.membrane_spec = this.mapping.contentRules.membrane_specifications[inputs.membrane_type]?.[inputs.membrane_thickness];\n        variables.insulation_spec = this.mapping.contentRules.insulation_specifications[inputs.insulation_type]?.[inputs.insulation_thickness];\n        break;\n        \n      case 'wind_uplift_requirements':\n        variables.hvhz = inputs.hvhz;\n        variables.wind_pressures = inputs.wind_pressures;\n        break;\n        \n      case 'flashings_and_accessories':\n        variables.hvac_count = inputs.hvac_units;\n        variables.penetration_count = inputs.penetrations;\n        variables.skylight_count = inputs.skylights;\n        variables.hatch_count = inputs.roof_hatches;\n        break;\n        \n      case 'drainage_systems':\n        variables.drain_count = inputs.number_of_drains;\n        variables.drain_types = inputs.drain_types;\n        variables.gutter_type = inputs.gutter_type;\n        break;\n    }\n    \n    return variables;\n  }\n}\n\n// Helper function to validate project inputs\nexport function validateProjectInputs(inputs: ProjectInputs): {\n  valid: boolean;\n  errors: string[];\n  warnings: string[];\n} {\n  const errors: string[] = [];\n  const warnings: string[] = [];\n  \n  // Required fields\n  if (!inputs.project_type) errors.push('Project type is required');\n  if (!inputs.square_footage || inputs.square_footage <= 0) errors.push('Valid square footage is required');\n  if (!inputs.building_height || inputs.building_height <= 0) errors.push('Valid building height is required');\n  if (!inputs.deck_type) errors.push('Deck type is required');\n  if (!inputs.membrane_type) errors.push('Membrane type is required');\n  if (!inputs.membrane_thickness) errors.push('Membrane thickness is required');\n  \n  // Logical validations\n  if (inputs.building_height > 200) {\n    warnings.push('Building height over 200 feet - verify accuracy');\n  }\n  \n  if (inputs.square_footage > 500000) {\n    warnings.push('Square footage over 500,000 - verify accuracy');\n  }\n  \n  if (inputs.project_type === 'recover' && !inputs.existing_membrane_type) {\n    warnings.push('Existing membrane type recommended for recover projects');\n  }\n  \n  return {\n    valid: errors.length === 0,\n    errors,\n    warnings\n  };\n}\n\n// Factory function\nexport function createSectionSelector(): SectionSelector {\n  return new SectionSelector();\n}
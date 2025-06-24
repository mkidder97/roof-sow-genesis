// SOW Section-to-Input Mapping Engine
// Maps project inputs to relevant SOW sections with complete auditability
// Integrates with existing section engine and content population system

export interface SectionInputMapping {
  section: string;
  relevantInput: string;
  inputPath: string; // Dot notation path to access the input value
  isRequired: boolean;
  transformFunction?: string; // Optional transformation function name
  fallbackValue?: any;
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minValue' | 'maxValue' | 'pattern' | 'oneOf';
  value?: any;
  message: string;
}

export interface SectionMappingResult {
  sectionId: string;
  sectionTitle: string;
  relevantInputs: ResolvedInput[];
  hasAllRequiredInputs: boolean;
  missingRequiredInputs: string[];
  sectionPriority: number;
  auditTrail: InputAuditEntry[];
}

export interface ResolvedInput {
  inputName: string;
  inputPath: string;
  rawValue: any;
  transformedValue: any;
  transformFunction?: string;
  isResolved: boolean;
  fallbackUsed: boolean;
  validationResults: ValidationResult[];
}

export interface ValidationResult {
  rule: ValidationRule;
  passed: boolean;
  message?: string;
}

export interface InputAuditEntry {
  timestamp: string;
  inputPath: string;
  action: 'resolved' | 'transformed' | 'fallback' | 'validation_failed';
  details: string;
  value: any;
}

export interface SectionMappingConfig {
  enableAuditTrail: boolean;
  enableValidation: boolean;
  enableTransformations: boolean;
  enableFallbacks: boolean;
  strictMode: boolean; // Fail if required inputs are missing
}

/**
 * Core section-to-input mapping definitions based on CSV
 * Expanded with validation, transformations, and fallbacks
 */
export const SOW_SECTION_MAPPINGS: SectionInputMapping[] = [
  // Basic Project Information
  {
    section: 'Project Title',
    relevantInput: 'projectName',
    inputPath: 'projectName',
    isRequired: true,
    validationRules: [
      { type: 'required', message: 'Project name is required' },
      { type: 'pattern', value: /.{3,}/, message: 'Project name must be at least 3 characters' }
    ]
  },
  {
    section: 'Project Address',
    relevantInput: 'address', 
    inputPath: 'address',
    isRequired: true,
    validationRules: [
      { type: 'required', message: 'Project address is required' }
    ]
  },
  {
    section: 'Company Name',
    relevantInput: 'companyName',
    inputPath: 'companyName', 
    isRequired: true,
    fallbackValue: 'General Contractor'
  },
  {
    section: 'Square Footage',
    relevantInput: 'squareFootage',
    inputPath: 'squareFootage',
    isRequired: true,
    transformFunction: 'formatSquareFootage',
    validationRules: [
      { type: 'required', message: 'Square footage is required' },
      { type: 'minValue', value: 100, message: 'Square footage must be at least 100 sq ft' }
    ]
  },

  // Template and System Selection
  {
    section: 'Template Selection',
    relevantInput: 'decisionTreeResult.template_selection.template_id',
    inputPath: 'decisionTreeResult.template_selection.template_id',
    isRequired: true,
    fallbackValue: 'T1'
  },
  {
    section: 'Assembly Description',
    relevantInput: 'decisionTreeResult.template_selection.assembly_description',
    inputPath: 'decisionTreeResult.template_selection.assembly_description',
    isRequired: false,
    transformFunction: 'formatAssemblyDescription'
  },
  {
    section: 'Project Type',
    relevantInput: 'decisionTreeResult.decision_tree.projectType',
    inputPath: 'decisionTreeResult.decision_tree.projectType',
    isRequired: true,
    validationRules: [
      { type: 'oneOf', value: ['recover', 'tearoff', 'new'], message: 'Project type must be recover, tearoff, or new' }
    ],
    fallbackValue: 'recover'
  },
  {
    section: 'Substrate Type',
    relevantInput: 'decisionTreeResult.decision_tree.deckType',
    inputPath: 'decisionTreeResult.decision_tree.deckType',
    isRequired: true,
    transformFunction: 'formatDeckType',
    fallbackValue: 'steel'
  },

  // Material Specifications
  {
    section: 'Membrane Specifications',
    relevantInput: 'decisionTreeResult.enhanced_specifications.materials.membrane',
    inputPath: 'decisionTreeResult.enhanced_specifications.materials.membrane',
    isRequired: true,
    transformFunction: 'formatMembraneSpecs'
  },
  {
    section: 'Insulation Specifications',
    relevantInput: 'decisionTreeResult.enhanced_specifications.materials.insulation',
    inputPath: 'decisionTreeResult.enhanced_specifications.materials.insulation',
    isRequired: false,
    transformFunction: 'formatInsulationSpecs'
  },
  {
    section: 'Coverboard Requirements',
    relevantInput: 'decisionTreeResult.enhanced_specifications.materials.coverboard_required',
    inputPath: 'decisionTreeResult.enhanced_specifications.materials.coverboard_required',
    isRequired: false,
    transformFunction: 'formatCoverboardReqs'
  },

  // Wind and Fastening Requirements
  {
    section: 'Wind Zone Requirements',
    relevantInput: 'windAnalysis.zones',
    inputPath: 'windAnalysis.zones',
    isRequired: true,
    transformFunction: 'formatWindZones'
  },
  {
    section: 'ASCE Version',
    relevantInput: 'windAnalysis.asceVersion',
    inputPath: 'windAnalysis.asceVersion',
    isRequired: true,
    fallbackValue: 'ASCE 7-16'
  },
  {
    section: 'Uplift Pressures',
    relevantInput: 'windAnalysis.pressures.zones',
    inputPath: 'windAnalysis.pressures.zones',
    isRequired: true,
    transformFunction: 'formatUpliftPressures'
  },
  {
    section: 'Enhanced Fastening',
    relevantInput: 'decisionTreeResult.enhanced_specifications.fastening.enhanced_patterns',
    inputPath: 'decisionTreeResult.enhanced_specifications.fastening.enhanced_patterns',
    isRequired: true,
    transformFunction: 'formatFasteningPatterns'
  },
  {
    section: 'Fastening Patterns',
    relevantInput: 'zonesAndFastening.fastening_schedule',
    inputPath: 'zonesAndFastening.fastening_schedule',
    isRequired: true,
    transformFunction: 'formatFasteningSchedule'
  },

  // Building Codes and Compliance
  {
    section: 'Building Code Version',
    relevantInput: 'buildingCodes.applicable_codes.primary_code',
    inputPath: 'buildingCodes.applicable_codes.primary_code',
    isRequired: true,
    fallbackValue: '2021 IBC'
  },
  {
    section: 'HVHZ Requirements',
    relevantInput: 'buildingCodes.special_requirements',
    inputPath: 'buildingCodes.special_requirements',
    isRequired: false,
    transformFunction: 'formatHVHZRequirements'
  },

  // Manufacturer and Approval Requirements
  {
    section: 'NOA Requirements',
    relevantInput: 'manufacturerAnalysis.miami_dade_requirements',
    inputPath: 'manufacturerAnalysis.miami_dade_requirements',
    isRequired: false,
    transformFunction: 'formatNOARequirements'
  },
  {
    section: 'ESR Requirements',
    relevantInput: 'manufacturerAnalysis.icc_esr_requirements',
    inputPath: 'manufacturerAnalysis.icc_esr_requirements',
    isRequired: false,
    transformFunction: 'formatESRRequirements'
  },
  {
    section: 'Manufacturer System',
    relevantInput: 'manufacturerAnalysis.system_specifications',
    inputPath: 'manufacturerAnalysis.system_specifications',
    isRequired: true,
    transformFunction: 'formatManufacturerSystem'
  },
  {
    section: 'Warranty Requirements',
    relevantInput: 'manufacturerAnalysis.warranty_information',
    inputPath: 'manufacturerAnalysis.warranty_information',
    isRequired: true,
    transformFunction: 'formatWarrantyInfo'
  },

  // Special Instructions and Additional Requirements
  {
    section: 'Special Instructions',
    relevantInput: 'decisionTreeResult.enhanced_specifications.special_considerations',
    inputPath: 'decisionTreeResult.enhanced_specifications.special_considerations',
    isRequired: false,
    transformFunction: 'formatSpecialInstructions'
  }
];

/**
 * Section Input Mapping Engine
 * Resolves all inputs for SOW sections with validation and transformation
 */
export class SectionInputMappingEngine {
  private config: SectionMappingConfig;
  private auditTrail: InputAuditEntry[] = [];

  constructor(config: Partial<SectionMappingConfig> = {}) {
    this.config = {
      enableAuditTrail: true,
      enableValidation: true,
      enableTransformations: true,
      enableFallbacks: true,
      strictMode: false,
      ...config
    };
  }

  /**
   * Main entry point: resolve all section mappings for given inputs
   */
  public resolveSectionMappings(inputs: any): SectionMappingResult[] {
    console.log('🗺️ Resolving SOW section mappings...');
    console.log(`   📊 ${SOW_SECTION_MAPPINGS.length} mappings to process`);
    console.log(`   ⚙️ Config: validation=${this.config.enableValidation}, transforms=${this.config.enableTransformations}`);

    this.auditTrail = [];
    const results: SectionMappingResult[] = [];

    for (const mapping of SOW_SECTION_MAPPINGS) {
      const result = this.resolveSectionMapping(mapping, inputs);
      results.push(result);
    }

    // Sort by priority (sections with all required inputs first)
    results.sort((a, b) => {
      if (a.hasAllRequiredInputs && !b.hasAllRequiredInputs) return -1;
      if (!a.hasAllRequiredInputs && b.hasAllRequiredInputs) return 1;
      return a.sectionPriority - b.sectionPriority;
    });

    console.log(`✅ Section mapping complete:`);
    console.log(`   📋 ${results.length} sections processed`);
    console.log(`   ✅ ${results.filter(r => r.hasAllRequiredInputs).length} sections fully resolved`);
    console.log(`   ⚠️ ${results.filter(r => !r.hasAllRequiredInputs).length} sections with missing inputs`);
    console.log(`   📝 ${this.auditTrail.length} audit trail entries`);

    return results;
  }

  /**
   * Resolve a single section mapping
   */
  private resolveSectionMapping(mapping: SectionInputMapping, inputs: any): SectionMappingResult {
    const resolvedInputs: ResolvedInput[] = [];
    const missingRequiredInputs: string[] = [];
    
    // Resolve the primary input
    const resolvedInput = this.resolveInput(mapping, inputs);
    resolvedInputs.push(resolvedInput);

    // Check for missing required inputs
    if (mapping.isRequired && !resolvedInput.isResolved && !resolvedInput.fallbackUsed) {
      missingRequiredInputs.push(mapping.relevantInput);
    }

    // Determine section priority
    const sectionPriority = this.calculateSectionPriority(mapping, resolvedInput);

    return {
      sectionId: this.generateSectionId(mapping.section),
      sectionTitle: mapping.section,
      relevantInputs: resolvedInputs,
      hasAllRequiredInputs: missingRequiredInputs.length === 0,
      missingRequiredInputs,
      sectionPriority,
      auditTrail: this.getRelevantAuditEntries(mapping.inputPath)
    };
  }

  /**
   * Resolve a single input with validation and transformation
   */
  private resolveInput(mapping: SectionInputMapping, inputs: any): ResolvedInput {
    const rawValue = this.getNestedValue(inputs, mapping.inputPath);
    let transformedValue = rawValue;
    let isResolved = rawValue !== undefined && rawValue !== null;
    let fallbackUsed = false;
    let validationResults: ValidationResult[] = [];

    this.addAuditEntry(mapping.inputPath, 'resolved', `Raw value resolved`, rawValue);

    // Apply fallback if needed
    if (!isResolved && this.config.enableFallbacks && mapping.fallbackValue !== undefined) {
      transformedValue = mapping.fallbackValue;
      isResolved = true;
      fallbackUsed = true;
      this.addAuditEntry(mapping.inputPath, 'fallback', `Fallback value applied`, mapping.fallbackValue);
    }

    // Apply transformations
    if (isResolved && this.config.enableTransformations && mapping.transformFunction) {
      const originalValue = transformedValue;
      transformedValue = this.applyTransformation(mapping.transformFunction, transformedValue, inputs);
      this.addAuditEntry(mapping.inputPath, 'transformed', `Applied ${mapping.transformFunction}`, { original: originalValue, transformed: transformedValue });
    }

    // Apply validation
    if (this.config.enableValidation && mapping.validationRules) {
      validationResults = this.validateInput(transformedValue, mapping.validationRules);
      
      const failedValidations = validationResults.filter(r => !r.passed);
      if (failedValidations.length > 0) {
        this.addAuditEntry(mapping.inputPath, 'validation_failed', `${failedValidations.length} validation(s) failed`, failedValidations.map(f => f.message));
        
        if (this.config.strictMode) {
          isResolved = false;
        }
      }
    }

    return {
      inputName: mapping.relevantInput,
      inputPath: mapping.inputPath,
      rawValue,
      transformedValue,
      transformFunction: mapping.transformFunction,
      isResolved,
      fallbackUsed,
      validationResults
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Apply transformation function to value
   */
  private applyTransformation(functionName: string, value: any, fullInputs: any): any {
    const transformations = {
      formatSquareFootage: (val: number) => `${val?.toLocaleString()} sq ft`,
      formatAssemblyDescription: (val: string) => val || 'Standard roof assembly',
      formatDeckType: (val: string) => this.formatDeckType(val),
      formatMembraneSpecs: (val: any) => this.formatMembraneSpecs(val),
      formatInsulationSpecs: (val: any) => this.formatInsulationSpecs(val),
      formatCoverboardReqs: (val: boolean) => val ? 'Coverboard required' : 'No coverboard required',
      formatWindZones: (val: any) => this.formatWindZones(val),
      formatUpliftPressures: (val: any) => this.formatUpliftPressures(val),
      formatFasteningPatterns: (val: any) => this.formatFasteningPatterns(val),
      formatFasteningSchedule: (val: any) => this.formatFasteningSchedule(val),
      formatHVHZRequirements: (val: any) => this.formatHVHZRequirements(val),
      formatNOARequirements: (val: any) => this.formatNOARequirements(val),
      formatESRRequirements: (val: any) => this.formatESRRequirements(val),
      formatManufacturerSystem: (val: any) => this.formatManufacturerSystem(val),
      formatWarrantyInfo: (val: any) => this.formatWarrantyInfo(val),
      formatSpecialInstructions: (val: any) => this.formatSpecialInstructions(val)
    };

    const transformFn = transformations[functionName as keyof typeof transformations];
    if (transformFn) {
      try {
        return transformFn(value);
      } catch (error) {
        console.warn(`⚠️ Transformation ${functionName} failed:`, error);
        return value;
      }
    }

    return value;
  }

  /**
   * Validate input against rules
   */
  private validateInput(value: any, rules: ValidationRule[]): ValidationResult[] {
    return rules.map(rule => {
      let passed = true;
      let message = rule.message;

      switch (rule.type) {
        case 'required':
          passed = value !== undefined && value !== null && value !== '';
          break;
        case 'minValue':
          passed = typeof value === 'number' && value >= rule.value;
          break;
        case 'maxValue':
          passed = typeof value === 'number' && value <= rule.value;
          break;
        case 'pattern':
          passed = rule.value instanceof RegExp ? rule.value.test(String(value)) : true;
          break;
        case 'oneOf':
          passed = Array.isArray(rule.value) && rule.value.includes(value);
          break;
      }

      return { rule, passed, message: passed ? undefined : message };
    });
  }

  /**
   * Calculate section priority based on resolution status
   */
  private calculateSectionPriority(mapping: SectionInputMapping, resolvedInput: ResolvedInput): number {
    let priority = 100; // Base priority

    // Required sections get higher priority
    if (mapping.isRequired) priority -= 50;

    // Fully resolved inputs get higher priority
    if (resolvedInput.isResolved) priority -= 20;

    // Sections with fallbacks get lower priority
    if (resolvedInput.fallbackUsed) priority += 10;

    // Sections with validation failures get lower priority
    if (resolvedInput.validationResults.some(r => !r.passed)) priority += 30;

    return priority;
  }

  /**
   * Generate section ID from section title
   */
  private generateSectionId(sectionTitle: string): string {
    return sectionTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Add audit trail entry
   */
  private addAuditEntry(inputPath: string, action: InputAuditEntry['action'], details: string, value: any): void {
    if (!this.config.enableAuditTrail) return;

    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      inputPath,
      action,
      details,
      value
    });
  }

  /**
   * Get audit entries relevant to specific input path
   */
  private getRelevantAuditEntries(inputPath: string): InputAuditEntry[] {
    return this.auditTrail.filter(entry => entry.inputPath === inputPath);
  }

  /**
   * Get complete audit trail
   */
  public getAuditTrail(): InputAuditEntry[] {
    return [...this.auditTrail];
  }

  // Transformation helper methods
  private formatDeckType(deckType: string): string {
    const deckMap: Record<string, string> = {
      'steel': 'Steel Deck',
      'gypsum': 'Gypsum Deck',
      'lwc': 'Lightweight Concrete over Steel Deck',
      'concrete': 'Concrete Deck',
      'wood': 'Wood Deck'
    };
    return deckMap[deckType?.toLowerCase()] || deckType || 'Unknown Deck Type';
  }

  private formatMembraneSpecs(specs: any): string {
    if (!specs) return 'Standard TPO membrane';
    
    if (typeof specs === 'string') return specs;
    
    const thickness = specs.thickness || '60 mil';
    const type = specs.type || 'TPO';
    const color = specs.color || 'White';
    
    return `${thickness} ${type} membrane, ${color}`;
  }

  private formatInsulationSpecs(specs: any): string {
    if (!specs) return 'No insulation specified';
    
    if (typeof specs === 'string') return specs;
    
    const type = specs.type || 'Polyiso';
    const thickness = specs.thickness || '2"';
    
    return `${thickness} ${type} insulation`;
  }

  private formatWindZones(zones: any): string {
    if (!zones) return 'Standard wind zones apply';
    
    if (Array.isArray(zones)) {
      return `Wind zones: ${zones.join(', ')}`;
    }
    
    return String(zones);
  }

  private formatUpliftPressures(pressures: any): string {
    if (!pressures) return 'Standard uplift pressures';
    
    if (typeof pressures === 'object') {
      const formatted = Object.entries(pressures)
        .map(([zone, pressure]) => `${zone}: ${Math.abs(Number(pressure))} psf`)
        .join(', ');
      return formatted || 'Uplift pressures calculated';
    }
    
    return String(pressures);
  }

  private formatFasteningPatterns(patterns: any): string {
    if (!patterns) return 'Standard fastening patterns';
    
    if (typeof patterns === 'object') {
      const field = patterns.field || '12" o.c.';
      const perimeter = patterns.perimeter || '6" o.c.';
      const corner = patterns.corner || '4" o.c.';
      
      return `Field: ${field}, Perimeter: ${perimeter}, Corner: ${corner}`;
    }
    
    return String(patterns);
  }

  private formatFasteningSchedule(schedule: any): string {
    if (!schedule) return 'Standard fastening schedule';
    return typeof schedule === 'object' ? JSON.stringify(schedule) : String(schedule);
  }

  private formatHVHZRequirements(reqs: any): string {
    if (!reqs) return 'No HVHZ requirements';
    return Array.isArray(reqs) ? reqs.join('; ') : String(reqs);
  }

  private formatNOARequirements(reqs: any): string {
    if (!reqs) return 'No NOA requirements';
    return typeof reqs === 'object' ? JSON.stringify(reqs) : String(reqs);
  }

  private formatESRRequirements(reqs: any): string {
    if (!reqs) return 'No ESR requirements';
    return typeof reqs === 'object' ? JSON.stringify(reqs) : String(reqs);
  }

  private formatManufacturerSystem(system: any): string {
    if (!system) return 'Standard manufacturer system';
    
    if (typeof system === 'object') {
      const name = system.name || 'Unknown System';
      const manufacturer = system.manufacturer || 'Unknown Manufacturer';
      return `${manufacturer} ${name}`;
    }
    
    return String(system);
  }

  private formatWarrantyInfo(warranty: any): string {
    if (!warranty) return 'Standard warranty terms apply';
    
    if (typeof warranty === 'object') {
      const term = warranty.term || '20 years';
      const type = warranty.type || 'Material';
      return `${term} ${type} warranty`;
    }
    
    return String(warranty);
  }

  private formatSpecialInstructions(instructions: any): string {
    if (!instructions) return 'No special instructions';
    
    if (Array.isArray(instructions)) {
      return instructions.join('; ');
    }
    
    return String(instructions);
  }
}

/**
 * Helper function to create mapping engine with default configuration
 */
export function createSectionMappingEngine(config?: Partial<SectionMappingConfig>): SectionInputMappingEngine {
  return new SectionInputMappingEngine(config);
}

/**
 * Helper function to get all available section mappings
 */
export function getAvailableSectionMappings(): SectionInputMapping[] {
  return [...SOW_SECTION_MAPPINGS];
}

/**
 * Helper function to find mappings for specific input path
 */
export function findMappingsForInput(inputPath: string): SectionInputMapping[] {
  return SOW_SECTION_MAPPINGS.filter(mapping => 
    mapping.inputPath === inputPath || 
    mapping.inputPath.startsWith(inputPath + '.') ||
    inputPath.startsWith(mapping.inputPath + '.')
  );
}

/**
 * Helper function to validate that all required sections can be resolved
 */
export function validateRequiredSections(inputs: any): { 
  isValid: boolean; 
  missingRequiredSections: string[];
  summary: { total: number; resolved: number; missing: number };
} {
  const engine = createSectionMappingEngine({ strictMode: true });
  const results = engine.resolveSectionMappings(inputs);
  
  const missingRequired = results
    .filter(result => !result.hasAllRequiredInputs)
    .map(result => result.sectionTitle);
  
  return {
    isValid: missingRequired.length === 0,
    missingRequiredSections: missingRequired,
    summary: {
      total: results.length,
      resolved: results.filter(r => r.hasAllRequiredInputs).length,
      missing: missingRequired.length
    }
  };
}

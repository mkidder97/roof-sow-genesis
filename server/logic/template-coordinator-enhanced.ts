// Enhanced Template Coordinator for Complete 36+ Page SOW Generation
// REFACTORED: Now uses database-driven engineering configuration instead of hardcoded values
import { EnhancedSOWContentGenerator } from './content-generator-enhanced.js';
import { SectionSelector, ProjectInputs, SelectedSection } from './section-selector-enhanced.js';
import { WindPressureCalculator } from './wind-pressure.js';
import enhancedMapping from '../data/sow-section-mapping-enhanced.json';
import { 
  findMatchingTemplate, 
  getConfig, 
  getImportanceFactor,
  getInternalPressureCoeff,
  getDirectivityFactor 
} from '../services/engineering-config';
import type { TemplateCondition } from '../types/engineering-config';

export interface TemplateCoordinationResult {
  templateType: string;
  templateDescription: string;
  generatedDocument: any;
  processingTime: number;
  qualityMetrics: {
    wordCount: number;
    pageEstimate: number;
    completeness: number;
    complexityScore: string;
    submittalCoverage: number;
  };
  warnings: string[];
  recommendedNextSteps: string[];
  engineeringConfig: {
    importanceFactor: number;
    internalPressureCoeff: number;
    directivityFactor: number;
    templateSource: 'database' | 'fallback';
  };
}

export class EnhancedTemplateCoordinator {
  private contentGenerator: EnhancedSOWContentGenerator;
  private sectionSelector: SectionSelector;
  private windCalculator: WindPressureCalculator;
  private mapping = enhancedMapping;

  constructor() {
    this.contentGenerator = new EnhancedSOWContentGenerator();
    this.sectionSelector = new SectionSelector();
    this.windCalculator = new WindPressureCalculator();
  }

  /**
   * Orchestrates complete SOW generation for any of the 8 templates
   * NOW USES DATABASE-DRIVEN TEMPLATE SELECTION AND ENGINEERING CONSTANTS
   */
  async generateCompleteSOW(
    projectInputs: ProjectInputs,
    manufacturerData?: any
  ): Promise<TemplateCoordinationResult> {
    const startTime = Date.now();
    console.log(`🎯 Starting comprehensive SOW generation with database-driven configuration...`);
    console.log(`📊 Project: ${projectInputs.project_type} - ${projectInputs.square_footage.toLocaleString()} sqft`);

    try {
      // 1. Get engineering configuration values from database
      const engineeringConfig = await this.getEngineeringConfiguration(projectInputs);
      console.log(`⚙️ Engineering config loaded: Kd=${engineeringConfig.directivityFactor}, I=${engineeringConfig.importanceFactor}`);

      // 2. Determine optimal template using database rules
      const selectedTemplate = await this.selectTemplateFromDatabase(projectInputs);
      console.log(`📋 Template selected from database: ${selectedTemplate.template || 'fallback to mapping'}`);

      // 3. Select sections (enhanced with database-driven template if available)
      const sectionSelection = selectedTemplate.template 
        ? await this.selectSectionsForDbTemplate(selectedTemplate.template, projectInputs)
        : this.sectionSelector.selectSections(projectInputs);
      
      console.log(`📄 Target: ${sectionSelection.targetPages} pages`);
      console.log(`✅ Selected ${sectionSelection.selectedSections.length} sections`);

      // 4. Calculate wind pressures with database-driven coefficients
      let windData;
      if (projectInputs.address && projectInputs.building_height) {
        try {
          windData = await this.windCalculator.calculateWindPressuresWithConfig(
            projectInputs.address,
            projectInputs.building_height,
            projectInputs.county || '',
            projectInputs.state || '',
            {
              importanceFactor: engineeringConfig.importanceFactor,
              internalPressureCoeff: engineeringConfig.internalPressureCoeff,
              directivityFactor: engineeringConfig.directivityFactor
            }
          );
          console.log(`🌪️ Wind pressures calculated with database config for ${projectInputs.address}`);
        } catch (error) {
          console.warn(`⚠️ Wind calculation failed: ${error.message}`);
        }
      }

      // 5. Enhance sections with template-specific requirements
      const enhancedSections = await this.enhanceSectionsForTemplate(
        sectionSelection.selectedSections,
        sectionSelection.templateType,
        projectInputs,
        engineeringConfig
      );

      // 6. Generate comprehensive content
      const document = this.contentGenerator.generateDocument(
        projectInputs,
        enhancedSections,
        windData,
        manufacturerData
      );

      // 7. Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(
        document,
        sectionSelection,
        projectInputs
      );

      // 8. Generate recommendations
      const recommendations = this.generateRecommendations(
        qualityMetrics,
        sectionSelection,
        projectInputs,
        engineeringConfig
      );

      const processingTime = Date.now() - startTime;
      console.log(`✅ SOW generation completed in ${processingTime}ms`);
      console.log(`📊 Quality: ${qualityMetrics.wordCount} words, ${qualityMetrics.pageEstimate} pages estimated`);

      return {
        templateType: sectionSelection.templateType,
        templateDescription: sectionSelection.templateDescription,
        generatedDocument: document,
        processingTime,
        qualityMetrics,
        warnings: [
          ...sectionSelection.warnings,
          ...document.metadata.warnings
        ],
        recommendedNextSteps: recommendations,
        engineeringConfig
      };

    } catch (error) {
      console.error(`❌ SOW generation failed:`, error);
      throw new Error(`Failed to generate SOW: ${error.message}`);
    }
  }

  /**
   * Gets engineering configuration values from database with fallbacks
   */
  private async getEngineeringConfiguration(projectInputs: ProjectInputs): Promise<{
    importanceFactor: number;
    internalPressureCoeff: number;
    directivityFactor: number;
    templateSource: 'database' | 'fallback';
  }> {
    try {
      // Determine building classification for importance factor
      const buildingClassification = this.determineBuildingClassification(projectInputs);
      const enclosureType = this.determineEnclosureType(projectInputs);

      // Get values from database
      const importanceFactor = await getImportanceFactor(buildingClassification);
      const internalPressureCoeff = await getInternalPressureCoeff(enclosureType);
      const directivityFactor = await getDirectivityFactor();

      return {
        importanceFactor,
        internalPressureCoeff,
        directivityFactor,
        templateSource: 'database'
      };
    } catch (error) {
      console.warn(`⚠️ Failed to load engineering config from database: ${error.message}`);
      console.log(`🔄 Using fallback engineering values`);
      
      // Fallback to hardcoded values
      return {
        importanceFactor: 1.0,
        internalPressureCoeff: 0.18,
        directivityFactor: 0.85,
        templateSource: 'fallback'
      };
    }
  }

  /**
   * Selects template using database template rules
   */
  private async selectTemplateFromDatabase(projectInputs: ProjectInputs): Promise<{
    template?: string;
    source: 'database' | 'fallback';
  }> {
    try {
      // Build template condition from project inputs
      const condition: TemplateCondition = {
        roofType: projectInputs.project_type === 'tearoff' ? 'tearoff' : 'recover',
        deckType: this.mapDeckType(projectInputs.deck_type),
        membraneType: this.mapMembraneType(projectInputs.membrane_type),
        attachmentType: this.mapAttachmentType(projectInputs.attachment_method),
        hasInsulation: this.hasInsulation(projectInputs),
        hasLightweightConcrete: this.hasLightweightConcrete(projectInputs),
        hasCoverBoard: this.hasCoverBoard(projectInputs),
        existingSystem: this.mapExistingSystem(projectInputs),
        membraneStyle: this.mapMembraneStyle(projectInputs.membrane_type),
        insulationType: this.mapInsulationType(projectInputs.insulation_type)
      };

      const result = await findMatchingTemplate(condition);
      
      if (result.success && result.data) {
        console.log(`✅ Database template match: ${result.data}`);
        return { template: result.data, source: 'database' };
      } else {
        console.log(`⚠️ No database template match: ${result.error}`);
        return { source: 'fallback' };
      }
    } catch (error) {
      console.warn(`⚠️ Database template selection failed: ${error.message}`);
      return { source: 'fallback' };
    }
  }

  /**
   * Maps project inputs to standardized database values
   */
  private mapDeckType(deckType?: string): string {
    if (!deckType) return 'steel';
    const lowerCase = deckType.toLowerCase();
    if (lowerCase.includes('gypsum')) return 'gypsum';
    if (lowerCase.includes('steel')) return 'steel';
    if (lowerCase.includes('ssr') || lowerCase.includes('standing seam')) return 'SSR';
    return 'steel'; // Default
  }

  private mapMembraneType(membraneType?: string): string {
    if (!membraneType) return 'TPO';
    return membraneType.toUpperCase().includes('TPO') ? 'TPO' : 'TPO';
  }

  private mapAttachmentType(attachmentMethod?: string): string {
    if (!attachmentMethod) return 'mechanically_attached';
    const lowerCase = attachmentMethod.toLowerCase();
    if (lowerCase.includes('adhered') || lowerCase.includes('fully')) return 'adhered';
    return 'mechanically_attached';
  }

  private hasInsulation(projectInputs: ProjectInputs): boolean {
    return !!(projectInputs.insulation_type && projectInputs.insulation_type !== 'none');
  }

  private hasLightweightConcrete(projectInputs: ProjectInputs): boolean {
    return !!(projectInputs.existing_components?.includes('lightweight concrete') || 
           projectInputs.deck_type?.toLowerCase().includes('lwc'));
  }

  private hasCoverBoard(projectInputs: ProjectInputs): boolean {
    return !!(projectInputs.existing_components?.includes('cover board') ||
           projectInputs.new_components?.includes('cover board'));
  }

  private mapExistingSystem(projectInputs: ProjectInputs): string | undefined {
    const existing = projectInputs.existing_components?.join(' ').toLowerCase();
    if (existing?.includes('bur') || existing?.includes('built up')) return 'BUR';
    return undefined;
  }

  private mapMembraneStyle(membraneType?: string): string | undefined {
    if (!membraneType) return undefined;
    const lowerCase = membraneType.toLowerCase();
    if (lowerCase.includes('fleece')) return 'fleeceback';
    if (lowerCase.includes('rhino')) return 'rhino';
    return undefined;
  }

  private mapInsulationType(insulationType?: string): string | undefined {
    if (!insulationType) return undefined;
    const lowerCase = insulationType.toLowerCase();
    if (lowerCase.includes('eps') && lowerCase.includes('flute')) return 'EPS_flute_fill';
    return undefined;
  }

  /**
   * Determines building classification for importance factor
   */
  private determineBuildingClassification(projectInputs: ProjectInputs): 'standard' | 'essential' | 'emergency' {
    // Use project metadata or building type to determine classification
    const buildingType = projectInputs.building_type?.toLowerCase() || '';
    
    if (buildingType.includes('hospital') || buildingType.includes('fire') || buildingType.includes('police')) {
      return 'emergency';
    }
    if (buildingType.includes('school') || buildingType.includes('assembly')) {
      return 'essential';
    }
    return 'standard';
  }

  /**
   * Determines enclosure type for internal pressure coefficient
   */
  private determineEnclosureType(projectInputs: ProjectInputs): 'enclosed' | 'partially_enclosed' | 'open' {
    // Use building characteristics to determine enclosure type
    const openings = projectInputs.penetrations || 0;
    const skylights = projectInputs.skylights || 0;
    
    if (openings + skylights > 20) return 'open';
    if (openings + skylights > 10) return 'partially_enclosed';
    return 'enclosed';
  }

  /**
   * Selects sections for database-matched template
   */
  private async selectSectionsForDbTemplate(templateId: string, projectInputs: ProjectInputs): Promise<any> {
    // For now, use existing section selector but add template ID to metadata
    const sectionSelection = this.sectionSelector.selectSections(projectInputs);
    sectionSelection.templateType = templateId;
    sectionSelection.templateDescription = `Database-matched template: ${templateId}`;
    sectionSelection.metadata.templateSource = 'database';
    return sectionSelection;
  }

  /**
   * Enhances sections with template-specific requirements and database config
   */
  private async enhanceSectionsForTemplate(
    sections: SelectedSection[],
    templateType: string,
    inputs: ProjectInputs,
    engineeringConfig: any
  ): Promise<SelectedSection[]> {
    const template = this.mapping.templateSections[templateType];
    if (!template) {
      console.warn(`⚠️ Template ${templateType} not found in enhanced mapping`);
      return sections;
    }

    console.log(`🔧 Enhancing sections for ${template.name} with database config`);

    // Get additional engineering configs from database
    let attachmentZones, membraneSpecs;
    try {
      const configs = await Promise.all([
        getConfig('attachment_zones'),
        getConfig('membrane_specifications')
      ]);
      
      attachmentZones = configs[0].success ? configs[0].data : null;
      membraneSpecs = configs[1].success ? configs[1].data : null;
    } catch (error) {
      console.warn(`⚠️ Failed to load additional configs: ${error.message}`);
    }

    return sections.map(section => {
      const enhanced = { ...section };

      // Add template-specific variables with database config
      enhanced.variables = {
        ...enhanced.variables,
        templateType,
        templateDescription: template.description,
        templatePages: template.pages,
        attachmentMethod: template.attachment_method,
        deckType: template.deck_type,
        projectType: template.project_type,
        // Database-driven engineering values
        importanceFactor: engineeringConfig.importanceFactor,
        internalPressureCoeff: engineeringConfig.internalPressureCoeff,
        directivityFactor: engineeringConfig.directivityFactor,
        configSource: engineeringConfig.templateSource
      };

      // Add database-driven attachment zones if available
      if (attachmentZones) {
        enhanced.variables.attachmentZones = attachmentZones;
        enhanced.variables.fieldFactor = attachmentZones.field?.factor || 1.0;
        enhanced.variables.perimeterFactor = attachmentZones.perimeter?.factor || 1.4;
        enhanced.variables.cornerFactor = attachmentZones.corner?.factor || 2.0;
      }

      // Add database-driven membrane specifications if available
      if (membraneSpecs && inputs.membrane_type) {
        const membraneType = this.mapMembraneType(inputs.membrane_type);
        const specs = membraneSpecs[membraneType];
        if (specs) {
          enhanced.variables.membraneSpecs = specs;
          enhanced.variables.membraneThickness = specs.standard_thickness;
          enhanced.variables.lapWidth = specs.lap_width;
          enhanced.variables.weldWidth = specs.weld_width;
          enhanced.variables.seamRequirements = specs.seam_requirements;
        }
      }

      // Enhance submittal sections with template-specific requirements
      if (section.id.includes('submittal')) {
        enhanced.variables.submittalCategories = this.mapping.contentRules.submittal_categories;
        enhanced.variables.primaryComponents = this.getPrimaryComponentsForTemplate(template, inputs);
        enhanced.variables.accessoryComponents = this.mapping.contentRules.accessory_components;
        enhanced.variables.msdsComponents = this.getMsdsComponentsForTemplate(template, inputs);
      }

      // Add template-specific content rules
      if (section.id === 'project_scope') {
        enhanced.variables.scopeRules = this.mapping.contentRules.project_scope[inputs.project_type];
      }

      if (section.id === 'new_roof_system') {
        enhanced.variables.insulationSpecs = this.mapping.contentRules.insulation_specifications[inputs.insulation_type];
      }

      return enhanced;
    });
  }

  /**
   * Gets primary components based on template attachment method
   */
  private getPrimaryComponentsForTemplate(template: any, inputs: ProjectInputs): string[] {
    const attachmentMethod = template.attachment_method || inputs.attachment_method || 'mechanical';
    
    if (attachmentMethod === 'fully_adhered') {
      return this.mapping.contentRules.primary_components.fully_adhered;
    } else if (attachmentMethod === 'SSR') {
      return this.mapping.contentRules.primary_components.ssr;
    } else {
      return this.mapping.contentRules.primary_components.mechanical_attachment;
    }
  }

  /**
   * Gets MSDS components based on template attachment method
   */
  private getMsdsComponentsForTemplate(template: any, inputs: ProjectInputs): string[] {
    const attachmentMethod = template.attachment_method || inputs.attachment_method || 'mechanical';
    
    if (attachmentMethod === 'fully_adhered') {
      return this.mapping.contentRules.msds_components.fully_adhered;
    } else {
      return this.mapping.contentRules.msds_components.mechanical_attachment;
    }
  }

  /**
   * Calculates comprehensive quality metrics for the generated SOW
   */
  private calculateQualityMetrics(
    document: any,
    sectionSelection: any,
    inputs: ProjectInputs
  ): {
    wordCount: number;
    pageEstimate: number;
    completeness: number;
    complexityScore: string;
    submittalCoverage: number;
  } {
    const wordCount = document.metadata.wordCount;
    const pageEstimate = document.metadata.totalPages;
    const completeness = document.metadata.completeness;
    const complexityScore = document.metadata.complexity;

    // Calculate submittal coverage
    const requiredSubmittalSections = ['project_critical_submittals', 'pre_construction_submittals', 'closeout_submittals'];
    const includedSubmittalSections = document.sections.filter((s: any) => 
      requiredSubmittalSections.includes(s.sectionId)
    ).length;
    const submittalCoverage = includedSubmittalSections / requiredSubmittalSections.length;

    return {
      wordCount,
      pageEstimate,
      completeness,
      complexityScore,
      submittalCoverage
    };
  }

  /**
   * Generates intelligent recommendations based on quality metrics and database config
   */
  private generateRecommendations(
    qualityMetrics: any,
    sectionSelection: any,
    inputs: ProjectInputs,
    engineeringConfig: any
  ): string[] {
    const recommendations: string[] = [];

    // Configuration source recommendations
    if (engineeringConfig.templateSource === 'fallback') {
      recommendations.push('⚠️ Engineering configuration loaded from fallback values - database connection may be needed');
    } else {
      recommendations.push('✅ Engineering configuration successfully loaded from database');
    }

    // Page count recommendations
    if (qualityMetrics.pageEstimate < 36) {
      recommendations.push('Consider adding more detailed sections to reach target 36+ pages');
      recommendations.push('Expand submittal requirements with manufacturer-specific details');
    }

    // Completeness recommendations
    if (qualityMetrics.completeness < 0.9) {
      recommendations.push('Some sections have missing dependencies - review input completeness');
    }

    // Submittal coverage recommendations
    if (qualityMetrics.submittalCoverage < 1.0) {
      recommendations.push('Critical submittal sections are missing - ensure all 4 categories are included');
    }

    // Template-specific recommendations with database context
    if (sectionSelection.templateType === 'T5-Recover-TPO(Rhino)-iso-EPS flute fill-SSR' && !inputs.membrane_type?.includes('Rhino')) {
      recommendations.push('T5 template selected but TPO Rhino membrane not specified - verify compatibility');
    }

    if (sectionSelection.templateType === 'T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum' && inputs.attachment_method !== 'fully_adhered') {
      recommendations.push('T8 template requires fully adhered system - update attachment method');
    }

    // Engineering factor recommendations
    if (engineeringConfig.importanceFactor > 1.0) {
      recommendations.push(`Building classified as ${engineeringConfig.importanceFactor > 1.4 ? 'emergency' : 'essential'} - enhanced requirements applied`);
    }

    if (engineeringConfig.internalPressureCoeff > 0.18) {
      recommendations.push('Building has significant openings - higher internal pressure coefficients applied');
    }

    // HVHZ recommendations
    if (inputs.state === 'FL' && !inputs.hvhz) {
      recommendations.push('Florida project detected - verify HVHZ requirements for this location');
    }

    // Complexity recommendations
    if (qualityMetrics.complexityScore === 'Complex') {
      recommendations.push('High complexity project - consider additional engineering review');
      recommendations.push('Enhanced quality control and inspection requirements recommended');
    }

    return recommendations;
  }

  /**
   * Validates template compatibility with project inputs using database rules
   */
  async validateTemplateCompatibility(templateType: string, inputs: ProjectInputs): Promise<{
    compatible: boolean;
    issues: string[];
    suggestions: string[];
    databaseValidation: boolean;
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let databaseValidation = false;

    try {
      // First try database-driven validation
      const condition: TemplateCondition = {
        roofType: inputs.project_type === 'tearoff' ? 'tearoff' : 'recover',
        deckType: this.mapDeckType(inputs.deck_type),
        membraneType: this.mapMembraneType(inputs.membrane_type),
        attachmentType: this.mapAttachmentType(inputs.attachment_method),
        hasInsulation: this.hasInsulation(inputs)
      };

      const result = await findMatchingTemplate(condition);
      
      if (result.success && result.data === templateType) {
        databaseValidation = true;
        console.log(`✅ Database validation passed for template ${templateType}`);
      } else if (result.success && result.data !== templateType) {
        issues.push(`Database suggests ${result.data} instead of ${templateType} for these conditions`);
        suggestions.push(`Consider using database-recommended template: ${result.data}`);
      }
    } catch (error) {
      console.warn(`⚠️ Database validation failed: ${error.message}`);
    }

    // Fallback to mapping-based validation
    const template = this.mapping.templateSections[templateType];
    if (!template) {
      return {
        compatible: false,
        issues: [`Template ${templateType} not found`],
        suggestions: ['Use automatic template selection based on project inputs'],
        databaseValidation
      };
    }

    // Check project type compatibility
    if (template.project_type !== inputs.project_type) {
      issues.push(`Template ${templateType} is for ${template.project_type} but project is ${inputs.project_type}`);
    }

    // Check deck type compatibility
    if (template.deck_type && template.deck_type !== inputs.deck_type) {
      issues.push(`Template ${templateType} requires ${template.deck_type} deck but project has ${inputs.deck_type}`);
    }

    // Check attachment method compatibility
    if (template.attachment_method && template.attachment_method !== inputs.attachment_method) {
      issues.push(`Template ${templateType} requires ${template.attachment_method} attachment but project specifies ${inputs.attachment_method}`);
    }

    return {
      compatible: issues.length === 0,
      issues,
      suggestions,
      databaseValidation
    };
  }

  /**
   * Gets all available templates with their descriptions
   */
  async getAvailableTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    projectType: string;
    deckType: string;
    attachmentMethod: string;
    source: 'database' | 'mapping';
  }>> {
    const templates: Array<any> = [];

    // First try to get templates from database
    try {
      const result = await getConfig('template_rules');
      if (result.success && result.data) {
        result.data.forEach((rule: any) => {
          templates.push({
            id: rule.template,
            name: rule.template,
            description: rule.description,
            projectType: rule.condition.roofType || 'Any',
            deckType: rule.condition.deckType || 'Any',
            attachmentMethod: rule.condition.attachmentType || 'Any',
            source: 'database'
          });
        });
        console.log(`✅ Loaded ${templates.length} templates from database`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load templates from database: ${error.message}`);
    }

    // Fallback to mapping-based templates
    const mappingTemplates = Object.entries(this.mapping.templateSections).map(([id, template]: [string, any]) => ({
      id,
      name: template.name,
      description: template.description,
      projectType: template.project_type,
      deckType: template.deck_type || 'Any',
      attachmentMethod: template.attachment_method || 'Mechanical',
      source: 'mapping' as const
    }));

    // Merge and deduplicate
    const allTemplates = [...templates];
    mappingTemplates.forEach(mappingTemplate => {
      if (!templates.find(t => t.id === mappingTemplate.id)) {
        allTemplates.push(mappingTemplate);
      }
    });

    return allTemplates;
  }

  /**
   * Estimates document metrics before generation with database config
   */
  async estimateDocumentMetrics(inputs: ProjectInputs): Promise<{
    estimatedTemplate: string;
    estimatedPages: number;
    estimatedWordCount: number;
    estimatedComplexity: string;
    estimatedSections: number;
    engineeringConfigAvailable: boolean;
  }> {
    // Try database template selection first
    const selectedTemplate = await this.selectTemplateFromDatabase(inputs);
    
    const sectionSelection = selectedTemplate.template 
      ? await this.selectSectionsForDbTemplate(selectedTemplate.template, inputs)
      : this.sectionSelector.selectSections(inputs);
    
    // Base estimates for 36+ page target
    let estimatedWordCount = 12000; // Base word count
    let complexityMultiplier = 1.0;

    // Adjust based on project characteristics
    if (inputs.square_footage > 100000) estimatedWordCount += 2000;
    if (inputs.hvhz) estimatedWordCount += 1500;
    if (inputs.hvac_units > 5) estimatedWordCount += 1000;
    if (inputs.penetrations > 15) estimatedWordCount += 800;
    if (inputs.skylights > 3) estimatedWordCount += 600;

    // Template-specific adjustments
    if (['T4', 'T5', 'T8'].includes(sectionSelection.templateType)) {
      complexityMultiplier = 1.2;
      estimatedWordCount *= complexityMultiplier;
    }

    // Check if engineering config is available
    let engineeringConfigAvailable = false;
    try {
      await getDirectivityFactor();
      engineeringConfigAvailable = true;
    } catch (error) {
      // Config not available
    }

    const estimatedPages = Math.max(36, Math.ceil(estimatedWordCount / 300));

    return {
      estimatedTemplate: sectionSelection.templateType,
      estimatedPages,
      estimatedWordCount: Math.round(estimatedWordCount),
      estimatedComplexity: sectionSelection.metadata?.estimatedComplexity || 'Standard',
      estimatedSections: sectionSelection.selectedSections.length,
      engineeringConfigAvailable
    };
  }
}

// Factory function
export function createEnhancedTemplateCoordinator(): EnhancedTemplateCoordinator {
  return new EnhancedTemplateCoordinator();
}
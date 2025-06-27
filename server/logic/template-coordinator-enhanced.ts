// Enhanced Template Coordinator for Complete 36+ Page SOW Generation
// Intelligently coordinates all 8 templates (T1-T8) with comprehensive submittal sections
import { EnhancedSOWContentGenerator } from './content-generator-enhanced.js';
import { SectionSelector, ProjectInputs, SelectedSection } from './section-selector-enhanced.js';
import { WindPressureCalculator } from './wind-pressure.js';
import enhancedMapping from '../data/sow-section-mapping-enhanced.json';

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
   */
  async generateCompleteSOW(
    projectInputs: ProjectInputs,
    manufacturerData?: any
  ): Promise<TemplateCoordinationResult> {
    const startTime = Date.now();
    console.log(`🎯 Starting comprehensive SOW generation...`);
    console.log(`📊 Project: ${projectInputs.project_type} - ${projectInputs.square_footage.toLocaleString()} sqft`);

    try {
      // 1. Determine optimal template and select sections
      const sectionSelection = this.sectionSelector.selectSections(projectInputs);
      console.log(`📋 Selected template: ${sectionSelection.templateType}`);
      console.log(`📄 Target: ${sectionSelection.targetPages} pages`);
      console.log(`✅ Selected ${sectionSelection.selectedSections.length} sections`);

      // 2. Calculate wind pressures if location provided
      let windData;
      if (projectInputs.address && projectInputs.building_height) {
        try {
          windData = await this.windCalculator.calculateWindPressures(
            projectInputs.address,
            projectInputs.building_height,
            projectInputs.county || '',
            projectInputs.state || ''
          );
          console.log(`🌪️ Wind pressures calculated for ${projectInputs.address}`);
        } catch (error) {
          console.warn(`⚠️ Wind calculation failed: ${error.message}`);
        }
      }

      // 3. Enhance sections with template-specific requirements
      const enhancedSections = this.enhanceSectionsForTemplate(
        sectionSelection.selectedSections,
        sectionSelection.templateType,
        projectInputs
      );

      // 4. Generate comprehensive content
      const document = this.contentGenerator.generateDocument(
        projectInputs,
        enhancedSections,
        windData,
        manufacturerData
      );

      // 5. Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(
        document,
        sectionSelection,
        projectInputs
      );

      // 6. Generate recommendations
      const recommendations = this.generateRecommendations(
        qualityMetrics,
        sectionSelection,
        projectInputs
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
        recommendedNextSteps: recommendations
      };

    } catch (error) {
      console.error(`❌ SOW generation failed:`, error);
      throw new Error(`Failed to generate SOW: ${error.message}`);
    }
  }

  /**
   * Enhances sections with template-specific requirements
   */
  private enhanceSectionsForTemplate(
    sections: SelectedSection[],
    templateType: string,
    inputs: ProjectInputs
  ): SelectedSection[] {
    const template = this.mapping.templateSections[templateType];
    if (!template) {
      console.warn(`⚠️ Template ${templateType} not found in enhanced mapping`);
      return sections;
    }

    console.log(`🔧 Enhancing sections for ${template.name}`);

    return sections.map(section => {
      const enhanced = { ...section };

      // Add template-specific variables
      enhanced.variables = {
        ...enhanced.variables,
        templateType,
        templateDescription: template.description,
        templatePages: template.pages,
        attachmentMethod: template.attachment_method,
        deckType: template.deck_type,
        projectType: template.project_type
      };

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
        enhanced.variables.membraneSpecs = this.mapping.contentRules.membrane_specifications[inputs.membrane_type];
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
    const includedSubmittalSections = document.sections.filter(s => 
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
   * Generates intelligent recommendations based on quality metrics
   */
  private generateRecommendations(
    qualityMetrics: any,
    sectionSelection: any,
    inputs: ProjectInputs
  ): string[] {
    const recommendations: string[] = [];

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

    // Template-specific recommendations
    if (sectionSelection.templateType === 'T5' && !inputs.membrane_type?.includes('Rhino')) {
      recommendations.push('T5 template selected but TPO Rhino membrane not specified - verify compatibility');
    }

    if (sectionSelection.templateType === 'T8' && inputs.attachment_method !== 'fully_adhered') {
      recommendations.push('T8 template requires fully adhered system - update attachment method');
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
   * Validates template compatibility with project inputs
   */
  validateTemplateCompatibility(templateType: string, inputs: ProjectInputs): {
    compatible: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const template = this.mapping.templateSections[templateType];
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!template) {
      return {
        compatible: false,
        issues: [`Template ${templateType} not found`],
        suggestions: ['Use automatic template selection based on project inputs']
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

    // Template-specific validations
    switch (templateType) {
      case 'T5':
        if (!inputs.membrane_type?.includes('Rhino')) {
          issues.push('T5 template requires TPO Rhino membrane');
          suggestions.push('Specify TPO Rhino membrane or use different template');
        }
        break;

      case 'T8':
        if (inputs.deck_type !== 'Gypsum') {
          issues.push('T8 template is optimized for gypsum decks');
          suggestions.push('Consider T6 or T7 for steel deck applications');
        }
        break;

      case 'T3':
      case 'T4':
        if (!inputs.membrane_type?.includes('Fleece')) {
          issues.push(`${templateType} template requires TPO Fleece-back membrane`);
          suggestions.push('Specify TPO Fleece-back membrane or use T1/T2 template');
        }
        break;
    }

    return {
      compatible: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Gets all available templates with their descriptions
   */
  getAvailableTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    projectType: string;
    deckType: string;
    attachmentMethod: string;
  }> {
    return Object.entries(this.mapping.templateSections).map(([id, template]: [string, any]) => ({
      id,
      name: template.name,
      description: template.description,
      projectType: template.project_type,
      deckType: template.deck_type || 'Any',
      attachmentMethod: template.attachment_method || 'Mechanical'
    }));
  }

  /**
   * Estimates document metrics before generation
   */
  estimateDocumentMetrics(inputs: ProjectInputs): {
    estimatedTemplate: string;
    estimatedPages: number;
    estimatedWordCount: number;
    estimatedComplexity: string;
    estimatedSections: number;
  } {
    const sectionSelection = this.sectionSelector.selectSections(inputs);
    
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

    const estimatedPages = Math.max(36, Math.ceil(estimatedWordCount / 300));

    return {
      estimatedTemplate: sectionSelection.templateType,
      estimatedPages,
      estimatedWordCount: Math.round(estimatedWordCount),
      estimatedComplexity: sectionSelection.metadata.estimatedComplexity,
      estimatedSections: sectionSelection.selectedSections.length
    };
  }
}

// Factory function
export function createEnhancedTemplateCoordinator(): EnhancedTemplateCoordinator {
  return new EnhancedTemplateCoordinator();
}
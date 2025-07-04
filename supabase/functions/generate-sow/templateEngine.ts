/**
 * Intelligent Template Engine for SOW Generation
 * Selects and configures appropriate templates (T1-T8) based on project specifications
 */

export interface ProjectSpecifications {
  projectType: 'tearoff' | 'overlay' | 'new-construction' | 'repair';
  roofArea: number; // square feet
  windSpeed: number; // mph
  membraneType: 'TPO' | 'EPDM' | 'PVC' | 'Modified-Bitumen' | 'Built-Up' | 'Metal';
  insulationType: 'Polyiso' | 'EPS' | 'XPS' | 'Mineral-Wool' | 'None';
  deckType: 'Steel' | 'Concrete' | 'Wood' | 'Gypsum' | 'Lightweight-Concrete';
  hvhzRequired: boolean;
  complexityFactors: {
    multipleRoofLevels: boolean;
    skylights: boolean;
    rooftopEquipment: boolean;
    parapets: boolean;
    customFlashing: boolean;
  };
  fasteningRequirements: {
    upliftRating: number; // psf
    specialFasteners: boolean;
    fieldPattern: string;
    perimeterPattern: string;
  };
  qualityRequirements: {
    warrantyYears: number;
    energyCompliance: boolean;
    fireRating?: string;
    accessibilityCompliance: boolean;
  };
}

export interface TemplateConfiguration {
  templateId: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8';
  templateName: string;
  description: string;
  applicableScenarios: string[];
  requiredSections: string[];
  optionalSections: string[];
  complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  estimatedPages: number;
  selectionScore: number; // 0-100, higher is better match
  selectionReasons: string[];
}

export interface TemplateSelectionResult {
  primaryTemplate: TemplateConfiguration;
  fallbackTemplates: TemplateConfiguration[];
  customizations: {
    additionalSections: string[];
    removedSections: string[];
    modifiedSections: Array<{
      section: string;
      modification: string;
      reason: string;
    }>;
  };
  contentOverrides: {
    hvhzCompliance: boolean;
    windLoadCalculations: boolean;
    specialInspections: boolean;
    manufacturerWarranties: boolean;
  };
  generationNotes: string[];
  metadata: {
    selectionDate: string;
    version: string;
    confidenceScore: number; // 0-100
  };
}

export class TemplateEngine {
  private readonly version = "1.0.0";
  
  // Template definitions with their characteristics and use cases
  private readonly templateDefinitions = {
    T1: {
      templateId: 'T1' as const,
      templateName: 'Basic Single-Membrane System',
      description: 'Simple, single-layer membrane installation for standard applications',
      applicableScenarios: [
        'Simple overlay projects',
        'Small roof areas (<5,000 sf)',
        'Standard wind loads (<120 mph)',
        'Minimal complexity factors'
      ],
      requiredSections: [
        'Project Overview',
        'Material Specifications',
        'Basic Installation',
        'Quality Control',
        'Cleanup'
      ],
      optionalSections: [
        'Weather Protection',
        'Basic Testing'
      ],
      complexityLevel: 'basic' as const,
      estimatedPages: 8
    },
    T2: {
      templateId: 'T2' as const,
      templateName: 'Standard Tear-Off & Replace',
      description: 'Complete tear-off and replacement with standard insulation',
      applicableScenarios: [
        'Full tear-off projects',
        'Medium roof areas (5,000-20,000 sf)',
        'Standard to moderate wind loads (120-150 mph)',
        'Standard complexity'
      ],
      requiredSections: [
        'Project Overview',
        'Demolition & Disposal',
        'Deck Preparation',
        'Insulation Installation',
        'Membrane Installation',
        'Flashing & Details',
        'Quality Control',
        'Testing & Inspection'
      ],
      optionalSections: [
        'Temporary Weatherization',
        'Phased Construction'
      ],
      complexityLevel: 'intermediate' as const,
      estimatedPages: 15
    },
    T3: {
      templateId: 'T3' as const,
      templateName: 'High-Wind Zone System',
      description: 'Enhanced fastening and HVHZ-compliant installation',
      applicableScenarios: [
        'Wind speeds >150 mph',
        'HVHZ areas (Miami-Dade, Broward, etc.)',
        'Enhanced uplift requirements',
        'Special inspection requirements'
      ],
      requiredSections: [
        'Project Overview',
        'Wind Load Analysis',
        'HVHZ Compliance',
        'Enhanced Fastening',
        'Special Inspections',
        'Testing Requirements',
        'Material Certifications',
        'Installation Procedures',
        'Quality Assurance'
      ],
      optionalSections: [
        'Manufacturer Testing',
        'Third-Party Verification'
      ],
      complexityLevel: 'advanced' as const,
      estimatedPages: 22
    },
    T4: {
      templateId: 'T4' as const,
      templateName: 'Multi-Level Complex System',
      description: 'Complex roof configurations with multiple levels and details',
      applicableScenarios: [
        'Multiple roof levels',
        'Complex geometries',
        'Extensive parapet work',
        'Custom flashing requirements'
      ],
      requiredSections: [
        'Project Overview',
        'Roof Level Coordination',
        'Complex Details',
        'Custom Flashing',
        'Parapet Systems',
        'Drainage Systems',
        'Expansion Joints',
        'Quality Control'
      ],
      optionalSections: [
        'Architectural Coordination',
        'Structural Interface'
      ],
      complexityLevel: 'advanced' as const,
      estimatedPages: 18
    },
    T5: {
      templateId: 'T5' as const,
      templateName: 'Equipment-Heavy Installation',
      description: 'Rooftop equipment integration with membrane systems',
      applicableScenarios: [
        'Heavy rooftop equipment',
        'HVAC unit installations',
        'Equipment curbing',
        'Vibration isolation'
      ],
      requiredSections: [
        'Project Overview',
        'Equipment Coordination',
        'Structural Analysis',
        'Curbing & Supports',
        'Equipment Flashing',
        'Vibration Isolation',
        'Access Requirements',
        'Maintenance Access'
      ],
      optionalSections: [
        'Equipment Warranties',
        'Commissioning'
      ],
      complexityLevel: 'advanced' as const,
      estimatedPages: 20
    },
    T6: {
      templateId: 'T6' as const,
      templateName: 'Energy & Sustainability Focus',
      description: 'High-performance systems with energy compliance',
      applicableScenarios: [
        'Energy code compliance required',
        'Green building certifications',
        'High R-value requirements',
        'Cool roof systems'
      ],
      requiredSections: [
        'Project Overview',
        'Energy Analysis',
        'High-Performance Insulation',
        'Cool Roof Systems',
        'Air Barrier Systems',
        'Thermal Bridging',
        'Energy Compliance',
        'Performance Testing'
      ],
      optionalSections: [
        'LEED Documentation',
        'Energy Modeling'
      ],
      complexityLevel: 'advanced' as const,
      estimatedPages: 24
    },
    T7: {
      templateId: 'T7' as const,
      templateName: 'Large-Scale Commercial',
      description: 'Extensive commercial projects with phased construction',
      applicableScenarios: [
        'Large roof areas (>50,000 sf)',
        'Phased construction required',
        'Multiple building zones',
        'Extended project duration'
      ],
      requiredSections: [
        'Project Overview',
        'Phasing Plan',
        'Logistics Coordination',
        'Area Isolation',
        'Progress Scheduling',
        'Quality Control',
        'Testing Schedules',
        'Documentation Requirements'
      ],
      optionalSections: [
        'Tenant Coordination',
        'Security Requirements'
      ],
      complexityLevel: 'expert' as const,
      estimatedPages: 30
    },
    T8: {
      templateId: 'T8' as const,
      templateName: 'Comprehensive Master Specification',
      description: 'All-inclusive specification for complex, high-stakes projects',
      applicableScenarios: [
        'Critical facilities',
        'Complex requirements',
        'Multiple specialties',
        'Highest quality standards'
      ],
      requiredSections: [
        'Project Overview',
        'Engineering Analysis',
        'Material Specifications',
        'Installation Procedures',
        'Quality Systems',
        'Testing Protocols',
        'Compliance Documentation',
        'Warranty Management',
        'Maintenance Requirements'
      ],
      optionalSections: [
        'Risk Analysis',
        'Contingency Planning'
      ],
      complexityLevel: 'expert' as const,
      estimatedPages: 40
    }
  };

  /**
   * Select the most appropriate template based on project specifications
   */
  async selectTemplate(specs: ProjectSpecifications): Promise<TemplateSelectionResult> {
    const notes: string[] = [];
    
    // Score all templates
    const scoredTemplates = this.scoreAllTemplates(specs, notes);
    
    // Select primary template (highest score)
    const primaryTemplate = scoredTemplates[0];
    
    // Select fallback templates (next 2 highest scores)
    const fallbackTemplates = scoredTemplates.slice(1, 3);
    
    // Determine customizations
    const customizations = this.determineCustomizations(primaryTemplate, specs, notes);
    
    // Set content overrides
    const contentOverrides = this.determineContentOverrides(specs, notes);
    
    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(primaryTemplate, specs, notes);
    
    return {
      primaryTemplate,
      fallbackTemplates,
      customizations,
      contentOverrides,
      generationNotes: notes,
      metadata: {
        selectionDate: new Date().toISOString(),
        version: this.version,
        confidenceScore
      }
    };
  }

  private scoreAllTemplates(specs: ProjectSpecifications, notes: string[]): TemplateConfiguration[] {
    const templates = Object.values(this.templateDefinitions);
    
    const scoredTemplates = templates.map(template => {
      const score = this.calculateTemplateScore(template, specs);
      const reasons = this.getSelectionReasons(template, specs, score);
      
      return {
        ...template,
        selectionScore: score,
        selectionReasons: reasons
      };
    });
    
    // Sort by score (highest first)
    scoredTemplates.sort((a, b) => b.selectionScore - a.selectionScore);
    
    notes.push(`Evaluated ${templates.length} templates, selected ${scoredTemplates[0].templateId} with score ${scoredTemplates[0].selectionScore}`);
    
    return scoredTemplates;
  }

  private calculateTemplateScore(template: any, specs: ProjectSpecifications): number {
    let score = 0;
    
    // Wind speed scoring
    if (specs.windSpeed <= 120) {
      score += template.templateId === 'T1' || template.templateId === 'T2' ? 25 : 0;
    } else if (specs.windSpeed <= 150) {
      score += template.templateId === 'T2' || template.templateId === 'T4' ? 25 : 0;
    } else {
      score += template.templateId === 'T3' ? 30 : 0;
    }
    
    // HVHZ requirements
    if (specs.hvhzRequired) {
      score += template.templateId === 'T3' ? 25 : -10;
    }
    
    // Project type scoring
    if (specs.projectType === 'tearoff') {
      score += template.templateId === 'T2' || template.templateId === 'T7' ? 20 : 0;
    } else if (specs.projectType === 'overlay') {
      score += template.templateId === 'T1' || template.templateId === 'T2' ? 15 : 0;
    }
    
    // Roof area scoring
    if (specs.roofArea < 5000) {
      score += template.templateId === 'T1' ? 20 : 0;
    } else if (specs.roofArea < 20000) {
      score += template.templateId === 'T2' || template.templateId === 'T4' ? 15 : 0;
    } else if (specs.roofArea > 50000) {
      score += template.templateId === 'T7' || template.templateId === 'T8' ? 20 : 0;
    }
    
    // Complexity scoring
    const complexityCount = Object.values(specs.complexityFactors).filter(Boolean).length;
    if (complexityCount === 0) {
      score += template.templateId === 'T1' ? 15 : 0;
    } else if (complexityCount <= 2) {
      score += template.templateId === 'T2' || template.templateId === 'T4' ? 10 : 0;
    } else {
      score += template.templateId === 'T4' || template.templateId === 'T8' ? 15 : 0;
    }
    
    // Equipment complexity
    if (specs.complexityFactors.rooftopEquipment) {
      score += template.templateId === 'T5' ? 25 : 0;
    }
    
    // Energy requirements
    if (specs.qualityRequirements.energyCompliance) {
      score += template.templateId === 'T6' ? 20 : 0;
    }
    
    // Warranty requirements (high warranty = more comprehensive spec)
    if (specs.qualityRequirements.warrantyYears >= 20) {
      score += template.templateId === 'T8' || template.templateId === 'T6' ? 10 : 0;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getSelectionReasons(template: any, specs: ProjectSpecifications, score: number): string[] {
    const reasons: string[] = [];
    
    if (score >= 80) {
      reasons.push('Excellent match for project requirements');
    } else if (score >= 60) {
      reasons.push('Good match with minor adaptations needed');
    } else if (score >= 40) {
      reasons.push('Moderate match requiring customization');
    } else {
      reasons.push('Limited match - consider alternative templates');
    }
    
    // Specific reasons based on template
    switch (template.templateId) {
      case 'T1':
        if (specs.roofArea < 5000) reasons.push('Appropriate for small roof area');
        if (specs.windSpeed <= 120) reasons.push('Suitable for standard wind loads');
        break;
      case 'T2':
        if (specs.projectType === 'tearoff') reasons.push('Designed for tear-off projects');
        if (specs.roofArea >= 5000 && specs.roofArea <= 20000) reasons.push('Optimal for medium-sized roofs');
        break;
      case 'T3':
        if (specs.hvhzRequired) reasons.push('Required for HVHZ compliance');
        if (specs.windSpeed > 150) reasons.push('Necessary for high wind speeds');
        break;
      case 'T4':
        if (specs.complexityFactors.multipleRoofLevels) reasons.push('Handles multi-level complexity');
        if (specs.complexityFactors.parapets) reasons.push('Includes parapet specifications');
        break;
      case 'T5':
        if (specs.complexityFactors.rooftopEquipment) reasons.push('Specialized for rooftop equipment');
        break;
      case 'T6':
        if (specs.qualityRequirements.energyCompliance) reasons.push('Addresses energy compliance');
        break;
      case 'T7':
        if (specs.roofArea > 50000) reasons.push('Designed for large-scale projects');
        break;
      case 'T8':
        if (specs.qualityRequirements.warrantyYears >= 20) reasons.push('Comprehensive for long warranties');
        break;
    }
    
    return reasons;
  }

  private determineCustomizations(template: TemplateConfiguration, specs: ProjectSpecifications, notes: string[]): {
    additionalSections: string[];
    removedSections: string[];
    modifiedSections: Array<{ section: string; modification: string; reason: string; }>;
  } {
    
    const additionalSections: string[] = [];
    const removedSections: string[] = [];
    const modifiedSections: Array<{ section: string; modification: string; reason: string; }> = [];
    
    // Add HVHZ sections if required but not in template
    if (specs.hvhzRequired && !template.requiredSections.includes('HVHZ Compliance')) {
      additionalSections.push('HVHZ Compliance');
      additionalSections.push('Special Inspections');
      notes.push('Added HVHZ compliance sections for Florida requirements');
    }
    
    // Add energy sections if required
    if (specs.qualityRequirements.energyCompliance && !template.requiredSections.includes('Energy Analysis')) {
      additionalSections.push('Energy Compliance');
      notes.push('Added energy compliance section');
    }
    
    // Remove sections for simple projects
    if (template.templateId !== 'T1' && specs.roofArea < 2000 && Object.values(specs.complexityFactors).filter(Boolean).length === 0) {
      removedSections.push('Complex Details');
      notes.push('Removed complex details for simple project');
    }
    
    // Modify sections based on membrane type
    if (specs.membraneType === 'Modified-Bitumen' || specs.membraneType === 'Built-Up') {
      modifiedSections.push({
        section: 'Material Specifications',
        modification: 'Enhanced for multi-ply systems',
        reason: 'Multi-ply membrane requires detailed layering specifications'
      });
    }
    
    return { additionalSections, removedSections, modifiedSections };
  }

  private determineContentOverrides(specs: ProjectSpecifications, notes: string[]): {
    hvhzCompliance: boolean;
    windLoadCalculations: boolean;
    specialInspections: boolean;
    manufacturerWarranties: boolean;
  } {
    
    const overrides = {
      hvhzCompliance: specs.hvhzRequired,
      windLoadCalculations: specs.windSpeed > 120 || specs.fasteningRequirements.upliftRating > 45,
      specialInspections: specs.hvhzRequired || specs.windSpeed > 150,
      manufacturerWarranties: specs.qualityRequirements.warrantyYears >= 15
    };
    
    if (overrides.hvhzCompliance) {
      notes.push('HVHZ compliance content will be included');
    }
    
    if (overrides.windLoadCalculations) {
      notes.push('Detailed wind load calculations will be included');
    }
    
    if (overrides.specialInspections) {
      notes.push('Special inspection requirements will be specified');
    }
    
    if (overrides.manufacturerWarranties) {
      notes.push('Enhanced warranty documentation will be included');
    }
    
    return overrides;
  }

  private calculateConfidenceScore(template: TemplateConfiguration, specs: ProjectSpecifications, notes: string[]): number {
    let confidence = template.selectionScore;
    
    // Boost confidence for exact matches
    if (specs.hvhzRequired && template.templateId === 'T3') confidence += 15;
    if (specs.complexityFactors.rooftopEquipment && template.templateId === 'T5') confidence += 15;
    if (specs.qualityRequirements.energyCompliance && template.templateId === 'T6') confidence += 15;
    
    // Reduce confidence for mismatches
    if (specs.roofArea > 50000 && template.complexityLevel === 'basic') confidence -= 20;
    if (specs.windSpeed > 150 && template.templateId === 'T1') confidence -= 25;
    
    const finalConfidence = Math.max(0, Math.min(100, confidence));
    notes.push(`Template selection confidence: ${finalConfidence}%`);
    
    return finalConfidence;
  }
}

/**
 * Convenience function for direct template selection
 */
export async function selectTemplate(specs: ProjectSpecifications): Promise<TemplateSelectionResult> {
  const engine = new TemplateEngine();
  return engine.selectTemplate(specs);
}
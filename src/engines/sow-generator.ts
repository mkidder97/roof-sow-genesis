/**
 * Enhanced SOW Generator with Self-Healing Logic
 * 
 * Orchestrates all engines and provides intelligent fallback mechanisms
 * for generating complete Scope of Work documents with dynamic section mapping.
 */

import { SectionEngine, SectionAnalysis, SelfHealingAction } from './section-engine.js';
import { ProjectData, TakeoffData } from '../types.js';

export interface SOWGenerationInput {
  project: ProjectData;
  takeoff: TakeoffData;
  options?: {
    includeDebugInfo?: boolean;
    enableSelfHealing?: boolean;
    confidenceThreshold?: number;
  };
}

export interface SOWResult {
  success: boolean;
  sections: string[];
  sectionAnalysis: SectionAnalysis;
  engineResults: {
    template?: any;
    wind?: any;
    fastening?: any;
    takeoff?: any;
  };
  selfHealingSummary: {
    actionsApplied: SelfHealingAction[];
    confidenceScore: number;
    warnings: string[];
    recommendations: string[];
  };
  metadata: {
    generatedAt: string;
    processingTime: number;
    totalSections: number;
    includedSections: number;
    excludedSections: number;
    dataCompleteness: number;
  };
  debugInfo?: {
    inputValidation: any;
    engineExecutionTimes: Record<string, number>;
    fallbacksApplied: string[];
    dataHealing: SelfHealingAction[];
  };
}

export class SOWGenerator {
  private sectionEngine: SectionEngine;
  private selfHealingEnabled: boolean = true;
  private confidenceThreshold: number = 0.7;

  constructor() {
    this.sectionEngine = new SectionEngine();
  }

  /**
   * Main generation method with self-healing capabilities
   */
  async generateSOW(input: SOWGenerationInput): Promise<SOWResult> {
    const startTime = Date.now();
    const debugInfo: SOWResult['debugInfo'] = {
      inputValidation: {},
      engineExecutionTimes: {},
      fallbacksApplied: [],
      dataHealing: []
    };

    try {
      // Apply self-healing to input data
      const healedInput = this.selfHealingEnabled ? this.healInputData(input) : input;
      if (input.options?.includeDebugInfo) {
        debugInfo.dataHealing = this.getDataHealingActions(input, healedInput);
      }

      // Validate input data
      const validation = this.validateInput(healedInput);
      if (input.options?.includeDebugInfo) {
        debugInfo.inputValidation = validation;
      }

      // Initialize engine results
      const engineResults: SOWResult['engineResults'] = {};

      // Execute Template Engine
      const templateStart = Date.now();
      const templateResult = await this.executeTemplateEngine(healedInput);
      engineResults.template = templateResult;
      debugInfo.engineExecutionTimes.template = Date.now() - templateStart;

      // Execute Wind Engine
      const windStart = Date.now();
      const windResult = await this.executeWindEngine(healedInput, templateResult);
      engineResults.wind = windResult;
      debugInfo.engineExecutionTimes.wind = Date.now() - windStart;

      // Execute Fastening Engine
      const fasteningStart = Date.now();
      const fasteningResult = await this.executeFasteningEngine(healedInput, templateResult, windResult);
      engineResults.fastening = fasteningResult;
      debugInfo.engineExecutionTimes.fastening = Date.now() - fasteningStart;

      // Execute Takeoff Engine
      const takeoffStart = Date.now();
      const takeoffResult = await this.executeTakeoffEngine(healedInput);
      engineResults.takeoff = takeoffResult;
      debugInfo.engineExecutionTimes.takeoff = Date.now() - takeoffStart;

      // Execute Section Engine
      const sectionStart = Date.now();
      const combinedData = {
        project: healedInput.project,
        takeoff: healedInput.takeoff,
        template: templateResult,
        wind: windResult,
        fastening: fasteningResult
      };

      const sectionAnalysis = await this.sectionEngine.analyzeSections(combinedData);
      debugInfo.engineExecutionTimes.section = Date.now() - sectionStart;

      // Generate final sections array
      const sections = this.generateFinalSections(sectionAnalysis);

      // Apply additional self-healing logic
      const selfHealingSummary = this.generateSelfHealingSummary(
        sectionAnalysis.selfHealingActions,
        validation,
        engineResults
      );

      // Calculate metadata
      const processingTime = Date.now() - startTime;
      const metadata = this.calculateMetadata(sectionAnalysis, healedInput, processingTime);

      return {
        success: true,
        sections,
        sectionAnalysis,
        engineResults,
        selfHealingSummary,
        metadata,
        debugInfo: input.options?.includeDebugInfo ? debugInfo : undefined
      };

    } catch (error) {
      // Self-healing error recovery
      const fallbackResult = this.generateFallbackSOW(input, error);
      fallbackResult.metadata.processingTime = Date.now() - startTime;
      
      if (input.options?.includeDebugInfo) {
        fallbackResult.debugInfo = {
          ...debugInfo,
          fallbacksApplied: ['complete_fallback_due_to_error'],
          dataHealing: []
        };
      }

      return fallbackResult;
    }
  }

  /**
   * Self-healing input data validation and correction
   */
  private healInputData(input: SOWGenerationInput): SOWGenerationInput {
    const healed: SOWGenerationInput = JSON.parse(JSON.stringify(input)); // Deep clone

    // Heal missing project data
    if (!healed.project.address && healed.takeoff.building_name) {
      healed.project.address = healed.takeoff.building_name;
    }

    if (!healed.project.state && healed.project.address) {
      // Extract state from address
      const stateMatch = healed.project.address.match(/\b([A-Z]{2})\b/);
      if (stateMatch) {
        healed.project.state = stateMatch[1];
      }
    }

    if (!healed.project.building_height && healed.takeoff.building_height) {
      healed.project.building_height = healed.takeoff.building_height;
    }

    if (!healed.project.square_footage && healed.takeoff.square_footage) {
      healed.project.square_footage = healed.takeoff.square_footage;
    }

    // Heal takeoff data
    if (!healed.takeoff.roof_slope) {
      healed.takeoff.roof_slope = 0.25; // Default 1/4" per foot
    }

    if (!healed.takeoff.total_drains) {
      const primary = healed.takeoff.drains_primary || 0;
      const secondary = healed.takeoff.drains_secondary || 0;
      healed.takeoff.total_drains = primary + secondary;
    }

    // Heal missing boolean flags
    if (healed.takeoff.fall_protection_required === undefined) {
      healed.takeoff.fall_protection_required = (healed.project.building_height || 0) > 30;
    }

    if (healed.takeoff.parapet_wall_continuous === undefined && healed.takeoff.parapet_height) {
      healed.takeoff.parapet_wall_continuous = healed.takeoff.parapet_height > 0;
    }

    // Default project type if missing
    if (!healed.project.project_type) {
      healed.project.project_type = 'replacement'; // Conservative default
    }

    return healed;
  }

  /**
   * Validate input data completeness and quality
   */
  private validateInput(input: SOWGenerationInput): any {
    const validation = {
      completeness: 0,
      criticalMissing: [] as string[],
      warnings: [] as string[],
      scores: {
        project: 0,
        takeoff: 0,
        overall: 0
      }
    };

    // Critical project fields
    const criticalProjectFields = ['address', 'project_type', 'building_height', 'square_footage'];
    const projectFieldsPresent = criticalProjectFields.filter(field => 
      input.project[field as keyof ProjectData] !== undefined && 
      input.project[field as keyof ProjectData] !== null &&
      input.project[field as keyof ProjectData] !== ''
    );

    validation.scores.project = projectFieldsPresent.length / criticalProjectFields.length;

    // Critical takeoff fields
    const criticalTakeoffFields = ['deck_type', 'roof_slope', 'drainage_type', 'parapet_height'];
    const takeoffFieldsPresent = criticalTakeoffFields.filter(field => 
      input.takeoff[field as keyof TakeoffData] !== undefined &&
      input.takeoff[field as keyof TakeoffData] !== null &&
      input.takeoff[field as keyof TakeoffData] !== ''
    );

    validation.scores.takeoff = takeoffFieldsPresent.length / criticalTakeoffFields.length;

    // Overall completeness
    validation.scores.overall = (validation.scores.project + validation.scores.takeoff) / 2;
    validation.completeness = Math.round(validation.scores.overall * 100);

    // Identify critical missing data
    const missingProject = criticalProjectFields.filter(field => 
      !projectFieldsPresent.includes(field)
    );
    const missingTakeoff = criticalTakeoffFields.filter(field => 
      !takeoffFieldsPresent.includes(field)
    );

    validation.criticalMissing = [
      ...missingProject.map(f => `project.${f}`),
      ...missingTakeoff.map(f => `takeoff.${f}`)
    ];

    // Generate warnings
    if (validation.completeness < 70) {
      validation.warnings.push('Input data completeness below 70%. Consider gathering additional project information.');
    }

    if (!input.project.jurisdiction && !input.project.state) {
      validation.warnings.push('No jurisdiction or state information provided. Wind load calculations may use conservative defaults.');
    }

    if (!input.takeoff.hvac_units && !input.takeoff.roof_mounted_equipment) {
      validation.warnings.push('No rooftop equipment information provided. Equipment coordination sections may be excluded.');
    }

    return validation;
  }

  /**
   * Execute template engine with fallback logic
   */
  private async executeTemplateEngine(input: SOWGenerationInput): Promise<any> {
    try {
      // This would call the actual template engine
      // For now, return a mock result with intelligent fallback
      const templateResult = {
        selectedTemplate: this.selectDefaultTemplate(input),
        confidence: 0.8,
        membrane: {
          type: 'TPO',
          thickness: '60-mil',
          attachment: input.project.project_type === 'recover' ? 'mechanically-attached' : 'fully-adhered'
        },
        insulation: 'polyisocyanurate insulation board',
        reasoning: 'Selected based on project type and typical specifications'
      };

      return templateResult;
    } catch (error) {
      // Fallback template selection
      return {
        selectedTemplate: 'T6-Tearoff-TPO(MA)-insul-steel',
        confidence: 0.5,
        membrane: { type: 'TPO', thickness: '60-mil', attachment: 'mechanically-attached' },
        insulation: 'polyisocyanurate insulation board',
        reasoning: 'Fallback template selected due to engine error',
        error: error.message
      };
    }
  }

  /**
   * Execute wind engine with fallback logic
   */
  private async executeWindEngine(input: SOWGenerationInput, templateResult: any): Promise<any> {
    try {
      // Mock wind engine result with intelligent defaults
      const buildingHeight = input.project.building_height || 30;
      const state = input.project.state || 'TX';
      
      return {
        basicWindSpeed: this.getDefaultWindSpeed(state),
        asceVersion: '7-16',
        pressures: {
          field: buildingHeight < 30 ? 15 : 20,
          perimeter: buildingHeight < 30 ? 25 : 35,
          corner: buildingHeight < 30 ? 35 : 50
        },
        zones: {
          field: '20\' x 20\'',
          perimeter: '10\' wide',
          corner: '10\' x 10\''
        },
        confidence: 0.85,
        reasoning: 'Wind loads calculated based on building height and location'
      };
    } catch (error) {
      return {
        basicWindSpeed: 115, // Conservative default
        asceVersion: '7-16',
        pressures: { field: 20, perimeter: 35, corner: 50 },
        zones: { field: '20\' x 20\'', perimeter: '10\' wide', corner: '10\' x 10\'' },
        confidence: 0.5,
        reasoning: 'Conservative wind loads applied due to calculation error',
        error: error.message
      };
    }
  }

  /**
   * Execute fastening engine with fallback logic
   */
  private async executeFasteningEngine(input: SOWGenerationInput, templateResult: any, windResult: any): Promise<any> {
    try {
      const deckType = input.takeoff.deck_type || input.project.deck_type || 'steel';
      
      return {
        selectedSystem: `${templateResult.membrane.type} ${templateResult.membrane.attachment}`,
        fastenerSpacing: {
          field: '12" o.c.',
          perimeter: '6" o.c.',
          corner: '4" o.c.'
        },
        fastenerType: deckType === 'steel' ? '#12 x 3" screws' : '#14 x 4" screws',
        plateSize: '3" diameter',
        hvhzCompliant: input.project.state === 'FL',
        confidence: 0.9,
        reasoning: `Fastening pattern selected for ${deckType} deck with ${templateResult.membrane.type} membrane`
      };
    } catch (error) {
      return {
        selectedSystem: 'TPO mechanically-attached',
        fastenerSpacing: { field: '12" o.c.', perimeter: '6" o.c.', corner: '4" o.c.' },
        fastenerType: '#12 x 3" screws',
        plateSize: '3" diameter',
        hvhzCompliant: false,
        confidence: 0.5,
        reasoning: 'Conservative fastening pattern applied due to calculation error',
        error: error.message
      };
    }
  }

  /**
   * Execute takeoff engine with fallback logic
   */
  private async executeTakeoffEngine(input: SOWGenerationInput): Promise<any> {
    try {
      const riskFactors = [];
      let riskScore = 0;

      if ((input.project.building_height || 0) > 50) {
        riskFactors.push('High building height');
        riskScore += 0.3;
      }

      if (input.takeoff.sensitive_tenants) {
        riskFactors.push('Sensitive tenant operations');
        riskScore += 0.2;
      }

      if ((input.takeoff.hvac_units || 0) > 5) {
        riskFactors.push('Multiple HVAC units');
        riskScore += 0.1;
      }

      return {
        riskScore: Math.min(riskScore, 1.0),
        riskFactors,
        recommendations: this.generateRiskRecommendations(riskFactors),
        confidence: 0.8,
        dataQuality: this.assessTakeoffDataQuality(input.takeoff)
      };
    } catch (error) {
      return {
        riskScore: 0.5,
        riskFactors: ['Assessment error - using conservative approach'],
        recommendations: ['Apply enhanced safety protocols', 'Increase coordination efforts'],
        confidence: 0.3,
        dataQuality: 0.5,
        error: error.message
      };
    }
  }

  /**
   * Generate final sections array from analysis
   */
  private generateFinalSections(analysis: SectionAnalysis): string[] {
    return analysis.includedSections
      .sort((a, b) => {
        // Sort by priority and then by ID
        const priorityOrder = { required: 0, recommended: 1, optional: 2 };
        const aPriority = priorityOrder[a.priority] || 3;
        const bPriority = priorityOrder[b.priority] || 3;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return a.id.localeCompare(b.id);
      })
      .map(section => section.content);
  }

  /**
   * Generate comprehensive self-healing summary
   */
  private generateSelfHealingSummary(
    sectionActions: SelfHealingAction[],
    validation: any,
    engineResults: any
  ): SOWResult['selfHealingSummary'] {
    const allActions = [...sectionActions];
    const warnings: string[] = [...validation.warnings];
    const recommendations: string[] = [];

    // Add engine-specific healing actions
    Object.entries(engineResults).forEach(([engine, result]) => {
      if (result?.error) {
        allActions.push({
          type: 'fallback_selection',
          field: engine,
          description: `${engine} engine failed, applied fallback logic`,
          confidence: result.confidence || 0.5
        });
      }
    });

    // Generate recommendations based on healing actions
    const missingFieldActions = allActions.filter(a => a.type === 'missing_field');
    if (missingFieldActions.length > 0) {
      recommendations.push(`Consider gathering additional data for: ${missingFieldActions.map(a => a.field).join(', ')}`);
    }

    const lowConfidenceActions = allActions.filter(a => a.confidence < 0.7);
    if (lowConfidenceActions.length > 0) {
      recommendations.push('Review and verify auto-corrected values for accuracy');
    }

    // Calculate overall confidence
    const totalConfidence = allActions.length > 0 
      ? allActions.reduce((sum, action) => sum + action.confidence, 0) / allActions.length
      : 0.9;

    return {
      actionsApplied: allActions,
      confidenceScore: Math.round(totalConfidence * 100) / 100,
      warnings,
      recommendations
    };
  }

  /**
   * Calculate comprehensive metadata
   */
  private calculateMetadata(
    analysis: SectionAnalysis,
    input: SOWGenerationInput,
    processingTime: number
  ): SOWResult['metadata'] {
    const requiredFields = ['address', 'project_type', 'building_height', 'square_footage', 'deck_type'];
    const presentFields = requiredFields.filter(field => 
      input.project[field as keyof ProjectData] || input.takeoff[field as keyof TakeoffData]
    );
    
    const dataCompleteness = Math.round((presentFields.length / requiredFields.length) * 100);

    return {
      generatedAt: new Date().toISOString(),
      processingTime,
      totalSections: analysis.totalSections,
      includedSections: analysis.includedSections.length,
      excludedSections: analysis.excludedSections.length,
      dataCompleteness
    };
  }

  /**
   * Generate fallback SOW when main process fails
   */
  private generateFallbackSOW(input: SOWGenerationInput, error: any): SOWResult {
    const fallbackSections = [
      `**EMERGENCY FALLBACK SCOPE OF WORK**

Due to processing limitations, this scope of work has been generated using fallback templates and conservative assumptions. Please review and verify all specifications before proceeding.

**Project:** ${input.project.address || 'Project Address TBD'}
**Type:** ${input.project.project_type || 'Roof System Installation'}
**Area:** ${input.project.square_footage || 'TBD'} square feet

**Base Scope:**
- Install new roof system per manufacturer specifications
- Provide all necessary flashings and accessories
- Coordinate with existing building conditions
- Obtain all required permits and approvals

**CRITICAL NOTICE:** This fallback scope requires engineering review and specification verification before implementation.`
    ];

    const fallbackAnalysis: SectionAnalysis = {
      includedSections: [{
        id: 'fallback_scope',
        title: 'Fallback Scope of Work',
        included: true,
        rationale: 'Fallback content due to processing error',
        content: fallbackSections[0],
        priority: 'required',
        confidence: 0.3,
        fallbackApplied: true,
        warnings: ['This is fallback content - requires manual review']
      }],
      excludedSections: [],
      reasoningMap: { 'fallback_scope': 'Generated due to system error' },
      totalSections: 1,
      confidence: 0.3,
      selfHealingActions: [{
        type: 'fallback_selection',
        field: 'complete_generation',
        description: `System error occurred: ${error.message}`,
        confidence: 0.3
      }]
    };

    return {
      success: false,
      sections: fallbackSections,
      sectionAnalysis: fallbackAnalysis,
      engineResults: {},
      selfHealingSummary: {
        actionsApplied: fallbackAnalysis.selfHealingActions,
        confidenceScore: 0.3,
        warnings: ['Complete fallback applied due to system error'],
        recommendations: ['Manual review and specification required', 'Gather additional project data', 'Re-run generation with complete inputs']
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: 0,
        totalSections: 1,
        includedSections: 1,
        excludedSections: 0,
        dataCompleteness: 30
      }
    };
  }

  // Helper methods

  private selectDefaultTemplate(input: SOWGenerationInput): string {
    const projectType = input.project.project_type;
    const deckType = input.takeoff.deck_type || input.project.deck_type;
    
    if (projectType === 'tearoff' || projectType === 'replacement') {
      if (deckType === 'steel') {
        return 'T6-Tearoff-TPO(MA)-insul-steel';
      } else if (deckType === 'gypsum') {
        return 'T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum';
      }
      return 'T6-Tearoff-TPO(MA)-insul-steel'; // Default
    } else if (projectType === 'recover') {
      return 'T2-Recover-TPO(MA)-cvr-bd-BUR-lwc-steel';
    }
    
    return 'T6-Tearoff-TPO(MA)-insul-steel'; // Conservative default
  }

  private getDefaultWindSpeed(state: string): number {
    const windSpeeds: Record<string, number> = {
      'FL': 150, 'TX': 120, 'LA': 130, 'SC': 120, 'NC': 110,
      'GA': 110, 'AL': 120, 'MS': 120, 'CA': 85, 'NY': 95
    };
    return windSpeeds[state] || 115; // Conservative default
  }

  private generateRiskRecommendations(riskFactors: string[]): string[] {
    const recommendations: string[] = [];
    
    if (riskFactors.includes('High building height')) {
      recommendations.push('Implement enhanced fall protection protocols');
      recommendations.push('Consider crane or hoist requirements for material handling');
    }
    
    if (riskFactors.includes('Sensitive tenant operations')) {
      recommendations.push('Coordinate work schedule with tenant operations');
      recommendations.push('Implement noise and dust control measures');
    }
    
    if (riskFactors.includes('Multiple HVAC units')) {
      recommendations.push('Develop detailed equipment protection plan');
      recommendations.push('Schedule HVAC coordination meetings');
    }
    
    return recommendations;
  }

  private assessTakeoffDataQuality(takeoff: TakeoffData): number {
    const requiredFields = ['deck_type', 'roof_slope', 'building_height', 'square_footage'];
    const optionalFields = ['hvac_units', 'drains_primary', 'parapet_height', 'expansion_joints'];
    
    const requiredPresent = requiredFields.filter(field => 
      takeoff[field as keyof TakeoffData] !== undefined
    ).length;
    
    const optionalPresent = optionalFields.filter(field => 
      takeoff[field as keyof TakeoffData] !== undefined
    ).length;
    
    const requiredScore = requiredPresent / requiredFields.length;
    const optionalScore = optionalPresent / optionalFields.length;
    
    return Math.round(((requiredScore * 0.8) + (optionalScore * 0.2)) * 100) / 100;
  }

  private getDataHealingActions(original: SOWGenerationInput, healed: SOWGenerationInput): SelfHealingAction[] {
    const actions: SelfHealingAction[] = [];
    
    // Compare and track changes
    if (original.project.address !== healed.project.address) {
      actions.push({
        type: 'auto_correction',
        field: 'project.address',
        originalValue: original.project.address,
        correctedValue: healed.project.address,
        description: 'Copied address from takeoff building name',
        confidence: 0.8
      });
    }
    
    if (original.project.building_height !== healed.project.building_height) {
      actions.push({
        type: 'auto_correction',
        field: 'project.building_height',
        originalValue: original.project.building_height,
        correctedValue: healed.project.building_height,
        description: 'Synchronized building height from takeoff data',
        confidence: 0.9
      });
    }
    
    return actions;
  }
}


// Section Engine for SOW Template Selection
// Location: src/engines/section-engine.ts

import { FieldInspection } from '@/types/fieldInspection';

export interface SectionEngineResult {
  selectedTemplate: string;
  requiredSections: string[];
  excludedSections: string[];
  reasoning: string;
  confidence: number;
}

export class SectionEngine {
  /**
   * Analyze inspection data and determine optimal SOW template and sections
   */
  static analyzeSections(inspectionData: FieldInspection): SectionEngineResult {
    const analysis = {
      selectedTemplate: 'T1-recover',
      requiredSections: ['project-info', 'roof-system', 'materials', 'labor'],
      excludedSections: [],
      reasoning: 'Standard recover project based on inspection data',
      confidence: 0.8
    };

    // Template selection logic
    if (inspectionData.project_type === 'tearoff') {
      analysis.selectedTemplate = 'T2-tearoff';
      analysis.requiredSections.push('tearoff-procedures', 'disposal');
      analysis.reasoning = 'Tearoff project requires additional tearoff and disposal sections';
    }

    // HVHZ zone detection
    if (this.isHVHZLocation(inspectionData.project_address || '')) {
      analysis.selectedTemplate = 'T4-hvhz';
      analysis.requiredSections.push('hvhz-requirements', 'wind-uplift');
      analysis.reasoning = 'HVHZ location requires enhanced wind resistance specifications';
    }

    // Steep slope detection
    if (inspectionData.roof_slope === 'steep' || this.calculateSlope(inspectionData) > 2) {
      analysis.selectedTemplate = 'T6-steep';
      analysis.requiredSections.push('slope-considerations', 'safety-measures');
      analysis.reasoning = 'Steep slope requires specialized installation procedures';
    }

    // Additional sections based on equipment
    if (inspectionData.hvac_units && Array.isArray(inspectionData.hvac_units) && inspectionData.hvac_units.length > 0) {
      analysis.requiredSections.push('hvac-integration');
    }

    if (inspectionData.skylights && inspectionData.skylights > 0) {
      analysis.requiredSections.push('skylight-integration');
    }

    return analysis;
  }

  private static isHVHZLocation(address: string): boolean {
    // Simple HVHZ detection - in production this would use proper jurisdiction lookup
    const hvhzIndicators = ['miami', 'dade', 'broward', 'florida', 'fl'];
    return hvhzIndicators.some(indicator => 
      address.toLowerCase().includes(indicator)
    );
  }

  private static calculateSlope(data: FieldInspection): number {
    // Simple slope calculation - in production this would be more sophisticated
    if (data.roof_slope === 'steep') return 4;
    if (data.roof_slope === 'moderate') return 2;
    return 0.25; // flat roof default
  }

  /**
   * Get section recommendations based on project characteristics
   */
  static getSectionRecommendations(data: FieldInspection): string[] {
    const recommendations = [];

    if (data.existing_membrane_condition && data.existing_membrane_condition < 3) {
      recommendations.push('Consider additional substrate preparation due to poor membrane condition');
    }

    if (data.building_height && data.building_height > 75) {
      recommendations.push('High building requires enhanced safety measures and wind considerations');
    }

    if (data.square_footage && data.square_footage > 50000) {
      recommendations.push('Large project may benefit from phased installation approach');
    }

    return recommendations;
  }
}

export default SectionEngine;

import { FieldInspection, DrainageSOWConfig, generateDrainageSOWConfig, selectSOWTemplate } from '@/types/fieldInspection';

// SOW Template and Section Selection Engine
export class SOWIntegrationEngine {
  
  /**
   * Main function to generate SOW configuration from field inspection data
   */
  static generateSOWConfiguration(inspection: FieldInspection): SOWConfiguration {
    return {
      templateId: selectSOWTemplate(inspection),
      projectInfo: this.extractProjectInfo(inspection),
      roofAssembly: this.generateRoofAssembly(inspection),
      drainageConfig: generateDrainageSOWConfig(inspection),
      equipmentSpecs: this.generateEquipmentSpecs(inspection),
      penetrationSpecs: this.generatePenetrationSpecs(inspection),
      specialRequirements: this.generateSpecialRequirements(inspection)
    };
  }

  /**
   * Extract project information for SOW header
   */
  private static extractProjectInfo(inspection: FieldInspection): ProjectInfo {
    return {
      projectName: inspection.project_name,
      projectAddress: inspection.project_address,
      city: inspection.city,
      state: inspection.state,
      zipCode: inspection.zip_code,
      squareFootage: inspection.square_footage || 0,
      buildingHeight: inspection.building_height || 0,
      numberOfSections: 1, // Default, could be enhanced later
      projectType: inspection.project_type || 'tearoff'
    };
  }

  /**
   * Generate roof assembly specifications for SOW templates
   */
  private static generateRoofAssembly(inspection: FieldInspection): RoofAssemblyConfig {
    return {
      deckType: inspection.deck_substrate || inspection.deck_type || 'steel',
      existingSystem: {
        membraneType: inspection.existing_membrane_type || 'TPO',
        ageYears: inspection.roof_age_years || 0,
        condition: inspection.existing_membrane_condition || 5
      },
      newSystem: {
        membraneType: 'TPO', // Default for new system
        membraneThickness: '60-mil',
        attachmentMethod: inspection.attachment_method || 'mechanically_attached',
        insulationType: inspection.insulation_type || 'Polyisocyanurate',
        insulationThickness: '4.5"', // Default R-25
        insulationAttachment: inspection.insulation_attachment || 'mechanically_attached'
      },
      windUpliftRequirements: {
        fieldZone: 'TBD', // To be calculated by engineer
        perimeterZone: 'TBD',
        cornerZone: 'TBD'
      }
    };
  }

  /**
   * Generate equipment specifications for SOW sections
   */
  private static generateEquipmentSpecs(inspection: FieldInspection): EquipmentSpecifications {
    return {
      skylights: {
        count: inspection.skylights || 0,
        requiresFlashing: (inspection.skylights || 0) > 0,
        details: inspection.equipment_skylights || []
      },
      hvacUnits: {
        count: (inspection.equipment_hvac_units || []).length,
        requiresCurbs: this.checkHVACCurbRequirements(inspection),
        details: inspection.equipment_hvac_units || []
      },
      accessPoints: {
        count: (inspection.equipment_access_points || []).length,
        roofHatches: inspection.roof_hatches || 0,
        details: inspection.equipment_access_points || []
      },
      walkwayPads: inspection.walkway_pads || 0,
      equipmentPlatforms: inspection.equipment_platforms || 0
    };
  }

  /**
   * Generate penetration specifications for SOW templates
   */
  private static generatePenetrationSpecs(inspection: FieldInspection): PenetrationSpecifications {
    return {
      gasLines: {
        present: inspection.penetrations_gas_lines || false,
        count: inspection.penetrations_gas_line_count || 0,
        requiresSpecialFlashing: inspection.penetrations_gas_lines || false
      },
      conduit: {
        attachedToUnderside: inspection.penetrations_conduit_attached || false,
        description: inspection.penetrations_conduit_description || '',
        requiresProtection: inspection.penetrations_conduit_attached || false
      },
      other: {
        description: inspection.penetrations_other || '',
        requiresCustomFlashing: (inspection.penetrations_other || '').length > 0
      }
    };
  }

  /**
   * Generate special requirements and modifications for SOW
   */
  private static generateSpecialRequirements(inspection: FieldInspection): SpecialRequirements {
    const requirements: string[] = [];
    
    // Add drainage-specific requirements
    if (inspection.drainage_primary_type === 'Deck Drains') {
      requirements.push(`Install ${inspection.drainage_deck_drains_count || 0} new deck drains at ${inspection.drainage_deck_drains_diameter || 4}" diameter`);
    }
    
    if (inspection.drainage_primary_type === 'Scuppers') {
      requirements.push(`Modify/install scuppers: ${inspection.drainage_scuppers_count || 0} units at ${inspection.drainage_scuppers_length || 12}"L x ${inspection.drainage_scuppers_width || 4}"W, ${inspection.drainage_scuppers_height || 2}" above roof`);
    }
    
    if (inspection.drainage_primary_type === 'Gutters') {
      requirements.push(`Install gutters: ${inspection.drainage_gutters_linear_feet || 0} linear feet at ${inspection.drainage_gutters_height || 6}"H x ${inspection.drainage_gutters_width || 8}"W x ${inspection.drainage_gutters_depth || 4}"D`);
    }
    
    // Add penetration requirements
    if (inspection.penetrations_gas_lines) {
      requirements.push(`Special gas line penetration flashing for ${inspection.penetrations_gas_line_count || 0} locations`);
    }
    
    if (inspection.penetrations_conduit_attached) {
      requirements.push('Conduit protection during tear-off and reinstallation');
    }
    
    // Add equipment requirements
    if (inspection.curbs_8_inch_or_above) {
      requirements.push(`Equipment curbs 8" or above: ${inspection.curbs_count || 0} locations`);
    }
    
    if (inspection.side_discharge_units) {
      requirements.push(`Side discharge unit considerations: ${inspection.side_discharge_count || 0} units`);
    }

    return {
      modifications: requirements,
      notes: inspection.special_requirements || '',
      interiorProtection: {
        required: inspection.interior_protection_needed || false,
        squareFootage: inspection.interior_protection_sqft || 0
      }
    };
  }

  /**
   * Helper function to determine HVAC curb requirements
   */
  private static checkHVACCurbRequirements(inspection: FieldInspection): boolean {
    const hvacUnits = inspection.equipment_hvac_units || [];
    return hvacUnits.some(unit => 
      unit.type.includes('RTU') || 
      unit.type.includes('Package Unit') ||
      unit.type.includes('Makeup Air')
    );
  }

  /**
   * Generate SOW section inclusions based on inspection data
   */
  static generateSectionInclusions(inspection: FieldInspection): SOWSectionInclusions {
    const config = this.generateSOWConfiguration(inspection);
    
    return {
      // Core sections (always included)
      tearoffAndDisposal: inspection.project_type === 'tearoff',
      newRoofSystem: true,
      flashing: true,
      
      // Conditional sections based on inspection data
      drainageModifications: this.requiresDrainageModifications(config.drainageConfig),
      scupperWork: config.drainageConfig.primary_type === 'Scuppers',
      gutterInstallation: config.drainageConfig.primary_type === 'Gutters',
      equipmentCurbs: config.equipmentSpecs.hvacUnits.requiresCurbs,
      skylightFlashing: config.equipmentSpecs.skylights.requiresFlashing,
      walkwayPads: config.equipmentSpecs.walkwayPads > 0,
      equipmentPlatforms: config.equipmentSpecs.equipmentPlatforms > 0,
      gasLinePenetrations: config.penetrationSpecs.gasLines.present,
      conduitProtection: config.penetrationSpecs.conduit.attachedToUnderside,
      interiorProtection: config.specialRequirements.interiorProtection.required,
      
      // Safety and access requirements
      safetyRequirements: this.generateSafetyRequirements(inspection),
      accessRequirements: config.equipmentSpecs.accessPoints.count > 0
    };
  }

  /**
   * Determine if drainage modifications are required
   */
  private static requiresDrainageModifications(drainageConfig: DrainageSOWConfig): boolean {
    return !!(
      drainageConfig.specifications.deck_drains ||
      drainageConfig.specifications.scuppers ||
      drainageConfig.specifications.gutters ||
      drainageConfig.additional_drainage
    );
  }

  /**
   * Generate safety requirements based on building characteristics
   */
  private static generateSafetyRequirements(inspection: FieldInspection): string[] {
    const requirements: string[] = [];
    
    // Height-based requirements
    if ((inspection.building_height || 0) > 30) {
      requirements.push('Fall protection systems required');
    }
    
    // Equipment-based requirements
    if ((inspection.equipment_hvac_units || []).length > 0) {
      requirements.push('Equipment access walkways');
    }
    
    // Penetration-based requirements
    if (inspection.penetrations_gas_lines) {
      requirements.push('Gas line safety protocols');
    }
    
    return requirements;
  }
}

// Type definitions for SOW configuration
export interface SOWConfiguration {
  templateId: string;
  projectInfo: ProjectInfo;
  roofAssembly: RoofAssemblyConfig;
  drainageConfig: DrainageSOWConfig;
  equipmentSpecs: EquipmentSpecifications;
  penetrationSpecs: PenetrationSpecifications;
  specialRequirements: SpecialRequirements;
}

export interface ProjectInfo {
  projectName: string;
  projectAddress: string;
  city?: string;
  state?: string;
  zipCode?: string;
  squareFootage: number;
  buildingHeight: number;
  numberOfSections: number;
  projectType: 'recover' | 'tearoff' | 'new';
}

export interface RoofAssemblyConfig {
  deckType: string;
  existingSystem: {
    membraneType: string;
    ageYears: number;
    condition: number;
  };
  newSystem: {
    membraneType: string;
    membraneThickness: string;
    attachmentMethod: string;
    insulationType: string;
    insulationThickness: string;
    insulationAttachment: string;
  };
  windUpliftRequirements: {
    fieldZone: string;
    perimeterZone: string;
    cornerZone: string;
  };
}

export interface EquipmentSpecifications {
  skylights: {
    count: number;
    requiresFlashing: boolean;
    details: any[];
  };
  hvacUnits: {
    count: number;
    requiresCurbs: boolean;
    details: any[];
  };
  accessPoints: {
    count: number;
    roofHatches: number;
    details: any[];
  };
  walkwayPads: number;
  equipmentPlatforms: number;
}

export interface PenetrationSpecifications {
  gasLines: {
    present: boolean;
    count: number;
    requiresSpecialFlashing: boolean;
  };
  conduit: {
    attachedToUnderside: boolean;
    description: string;
    requiresProtection: boolean;
  };
  other: {
    description: string;
    requiresCustomFlashing: boolean;
  };
}

export interface SpecialRequirements {
  modifications: string[];
  notes: string;
  interiorProtection: {
    required: boolean;
    squareFootage: number;
  };
}

export interface SOWSectionInclusions {
  // Core sections
  tearoffAndDisposal: boolean;
  newRoofSystem: boolean;
  flashing: boolean;
  
  // Conditional sections
  drainageModifications: boolean;
  scupperWork: boolean;
  gutterInstallation: boolean;
  equipmentCurbs: boolean;
  skylightFlashing: boolean;
  walkwayPads: boolean;
  equipmentPlatforms: boolean;
  gasLinePenetrations: boolean;
  conduitProtection: boolean;
  interiorProtection: boolean;
  
  // Safety and access
  safetyRequirements: string[];
  accessRequirements: boolean;
}
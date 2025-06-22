// Section Population Logic Based on Takeoff Data
export interface TakeoffItems {
  drainCount: number;
  penetrationCount: number;
  flashingLinearFeet: number;
  accessoryCount: number;
  hvacUnits?: number;
  skylights?: number;
  scuppers?: number;
  expansionJoints?: number;
  parapetHeight?: number;
  roofArea?: number;
}

export interface TakeoffDiagnostics {
  drainOverflowRequired: boolean;
  highPenetrationDensity: boolean;
  extendedFlashingRequired: boolean;
  specialAccessoryNotes: boolean;
  structuralConsiderations: boolean;
  additionalVentilation: boolean;
  enhancedWaterproofing: boolean;
}

export interface SectionOverrides {
  customNotes: string[];
  specialRequirements: string[];
  additionalSections: string[];
  warningFlags: string[];
}

export function analyzeTakeoffData(takeoffItems: TakeoffItems, projectData: {
  squareFootage: number;
  projectType: string;
  windPressure: number;
  hvhz: boolean;
}): { diagnostics: TakeoffDiagnostics; overrides: SectionOverrides } {
  
  console.log(`📊 Analyzing takeoff data: ${takeoffItems.drainCount} drains, ${takeoffItems.penetrationCount} penetrations`);
  
  const diagnostics = generateTakeoffDiagnostics(takeoffItems, projectData);
  const overrides = generateSectionOverrides(takeoffItems, projectData, diagnostics);
  
  console.log(`🔍 Diagnostics: ${Object.values(diagnostics).filter(Boolean).length} flags triggered`);
  console.log(`📝 Generated ${overrides.customNotes.length} custom notes`);
  
  return { diagnostics, overrides };
}

function generateTakeoffDiagnostics(takeoffItems: TakeoffItems, projectData: any): TakeoffDiagnostics {
  const { squareFootage } = projectData;
  const roofAreaSqFt = squareFootage || takeoffItems.roofArea || 10000;
  
  // Calculate density metrics
  const drainDensity = takeoffItems.drainCount / (roofAreaSqFt / 1000); // drains per 1000 sf
  const penetrationDensity = takeoffItems.penetrationCount / (roofAreaSqFt / 1000);
  const flashingDensity = takeoffItems.flashingLinearFeet / (roofAreaSqFt / 1000);
  
  console.log(`📏 Densities: Drains ${drainDensity.toFixed(1)}/1000sf, Penetrations ${penetrationDensity.toFixed(1)}/1000sf`);
  
  return {
    // Drainage analysis
    drainOverflowRequired: takeoffItems.drainCount > 4 || drainDensity < 1.0,
    
    // Penetration analysis  
    highPenetrationDensity: penetrationDensity > 8 || takeoffItems.penetrationCount > 20,
    
    // Flashing analysis
    extendedFlashingRequired: takeoffItems.flashingLinearFeet > 100 || flashingDensity > 50,
    
    // Accessory analysis
    specialAccessoryNotes: takeoffItems.accessoryCount > 10 || 
                          (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 3) ||
                          (takeoffItems.skylights && takeoffItems.skylights > 2),
    
    // Structural considerations
    structuralConsiderations: (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 2) ||
                            (takeoffItems.parapetHeight && takeoffItems.parapetHeight > 42) ||
                            projectData.windPressure > 50,
    
    // Ventilation requirements
    additionalVentilation: roofAreaSqFt > 50000 || 
                         (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 4),
    
    // Waterproofing considerations
    enhancedWaterproofing: takeoffItems.expansionJoints > 0 ||
                         penetrationDensity > 10 ||
                         (takeoffItems.parapetHeight && takeoffItems.parapetHeight > 24)
  };
}

function generateSectionOverrides(takeoffItems: TakeoffItems, projectData: any, diagnostics: TakeoffDiagnostics): SectionOverrides {
  const customNotes: string[] = [];
  const specialRequirements: string[] = [];
  const additionalSections: string[] = [];
  const warningFlags: string[] = [];
  
  // Drainage-related overrides
  if (diagnostics.drainOverflowRequired) {
    if (takeoffItems.drainCount > 4) {
      customNotes.push("Install overflow scuppers per IBC Section 1611 due to high drain count");
      specialRequirements.push("Overflow drainage system required");
      additionalSections.push("OVERFLOW DRAINAGE SYSTEM");
    }
    
    if (takeoffItems.drainCount / (projectData.squareFootage / 1000) < 1.0) {
      warningFlags.push("Drain density below recommended 1 per 1000 sf - verify drainage adequacy");
    }
  }
  
  // Extended flashing requirements
  if (diagnostics.extendedFlashingRequired) {
    customNotes.push("Extended perimeter flashing system required due to excessive linear footage");
    customNotes.push("All flashing terminations to be mechanically fastened and sealed");
    
    if (takeoffItems.flashingLinearFeet > 200) {
      specialRequirements.push("Staged flashing installation to prevent wind uplift during construction");
      additionalSections.push("STAGED INSTALLATION PROCEDURES");
    }
  }
  
  // High penetration density handling
  if (diagnostics.highPenetrationDensity) {
    customNotes.push("Enhanced detail requirements for high penetration density");
    customNotes.push("All penetrations to receive secondary seal and inspection");
    specialRequirements.push("Enhanced penetration waterproofing protocol");
    
    if (takeoffItems.penetrationCount > 30) {
      warningFlags.push("Excessive penetration count may require membrane reinforcement");
      additionalSections.push("PENETRATION REINFORCEMENT DETAILS");
    }
  }
  
  // HVAC unit considerations
  if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 0) {
    customNotes.push(`Install equipment support systems for ${takeoffItems.hvacUnits} HVAC unit(s)`);
    customNotes.push("Coordinate equipment installation with roof membrane installation");
    
    if (takeoffItems.hvacUnits > 3) {
      specialRequirements.push("Structural analysis required for multiple equipment installations");
      additionalSections.push("EQUIPMENT SUPPORT ANALYSIS");
      warningFlags.push("Multiple HVAC units require coordinated installation sequence");
    }
  }
  
  // Skylight considerations
  if (takeoffItems.skylights && takeoffItems.skylights > 0) {
    customNotes.push(`Install skylight curbing and flashing for ${takeoffItems.skylights} skylight(s)`);
    specialRequirements.push("Skylight manufacturer coordination required");
    
    if (takeoffItems.skylights > 2) {
      additionalSections.push("SKYLIGHT INSTALLATION SEQUENCE");
    }
  }
  
  // Expansion joint handling
  if (takeoffItems.expansionJoints && takeoffItems.expansionJoints > 0) {
    customNotes.push("Install expansion joint cover systems with movement capability");
    customNotes.push("Expansion joints to accommodate structural movement per design");
    specialRequirements.push("Expansion joint manufacturer submittal required");
    additionalSections.push("EXPANSION JOINT DETAILS");
  }
  
  // Parapet considerations
  if (takeoffItems.parapetHeight && takeoffItems.parapetHeight > 0) {
    customNotes.push(`Install parapet cap flashing for ${takeoffItems.parapetHeight}" high parapets`);
    
    if (takeoffItems.parapetHeight > 24) {
      customNotes.push("Enhanced parapet flashing system required for height > 24 inches");
      specialRequirements.push("Parapet counterflashing and reglet system");
    }
    
    if (takeoffItems.parapetHeight > 42) {
      warningFlags.push("Parapet height > 42\" requires enhanced wind analysis");
      additionalSections.push("HIGH PARAPET WIND ANALYSIS");
    }
  }
  
  // Project-specific considerations
  if (projectData.hvhz) {
    specialRequirements.push("HVHZ installation protocols required for all roof components");
    customNotes.push("All installations subject to HVHZ inspection requirements");
  }
  
  if (projectData.windPressure > 60) {
    warningFlags.push(`High wind pressure (${projectData.windPressure.toFixed(1)} psf) requires enhanced fastening`);
    specialRequirements.push("High wind installation protocols");
  }
  
  // Large roof considerations
  if (projectData.squareFootage > 100000) {
    customNotes.push("Large roof area requires staged installation and quality control");
    specialRequirements.push("Phased installation plan required");
    additionalSections.push("PHASED INSTALLATION PLAN");
  }
  
  return {
    customNotes,
    specialRequirements,
    additionalSections,
    warningFlags
  };
}

// Template section mapping based on takeoff data
export function generateTemplateOverrides(takeoffItems: TakeoffItems, projectData: any) {
  const sectionMap: Record<string, string[]> = {};
  
  // Base sections always included
  sectionMap['GENERAL_REQUIREMENTS'] = [
    "All work to comply with manufacturer specifications",
    "Weather limitations apply to all installation activities"
  ];
  
  // Drainage sections
  if (takeoffItems.drainCount > 0) {
    sectionMap['DRAINAGE_SYSTEM'] = [
      `Install ${takeoffItems.drainCount} roof drains with proper flashing`,
      "Drain assemblies to be compatible with membrane system",
      "Test all drains for proper drainage flow"
    ];
  }
  
  // Penetration sections
  if (takeoffItems.penetrationCount > 0) {
    sectionMap['PENETRATION_DETAILS'] = [
      `Flash ${takeoffItems.penetrationCount} roof penetrations per manufacturer details`,
      "All penetrations to receive secondary waterproof seal",
      "Coordinate penetration locations with structural elements"
    ];
  }
  
  // Flashing sections
  if (takeoffItems.flashingLinearFeet > 0) {
    sectionMap['FLASHING_SYSTEMS'] = [
      `Install ${takeoffItems.flashingLinearFeet} linear feet of perimeter flashing`,
      "All flashing to be mechanically fastened and sealed",
      "Flashing materials to be compatible with membrane system"
    ];
  }
  
  // Equipment sections
  if (takeoffItems.hvacUnits && takeoffItems.hvacUnits > 0) {
    sectionMap['EQUIPMENT_SUPPORT'] = [
      `Provide equipment support for ${takeoffItems.hvacUnits} HVAC units`,
      "Equipment supports to be vibration isolated",
      "Coordinate equipment placement with structural capacity"
    ];
  }
  
  return sectionMap;
}

// Quality control requirements based on takeoff complexity
export function generateQualityControlRequirements(takeoffItems: TakeoffItems, diagnostics: TakeoffDiagnostics) {
  const requirements: string[] = [];
  
  // Base QC requirements
  requirements.push("Visual inspection of all seams and terminations");
  requirements.push("Random fastener pullout testing per specifications");
  
  // Enhanced requirements based on complexity
  if (diagnostics.highPenetrationDensity) {
    requirements.push("100% penetration inspection and testing");
    requirements.push("Electronic leak detection of all penetration seals");
  }
  
  if (diagnostics.extendedFlashingRequired) {
    requirements.push("Detailed flashing inspection at 50-foot intervals");
    requirements.push("Water testing of complex flashing assemblies");
  }
  
  if (diagnostics.drainOverflowRequired) {
    requirements.push("Functional testing of all drainage systems");
    requirements.push("Overflow system capacity verification");
  }
  
  if (diagnostics.specialAccessoryNotes) {
    requirements.push("Third-party inspection of equipment installations");
    requirements.push("Coordinated testing of integrated roof systems");
  }
  
  return requirements;
}

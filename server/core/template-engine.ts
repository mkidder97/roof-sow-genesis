// Template Selection Engine
// Maps project inputs to appropriate SOW templates (T1-T8)

export interface TemplateSelectionInputs {
  projectType: 'recover' | 'tearoff' | 'new';
  hvhz: boolean;
  membraneType: string;
  membraneMaterial?: string;
  roofSlope: number; // in rise:run ratio (e.g., 0.25 = 3:12)
  buildingHeight: number;
  exposureCategory: 'B' | 'C' | 'D';
  includesTaperedInsulation?: boolean;
  userSelectedSystem?: string;
  specialConditions?: string[];
}

export interface TemplateSelectionResult {
  templateCode: string;
  templateName: string;
  rationale: string;
  applicableConditions: string[];
  rejectedTemplates: Array<{
    code: string;
    name: string;
    reason: string;
  }>;
}

/**
 * Template Selection Logic
 * Automatically selects the correct SOW template based on project conditions
 */
export function selectTemplate(inputs: TemplateSelectionInputs): TemplateSelectionResult {
  console.log('🎯 Template Selection - Analyzing project inputs...');
  
  const rejectedTemplates: Array<{ code: string; name: string; reason: string }> = [];
  const applicableConditions: string[] = [];
  
  // Convert roof slope to rise:run for easier comparison
  const slopeRatio = inputs.roofSlope || 0;
  const isLowSlope = slopeRatio < (2/12); // Less than 2:12
  const isSteepSlope = slopeRatio >= (2/12); // 2:12 or greater
  
  console.log(`📐 Roof slope: ${(slopeRatio * 12).toFixed(1)}:12 (${isLowSlope ? 'Low' : 'Steep'} slope)`);
  console.log(`🏗️ Project type: ${inputs.projectType}, HVHZ: ${inputs.hvhz}, Height: ${inputs.buildingHeight}ft`);
  
  // Template evaluation order (most specific to least specific)
  
  // T6 - Steep Slope (highest priority for steep slopes)
  if (isSteepSlope) {
    applicableConditions.push(`Steep slope (${(slopeRatio * 12).toFixed(1)}:12)`);
    console.log('✅ T6 - Steep Slope selected for roof slope ≥ 2:12');
    
    // Reject other templates
    addRejection('T1', 'Recover', 'Steep slope requires specialized template');
    addRejection('T2', 'Tear-off', 'Steep slope requires specialized template');
    addRejection('T3', 'Tapered', 'Steep slope takes precedence over tapered');
    addRejection('T4', 'HVHZ Recover', 'Steep slope takes precedence over HVHZ');
    addRejection('T5', 'Fleeceback', 'Steep slope takes precedence over membrane type');
    addRejection('T7', 'High-Rise', 'Steep slope takes precedence over height');
    addRejection('T8', 'Special System', 'Steep slope is more specific condition');
    
    return {
      templateCode: 'T6',
      templateName: 'T6 - Steep Slope',
      rationale: `Selected due to roof slope of ${(slopeRatio * 12).toFixed(1)}:12 (≥ 2:12 threshold)`,
      applicableConditions,
      rejectedTemplates
    };
  }
  
  // T8 - Special System (high priority for specific materials/systems)
  if (inputs.membraneMaterial && ['PVC', 'KEE', 'EPDM'].includes(inputs.membraneMaterial.toUpperCase()) ||
      inputs.userSelectedSystem === 'Special') {
    applicableConditions.push(`Special membrane material: ${inputs.membraneMaterial}`);
    if (inputs.userSelectedSystem === 'Special') {
      applicableConditions.push('User-selected special system');
    }
    
    console.log('✅ T8 - Special System selected for special membrane/system');
    
    addRejection('T1', 'Recover', 'Special system requirements override standard recover');
    addRejection('T2', 'Tear-off', 'Special system requirements override standard tear-off');
    addRejection('T3', 'Tapered', 'Special system takes precedence');
    addRejection('T4', 'HVHZ Recover', 'Special system takes precedence');
    addRejection('T5', 'Fleeceback', 'Special membrane material overrides fleeceback');
    addRejection('T7', 'High-Rise', 'Special system takes precedence');
    
    return {
      templateCode: 'T8',
      templateName: 'T8 - Special System',
      rationale: `Selected for special membrane material (${inputs.membraneMaterial}) or user-specified special system`,
      applicableConditions,
      rejectedTemplates
    };
  }
  
  // T7 - High-Rise (for tall buildings or severe exposure)
  if (inputs.buildingHeight > 50 || inputs.exposureCategory === 'D') {
    applicableConditions.push(inputs.buildingHeight > 50 ? `High-rise building (${inputs.buildingHeight}ft)` : `Severe exposure (Category ${inputs.exposureCategory})`);
    
    console.log('✅ T7 - High-Rise selected for height > 50ft or Exposure D');
    
    addRejection('T1', 'Recover', 'High-rise conditions require enhanced template');
    addRejection('T2', 'Tear-off', 'High-rise conditions require enhanced template');
    addRejection('T3', 'Tapered', 'High-rise takes precedence over tapered');
    addRejection('T4', 'HVHZ Recover', 'High-rise takes precedence over HVHZ');
    addRejection('T5', 'Fleeceback', 'High-rise takes precedence over membrane type');
    
    return {
      templateCode: 'T7',
      templateName: 'T7 - High-Rise',
      rationale: inputs.buildingHeight > 50 
        ? `Selected for high-rise building (${inputs.buildingHeight}ft > 50ft threshold)`
        : `Selected for severe coastal exposure (Category ${inputs.exposureCategory})`,
      applicableConditions,
      rejectedTemplates
    };
  }
  
  // T4 - HVHZ Recover (for High Velocity Hurricane Zones)
  if (inputs.hvhz && inputs.projectType === 'recover') {
    applicableConditions.push('High Velocity Hurricane Zone (HVHZ)');
    applicableConditions.push('Recover project type');
    
    console.log('✅ T4 - HVHZ Recover selected for HVHZ recover project');
    
    addRejection('T1', 'Recover', 'HVHZ requires specialized recover template');
    addRejection('T2', 'Tear-off', 'Project type is recover, not tear-off');
    addRejection('T3', 'Tapered', 'HVHZ takes precedence over tapered');
    addRejection('T5', 'Fleeceback', 'HVHZ takes precedence over membrane type');
    
    return {
      templateCode: 'T4',
      templateName: 'T4 - HVHZ Recover',
      rationale: 'Selected for High Velocity Hurricane Zone recover project requiring enhanced wind resistance',
      applicableConditions,
      rejectedTemplates
    };
  }
  
  // T5 - Fleeceback (for fleeceback membrane systems)
  if (inputs.membraneType.toLowerCase().includes('fleeceback') || 
      inputs.membraneType.toLowerCase().includes('fleece')) {
    applicableConditions.push('Fleeceback membrane system');
    
    console.log('✅ T5 - Fleeceback selected for fleeceback membrane');
    
    addRejection('T1', 'Recover', 'Fleeceback requires specialized template');
    addRejection('T2', 'Tear-off', 'Fleeceback membrane type overrides project type');
    addRejection('T3', 'Tapered', 'Fleeceback takes precedence over tapered');
    
    return {
      templateCode: 'T5',
      templateName: 'T5 - Fleeceback',
      rationale: 'Selected for fleeceback membrane system requiring specialized attachment',
      applicableConditions,
      rejectedTemplates
    };
  }
  
  // T3 - Tapered (for tapered insulation systems)
  if (inputs.includesTaperedInsulation) {
    applicableConditions.push('Tapered insulation system');
    
    console.log('✅ T3 - Tapered selected for tapered insulation');
    
    addRejection('T1', 'Recover', 'Tapered insulation requires specialized template');
    addRejection('T2', 'Tear-off', 'Tapered insulation overrides standard project type');
    
    return {
      templateCode: 'T3',
      templateName: 'T3 - Tapered',
      rationale: 'Selected for tapered insulation system requiring specialized design',
      applicableConditions,
      rejectedTemplates
    };
  }
  
  // T2 - Tear-off (for tear-off projects)
  if (inputs.projectType === 'tearoff') {
    applicableConditions.push('Tear-off project type');
    
    console.log('✅ T2 - Tear-off selected for tear-off project');
    
    addRejection('T1', 'Recover', 'Project type is tear-off, not recover');
    
    return {
      templateCode: 'T2',
      templateName: 'T2 - Tear-off',
      rationale: 'Selected for complete tear-off and replacement project',
      applicableConditions,
      rejectedTemplates
    };
  }
  
  // T1 - Recover (default for standard recover projects)
  if (inputs.projectType === 'recover') {
    applicableConditions.push('Standard recover project');
    
    console.log('✅ T1 - Recover selected as standard recover template');
    
    return {
      templateCode: 'T1',
      templateName: 'T1 - Recover',
      rationale: 'Selected for standard recover project with no special conditions',
      applicableConditions,
      rejectedTemplates
    };
  }
  
  // Fallback - Default to T1 if no specific conditions met
  console.log('⚠️ No specific template conditions met, defaulting to T1 - Recover');
  applicableConditions.push('Default selection (no special conditions)');
  
  return {
    templateCode: 'T1',
    templateName: 'T1 - Recover',
    rationale: 'Default template selected - no specific conditions detected',
    applicableConditions,
    rejectedTemplates
  };
  
  // Helper function to add rejected templates
  function addRejection(code: string, name: string, reason: string) {
    rejectedTemplates.push({ code, name, reason });
  }
}

/**
 * Get template description and requirements
 */
export function getTemplateInfo(templateCode: string): {
  code: string;
  name: string;
  description: string;
  requirements: string[];
  applicableFor: string[];
} {
  const templates = {
    'T1': {
      code: 'T1',
      name: 'T1 - Recover',
      description: 'Standard recover roof system over existing membrane',
      requirements: ['Existing roof assessment', 'Standard wind resistance'],
      applicableFor: ['Standard recover projects', 'No special conditions']
    },
    'T2': {
      code: 'T2', 
      name: 'T2 - Tear-off',
      description: 'Complete tear-off and replacement roof system',
      requirements: ['Full removal of existing system', 'New deck preparation'],
      applicableFor: ['Complete replacement projects', 'Existing system beyond repair']
    },
    'T3': {
      code: 'T3',
      name: 'T3 - Tapered',
      description: 'Roof system with tapered insulation for drainage',
      requirements: ['Tapered insulation design', 'Drainage analysis'],
      applicableFor: ['Poor drainage correction', 'Energy efficiency upgrades']
    },
    'T4': {
      code: 'T4',
      name: 'T4 - HVHZ Recover',
      description: 'High Velocity Hurricane Zone recover system',
      requirements: ['NOA approval', 'Enhanced wind resistance', 'Special inspection'],
      applicableFor: ['Florida HVHZ locations', 'Enhanced wind protection']
    },
    'T5': {
      code: 'T5',
      name: 'T5 - Fleeceback',
      description: 'Fleeceback membrane system with specialized attachment',
      requirements: ['Fleeceback membrane', 'Specialized fastening'],
      applicableFor: ['Enhanced adhesion', 'Extreme weather resistance']
    },
    'T6': {
      code: 'T6',
      name: 'T6 - Steep Slope',
      description: 'Steep slope roof system (≥ 2:12 slope)',
      requirements: ['Steep slope installation', 'Enhanced drainage'],
      applicableFor: ['Sloped roofs ≥ 2:12', 'Architectural requirements']
    },
    'T7': {
      code: 'T7',
      name: 'T7 - High-Rise',
      description: 'High-rise building roof system with enhanced requirements',
      requirements: ['Enhanced wind resistance', 'High-rise code compliance'],
      applicableFor: ['Buildings > 50ft', 'Severe exposure conditions']
    },
    'T8': {
      code: 'T8',
      name: 'T8 - Special System',
      description: 'Specialized membrane materials or custom systems',
      requirements: ['Special material approval', 'Custom installation'],
      applicableFor: ['PVC/KEE/EPDM', 'Custom specifications']
    }
  };
  
  return templates[templateCode as keyof typeof templates] || templates['T1'];
}

/**
 * Validate template selection inputs
 */
export function validateTemplateInputs(inputs: TemplateSelectionInputs): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!inputs.projectType) {
    errors.push('Project type is required');
  }
  
  if (typeof inputs.hvhz !== 'boolean') {
    errors.push('HVHZ status must be specified');
  }
  
  if (!inputs.membraneType) {
    errors.push('Membrane type is required');
  }
  
  if (typeof inputs.buildingHeight !== 'number' || inputs.buildingHeight <= 0) {
    errors.push('Valid building height is required');
  }
  
  if (!['B', 'C', 'D'].includes(inputs.exposureCategory)) {
    errors.push('Valid exposure category (B, C, or D) is required');
  }
  
  // Warnings
  if (inputs.roofSlope > 0.5) { // > 6:12
    warnings.push('Very steep slope detected - verify template applicability');
  }
  
  if (inputs.buildingHeight > 100) {
    warnings.push('Very tall building - may require special engineering');
  }
  
  if (inputs.hvhz && !inputs.projectType) {
    warnings.push('HVHZ project should specify project type for proper template selection');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Template Selection Logic
import { TemplateSelectionParams, TemplateSelectionResult } from '../types';

export async function selectTemplate(params: TemplateSelectionParams): Promise<TemplateSelectionResult> {
  const { projectType, deckType, membraneThickness, hvhz, windPressures } = params;
  
  console.log(`🏗️ Template selection: ${projectType}, ${membraneThickness}mil, HVHZ: ${hvhz}, Max pressure: ${Math.abs(windPressures.zone3Corner).toFixed(1)}psf`);
  
  let template = 'T1 - Basic TPO';
  let rationale = 'Default template selected';
  let attachmentMethod = 'Mechanically Attached';
  
  const maxPressure = Math.abs(windPressures.zone3Corner);
  
  // Template selection logic based on project type and conditions
  if (projectType.toLowerCase().includes('recover')) {
    if (parseInt(membraneThickness) >= 80 || membraneThickness.includes('115')) {
      template = 'T5 - Recover Fleeceback';
      rationale = 'Heavy-duty fleeceback membrane selected for enhanced uplift resistance in recover applications';
      attachmentMethod = 'Induction Welded';
    } else if (maxPressure > 35) {
      template = 'T4 - Enhanced TPO Recover';
      rationale = 'Enhanced recover system selected due to high wind loads exceeding 35 psf';
      attachmentMethod = 'Mechanically Attached Enhanced';
    } else {
      template = 'T4 - Standard TPO Recover';
      rationale = 'Standard TPO recover system suitable for moderate wind loads';
      attachmentMethod = 'Mechanically Attached';
    }
  } else if (projectType.toLowerCase().includes('tear')) {
    if (maxPressure > 50) {
      template = 'T8 - High-Wind Tearoff';
      rationale = 'High wind load system with dual attachment methods for extreme uplift resistance';
      attachmentMethod = 'Dual Attachment';
    } else if (maxPressure > 30) {
      template = 'T7 - Enhanced Tearoff';
      rationale = 'Enhanced tearoff system for elevated wind loads';
      attachmentMethod = 'Mechanically Attached Enhanced';
    } else {
      template = 'T6 - Standard Tearoff';
      rationale = 'Standard tearoff system suitable for normal wind loads';
      attachmentMethod = 'Mechanically Attached';
    }
  } else {
    // Replacement/New Construction
    if (maxPressure > 40) {
      template = 'T3 - High-Performance New Construction';
      rationale = 'High-performance system designed for severe wind conditions';
      attachmentMethod = 'Fully Adhered';
    } else {
      template = 'T2 - Standard New Construction';
      rationale = 'Standard new construction system for typical applications';
      attachmentMethod = 'Mechanically Attached';
    }
  }
  
  // HVHZ modifications
  if (hvhz) {
    template += ' (HVHZ)';
    rationale += ' with High Velocity Hurricane Zone compliance requirements including NOA approvals';
    
    if (!attachmentMethod.includes('Enhanced') && !attachmentMethod.includes('Dual')) {
      attachmentMethod += ' Enhanced';
    }
  }
  
  // Deck type considerations
  if (deckType?.toLowerCase().includes('wood')) {
    rationale += '. Wood deck requires special fastener considerations for pullout resistance';
  } else if (deckType?.toLowerCase().includes('concrete')) {
    rationale += '. Concrete deck allows for enhanced attachment methods';
    if (maxPressure > 40) {
      attachmentMethod = 'Mechanically Fastened with Adhesive';
    }
  }
  
  console.log(`✅ Selected template: ${template}`);
  
  return { template, rationale, attachmentMethod };
}

export async function getManufacturerApprovals(params: {
  template: string;
  windPressures: any;
  hvhz: boolean;
  county: string;
  state: string;
}) {
  console.log(`🏭 Getting manufacturer approvals for ${params.county}, ${params.state}`);
  
  const approvedSources: string[] = [];
  const rejectedManufacturers: string[] = [];
  
  // Base approvals for all systems
  approvedSources.push('FM I-175 (Factory Mutual)');
  approvedSources.push('UL 580 (Underwriters Laboratory)');
  
  // HVHZ specific approvals
  if (params.hvhz) {
    if (params.state === 'FL') {
      if (params.county === 'Miami-Dade County') {
        approvedSources.push('NOA #22-0208.03 (Miami-Dade)');
        approvedSources.push('TAS 100-95 Test Protocol');
      } else if (params.county === 'Broward County') {
        approvedSources.push('Broward County Product Approval');
      } else {
        approvedSources.push('Florida Building Code Section 1504');
      }
    }
    
    // Manufacturers that don't meet HVHZ requirements
    rejectedManufacturers.push(
      'Generic TPO Systems Inc. (No HVHZ certification)',
      'Basic Roofing Materials Co. (Failed TAS-100 testing)',
      'Economy Membrane Solutions (No NOA approval)'
    );
  } else {
    // Standard approvals for non-HVHZ
    approvedSources.push('ICC-ES ESR-1289');
    
    // Some basic manufacturers rejected for quality reasons
    if (Math.abs(params.windPressures.zone3Corner) > 30) {
      rejectedManufacturers.push(
        'Budget Roofing Systems (Insufficient uplift ratings)',
        'Discount Membrane Co. (Failed wind testing)'
      );
    }
  }
  
  // High wind specific approvals
  if (Math.abs(params.windPressures.zone3Corner) > 40) {
    approvedSources.push('ASTM D6878 (High Wind Resistance)');
    approvedSources.push('FM 4450/4470 (Severe Wind Standards)');
  }
  
  console.log(`📋 Approved sources: ${approvedSources.length}, Rejected: ${rejectedManufacturers.length}`);
  
  return {
    approvedSources,
    rejectedManufacturers
  };
}

// Helper function to get template-specific requirements
export function getTemplateRequirements(template: string) {
  const requirements = {
    fastenerSpacing: '12" o.c.',
    membraneOverlap: '3" minimum',
    seamWelding: 'Hot air welded',
    qualityAssurance: 'Visual inspection + pull testing'
  };
  
  if (template.includes('Enhanced') || template.includes('HVHZ')) {
    requirements.fastenerSpacing = '9" o.c.';
    requirements.qualityAssurance = 'Electronic leak detection + pull testing';
  }
  
  if (template.includes('High-Wind') || template.includes('Dual')) {
    requirements.fastenerSpacing = '6" o.c.';
    requirements.membraneOverlap = '6" minimum';
    requirements.qualityAssurance = 'Electronic leak detection + 5% pull testing + IR scan';
  }
  
  return requirements;
}

// Helper function to calculate system warranty implications
export function getWarrantyImplications(template: string, windPressures: any) {
  const maxPressure = Math.abs(windPressures.zone3Corner);
  
  let warrantyTerm = 20; // Base warranty years
  let warrantyNotes = 'Standard manufacturer warranty applies';
  
  if (template.includes('HVHZ')) {
    warrantyTerm = 25;
    warrantyNotes = 'HVHZ warranty includes wind damage coverage up to design wind speed';
  }
  
  if (maxPressure > 40) {
    warrantyNotes += '. High wind warranty requires annual inspections';
  }
  
  if (template.includes('Enhanced') || template.includes('High-Performance')) {
    warrantyTerm = Math.max(warrantyTerm, 25);
    warrantyNotes += '. Enhanced warranty includes labor coverage';
  }
  
  return {
    warrantyTerm,
    warrantyNotes
  };
}

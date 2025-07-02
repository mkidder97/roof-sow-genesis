// Template Selection Logic with Database-Driven Manufacturer Approvals
import { TemplateSelectionParams, TemplateSelectionResult } from '../types';
import { getManufacturerSpecs, getAvailableManufacturers, hasValidApproval } from './manufacturer-approvals.js';

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
  preferredManufacturer?: string;
  membraneType?: string;
}) {
  console.log(`🏭 Getting manufacturer approvals for ${params.county}, ${params.state}`);
  
  const approvedSources: string[] = [];
  const rejectedManufacturers: string[] = [];
  const availableManufacturers: any[] = [];
  
  try {
    // Get membrane type (default to TPO if not specified)
    const membraneType = params.membraneType || 'tpo';
    
    // Get all available manufacturers for the membrane type
    const manufacturers = await getAvailableManufacturers(membraneType);
    
    console.log(`📋 Found ${manufacturers.length} manufacturers for ${membraneType}`);
    
    // Process each manufacturer
    for (const manufacturer of manufacturers) {
      try {
        // Check if approval is valid and not expired
        if (manufacturer.isExpired) {
          rejectedManufacturers.push(
            `${manufacturer.manufacturer} (Approval expired: ${manufacturer.expirationDate?.toLocaleDateString()})`
          );
          continue;
        }
        
        // For HVHZ, check if manufacturer has HVHZ-capable products
        if (params.hvhz) {
          // Additional HVHZ validation could be added here
          // For now, assume all current manufacturers in database are HVHZ-capable
        }
        
        // Check wind pressure capability (using MCRF as proxy)
        const maxPressure = Math.abs(params.windPressures.zone3Corner);
        const minimumMCRF = maxPressure > 40 ? 300 : maxPressure > 30 ? 285 : 250;
        
        if (manufacturer.mcrfValue < minimumMCRF) {
          rejectedManufacturers.push(
            `${manufacturer.manufacturer} (MCRF ${manufacturer.mcrfValue} lbf insufficient for ${maxPressure.toFixed(1)} psf loads)`
          );
          continue;
        }
        
        // Manufacturer meets requirements
        availableManufacturers.push({
          manufacturer: manufacturer.manufacturer,
          productType: manufacturer.productType,
          fpaNumber: manufacturer.fpaNumber,
          mcrfValue: manufacturer.mcrfValue,
          expirationDate: manufacturer.expirationDate,
          notes: manufacturer.notes
        });
        
        // Add to approved sources
        approvedSources.push(`${manufacturer.fpaNumber} (${manufacturer.manufacturer.toUpperCase()})`);
        
      } catch (error) {
        console.error(`❌ Error processing manufacturer ${manufacturer.manufacturer}:`, error);
        rejectedManufacturers.push(
          `${manufacturer.manufacturer} (Database error: ${error.message})`
        );
      }
    }
    
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
    } else {
      // Standard approvals for non-HVHZ
      approvedSources.push('ICC-ES ESR-1289');
    }
    
    // High wind specific approvals
    if (Math.abs(params.windPressures.zone3Corner) > 40) {
      approvedSources.push('ASTM D6878 (High Wind Resistance)');
      approvedSources.push('FM 4450/4470 (Severe Wind Standards)');
    }
    
    console.log(`📋 Approved sources: ${approvedSources.length}, Available manufacturers: ${availableManufacturers.length}, Rejected: ${rejectedManufacturers.length}`);
    
    return {
      approvedSources,
      rejectedManufacturers,
      availableManufacturers,
      recommendedManufacturer: availableManufacturers.length > 0 ? availableManufacturers[0] : null
    };
    
  } catch (error) {
    console.error('❌ Error fetching manufacturer approvals:', error);
    
    // Fallback to basic approvals if database is unavailable
    approvedSources.push('FM I-175 (Factory Mutual)');
    approvedSources.push('UL 580 (Underwriters Laboratory)');
    rejectedManufacturers.push('Database unavailable - using fallback approvals');
    
    return {
      approvedSources,
      rejectedManufacturers,
      availableManufacturers: [],
      recommendedManufacturer: null,
      error: 'Database connection failed - using fallback data'
    };
  }
}

/**
 * Get specific manufacturer specifications for SOW generation
 */
export async function getSOWManufacturerSpecs(
  manufacturer: string, 
  productType: string
): Promise<any> {
  try {
    console.log(`🔍 Getting SOW specs for ${manufacturer} ${productType}`);
    
    const specs = await getManufacturerSpecs(manufacturer, productType);
    
    if (!specs) {
      throw new Error(`No valid approval found for ${manufacturer} ${productType}`);
    }
    
    if (specs.isExpired) {
      throw new Error(`Approval expired for ${manufacturer} ${productType}: ${specs.expirationDate?.toLocaleDateString()}`);
    }
    
    return {
      manufacturer: specs.manufacturer,
      productType: specs.productType,
      fpaNumber: specs.fpaNumber,
      mcrfValue: specs.mcrfValue,
      expirationDate: specs.expirationDate,
      isValid: !specs.isExpired,
      notes: specs.notes,
      
      // Legacy compatibility fields
      hvhzCapable: true, // Assume all database entries are HVHZ capable
      approvalType: 'FPA', // Florida Product Approval
      systemDescription: `${specs.productType.toUpperCase()} membrane system with MCRF ${specs.mcrfValue} lbf fasteners`
    };
    
  } catch (error) {
    console.error(`❌ Error getting SOW manufacturer specs:`, error);
    throw error;
  }
}

/**
 * Validate manufacturer selection for project requirements
 */
export async function validateManufacturerSelection(
  manufacturer: string,
  productType: string,
  requirements: {
    hvhz: boolean;
    maxWindPressure: number;
    state: string;
  }
): Promise<{ isValid: boolean; issues: string[]; specs?: any }> {
  const issues: string[] = [];
  
  try {
    const specs = await getManufacturerSpecs(manufacturer, productType);
    
    if (!specs) {
      issues.push(`No approval found for ${manufacturer} ${productType}`);
      return { isValid: false, issues };
    }
    
    if (specs.isExpired) {
      issues.push(`Approval expired: ${specs.expirationDate?.toLocaleDateString()}`);
    }
    
    // Check MCRF requirements based on wind pressure
    const minMCRF = requirements.maxWindPressure > 40 ? 300 : 
                    requirements.maxWindPressure > 30 ? 285 : 250;
    
    if (specs.mcrfValue < minMCRF) {
      issues.push(`MCRF ${specs.mcrfValue} lbf insufficient for ${requirements.maxWindPressure.toFixed(1)} psf loads (minimum: ${minMCRF} lbf)`);
    }
    
    // HVHZ validation could be enhanced here with specific NOA checks
    if (requirements.hvhz && requirements.state === 'FL') {
      // For now, assume all database entries are HVHZ capable
      // Future enhancement: add NOA tracking to database
    }
    
    const isValid = issues.length === 0;
    
    console.log(`✅ Validation ${isValid ? 'passed' : 'failed'} for ${manufacturer} ${productType}`);
    
    return { isValid, issues, specs };
    
  } catch (error) {
    console.error(`❌ Error validating manufacturer selection:`, error);
    issues.push(`Database error: ${error.message}`);
    return { isValid: false, issues };
  }
}

// Helper function to get template-specific requirements
export function getTemplateRequirements(template: string) {
  const requirements = {
    fastenerSpacing: '12\" o.c.',
    membraneOverlap: '3\" minimum',
    seamWelding: 'Hot air welded',
    qualityAssurance: 'Visual inspection + pull testing'
  };
  
  if (template.includes('Enhanced') || template.includes('HVHZ')) {
    requirements.fastenerSpacing = '9\" o.c.';
    requirements.qualityAssurance = 'Electronic leak detection + pull testing';
  }
  
  if (template.includes('High-Wind') || template.includes('Dual')) {
    requirements.fastenerSpacing = '6\" o.c.';
    requirements.membraneOverlap = '6\" minimum';
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

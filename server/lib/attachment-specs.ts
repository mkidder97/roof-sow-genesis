// Fastening Specifications Calculator
export async function generateAttachmentSpecs(params: {
  windPressures: {
    zone1Field: number;
    zone1Perimeter: number;
    zone2Perimeter: number;
    zone3Corner: number;
  };
  template: string;
  approvals: string[];
}) {
  console.log('🔧 Calculating attachment specifications...');
  
  const maxPressure = Math.abs(params.windPressures.zone3Corner);
  const maxPerimeterPressure = Math.abs(params.windPressures.zone2Perimeter);
  const fieldPressure = Math.abs(params.windPressures.zone1Field);
  
  // Base fastening patterns
  let fieldSpacing = '12" o.c.';
  let perimeterSpacing = '6" o.c.';
  let cornerSpacing = '4" o.c.';
  let penetrationDepth = '1.25" minimum into deck';
  
  // Adjust spacing based on wind pressures
  if (maxPressure > 50) {
    // Extreme wind conditions
    fieldSpacing = '8" o.c.';
    perimeterSpacing = '3" o.c.';
    cornerSpacing = '2" o.c.';
    penetrationDepth = '1.5" minimum into deck';
  } else if (maxPressure > 40) {
    // High wind conditions
    fieldSpacing = '9" o.c.';
    perimeterSpacing = '4" o.c.';
    cornerSpacing = '2.5" o.c.';
    penetrationDepth = '1.25" minimum into deck';
  } else if (maxPressure > 30) {
    // Moderate-high wind conditions
    fieldSpacing = '10" o.c.';
    perimeterSpacing = '5" o.c.';
    cornerSpacing = '3" o.c.';
  } else if (maxPressure > 20) {
    // Moderate wind conditions
    fieldSpacing = '11" o.c.';
    perimeterSpacing = '5.5" o.c.';
    cornerSpacing = '3.5" o.c.';
  }
  
  // Template-specific adjustments
  if (params.template.includes('HVHZ')) {
    // HVHZ requires more stringent fastening
    fieldSpacing = reduceSpacing(fieldSpacing, 1);
    perimeterSpacing = reduceSpacing(perimeterSpacing, 0.5);
    cornerSpacing = reduceSpacing(cornerSpacing, 0.5);
  }
  
  if (params.template.includes('Enhanced') || params.template.includes('High-Wind')) {
    fieldSpacing = reduceSpacing(fieldSpacing, 1);
    perimeterSpacing = reduceSpacing(perimeterSpacing, 1);
  }
  
  if (params.template.includes('Dual Attachment')) {
    penetrationDepth = '1.5" minimum with supplemental adhesive';
  }
  
  // Generate engineering notes
  const notes = generateEngineeringNotes({
    maxPressure,
    fieldPressure,
    maxPerimeterPressure,
    template: params.template,
    approvals: params.approvals
  });
  
  console.log(`📐 Fastening spec: Field ${fieldSpacing}, Perimeter ${perimeterSpacing}, Corner ${cornerSpacing}`);
  
  return {
    fieldSpacing,
    perimeterSpacing,
    cornerSpacing,
    penetrationDepth,
    notes
  };
}

function reduceSpacing(currentSpacing: string, reduction: number): string {
  const match = currentSpacing.match(/(\d+(?:\.\d+)?)/);
  if (!match) return currentSpacing;
  
  const currentValue = parseFloat(match[1]);
  const newValue = Math.max(2, currentValue - reduction); // Minimum 2" spacing
  
  return `${newValue}" o.c.`;
}

function generateEngineeringNotes(params: {
  maxPressure: number;
  fieldPressure: number;
  maxPerimeterPressure: number;
  template: string;
  approvals: string[];
}): string {
  const notes: string[] = [];
  
  // Primary design criteria
  notes.push(`Fastening pattern designed for maximum zone pressure of ${params.maxPressure.toFixed(1)} psf (Zone 3 corner areas)`);
  
  // Pullout requirements
  const requiredPullout = Math.max(200, params.maxPressure * 8);
  notes.push(`All fasteners must achieve minimum ${Math.round(requiredPullout)} lbf pullout resistance per ASTM D1761`);
  
  // Template-specific notes
  if (params.template.includes('HVHZ')) {
    notes.push('HVHZ compliance requires field verification of fastener pullout per TAS 105');
  }
  
  if (params.template.includes('Enhanced')) {
    notes.push('Enhanced fastening includes staggered pattern in high-stress zones');
  }
  
  if (params.template.includes('Dual Attachment')) {
    notes.push('Dual attachment system combines mechanical fastening with structural adhesive');
  }
  
  // Pressure zone specific requirements
  if (params.maxPressure > 40) {
    notes.push('High wind design requires 100% penetration verification and 5% pullout testing');
  }
  
  if (params.maxPerimeterPressure > 30) {
    notes.push('Perimeter zones require enhanced seam welding with 6" minimum overlap');
  }
  
  // Quality assurance requirements
  if (params.approvals.some(approval => approval.includes('NOA'))) {
    notes.push('Installation must comply with NOA-specified fastening patterns and QA protocols');
  }
  
  // Deck considerations
  notes.push('Fastener penetration depth measured from top of deck substrate, excluding coatings');
  
  if (params.maxPressure > 35) {
    notes.push('Consider structural deck analysis for high uplift loads');
  }
  
  return notes.join('. ') + '.';
}

// Helper function to calculate fastener density
export function calculateFastenerDensity(spacing: string, areaType: 'field' | 'perimeter' | 'corner'): number {
  const match = spacing.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  
  const spacingInches = parseFloat(match[1]);
  const spacingFeet = spacingInches / 12;
  
  // Calculate fasteners per square foot
  const fastenersPerSqFt = 1 / (spacingFeet * spacingFeet);
  
  return Math.round(fastenersPerSqFt * 10) / 10; // Round to 1 decimal
}

// Helper function to validate fastening against manufacturer specs
export function validateFastening(
  windPressure: number,
  fastenerSpacing: string,
  template: string
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  let valid = true;
  
  const spacingValue = parseFloat(fastenerSpacing.match(/(\d+(?:\.\d+)?)/)?.[1] || '12');
  
  // Check minimum spacing requirements
  if (spacingValue < 2) {
    issues.push('Fastener spacing cannot be less than 2" due to membrane stress concentration');
    valid = false;
  }
  
  // Check maximum spacing for pressure
  const maxAllowedSpacing = Math.max(6, 60 / windPressure);
  if (spacingValue > maxAllowedSpacing) {
    issues.push(`Spacing of ${spacingValue}" exceeds maximum ${maxAllowedSpacing.toFixed(1)}" for ${windPressure.toFixed(1)} psf`);
    valid = false;
  }
  
  // Template-specific validations
  if (template.includes('HVHZ') && spacingValue > 9) {
    issues.push('HVHZ applications require fastener spacing ≤ 9" in high-stress zones');
    valid = false;
  }
  
  return { valid, issues };
}

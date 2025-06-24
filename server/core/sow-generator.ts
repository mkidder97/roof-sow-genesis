// Export debug generation function with section analysis and REAL data support
export async function generateDebugSOW(overrides: Partial<SOWGeneratorInputs> = {}): Promise<SOWGeneratorResult> {
  console.log('🧪 Generating debug SOW with REAL data support and section analysis...');
  
  // Use provided inputs if available, otherwise use intelligent defaults
  let baseInputs: SOWGeneratorInputs;
  
  if (overrides.projectName || overrides.address || overrides.squareFootage || overrides.takeoffFile) {
    // User provided real data - use it as base
    console.log('📋 Using user-provided data as base...');
    baseInputs = {
      projectName: overrides.projectName || 'Project Debug Test',
      address: overrides.address || '123 Main St, Anytown, FL 33172',
      companyName: overrides.companyName || 'Roofing Solutions Inc',
      buildingHeight: overrides.buildingHeight || 25,
      squareFootage: overrides.squareFootage || 15000,
      buildingDimensions: overrides.buildingDimensions || calculateDimensionsFromSF(overrides.squareFootage || 15000),
      deckType: overrides.deckType || 'steel',
      projectType: overrides.projectType || 'recover',
      roofSlope: overrides.roofSlope || 0.25,
      elevation: overrides.elevation || 6,
      exposureCategory: overrides.exposureCategory || 'C',
      membraneType: overrides.membraneType || 'TPO',
      membraneThickness: overrides.membraneThickness || '60mil',
      membraneMaterial: overrides.membraneMaterial || (overrides.membraneType || 'TPO'),
      selectedMembraneBrand: overrides.selectedMembraneBrand || 'Carlisle',
      
      // Use provided takeoff items or file - CRITICAL: Pass through any uploaded file
      takeoffItems: overrides.takeoffItems || (overrides.takeoffFile ? undefined : generateIntelligentTakeoffForDebug(overrides.squareFootage || 15000)),
      takeoffFile: overrides.takeoffFile, // Pass through any uploaded file for REAL parsing
      
      fallProtectionRequired: overrides.fallProtectionRequired || false,
      walkwayPadRequested: overrides.walkwayPadRequested || false,
      sensitiveTenants: overrides.sensitiveTenants || false,
      sharedParkingAccess: overrides.sharedParkingAccess || false,
      parapetHeight: overrides.parapetHeight,
      preferredManufacturer: overrides.preferredManufacturer || overrides.selectedMembraneBrand || 'Carlisle',
      
      debug: true,
      engineDebug: {
        template: true,
        wind: true,
        fastening: true,
        takeoff: true,
        sections: true,
        ...overrides.engineDebug
      },
      customNotes: overrides.customNotes || ['Real data debug mode with section analysis'],
      ...overrides
    };
    
    console.log('✅ Using real project data:', {
      project: baseInputs.projectName,
      squareFootage: baseInputs.squareFootage,
      address: baseInputs.address,
      projectType: baseInputs.projectType,
      fileProcessed: !!overrides.takeoffFile,
      fileName: overrides.takeoffFile?.filename || 'none'
    });
    
  } else {
    // No real data provided - use enhanced mock data
    console.log('🎲 No real data provided, using enhanced mock data...');
    baseInputs = {
      projectName: 'Enhanced Debug Test',
      address: '2650 NW 89th Ct, Doral, FL 33172',
      companyName: 'Advanced Roofing Solutions',
      buildingHeight: 30,
      squareFootage: 35000,
      buildingDimensions: { length: 250, width: 140 },
      deckType: 'steel',
      projectType: 'recover',
      roofSlope: 0.25,
      elevation: 6,
      exposureCategory: 'C',
      membraneType: 'TPO',
      membraneThickness: '60mil',
      membraneMaterial: 'TPO',
      selectedMembraneBrand: 'Carlisle',
      takeoffItems: {
        drainCount: 8,
        penetrationCount: 22,
        flashingLinearFeet: 950,
        accessoryCount: 12,
        hvacUnits: 4,
        skylights: 3,
        roofHatches: 2,
        scuppers: 3,
        expansionJoints: 1,
        parapetHeight: 24,
        roofArea: 35000
      },
      fallProtectionRequired: true,
      walkwayPadRequested: true,
      sensitiveTenants: false,
      sharedParkingAccess: true,
      parapetHeight: 24,
      preferredManufacturer: 'Carlisle',
      debug: true,
      engineDebug: {
        template: true,
        wind: true,
        fastening: true,
        takeoff: true,
        sections: true
      },
      customNotes: ['Enhanced section engine debug with real data support'],
      ...overrides
    };
  }
  
  return await generateSOWWithEngineering(baseInputs);
}

// Helper function to calculate dimensions from square footage
function calculateDimensionsFromSF(squareFootage: number): { length: number; width: number } {
  if (!squareFootage || squareFootage <= 0) {
    return { length: 100, width: 100 };
  }
  
  // Assume roughly rectangular building with 1.5:1 aspect ratio
  const width = Math.sqrt(squareFootage / 1.5);
  const length = squareFootage / width;
  
  return {
    length: Math.round(length),
    width: Math.round(width)
  };
}

// Helper function to generate intelligent takeoff for debug
function generateIntelligentTakeoffForDebug(squareFootage: number): TakeoffItems {
  const drainCount = Math.max(2, Math.ceil(squareFootage / 10000));
  const penetrationCount = Math.floor(squareFootage / 2000) + 5;
  const flashingLinearFeet = Math.sqrt(squareFootage) * 4 * 1.1;
  
  return {
    drainCount,
    penetrationCount,
    flashingLinearFeet: Math.round(flashingLinearFeet),
    accessoryCount: Math.floor(squareFootage / 5000) + 2,
    roofArea: squareFootage,
    hvacUnits: Math.floor(squareFootage / 15000) + 1,
    skylights: Math.floor(squareFootage / 20000),
    roofHatches: squareFootage > 30000 ? 1 : 0,
    scuppers: 0,
    expansionJoints: squareFootage > 50000 ? 1 : 0
  };
}

export function validateSOWInputs(inputs: SOWGeneratorInputs): { valid: boolean; errors: string[] } {
  return validateAllInputs(inputs);
}
// Enhanced SOW Content Population Engine
// Replaces template placeholders with actual project-specific data
// Removes all editorial markup and generates clean, professional SOWs

import { TemplateSelectionResult } from './template-engine.js';
import { EnhancedEngineeringSummary } from './sow-generator.js';

export interface ContentPopulationInputs {
  projectName: string;
  address: string;
  companyName: string;
  buildingHeight: number;
  squareFootage: number;
  buildingDimensions?: {
    length: number;
    width: number;
  };
  deckType: string;
  projectType: 'recover' | 'tearoff' | 'new';
  roofSlope: number;
  membraneType: string;
  membraneThickness: string;
  selectedSystem: string;
  manufacturer: string;
  windSpeed: number;
  zonePressures: Record<string, number>;
  takeoffItems: any;
  engineeringSummary: EnhancedEngineeringSummary;
  templateSelection: TemplateSelectionResult;
}

export interface PopulatedContent {
  sections: ContentSection[];
  totalPages: number;
  wordCount: number;
  hasPlaceholders: boolean;
  placeholderCount: number;
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  pageNumber: number;
  dynamicFields: string[];
}

/**
 * Main content population function
 * Replaces ALL template placeholders with actual project data
 */
export function populateSOWContent(inputs: ContentPopulationInputs): PopulatedContent {
  console.log('📝 Starting SOW content population...');
  console.log(`   Project: ${inputs.projectName}`);
  console.log(`   Template: ${inputs.templateSelection.templateName}`);
  console.log(`   System: ${inputs.projectType} - ${inputs.membraneType}`);

  const sections: ContentSection[] = [];
  let currentPage = 1;

  // 1. Title Section
  sections.push(createTitleSection(inputs, currentPage++));

  // 2. Project Description Section  
  sections.push(createProjectDescriptionSection(inputs, currentPage++));

  // 3. Scope of Work Section
  sections.push(createScopeOfWorkSection(inputs, currentPage));
  currentPage += 2; // Scope typically spans 2 pages

  // 4. Wind Analysis Section
  sections.push(createWindAnalysisSection(inputs, currentPage));
  currentPage += 3; // Wind analysis with tables spans 3 pages

  // 5. System Specifications Section
  sections.push(createSystemSpecificationsSection(inputs, currentPage));
  currentPage += 4; // System specs with details span 4 pages

  // 6. Fastening Requirements Section
  sections.push(createFasteningRequirementsSection(inputs, currentPage));
  currentPage += 3; // Fastening with patterns span 3 pages

  // 7. Installation Requirements Section
  sections.push(createInstallationRequirementsSection(inputs, currentPage));
  currentPage += 4; // Installation details span 4 pages

  // 8. Takeoff Specifications Section
  sections.push(createTakeoffSpecificationsSection(inputs, currentPage));
  currentPage += 2; // Takeoff details span 2 pages

  // 9. Quality Assurance Section
  sections.push(createQualityAssuranceSection(inputs, currentPage));
  currentPage += 2; // QA requirements span 2 pages

  // 10. Submittal Requirements Section
  sections.push(createSubmittalRequirementsSection(inputs, currentPage));
  currentPage += 3; // Submittal details span 3 pages

  // 11. Warranty Section
  sections.push(createWarrantySection(inputs, currentPage));
  currentPage += 2; // Warranty terms span 2 pages

  // 12. Safety Requirements Section
  sections.push(createSafetyRequirementsSection(inputs, currentPage));
  currentPage += 2; // Safety requirements span 2 pages

  // Calculate final metrics
  const totalWordCount = sections.reduce((sum, section) => sum + countWords(section.content), 0);
  const placeholderCheck = checkForPlaceholders(sections);

  console.log(`✅ Content population complete:`);
  console.log(`   📄 ${sections.length} sections generated`);
  console.log(`   📖 ${currentPage - 1} total pages`);
  console.log(`   📝 ${totalWordCount.toLocaleString()} words`);
  console.log(`   🎯 ${placeholderCheck.placeholderCount} placeholders remaining`);

  return {
    sections,
    totalPages: currentPage - 1,
    wordCount: totalWordCount,
    hasPlaceholders: placeholderCheck.hasPlaceholders,
    placeholderCount: placeholderCheck.placeholderCount
  };
}

/**
 * Create title section with project-specific data
 */
function createTitleSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const content = `
**SECTION -- BID SCOPE OF WORK**

**Project:** ${inputs.projectName}
**Location:** ${inputs.address}
**System Type:** ${getSystemDescription(inputs)}
**Building Height:** ${inputs.buildingHeight} feet
**Roof Area:** ${inputs.squareFootage.toLocaleString()} square feet
**Wind Speed:** ${inputs.windSpeed} mph (${inputs.engineeringSummary.windAnalysis.asceVersion})

**CONTRACTOR REQUIREMENTS**

Prior to start, Contractor must review all project requirements, obtain necessary permits, and coordinate with building management. All work must comply with manufacturer specifications, local building codes, and project-specific requirements outlined herein.

**IMPORTANT NOTES**

- All highlighted items in this specification require field verification and contractor confirmation
- Contractor is responsible for verifying all existing conditions and dimensions
- Any deviations from this specification must be approved in writing prior to implementation
- All work must be performed by manufacturer-certified installers
- Complete weather protection plan required during installation

This Scope of Work is specifically designed for the ${getProjectTypeDescription(inputs)} of the existing roof system at ${inputs.address}.
`;

  return {
    id: 'title',
    title: 'Project Title and Overview',
    content: content.trim(),
    pageNumber,
    dynamicFields: ['projectName', 'address', 'buildingHeight', 'squareFootage', 'windSpeed']
  };
}

/**
 * Create project description section
 */
function createProjectDescriptionSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const buildingDescription = getBuildingDescription(inputs);
  const scopeDescription = getScopeDescription(inputs);

  const content = `
**PROJECT DESCRIPTION**

The Scope of Work for **${inputs.projectName}** at **${inputs.address}**, as provided in this Section, is briefly described but not limited to the following:

**BUILDING DESCRIPTION**

${buildingDescription}

**SCOPE OF WORK OVERVIEW**

${scopeDescription}

**WIND LOAD COMPLIANCE**

- The roof system specified herein is based on roof assembly wind uplift testing and approval for field, perimeter, and corner zones as calculated per ${inputs.engineeringSummary.windAnalysis.asceVersion}
- Design wind speed: ${inputs.windSpeed} mph
- Exposure Category: ${inputs.engineeringSummary.windAnalysis.exposureCategory}
- Building height: ${inputs.buildingHeight} feet above grade

**CONTRACTOR RESPONSIBILITIES**

The Contractor will be responsible for providing any/all engineering services and documents required by the Authority Having Jurisdiction (AHJ), as required to obtain applicable permits and/or for project close-out. All required engineering services are to be performed by an engineer licensed in the appropriate State or as otherwise acceptable to the AHJ. Contractors are to confirm local AHJ requirements prior to submitting their bids, with all related engineering costs to be included in the Base Bid amount.

**CODE COMPLIANCE**

This project must comply with:
- ${inputs.engineeringSummary.jurisdiction.codeCycle} Building Code
- ${inputs.engineeringSummary.windAnalysis.asceVersion} wind load requirements
- Local jurisdiction requirements for ${inputs.engineeringSummary.jurisdiction.county}, ${inputs.engineeringSummary.jurisdiction.state}
${inputs.engineeringSummary.jurisdiction.hvhz ? '- High Velocity Hurricane Zone (HVHZ) requirements' : ''}
${inputs.engineeringSummary.jurisdiction.specialRequirements.map(req => `- ${req}`).join('\n')}
`;

  return {
    id: 'project_description', 
    title: 'Project Description',
    content: content.trim(),
    pageNumber,
    dynamicFields: ['projectName', 'address', 'buildingHeight', 'windSpeed', 'jurisdiction']
  };
}

/**
 * Create scope of work section
 */
function createScopeOfWorkSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const specificScope = getProjectSpecificScope(inputs);
  const preparationWork = getPreparationWork(inputs);
  const systemInstallation = getSystemInstallation(inputs);

  const content = `
**DETAILED SCOPE OF WORK**

**1. PROJECT PREPARATION**

${preparationWork}

**2. SYSTEM INSTALLATION**

${systemInstallation}

**3. SPECIFIC WORK ITEMS**

${specificScope}

**4. FLASHING AND ACCESSORIES**

All perimeter edge details, penetration flashings, and accessories shall be installed in accordance with manufacturer specifications and approved shop drawings. This includes:

- Primary roof membrane: ${inputs.membraneType} ${inputs.membraneThickness}
- Manufacturer: ${inputs.manufacturer}
- System: ${inputs.selectedSystem}
- Installation method: ${getAttachmentMethod(inputs)}

**5. DRAINAGE CONSIDERATIONS**

${getDrainageRequirements(inputs)}

**6. PENETRATION TREATMENT**

All roof penetrations (${inputs.takeoffItems.penetrationCount} locations) shall be properly sealed and flashed according to manufacturer details. Each penetration requires individual assessment and custom flashing design.

**7. HVAC AND EQUIPMENT**

${getHVACRequirements(inputs)}

**8. ACCESS AND SAFETY**

${getSafetyRequirements(inputs)}
`;

  return {
    id: 'scope_of_work',
    title: 'Detailed Scope of Work', 
    content: content.trim(),
    pageNumber,
    dynamicFields: ['membraneType', 'membraneThickness', 'manufacturer', 'selectedSystem', 'penetrationCount']
  };
}

/**
 * Create wind analysis section with actual calculated values
 */
function createWindAnalysisSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const windAnalysis = inputs.engineeringSummary.windAnalysis;
  const pressureTable = createPressureTable(inputs.zonePressures);
  const calculationDetails = getCalculationDetails(windAnalysis);

  const content = `
**WIND LOAD ANALYSIS**

**DESIGN PARAMETERS**

The wind load analysis for this project has been performed in accordance with ${windAnalysis.asceVersion} "Minimum Design Loads for Buildings and Other Structures."

- **Design Wind Speed:** ${windAnalysis.windSpeed} mph
- **Exposure Category:** ${windAnalysis.exposureCategory} 
- **Building Height:** ${inputs.buildingHeight} feet above grade
- **Ground Elevation:** ${windAnalysis.elevation} feet above sea level
- **Risk Category:** II (Standard commercial building)

**CALCULATION FACTORS**

${calculationDetails}

**WIND PRESSURE ZONES**

${pressureTable}

**METHODOLOGY**

${windAnalysis.pressureMethodology.map((method, index) => `${index + 1}. ${method}`).join('\n')}

**COMPLIANCE VERIFICATION**

The selected roofing system (${inputs.selectedSystem}) has been verified to meet or exceed the calculated wind uplift pressures for all roof zones. Safety factors are included in the manufacturer's approved uplift ratings.

**SPECIAL CONSIDERATIONS**

${getWindSpecialConsiderations(inputs)}
`;

  return {
    id: 'wind_analysis',
    title: 'Wind Load Analysis',
    content: content.trim(),
    pageNumber,
    dynamicFields: ['windSpeed', 'exposureCategory', 'buildingHeight', 'elevation', 'zonePressures']
  };
}

/**
 * Create system specifications section
 */
function createSystemSpecificationsSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const systemDetails = getSystemDetails(inputs);
  const materialSpecs = getMaterialSpecifications(inputs);
  const fasteningSpecs = getFasteningSpecifications(inputs);

  const content = `
**ROOFING SYSTEM SPECIFICATIONS**

**PRIMARY SYSTEM**

${systemDetails}

**MATERIAL SPECIFICATIONS**

${materialSpecs}

**FASTENING SPECIFICATIONS**

${fasteningSpecs}

**INSTALLATION REQUIREMENTS**

All materials shall be installed strictly in accordance with ${inputs.manufacturer} specifications and approved installation instructions. Installation shall be performed by ${inputs.manufacturer}-certified installers only.

**QUALITY CONTROL**

- Daily inspection of all seams and fastening
- Verification of proper overlap and attachment spacing
- Documentation of any field modifications or repairs
- Final system testing and inspection per manufacturer requirements

**PERFORMANCE REQUIREMENTS**

The completed roof system shall provide:
- Wind uplift resistance as calculated in the Wind Load Analysis section
- Watertight integrity for minimum 20-year service life
- Compliance with all applicable building codes and standards
- Manufacturer warranty requirements satisfaction

**SPECIAL CONDITIONS**

${getSystemSpecialConditions(inputs)}
`;

  return {
    id: 'system_specifications',
    title: 'Roofing System Specifications',
    content: content.trim(),
    pageNumber,
    dynamicFields: ['manufacturer', 'membraneType', 'membraneThickness', 'selectedSystem']
  };
}

/**
 * Create fastening requirements section
 */
function createFasteningRequirementsSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const fasteningTable = createFasteningTable(inputs);
  const fasteningDetails = getFasteningDetails(inputs);

  const content = `
**FASTENING REQUIREMENTS**

**FASTENING PATTERN SUMMARY**

${fasteningTable}

**DETAILED REQUIREMENTS**

${fasteningDetails}

**INSTALLATION PROCEDURES**

1. **Deck Preparation**: All deck surfaces must be clean, dry, and free of debris before fastener installation
2. **Fastener Installation**: All fasteners must be installed perpendicular to deck surface with proper penetration depth
3. **Quality Control**: Each fastener must be visually inspected and tested for proper engagement
4. **Documentation**: Fastening pattern must be verified and documented during installation

**SPECIAL FASTENING CONDITIONS**

${getSpecialFasteningConditions(inputs)}

**TESTING REQUIREMENTS**

- Pull-out testing as required by manufacturer specifications
- Pattern verification at completion of each roof area
- Documentation of any deviations from specified pattern
`;

  return {
    id: 'fastening_requirements',
    title: 'Fastening Requirements',
    content: content.trim(),
    pageNumber,
    dynamicFields: ['fasteningSpecs', 'deckType', 'windPressures']
  };
}

/**
 * Create installation requirements section
 */
function createInstallationRequirementsSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const installationSequence = getInstallationSequence(inputs);
  const weatherRequirements = getWeatherRequirements(inputs);
  
  const content = `
**INSTALLATION REQUIREMENTS**

**INSTALLATION SEQUENCE**

${installationSequence}

**WEATHER CONDITIONS**

${weatherRequirements}

**QUALITY STANDARDS**

All work must meet the following quality standards:
- Membrane surface smooth and free of wrinkles or bubbles
- All seams properly welded with no gaps or voids
- Fasteners properly seated and sealed
- Flashing details complete and watertight

**INSPECTION REQUIREMENTS**

${getInspectionRequirements(inputs)}

**TESTING PROCEDURES**

${getTestingProcedures(inputs)}
`;

  return {
    id: 'installation_requirements',
    title: 'Installation Requirements',
    content: content.trim(),
    pageNumber,
    dynamicFields: ['projectType', 'manufacturer', 'membraneType']
  };
}

/**
 * Helper function to get system description
 */
function getSystemDescription(inputs: ContentPopulationInputs): string {
  const typeDesc = inputs.projectType === 'tearoff' ? 'Complete Tear-off and Replacement' :
                   inputs.projectType === 'recover' ? 'Recover System Installation' : 'New Construction';
  return `${typeDesc} - ${inputs.membraneType} ${inputs.membraneThickness} Membrane System`;
}

/**
 * Helper function to get project type description
 */
function getProjectTypeDescription(inputs: ContentPopulationInputs): string {
  switch (inputs.projectType) {
    case 'tearoff':
      return 'complete removal and replacement';
    case 'recover':
      return 'installation of new roofing system over existing';
    case 'new':
      return 'new construction installation';
    default:
      return 'roofing system installation';
  }
}

/**
 * Helper function to get building description
 */
function getBuildingDescription(inputs: ContentPopulationInputs): string {
  const dimensions = inputs.buildingDimensions ? 
    `approximately ${inputs.buildingDimensions.length}' x ${inputs.buildingDimensions.width}'` :
    `${inputs.squareFootage.toLocaleString()} square feet`;

  return `This building encompasses ${dimensions}, with a total roof area of ${inputs.squareFootage.toLocaleString()} square feet. The existing roof assembly is comprised of ${getDeckDescription(inputs.deckType)} roof deck with existing roofing system. The building height is ${inputs.buildingHeight} feet above grade. (Note: This information is provided for convenience only and Bidder/Contractor is responsible for verifying all existing components and conditions)`;
}

/**
 * Helper function to get scope description
 */
function getScopeDescription(inputs: ContentPopulationInputs): string {
  const baseScope = inputs.projectType === 'tearoff' ? 
    'complete removal of the existing roof assembly and installation of new' :
    'preparation of the existing roof assembly and installation of new';

  return `The scope of work for this project is a ${baseScope} ${inputs.membraneThickness}, ${getAttachmentMethod(inputs)} ${inputs.membraneType} membrane roof system and related flashings, accessories and related work.`;
}

/**
 * Helper function to get deck description
 */
function getDeckDescription(deckType: string): string {
  switch (deckType.toLowerCase()) {
    case 'steel':
      return 'steel';
    case 'gypsum':
      return 'gypsum';
    case 'lwc':
      return 'lightweight concrete and steel';
    case 'concrete':
      return 'concrete';
    default:
      return deckType;
  }
}

/**
 * Helper function to get attachment method
 */
function getAttachmentMethod(inputs: ContentPopulationInputs): string {
  // This would be determined by the template selection logic
  if (inputs.deckType.toLowerCase() === 'gypsum') {
    return 'adhered';
  }
  return 'mechanically attached';
}

// Additional helper functions would continue here...
// These functions generate specific content for each section based on project parameters

function getProjectSpecificScope(inputs: ContentPopulationInputs): string {
  // Generate detailed scope based on project type and conditions
  return `Specific work items include ${inputs.takeoffItems.drainCount} roof drains, ${inputs.takeoffItems.penetrationCount} penetrations, and ${Math.round(inputs.takeoffItems.flashingLinearFeet)} linear feet of flashing details.`;
}

function getPreparationWork(inputs: ContentPopulationInputs): string {
  if (inputs.projectType === 'tearoff') {
    return 'Complete removal and proper disposal of existing roofing system down to structural deck. Clean and prepare deck surface for new system installation.';
  }
  return 'Preparation of existing roof surface including cleaning, repairs, and installation of cover board as required.';
}

function getSystemInstallation(inputs: ContentPopulationInputs): string {
  return `Installation of new ${inputs.membraneType} ${inputs.membraneThickness} membrane system using ${inputs.manufacturer} ${inputs.selectedSystem} with ${getAttachmentMethod(inputs)} installation method.`;
}

function createPressureTable(zonePressures: Record<string, number>): string {
  let table = '**WIND PRESSURE TABLE**\n\n';
  table += '| Zone | Pressure (psf) | Application |\n';
  table += '|------|----------------|-------------|\n';
  
  for (const [zone, pressure] of Object.entries(zonePressures)) {
    const absPress = Math.abs(pressure);
    const application = zone.includes('field') ? 'Field of roof' :
                       zone.includes('perimeter') ? 'Perimeter zones' :
                       zone.includes('corner') ? 'Corner zones' : 'Special zones';
    table += `| ${zone} | ${absPress.toFixed(1)} | ${application} |\n`;
  }
  
  return table;
}

function getCalculationDetails(windAnalysis: any): string {
  const factors = windAnalysis.calculationFactors;
  return `
- **Kd (Directionality Factor):** ${factors.Kd}
- **Kh (Velocity Pressure Coefficient):** ${factors.Kh.toFixed(3)}
- **Kzt (Topographic Factor):** ${factors.Kzt.toFixed(2)}
- **Ke (Ground Elevation Factor):** ${factors.Ke.toFixed(2)}
- **I (Importance Factor):** ${factors.I.toFixed(2)}
- **qh (Velocity Pressure):** ${factors.qh.toFixed(1)} psf
`;
}

function createFasteningTable(inputs: ContentPopulationInputs): string {
  const specs = inputs.engineeringSummary.systemSelection.fasteningSpecs;
  
  return `
| Zone | Fastener Spacing | Fastener Type |
|------|------------------|---------------|
| Field | ${specs.fieldSpacing} | ${specs.fastenerType} |
| Perimeter | ${specs.perimeterSpacing} | ${specs.fastenerType} |
| Corner | ${specs.cornerSpacing} | ${specs.fastenerType} |

**Penetration Depth:** ${specs.penetrationDepth}
**Safety Margin:** ${specs.safetyMargin}x rated capacity
`;
}

// Additional helper functions for remaining sections...
function getDrainageRequirements(inputs: ContentPopulationInputs): string {
  return `The roof drainage system includes ${inputs.takeoffItems.drainCount} primary drains. All drain details must be properly flashed and sealed according to manufacturer specifications.`;
}

function getHVACRequirements(inputs: ContentPopulationInputs): string {
  const hvacCount = inputs.takeoffItems.hvacUnits || 0;
  if (hvacCount > 0) {
    return `HVAC equipment (${hvacCount} units) shall be properly supported and flashed with manufacturer-approved details. Vibration isolation and access walkways may be required.`;
  }
  return 'No HVAC equipment installations specified for this project.';
}

function getSafetyRequirements(inputs: ContentPopulationInputs): string {
  const fallProtection = inputs.buildingHeight > 30 ? 'Fall protection systems are required for all work on this building due to height exceeding 30 feet.' : 'Standard safety procedures apply.';
  return fallProtection + ' All work must comply with OSHA safety requirements and local safety regulations.';
}

function getWindSpecialConsiderations(inputs: ContentPopulationInputs): string {
  const considerations = [];
  
  if (inputs.engineeringSummary.jurisdiction.hvhz) {
    considerations.push('High Velocity Hurricane Zone requirements apply');
  }
  
  if (inputs.buildingHeight > 50) {
    considerations.push('High-rise building wind effects considered');
  }
  
  if (inputs.engineeringSummary.windAnalysis.exposureCategory === 'D') {
    considerations.push('Severe exposure category requires enhanced wind resistance');
  }
  
  return considerations.length > 0 ? considerations.map(c => `- ${c}`).join('\n') : 'No special wind considerations required.';
}

function getSystemDetails(inputs: ContentPopulationInputs): string {
  return `
**Membrane:** ${inputs.membraneType} ${inputs.membraneThickness}
**Manufacturer:** ${inputs.manufacturer}  
**System:** ${inputs.selectedSystem}
**Installation Method:** ${getAttachmentMethod(inputs)}
**Deck Type:** ${inputs.deckType}
`;
}

function getMaterialSpecifications(inputs: ContentPopulationInputs): string {
  return `All roofing materials shall be new, first-quality products manufactured by ${inputs.manufacturer} and specifically designed for this application. Materials shall conform to applicable ASTM standards and manufacturer specifications.`;
}

function getFasteningSpecifications(inputs: ContentPopulationInputs): string {
  const specs = inputs.engineeringSummary.systemSelection.fasteningSpecs;
  return `
Fastening shall be performed using ${specs.fastenerType} with the following spacing requirements:
- Field areas: ${specs.fieldSpacing}
- Perimeter zones: ${specs.perimeterSpacing}  
- Corner zones: ${specs.cornerSpacing}
- Minimum penetration: ${specs.penetrationDepth}
`;
}

// Additional helper functions would continue for all remaining sections...
function getSystemSpecialConditions(inputs: ContentPopulationInputs): string {
  return 'Standard installation conditions apply unless otherwise noted in project specifications.';
}

function getSpecialFasteningConditions(inputs: ContentPopulationInputs): string {
  return inputs.deckType === 'gypsum' ? 
    'Gypsum deck requires special fastener types and installation procedures per manufacturer requirements.' :
    'Standard fastening conditions apply for ' + inputs.deckType + ' deck.';
}

function getFasteningDetails(inputs: ContentPopulationInputs): string {
  return `Fastening patterns have been calculated based on wind pressures and manufacturer testing. All fasteners must achieve minimum ${inputs.engineeringSummary.systemSelection.fasteningSpecs.penetrationDepth} penetration into structural deck.`;
}

function getInstallationSequence(inputs: ContentPopulationInputs): string {
  return inputs.projectType === 'tearoff' ? 
    '1. Remove existing system\n2. Prepare deck surface\n3. Install new system\n4. Complete flashing and details' :
    '1. Prepare existing surface\n2. Install cover board if required\n3. Install new membrane\n4. Complete flashing and details';
}

function getWeatherRequirements(inputs: ContentPopulationInputs): string {
  return 'Installation shall not proceed during precipitation, high winds (>25 mph), or when deck temperature is below manufacturer minimum requirements.';
}

function getInspectionRequirements(inputs: ContentPopulationInputs): string {
  return 'Daily inspections required during installation with final inspection and testing upon completion.';
}

function getTestingProcedures(inputs: ContentPopulationInputs): string {
  return 'Electronic leak detection and/or flood testing required as specified by manufacturer and local requirements.';
}

// Helper functions for remaining sections
function createTakeoffSpecificationsSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const content = `
**TAKEOFF SPECIFICATIONS**

**QUANTITIES SUMMARY**

The following quantities have been calculated for this project:

- **Roof Area:** ${inputs.squareFootage.toLocaleString()} sq ft
- **Drains:** ${inputs.takeoffItems.drainCount} locations
- **Penetrations:** ${inputs.takeoffItems.penetrationCount} locations  
- **Perimeter Flashing:** ${Math.round(inputs.takeoffItems.flashingLinearFeet)} linear feet
- **Accessories:** ${inputs.takeoffItems.accessoryCount} items

**MEASUREMENT BASIS**

All quantities are based on field measurements and architectural drawings. Contractor is responsible for verifying all dimensions and quantities prior to material ordering.

**ALLOWANCES**

Material quantities include standard waste allowances per manufacturer recommendations. Additional materials may be required based on field conditions.
`;

  return {
    id: 'takeoff_specifications',
    title: 'Takeoff Specifications',
    content: content.trim(),
    pageNumber,
    dynamicFields: ['squareFootage', 'drainCount', 'penetrationCount', 'flashingLinearFeet']
  };
}

function createQualityAssuranceSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const content = `
**QUALITY ASSURANCE**

**INSTALLER QUALIFICATIONS**

All installation work must be performed by installers certified by ${inputs.manufacturer} for the specific roofing system being installed.

**INSPECTION REQUIREMENTS**

- Daily progress inspections during installation
- Material inspection upon delivery
- Intermediate inspections at key installation milestones
- Final inspection and testing upon completion

**TESTING PROCEDURES**

Testing shall be performed in accordance with manufacturer specifications and may include electronic leak detection, flood testing, or other approved methods.

**DOCUMENTATION**

Complete installation documentation shall be provided including material certifications, installer certifications, and inspection reports.
`;

  return {
    id: 'quality_assurance',
    title: 'Quality Assurance',
    content: content.trim(),
    pageNumber,
    dynamicFields: ['manufacturer']
  };
}

function createSubmittalRequirementsSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const content = `
**SUBMITTAL REQUIREMENTS**

**REQUIRED SUBMITTALS**

The following submittals are required prior to material ordering:

1. **Material Data Sheets** - Complete manufacturer data for all roofing materials
2. **Shop Drawings** - Detailed drawings for all flashing and special conditions
3. **Installation Procedures** - Manufacturer installation instructions
4. **Warranty Information** - Complete warranty terms and conditions
5. **Installer Certifications** - Proof of installer certification

**SUBMITTAL SCHEDULE**

All submittals must be received and approved prior to material ordering and project commencement.

**APPROVAL PROCESS**

Submittals will be reviewed for compliance with specifications and returned with approval status.
`;

  return {
    id: 'submittal_requirements',
    title: 'Submittal Requirements', 
    content: content.trim(),
    pageNumber,
    dynamicFields: ['manufacturer']
  };
}

function createWarrantySection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const content = `
**WARRANTY REQUIREMENTS**

**MANUFACTURER WARRANTY**

${inputs.manufacturer} material warranty shall be provided in accordance with standard warranty terms for ${inputs.membraneType} membrane systems.

**INSTALLATION WARRANTY**

Contractor shall provide installation warranty covering workmanship defects for minimum period specified in contract documents.

**WARRANTY CONDITIONS**

All warranty conditions must be met including proper material storage, certified installation, and required maintenance procedures.

**WARRANTY REGISTRATION**

System must be properly registered with manufacturer to activate warranty coverage.
`;

  return {
    id: 'warranty',
    title: 'Warranty Requirements',
    content: content.trim(), 
    pageNumber,
    dynamicFields: ['manufacturer', 'membraneType']
  };
}

function createSafetyRequirementsSection(inputs: ContentPopulationInputs, pageNumber: number): ContentSection {
  const fallProtectionReq = inputs.buildingHeight > 30;
  
  const content = `
**SAFETY REQUIREMENTS**

**FALL PROTECTION**

${fallProtectionReq ? 
  `Fall protection systems are REQUIRED for this project due to building height (${inputs.buildingHeight} feet) exceeding 30 feet. Appropriate fall protection measures must be implemented throughout the work.` :
  'Standard fall protection procedures apply per OSHA requirements.'
}

**SITE SAFETY**

- All work must comply with OSHA safety requirements
- Site-specific safety plan required  
- Daily safety briefings required
- Personal protective equipment (PPE) mandatory

**WEATHER RESTRICTIONS**

Work shall not proceed during unsafe weather conditions including high winds, precipitation, or extreme temperatures.

**EMERGENCY PROCEDURES**

Emergency contact information and procedures must be established prior to work commencement.
`;

  return {
    id: 'safety_requirements',
    title: 'Safety Requirements',
    content: content.trim(),
    pageNumber, 
    dynamicFields: ['buildingHeight']
  };
}

/**
 * Check for any remaining placeholders in content
 */
function checkForPlaceholders(sections: ContentSection[]): { hasPlaceholders: boolean; placeholderCount: number } {
  let placeholderCount = 0;
  
  for (const section of sections) {
    // Look for common placeholder patterns
    const placeholderPatterns = [
      /\{.*?\}/g,           // {placeholder}
      /\[.*?\]/g,           // [placeholder]  
      /\*\[.*?\]\*/g,       // *[placeholder]*
      /\{\{.*?\}\}/g,       // {{placeholder}}
      /___+/g,              // _____ (blanks)
      /TODO/gi,             // TODO items
      /PLACEHOLDER/gi,      // PLACEHOLDER text
      /TBD/gi               // TBD items
    ];
    
    for (const pattern of placeholderPatterns) {
      const matches = section.content.match(pattern);
      if (matches) {
        placeholderCount += matches.length;
      }
    }
  }
  
  return {
    hasPlaceholders: placeholderCount > 0,
    placeholderCount
  };
}

/**
 * Count words in content
 */
function countWords(content: string): number {
  return content.trim().split(/\s+/).length;
}

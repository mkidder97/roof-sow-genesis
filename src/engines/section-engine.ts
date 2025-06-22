// Section Engine - Dynamic SOW Section Selection
// Logic-based inclusion/exclusion of paragraph sections

import { SOWPayload } from '../server/types/index';
import { 
  SectionOutput, 
  SelfHealingAction, 
  SectionAnalysis 
} from '../server/types/index';

interface SectionRule {
  id: string;
  title: string;
  description: string;
  priority: number;
  dependencies?: string[];
  includeIf: (payload: SOWPayload) => boolean;
  content?: (payload: SOWPayload) => string;
  warnings?: (payload: SOWPayload) => string[];
}

// Section Rules Database
const sectionRules: SectionRule[] = [
  {
    id: 'base_scope',
    title: 'Base Scope',
    description: 'Always included - foundational project details',
    priority: 1,
    includeIf: () => true,
    content: () => 'This project includes a complete TPO roofing system...',
  },
  {
    id: 'system_specifications',
    title: 'System Specifications',
    description: 'Detailed material and installation specifications',
    priority: 2,
    includeIf: () => true,
    content: () => 'The roofing system shall be installed per manufacturer specifications...',
  },
  {
    id: 'wind_analysis',
    title: 'Wind Analysis Compliance',
    description: 'Wind load requirements and compliance details',
    priority: 3,
    includeIf: () => true,
    content: () => 'This project is designed to withstand wind loads per ASCE 7-16...',
  },
  {
    id: 'fall_protection',
    title: 'Fall Protection Requirements',
    description: 'OSHA fall protection compliance',
    priority: 5,
    includeIf: (payload: SOWPayload) => payload.buildingHeight > 30,
    content: () => 'Contractor shall furnish temporary OSHA-compliant fall protection...',
    warnings: (payload: SOWPayload) => payload.buildingHeight > 50 ? ['High-rise fall protection plan required'] : undefined
  },
  {
    id: 'expansion_joints',
    title: 'Expansion Joint Treatment',
    description: 'Expansion joint flashing and detailing',
    priority: 6,
    includeIf: (payload: SOWPayload) => payload.squareFootage > 20000,
    content: () => 'All expansion joints shall be treated with flexible flashing...',
  },
  {
    id: 'demolition',
    title: 'Existing Roof Demolition',
    description: 'Removal of existing roofing system',
    priority: 4,
    includeIf: (payload: SOWPayload) => payload.projectType === 'tearoff',
    content: () => 'The existing roof system shall be completely removed and disposed of...',
  },
  {
    id: 'crickets',
    title: 'Tapered Insulation Crickets',
    description: 'Installation of crickets for improved drainage',
    priority: 7,
    includeIf: (payload: SOWPayload) => payload.roofSlope && payload.roofSlope < 0.25,
    content: () => 'Tapered insulation crickets shall be installed to improve drainage...',
  },
  {
    id: 'scupper_mods',
    title: 'Scupper Modifications',
    description: 'Modifications to existing scuppers',
    priority: 8,
    includeIf: (payload: SOWPayload) => payload.squareFootage > 15000,
    content: () => 'Existing scuppers shall be modified to ensure proper drainage...',
  },
  {
    id: 'coping_detail',
    title: 'Parapet Coping Detail',
    description: 'Metal coping on parapet walls',
    priority: 9,
    includeIf: (payload: SOWPayload) => payload.buildingHeight > 40,
    content: () => 'Parapet walls shall be capped with metal coping...',
  },
  {
    id: 'hvac_controls',
    title: 'HVAC Coordination',
    description: 'Coordination with HVAC contractor',
    priority: 10,
    includeIf: (payload: SOWPayload) => payload.squareFootage > 10000,
    content: () => 'Coordination with HVAC contractor is required...',
  },
  {
    id: 'walkway_pads',
    title: 'Walkway Traffic Pads',
    description: 'Installation of walkway pads for traffic protection',
    priority: 11,
    includeIf: (payload: SOWPayload) => payload.squareFootage > 5000,
    content: () => 'Walkway pads shall be installed to protect the roofing membrane...',
  },
  {
    id: 'special_coordination',
    title: 'Special Project Coordination',
    description: 'Enhanced coordination for sensitive projects',
    priority: 12,
    includeIf: (payload: SOWPayload) => payload.projectName.includes('Hospital'),
    content: () => 'This project requires special coordination due to ongoing hospital operations...',
  },
  {
    id: 'hvhz_compliance',
    title: 'HVHZ Compliance',
    description: 'High Velocity Hurricane Zone requirements',
    priority: 13,
    includeIf: (payload: SOWPayload) => payload.address.includes('Miami'),
    content: () => 'This project is located in a High Velocity Hurricane Zone...',
  },
  {
    id: 'quality_assurance',
    title: 'Quality Assurance Program',
    description: 'Quality control and inspection procedures',
    priority: 14,
    includeIf: () => true,
    content: () => 'A comprehensive quality assurance program shall be implemented...',
  },
  {
    id: 'warranty',
    title: 'Warranty Requirements',
    description: 'Warranty terms and conditions',
    priority: 15,
    includeIf: () => true,
    content: () => 'A [20]-year manufacturer’s warranty shall be provided...',
  }
];

// Section Engine Core Function
export function selectSOWSections(payload: SOWPayload): SectionAnalysis {
  const includedSections: SectionOutput[] = [];
  const excludedSections: SectionOutput[] = [];
  const reasoningMap: Record<string, string> = {};
  let totalConfidence = 0;
  let sectionCount = 0;

  for (const rule of sectionRules) {
    sectionCount++;
    const shouldInclude = rule.includeIf(payload);
    reasoningMap[rule.id] = `${rule.title}: ${shouldInclude ? 'Included' : 'Excluded'} - ${rule.description}`;

    if (shouldInclude) {
      includedSections.push({
        id: rule.id,
        title: rule.title,
        included: true,
        rationale: rule.description,
        content: rule.content ? rule.content(payload) : undefined,
        priority: rule.priority,
        dependencies: rule.dependencies,
        warnings: rule.warnings ? rule.warnings(payload) : undefined
      });
      totalConfidence += 1; // Base confidence for inclusion
    } else {
      excludedSections.push({
        id: rule.id,
        title: rule.title,
        included: false,
        rationale: rule.description,
      });
    }
  }

  const confidenceScore = sectionCount > 0 ? totalConfidence / sectionCount : 1;

  return {
    includedSections,
    excludedSections,
    reasoningMap,
    selfHealingActions: [], // No self-healing in this engine
    confidenceScore
  };
}

// Example Usage
// const payload: SOWPayload = { ... };
// const sectionAnalysis = selectSOWSections(payload);
// console.log(sectionAnalysis);

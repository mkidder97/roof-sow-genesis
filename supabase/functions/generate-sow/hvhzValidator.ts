/**
 * High Velocity Hurricane Zone (HVHZ) Validator
 * Implements Florida-specific compliance requirements for Miami-Dade, Broward, Monroe, and Palm Beach counties
 */

export interface HVHZParameters {
  county: string;
  state: string;
  windSpeed: number;
  projectAddress: string;
  membraneType?: string;
  insulationType?: string;
  deckType?: string;
  fasteningMethod?: string;
  manufacturerApprovals?: string[];
}

export interface NOARequirement {
  type: 'NOA' | 'ESR' | 'TAS-100' | 'TAS-101' | 'TAS-102' | 'TAS-114';
  description: string;
  required: boolean;
  validApprovals?: string[];
  testingStandard: string;
  jurisdiction: string;
}

export interface HVHZAnalysisResult {
  isHVHZArea: boolean;
  county: string;
  applicableRequirements: NOARequirement[];
  complianceStatus: {
    overall: 'compliant' | 'non-compliant' | 'review-required';
    missingRequirements: string[];
    validApprovals: string[];
  };
  specialRequirements: {
    inspectionRequired: boolean;
    specialFastening: boolean;
    upliftTesting: boolean;
    windloadTesting: boolean;
  };
  calculationNotes: string[];
  metadata: {
    validationDate: string;
    version: string;
    jurisdiction: string;
  };
}

export class HVHZValidator {
  private readonly version = "1.0.0";
  
  // HVHZ Counties in Florida with their specific requirements
  private readonly hvhzCounties = {
    'miami-dade': {
      name: 'Miami-Dade County',
      windSpeed: 175, // mph
      requirements: [
        {
          type: 'NOA' as const,
          description: 'Miami-Dade Notice of Acceptance required for all roofing products',
          required: true,
          testingStandard: 'TAS-100A, TAS-101A, TAS-102A, TAS-114',
          jurisdiction: 'Miami-Dade County'
        }
      ],
      specialInspections: true,
      upliftTestingRequired: true
    },
    'broward': {
      name: 'Broward County',
      windSpeed: 150, // mph
      requirements: [
        {
          type: 'NOA' as const,
          description: 'Broward County product approval required',
          required: true,
          testingStandard: 'TAS-100, TAS-101, TAS-102',
          jurisdiction: 'Broward County'
        }
      ],
      specialInspections: true,
      upliftTestingRequired: true
    },
    'monroe': {
      name: 'Monroe County (Florida Keys)',
      windSpeed: 180, // mph
      requirements: [
        {
          type: 'NOA' as const,
          description: 'Monroe County HVHZ approval required - highest wind zone',
          required: true,
          testingStandard: 'TAS-100A, TAS-101A, TAS-102A, TAS-114A',
          jurisdiction: 'Monroe County'
        }
      ],
      specialInspections: true,
      upliftTestingRequired: true
    },
    'palm-beach': {
      name: 'Palm Beach County',
      windSpeed: 150, // mph (partial HVHZ)
      requirements: [
        {
          type: 'ESR' as const,
          description: 'ICC-ES Evaluation Service Report or local approval',
          required: true,
          testingStandard: 'TAS-100, TAS-101, AC-438',
          jurisdiction: 'Palm Beach County'
        }
      ],
      specialInspections: false,
      upliftTestingRequired: true
    }
  };

  /**
   * Validate HVHZ compliance for a given project
   */
  async validateHVHZ(params: HVHZParameters): Promise<HVHZAnalysisResult> {
    const notes: string[] = [];
    
    // Normalize county name
    const normalizedCounty = this.normalizeCountyName(params.county);
    
    // Check if project is in HVHZ area
    const isHVHZArea = this.isInHVHZArea(normalizedCounty, params.state, notes);
    
    if (!isHVHZArea) {
      return this.createNonHVHZResult(params.county, notes);
    }
    
    // Get applicable requirements
    const applicableRequirements = this.getApplicableRequirements(normalizedCounty, notes);
    
    // Check compliance status
    const complianceStatus = this.checkComplianceStatus(applicableRequirements, params, notes);
    
    // Determine special requirements
    const specialRequirements = this.getSpecialRequirements(normalizedCounty, params, notes);
    
    return {
      isHVHZArea: true,
      county: this.hvhzCounties[normalizedCounty as keyof typeof this.hvhzCounties]?.name || params.county,
      applicableRequirements,
      complianceStatus,
      specialRequirements,
      calculationNotes: notes,
      metadata: {
        validationDate: new Date().toISOString(),
        version: this.version,
        jurisdiction: normalizedCounty
      }
    };
  }

  private normalizeCountyName(county: string): string {
    const normalized = county.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/county/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Handle common variations
    const variations: Record<string, string> = {
      'dade': 'miami-dade',
      'miami': 'miami-dade',
      'miamidade': 'miami-dade',
      'palm': 'palm-beach',
      'palmbeach': 'palm-beach',
      'keys': 'monroe',
      'florida-keys': 'monroe'
    };
    
    return variations[normalized] || normalized;
  }

  private isInHVHZArea(county: string, state: string, notes: string[]): boolean {
    if (state.toLowerCase() !== 'florida' && state.toLowerCase() !== 'fl') {
      notes.push(`Project located in ${state} - HVHZ requirements only apply to Florida`);
      return false;
    }
    
    const isHVHZ = county in this.hvhzCounties;
    
    if (isHVHZ) {
      notes.push(`Project located in HVHZ area: ${this.hvhzCounties[county as keyof typeof this.hvhzCounties].name}`);
    } else {
      notes.push(`Project located in ${county}, Florida - not designated as HVHZ area`);
    }
    
    return isHVHZ;
  }

  private createNonHVHZResult(county: string, notes: string[]): HVHZAnalysisResult {
    return {
      isHVHZArea: false,
      county,
      applicableRequirements: [],
      complianceStatus: {
        overall: 'compliant',
        missingRequirements: [],
        validApprovals: []
      },
      specialRequirements: {
        inspectionRequired: false,
        specialFastening: false,
        upliftTesting: false,
        windloadTesting: false
      },
      calculationNotes: notes,
      metadata: {
        validationDate: new Date().toISOString(),
        version: this.version,
        jurisdiction: county
      }
    };
  }

  private getApplicableRequirements(county: string, notes: string[]): NOARequirement[] {
    const countyData = this.hvhzCounties[county as keyof typeof this.hvhzCounties];
    
    if (!countyData) {
      notes.push(`No specific HVHZ requirements found for ${county}`);
      return [];
    }
    
    notes.push(`Loaded ${countyData.requirements.length} HVHZ requirements for ${countyData.name}`);
    
    return countyData.requirements.map(req => ({
      ...req,
      validApprovals: this.getValidApprovals(county, req.type)
    }));
  }

  private getValidApprovals(county: string, type: string): string[] {
    // This would typically be populated from a database of valid approvals
    // For now, return common approval patterns
    const approvalPatterns: Record<string, string[]> = {
      'miami-dade': [
        'NOA-12345-P',
        'NOA-67890-P', 
        'NOA-24680-P'
      ],
      'broward': [
        'BC-12345',
        'BC-67890'
      ],
      'monroe': [
        'NOA-13579-P',
        'NOA-97531-P'
      ],
      'palm-beach': [
        'ESR-1234',
        'ESR-5678',
        'PBC-2024-001'
      ]
    };
    
    return approvalPatterns[county] || [];
  }

  private checkComplianceStatus(
    requirements: NOARequirement[], 
    params: HVHZParameters, 
    notes: string[]
  ): { overall: 'compliant' | 'non-compliant' | 'review-required'; missingRequirements: string[]; validApprovals: string[] } {
    
    const missingRequirements: string[] = [];
    const validApprovals: string[] = [];
    
    // Check if manufacturer approvals are provided
    const providedApprovals = params.manufacturerApprovals || [];
    
    for (const requirement of requirements) {
      if (requirement.required) {
        // Check if any provided approvals match the requirement pattern
        const hasValidApproval = providedApprovals.some(approval => 
          requirement.validApprovals?.some(valid => 
            approval.includes(valid.split('-')[0]) // Match approval prefix
          )
        );
        
        if (hasValidApproval) {
          validApprovals.push(...providedApprovals.filter(approval => 
            requirement.validApprovals?.some(valid => approval.includes(valid.split('-')[0]))
          ));
          notes.push(`✓ Valid ${requirement.type} approval found for ${requirement.jurisdiction}`);
        } else {
          missingRequirements.push(requirement.description);
          notes.push(`✗ Missing ${requirement.type} approval for ${requirement.jurisdiction}`);
        }
      }
    }
    
    let overall: 'compliant' | 'non-compliant' | 'review-required';
    
    if (missingRequirements.length === 0) {
      overall = 'compliant';
      notes.push('✓ All HVHZ requirements satisfied');
    } else if (providedApprovals.length > 0) {
      overall = 'review-required';
      notes.push('⚠ Some approvals provided but may need engineering review');
    } else {
      overall = 'non-compliant';
      notes.push('✗ Missing required HVHZ approvals');
    }
    
    return { overall, missingRequirements, validApprovals };
  }

  private getSpecialRequirements(
    county: string, 
    params: HVHZParameters, 
    notes: string[]
  ): { inspectionRequired: boolean; specialFastening: boolean; upliftTesting: boolean; windloadTesting: boolean } {
    
    const countyData = this.hvhzCounties[county as keyof typeof this.hvhzCounties];
    
    if (!countyData) {
      return {
        inspectionRequired: false,
        specialFastening: false,
        upliftTesting: false,
        windloadTesting: false
      };
    }
    
    const requirements = {
      inspectionRequired: countyData.specialInspections,
      specialFastening: params.windSpeed > 150,
      upliftTesting: countyData.upliftTestingRequired,
      windloadTesting: params.windSpeed > 170
    };
    
    if (requirements.inspectionRequired) {
      notes.push(`Special inspection required per ${countyData.name} regulations`);
    }
    
    if (requirements.specialFastening) {
      notes.push(`Enhanced fastening requirements for wind speeds > 150 mph`);
    }
    
    if (requirements.upliftTesting) {
      notes.push(`Uplift testing required per ${countyData.name} standards`);
    }
    
    if (requirements.windloadTesting) {
      notes.push(`Wind load testing required for extreme wind speeds > 170 mph`);
    }
    
    return requirements;
  }
}

/**
 * Convenience function for direct HVHZ validation
 */
export async function validateHVHZ(params: HVHZParameters): Promise<HVHZAnalysisResult> {
  const validator = new HVHZValidator();
  return validator.validateHVHZ(params);
}
// Complete SOW Generation Engine - Phase 1 Implementation
import { ProjectInputs, SectionSelector, createSectionSelector, validateProjectInputs } from './section-selector';
import { SOWContentGenerator, createContentGenerator, SOWDocument } from './content-generator';
import { WindEngineeringIntegrator, createWindIntegrator, CompleteWindAnalysis, validateWindAnalysis } from './wind-integrator';

export interface SOWGenerationRequest {
  projectInputs: ProjectInputs;
  options?: {
    includeWindAnalysis?: boolean;
    includeManufacturerData?: boolean;
    templateOverride?: string;
    validateOnly?: boolean;
  };
}

export interface SOWGenerationResult {
  success: boolean;
  document?: SOWDocument;
  windAnalysis?: CompleteWindAnalysis;
  validation: {
    inputValidation: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
    sectionValidation: {
      completeness: number;
      missingDependencies: string[];
      warnings: string[];
    };
    windValidation?: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
  };
  metadata: {
    templateType: string;
    generationTime: number;
    totalSections: number;
    estimatedPages: number;
    wordCount: number;
  };
  errors?: string[];
}

export class SOWGenerationEngine {
  private sectionSelector: SectionSelector;
  private contentGenerator: SOWContentGenerator;
  private windIntegrator: WindEngineeringIntegrator;

  constructor() {
    this.sectionSelector = createSectionSelector();
    this.contentGenerator = createContentGenerator();
    this.windIntegrator = createWindIntegrator();
  }

  /**
   * Main SOW generation method
   */
  async generateSOW(request: SOWGenerationRequest): Promise<SOWGenerationResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting SOW generation for ${request.projectInputs.address}`);

    try {
      // Step 1: Validate inputs
      const inputValidation = validateProjectInputs(request.projectInputs);
      if (!inputValidation.valid) {
        return this.createErrorResult(inputValidation.errors, startTime, {
          inputValidation,
          sectionValidation: { completeness: 0, missingDependencies: [], warnings: [] }
        });
      }

      // Step 2: Enhance project inputs with location data
      const enhancedInputs = await this.enhanceProjectInputs(request.projectInputs);

      // Step 3: Perform wind analysis if requested
      let windAnalysis: CompleteWindAnalysis | undefined;
      let windValidation: any;
      
      if (request.options?.includeWindAnalysis !== false) {
        try {
          windAnalysis = this.windIntegrator.performCompleteAnalysis(enhancedInputs);
          windValidation = validateWindAnalysis(windAnalysis);
          
          // Integrate wind data back into project inputs
          enhancedInputs.wind_pressures = windAnalysis.pressures;
          enhancedInputs.hvhz = windAnalysis.metadata.hvhz;
          
          console.log(`✅ Wind analysis complete: ${windAnalysis.metadata.asceVersion}, HVHZ: ${windAnalysis.metadata.hvhz}`);
        } catch (error) {
          console.error('❌ Wind analysis failed:', error);
          windValidation = {
            valid: false,
            errors: [`Wind analysis failed: ${error.message}`],
            warnings: []
          };
        }
      }

      // Step 4: Select sections
      const sectionResult = this.sectionSelector.selectSections(enhancedInputs);
      
      if (request.options?.validateOnly) {
        return {
          success: true,
          validation: {
            inputValidation,
            sectionValidation: {
              completeness: sectionResult.metadata.completeness,
              missingDependencies: sectionResult.missingDependencies,
              warnings: sectionResult.warnings
            },
            windValidation
          },
          metadata: {
            templateType: sectionResult.templateType,
            generationTime: Date.now() - startTime,
            totalSections: sectionResult.selectedSections.length,
            estimatedPages: 0,
            wordCount: 0
          },
          windAnalysis
        };
      }

      // Step 5: Generate content
      console.log(`📝 Generating content for ${sectionResult.selectedSections.length} sections`);
      
      const document = this.contentGenerator.generateDocument(
        enhancedInputs,
        sectionResult.selectedSections,
        windAnalysis ? {
          windUpliftPressures: windAnalysis.pressures,
          metadata: windAnalysis.metadata
        } : undefined,
        undefined // Manufacturer data - to be implemented in Phase 2
      );

      const generationTime = Date.now() - startTime;

      console.log(`✅ SOW generation complete in ${generationTime}ms`);
      console.log(`📊 Generated ${document.sections.length} sections, ~${document.metadata.totalPages} pages, ${document.metadata.wordCount} words`);

      return {
        success: true,
        document,
        windAnalysis,
        validation: {
          inputValidation,
          sectionValidation: {
            completeness: sectionResult.metadata.completeness,
            missingDependencies: sectionResult.missingDependencies,
            warnings: sectionResult.warnings
          },
          windValidation
        },
        metadata: {
          templateType: sectionResult.templateType,
          generationTime,
          totalSections: document.sections.length,
          estimatedPages: document.metadata.totalPages,
          wordCount: document.metadata.wordCount
        }
      };

    } catch (error) {
      console.error('❌ SOW generation failed:', error);
      return this.createErrorResult(
        [`SOW generation failed: ${error.message}`],
        startTime,
        {
          inputValidation: { valid: false, errors: [error.message], warnings: [] },
          sectionValidation: { completeness: 0, missingDependencies: [], warnings: [] }
        }
      );
    }
  }

  /**
   * Enhances project inputs with additional data
   */
  private async enhanceProjectInputs(inputs: ProjectInputs): Promise<ProjectInputs> {
    const enhanced = { ...inputs };

    // Extract location information from address
    if (!enhanced.county || !enhanced.state) {
      const locationData = this.extractLocationFromAddress(enhanced.address);
      enhanced.county = enhanced.county || locationData.county;
      enhanced.state = enhanced.state || locationData.state;
    }

    // Set defaults for missing optional fields
    enhanced.roof_slope = enhanced.roof_slope || 0;
    enhanced.elevation = enhanced.elevation || 0;
    enhanced.membrane_type = enhanced.membrane_type || 'TPO';
    enhanced.membrane_thickness = enhanced.membrane_thickness || '60';
    enhanced.insulation_type = enhanced.insulation_type || 'Polyisocyanurate';

    // Calculate missing R-value if not provided
    if (!enhanced.insulation_r_value && enhanced.insulation_thickness) {
      enhanced.insulation_r_value = this.calculateRValue(enhanced.insulation_type, enhanced.insulation_thickness);
    }

    return enhanced;
  }

  /**
   * Extracts location data from address string
   */
  private extractLocationFromAddress(address: string): { county: string; state: string } {
    const addressParts = address.split(',').map(part => part.trim());
    
    let state = '';
    let county = '';

    // Look for state (last part or second to last)
    for (let i = addressParts.length - 1; i >= 0; i--) {
      const part = addressParts[i];
      
      // Check for state abbreviation
      if (part.length === 2 && /^[A-Z]{2}$/.test(part)) {
        state = part;
        break;
      }
      
      // Check for state name
      const stateNames = ['Florida', 'Texas', 'California', 'New York', 'Georgia'];
      if (stateNames.some(stateName => part.toLowerCase().includes(stateName.toLowerCase()))) {
        state = this.getStateAbbreviation(part);
        break;
      }
    }

    // For Florida, try to extract county
    if (state === 'FL') {
      const flCounties = ['Miami-Dade', 'Broward', 'Palm Beach', 'Orange', 'Hillsborough', 'Pinellas'];
      const cityToCounty = {
        'orlando': 'Orange County',
        'miami': 'Miami-Dade County',
        'tampa': 'Hillsborough County',
        'jacksonville': 'Duval County',
        'fort lauderdale': 'Broward County',
        'west palm beach': 'Palm Beach County',
        'doral': 'Miami-Dade County'
      };

      for (const [city, countyName] of Object.entries(cityToCounty)) {
        if (address.toLowerCase().includes(city)) {
          county = countyName;
          break;
        }
      }
    }

    // For Texas, try to extract county
    if (state === 'TX') {
      const cityToCounty = {
        'dallas': 'Dallas County',
        'houston': 'Harris County',
        'austin': 'Travis County',
        'fort worth': 'Tarrant County',
        'arlington': 'Tarrant County',
        'carrollton': 'Dallas County'
      };

      for (const [city, countyName] of Object.entries(cityToCounty)) {
        if (address.toLowerCase().includes(city)) {
          county = countyName;
          break;
        }
      }
    }

    return { county, state };
  }

  /**
   * Gets state abbreviation from state name
   */
  private getStateAbbreviation(stateName: string): string {
    const stateMap = {
      'florida': 'FL',
      'texas': 'TX',
      'california': 'CA',
      'new york': 'NY',
      'georgia': 'GA'
    };

    return stateMap[stateName.toLowerCase()] || stateName;
  }

  /**
   * Calculates R-value based on insulation type and thickness
   */
  private calculateRValue(insulationType: string, thickness: number): number {
    const rValuePerInch = {
      'Polyisocyanurate': 6.0,
      'EPS': 4.0,
      'XPS': 5.0,
      'Mineral Wool': 4.2
    };

    const rPerInch = rValuePerInch[insulationType] || 6.0;
    return Math.round(thickness * rPerInch * 10) / 10; // Round to 1 decimal
  }

  /**
   * Creates error result
   */
  private createErrorResult(
    errors: string[],
    startTime: number,
    validation: any
  ): SOWGenerationResult {
    return {
      success: false,
      validation,
      metadata: {
        templateType: 'Unknown',
        generationTime: Date.now() - startTime,
        totalSections: 0,
        estimatedPages: 0,
        wordCount: 0
      },
      errors
    };
  }
}

/**
 * Helper function to create test project inputs from field inspection data
 */
export function createProjectInputsFromFieldInspection(fieldInspection: any): ProjectInputs {
  return {
    // Basic project info
    project_type: 'tearoff', // Default, can be overridden
    square_footage: fieldInspection.square_footage || 0,
    building_height: fieldInspection.building_height || 0,
    
    // Roof characteristics
    deck_type: fieldInspection.deck_type || 'Steel',
    roof_slope: fieldInspection.roof_slope || 0,
    
    // Existing conditions
    existing_membrane_type: fieldInspection.existing_membrane_type,
    existing_membrane_condition: fieldInspection.existing_membrane_condition,
    insulation_condition: fieldInspection.insulation_condition,
    
    // New system specifications
    membrane_type: 'TPO',
    membrane_thickness: '60',
    insulation_type: fieldInspection.insulation_type || 'Polyisocyanurate',
    insulation_thickness: 2.0,
    insulation_r_value: 12.0,
    cover_board_type: fieldInspection.cover_board_type,
    
    // Environmental factors (will be calculated)
    hvhz: false,
    wind_pressures: undefined,
    climate_zone: undefined,
    
    // Building features
    number_of_drains: fieldInspection.roof_drains?.length || 0,
    drain_types: fieldInspection.drain_types || [],
    hvac_units: fieldInspection.hvac_units?.length || 0,
    penetrations: fieldInspection.penetrations?.length || 0,
    skylights: fieldInspection.skylights || 0,
    roof_hatches: fieldInspection.roof_hatches || 0,
    walkway_pad_requested: false,
    gutter_type: 'None',
    downspouts: 0,
    
    // Location info
    address: fieldInspection.project_address || '',
    county: '',
    state: '',
    elevation: 0,
    
    // Project specific
    manufacturer: 'Johns Manville', // Default
    warranty_requirements: 'Standard manufacturer warranty'
  };
}

// Factory function
export function createSOWEngine(): SOWGenerationEngine {
  return new SOWGenerationEngine();
}

// Quick test function for the existing field inspection
export async function testSOWGeneration(): Promise<SOWGenerationResult> {
  console.log('🧪 Running SOW generation test with existing field inspection data');
  
  const engine = createSOWEngine();
  
  // Use the Southridge 12 project data from the database
  const testInputs: ProjectInputs = {
    project_type: 'tearoff',
    square_footage: 41300,
    building_height: 42,
    deck_type: 'Steel',
    roof_slope: 0,
    existing_membrane_type: 'Built-up Roof',
    membrane_type: 'TPO',
    membrane_thickness: '60',
    insulation_type: 'Polyisocyanurate',
    insulation_thickness: 4.5,
    insulation_r_value: 25,
    number_of_drains: 6,
    drain_types: ['Interior Drains'],
    hvac_units: 4,
    penetrations: 12,
    skylights: 0,
    roof_hatches: 2,
    walkway_pad_requested: true,
    address: '2405 Commerce Park Drive, Orlando, FL',
    county: 'Orange County',
    state: 'FL',
    hvhz: false,
    manufacturer: 'Johns Manville'
  };

  const result = await engine.generateSOW({
    projectInputs: testInputs,
    options: {
      includeWindAnalysis: true,
      includeManufacturerData: false
    }
  });

  console.log('📊 Test Results:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📋 Template: ${result.metadata.templateType}`);
  console.log(`📝 Sections: ${result.metadata.totalSections}`);
  console.log(`📄 Pages: ${result.metadata.estimatedPages}`);
  console.log(`🔤 Words: ${result.metadata.wordCount}`);
  console.log(`⏱️ Time: ${result.metadata.generationTime}ms`);
  
  if (result.windAnalysis) {
    console.log(`🌪️ Wind: Z1=${Math.abs(result.windAnalysis.pressures.zone1Field).toFixed(1)} psf, Z3=${Math.abs(result.windAnalysis.pressures.zone3Corner).toFixed(1)} psf`);
  }

  return result;
}
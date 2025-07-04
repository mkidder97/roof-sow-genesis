import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { WindCalculator, WindParameters, WindAnalysisResult } from './windCalculator.ts'
import { HVHZValidator, HVHZParameters, HVHZAnalysisResult } from './hvhzValidator.ts'
import { TemplateEngine, ProjectSpecifications, TemplateSelectionResult } from './templateEngine.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface SOWGenerationRequest {
  // Project Information
  projectName: string;
  projectAddress: string;
  customerName?: string;
  customerPhone?: string;
  
  // Building Specifications
  buildingHeight?: number;
  buildingLength?: number;
  buildingWidth?: number;
  squareFootage?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Roof System
  deckType?: string;
  membraneType?: string;
  insulationType?: string;
  projectType?: string;
  
  // Wind & Structural
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  riskCategory?: string;
  groundElevation?: number;
  topographicEffects?: boolean;
  
  // Quality & Compliance
  warrantyYears?: number;
  energyCompliance?: boolean;
  fireRating?: string;
  
  // Complexity Factors
  multipleRoofLevels?: boolean;
  skylights?: boolean;
  rooftopEquipment?: boolean;
  parapets?: boolean;
  customFlashing?: boolean;
  
  // Fastening & Uplift
  upliftRating?: number;
  specialFasteners?: boolean;
  fieldPattern?: string;
  perimeterPattern?: string;
  
  // Manufacturer Data
  manufacturerApprovals?: string[];
  
  // Optional
  notes?: string;
  inspectionId?: string;
  roofAssemblyLayers?: any[];
  
  // Engineering Overrides
  engineeringOverrides?: Record<string, any>;
}

interface SOWGenerationResponse {
  success: boolean;
  sowId: string;
  downloadUrl?: string;
  message: string;
  data: {
    windAnalysis: WindAnalysisResult;
    hvhzAnalysis: HVHZAnalysisResult;
    templateSelection: TemplateSelectionResult;
    sowContent: {
      sections: Record<string, any>;
      metadata: Record<string, any>;
    };
    engineeringOverrides?: any[];
  };
  compliance: {
    overall: 'compliant' | 'non-compliant' | 'review-required';
    windLoads: boolean;
    hvhzRequirements: boolean;
    templateSelection: boolean;
    engineeringReview: boolean;
  };
  metadata: {
    generationTime: number;
    version: string;
    calculationDate: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();
  
  try {
    const payload: SOWGenerationRequest = await req.json()
    console.log('🚀 Enhanced SOW generation request received:', {
      projectName: payload.projectName,
      projectAddress: payload.projectAddress,
      windSpeed: payload.windSpeed,
      state: payload.state,
      inspectionId: payload.inspectionId
    })

    // Validate required fields
    const projectName = payload.projectName || (payload as any).project_name
    const projectAddress = payload.projectAddress || (payload as any).project_address

    if (!projectName?.trim()) {
      throw new Error('Project name is required')
    }

    if (!projectAddress?.trim()) {
      throw new Error('Project address is required')
    }

    // Create initial SOW generation record
    const { data: sowRecord, error: createError } = await supabase
      .from('sow_generations')
      .insert({
        template_type: 'enhanced-asce-compliant',
        generation_status: 'processing',
        input_data: payload,
        user_id: '00000000-0000-0000-0000-000000000000', // Anonymous for now
        inspection_id: payload.inspectionId || null
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create SOW record:', createError)
      throw new Error('Failed to initialize SOW generation')
    }

    console.log('📝 SOW generation record created:', sowRecord.id)

    // STEP 1: Wind Load Analysis (ASCE 7-16/7-22)
    console.log('🌪️ Performing wind load analysis...')
    const windParameters: WindParameters = {
      basicWindSpeed: payload.windSpeed || 120,
      exposureCategory: (payload.exposureCategory as 'A' | 'B' | 'C' | 'D') || 'B',
      buildingHeight: payload.buildingHeight || 30,
      buildingLength: payload.buildingLength || Math.sqrt(payload.squareFootage || 10000),
      buildingWidth: payload.buildingWidth || Math.sqrt(payload.squareFootage || 10000),
      groundElevation: payload.groundElevation,
      riskCategory: (payload.riskCategory as 'I' | 'II' | 'III' | 'IV') || 'II',
      topographicEffects: payload.topographicEffects || false,
      engineeringOverrides: payload.engineeringOverrides
    }

    const windCalculator = new WindCalculator()
    const windAnalysis = await windCalculator.calculateWindLoads(windParameters)

    // Store wind analysis
    const { error: windError } = await supabase
      .from('wind_analysis')
      .insert({
        sow_generation_id: sowRecord.id,
        input_parameters: windParameters,
        design_wind_speed: windAnalysis.designWindSpeed,
        velocity_pressure: windAnalysis.velocityPressure,
        zone_pressures: windAnalysis.zonePressures,
        perimeter_widths: windAnalysis.perimeterWidths,
        compliance_flags: windAnalysis.complianceFlags,
        calculation_notes: windAnalysis.calculationNotes,
        metadata: windAnalysis.metadata
      })

    if (windError) {
      console.error('⚠️ Failed to store wind analysis:', windError)
    } else {
      console.log('✅ Wind analysis completed and stored')
    }

    // STEP 2: HVHZ Validation (Florida Counties)
    console.log('🏢 Performing HVHZ validation...')
    const hvhzParameters: HVHZParameters = {
      county: extractCountyFromAddress(payload.projectAddress, payload.city),
      state: payload.state || 'FL',
      windSpeed: windAnalysis.designWindSpeed,
      projectAddress: payload.projectAddress,
      membraneType: payload.membraneType,
      insulationType: payload.insulationType,
      deckType: payload.deckType,
      fasteningMethod: payload.fieldPattern,
      manufacturerApprovals: payload.manufacturerApprovals
    }

    const hvhzValidator = new HVHZValidator()
    const hvhzAnalysis = await hvhzValidator.validateHVHZ(hvhzParameters)

    // Store HVHZ analysis
    const { error: hvhzError } = await supabase
      .from('hvhz_analysis')
      .insert({
        sow_generation_id: sowRecord.id,
        is_hvhz_area: hvhzAnalysis.isHVHZArea,
        county: hvhzAnalysis.county,
        state: hvhzParameters.state,
        applicable_requirements: hvhzAnalysis.applicableRequirements,
        compliance_status: hvhzAnalysis.complianceStatus,
        special_requirements: hvhzAnalysis.specialRequirements,
        calculation_notes: hvhzAnalysis.calculationNotes,
        metadata: hvhzAnalysis.metadata
      })

    if (hvhzError) {
      console.error('⚠️ Failed to store HVHZ analysis:', hvhzError)
    } else {
      console.log('✅ HVHZ validation completed and stored')
    }

    // STEP 3: Intelligent Template Selection
    console.log('📋 Performing template selection...')
    const projectSpecs: ProjectSpecifications = {
      projectType: (payload.projectType as 'tearoff' | 'overlay' | 'new-construction' | 'repair') || 'tearoff',
      roofArea: payload.squareFootage || 10000,
      windSpeed: windAnalysis.designWindSpeed,
      membraneType: (payload.membraneType as any) || 'TPO',
      insulationType: (payload.insulationType as any) || 'Polyiso',
      deckType: (payload.deckType as any) || 'Steel',
      hvhzRequired: hvhzAnalysis.isHVHZArea,
      complexityFactors: {
        multipleRoofLevels: payload.multipleRoofLevels || false,
        skylights: payload.skylights || false,
        rooftopEquipment: payload.rooftopEquipment || false,
        parapets: payload.parapets || false,
        customFlashing: payload.customFlashing || false
      },
      fasteningRequirements: {
        upliftRating: payload.upliftRating || Math.abs(windAnalysis.zonePressures.corner),
        specialFasteners: payload.specialFasteners || windAnalysis.designWindSpeed > 150,
        fieldPattern: payload.fieldPattern || 'standard',
        perimeterPattern: payload.perimeterPattern || 'enhanced'
      },
      qualityRequirements: {
        warrantyYears: payload.warrantyYears || 10,
        energyCompliance: payload.energyCompliance || false,
        fireRating: payload.fireRating,
        accessibilityCompliance: false
      }
    }

    const templateEngine = new TemplateEngine()
    const templateSelection = await templateEngine.selectTemplate(projectSpecs)

    // Store template selection
    const { error: templateError } = await supabase
      .from('template_selection')
      .insert({
        sow_generation_id: sowRecord.id,
        primary_template: templateSelection.primaryTemplate,
        fallback_templates: templateSelection.fallbackTemplates,
        customizations: templateSelection.customizations,
        content_overrides: templateSelection.contentOverrides,
        generation_notes: templateSelection.generationNotes,
        confidence_score: templateSelection.metadata.confidenceScore,
        metadata: templateSelection.metadata
      })

    if (templateError) {
      console.error('⚠️ Failed to store template selection:', templateError)
    } else {
      console.log('✅ Template selection completed and stored')
    }

    // STEP 4: Handle Engineering Overrides
    const engineeringOverrides = await processEngineeringOverrides(
      sowRecord.id,
      payload.engineeringOverrides,
      windAnalysis,
      hvhzAnalysis
    )

    // STEP 5: Generate SOW Content
    console.log('📄 Generating SOW content...')
    const sowContent = await generateSOWContent(
      projectSpecs,
      windAnalysis,
      hvhzAnalysis,
      templateSelection,
      payload
    )

    // STEP 6: Determine Overall Compliance
    const compliance = determineOverallCompliance(
      windAnalysis,
      hvhzAnalysis,
      templateSelection,
      engineeringOverrides
    )

    // Calculate generation time
    const generationTime = Date.now() - startTime

    // Generate file information
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${cleanProjectName}_SOW_${templateSelection.primaryTemplate.templateId}_${timestamp}.pdf`

    // Update SOW record with completion
    const { error: updateError } = await supabase
      .from('sow_generations')
      .update({
        generation_status: compliance.overall === 'compliant' ? 'completed' : 'review-required',
        output_file_path: filename,
        generation_completed_at: new Date().toISOString(),
        generation_duration_seconds: Math.round(generationTime / 1000),
        wind_analysis_data: windAnalysis,
        hvhz_analysis_data: hvhzAnalysis,
        template_selection_data: templateSelection,
        engineering_overrides_data: engineeringOverrides,
        compliance_summary: compliance,
        generation_metadata: {
          version: '1.0.0',
          modules: ['windCalculator', 'hvhzValidator', 'templateEngine'],
          generationTime,
          templateUsed: templateSelection.primaryTemplate.templateId
        }
      })
      .eq('id', sowRecord.id)

    if (updateError) {
      console.error('❌ Failed to update SOW record:', updateError)
    }

    // Link inspection to SOW if inspection ID provided
    if (payload.inspectionId) {
      await linkInspectionToSOW(payload.inspectionId, sowRecord.id, compliance.overall)
    }

    // Prepare response
    const response: SOWGenerationResponse = {
      success: true,
      sowId: sowRecord.id,
      downloadUrl: `${supabaseUrl}/storage/v1/object/public/sow-documents/${filename}`,
      message: `SOW generated successfully using template ${templateSelection.primaryTemplate.templateId}`,
      data: {
        windAnalysis,
        hvhzAnalysis,
        templateSelection,
        sowContent,
        engineeringOverrides
      },
      compliance,
      metadata: {
        generationTime,
        version: '1.0.0',
        calculationDate: new Date().toISOString()
      }
    }

    console.log('✅ Enhanced SOW generation completed successfully:', {
      sowId: sowRecord.id,
      template: templateSelection.primaryTemplate.templateId,
      compliance: compliance.overall,
      generationTime: `${generationTime}ms`
    })

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Enhanced SOW generation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Enhanced SOW generation failed',
        metadata: {
          generationTime: Date.now() - startTime,
          version: '1.0.0',
          calculationDate: new Date().toISOString()
        }
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

// Helper Functions

function extractCountyFromAddress(address: string, city?: string): string {
  // Simple county extraction logic - can be enhanced with geocoding
  const addressLower = address.toLowerCase()
  
  // Check for explicit county mentions
  if (addressLower.includes('miami-dade') || addressLower.includes('miami')) return 'miami-dade'
  if (addressLower.includes('broward')) return 'broward'
  if (addressLower.includes('monroe') || addressLower.includes('key ')) return 'monroe'
  if (addressLower.includes('palm beach')) return 'palm-beach'
  
  // Check city-based county mapping
  if (city) {
    const cityLower = city.toLowerCase()
    if (cityLower.includes('miami') || cityLower.includes('homestead')) return 'miami-dade'
    if (cityLower.includes('fort lauderdale') || cityLower.includes('hollywood')) return 'broward'
    if (cityLower.includes('key ') || cityLower.includes('marathon')) return 'monroe'
    if (cityLower.includes('palm beach') || cityLower.includes('boca raton')) return 'palm-beach'
  }
  
  return 'unknown'
}

async function processEngineeringOverrides(
  sowId: string,
  overrides: Record<string, any> | undefined,
  windAnalysis: WindAnalysisResult,
  hvhzAnalysis: HVHZAnalysisResult
): Promise<any[]> {
  
  if (!overrides || Object.keys(overrides).length === 0) {
    return []
  }

  const processedOverrides = []
  
  for (const [type, values] of Object.entries(overrides)) {
    try {
      const { error } = await supabase
        .from('asce_overrides')
        .insert({
          sow_generation_id: sowId,
          engineer_id: values.engineerId,
          engineer_name: values.engineerName,
          override_type: type,
          original_values: getOriginalValues(type, windAnalysis, hvhzAnalysis),
          override_values: values,
          justification: values.justification || 'Engineering override applied',
          approval_status: 'pending'
        })

      if (!error) {
        processedOverrides.push({ type, values, status: 'recorded' })
        console.log(`📝 Engineering override recorded: ${type}`)
      } else {
        console.error(`❌ Failed to record override ${type}:`, error)
      }
    } catch (error) {
      console.error(`❌ Error processing override ${type}:`, error)
    }
  }

  return processedOverrides
}

function getOriginalValues(type: string, windAnalysis: WindAnalysisResult, hvhzAnalysis: HVHZAnalysisResult): any {
  switch (type) {
    case 'wind_parameters':
      return windAnalysis.inputParameters
    case 'pressure_coefficients':
      return windAnalysis.zonePressures
    case 'hvhz_approval':
      return hvhzAnalysis.complianceStatus
    default:
      return {}
  }
}

async function generateSOWContent(
  specs: ProjectSpecifications,
  windAnalysis: WindAnalysisResult,
  hvhzAnalysis: HVHZAnalysisResult,
  templateSelection: TemplateSelectionResult,
  payload: SOWGenerationRequest
): Promise<{ sections: Record<string, any>; metadata: Record<string, any> }> {
  
  const sections: Record<string, any> = {}
  
  // Generate core sections based on selected template
  const template = templateSelection.primaryTemplate
  
  for (const sectionName of template.requiredSections) {
    sections[sectionName] = await generateSection(sectionName, {
      specs,
      windAnalysis,
      hvhzAnalysis,
      templateSelection,
      payload
    })
  }
  
  // Add customized sections
  for (const additionalSection of templateSelection.customizations.additionalSections) {
    sections[additionalSection] = await generateSection(additionalSection, {
      specs,
      windAnalysis,
      hvhzAnalysis,
      templateSelection,
      payload
    })
  }
  
  const metadata = {
    templateUsed: template.templateId,
    sectionsGenerated: Object.keys(sections).length,
    customizationsApplied: templateSelection.customizations,
    contentOverrides: templateSelection.contentOverrides,
    generatedAt: new Date().toISOString()
  }
  
  return { sections, metadata }
}

async function generateSection(sectionName: string, context: any): Promise<any> {
  // This would contain the actual section generation logic
  // For now, return structured placeholder content
  
  const sectionContent = {
    title: sectionName,
    content: `Generated content for ${sectionName} section`,
    specifications: [],
    requirements: [],
    notes: []
  }
  
  // Add specific content based on section type
  switch (sectionName) {
    case 'Wind Load Analysis':
      sectionContent.specifications = [
        `Design wind speed: ${context.windAnalysis.designWindSpeed} mph`,
        `Velocity pressure: ${context.windAnalysis.velocityPressure.toFixed(2)} psf`,
        `Zone pressures calculated per ASCE ${context.windAnalysis.complianceFlags.asceStandard}`
      ]
      break
      
    case 'HVHZ Compliance':
      if (context.hvhzAnalysis.isHVHZArea) {
        sectionContent.requirements = context.hvhzAnalysis.applicableRequirements.map((req: any) => req.description)
      }
      break
      
    case 'Material Specifications':
      sectionContent.specifications = [
        `Membrane type: ${context.specs.membraneType}`,
        `Insulation type: ${context.specs.insulationType}`,
        `Deck type: ${context.specs.deckType}`
      ]
      break
  }
  
  return sectionContent
}

function determineOverallCompliance(
  windAnalysis: WindAnalysisResult,
  hvhzAnalysis: HVHZAnalysisResult,
  templateSelection: TemplateSelectionResult,
  engineeringOverrides: any[]
): {
  overall: 'compliant' | 'non-compliant' | 'review-required';
  windLoads: boolean;
  hvhzRequirements: boolean;
  templateSelection: boolean;
  engineeringReview: boolean;
} {
  
  const windLoads = windAnalysis.complianceFlags.hvhzCompliant
  const hvhzRequirements = hvhzAnalysis.complianceStatus.overall !== 'non-compliant'
  const templateSelectionValid = templateSelection.metadata.confidenceScore >= 70
  const engineeringReview = engineeringOverrides.length > 0 || windAnalysis.complianceFlags.engineeringOverride
  
  let overall: 'compliant' | 'non-compliant' | 'review-required'
  
  if (!windLoads || hvhzAnalysis.complianceStatus.overall === 'non-compliant') {
    overall = 'non-compliant'
  } else if (engineeringReview || hvhzAnalysis.complianceStatus.overall === 'review-required') {
    overall = 'review-required'
  } else {
    overall = 'compliant'
  }
  
  return {
    overall,
    windLoads,
    hvhzRequirements,
    templateSelection: templateSelectionValid,
    engineeringReview
  }
}

async function linkInspectionToSOW(inspectionId: string, sowId: string, complianceStatus: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('field_inspections')
      .update({
        sow_generated: true,
        sow_id: sowId,
        updated_at: new Date().toISOString()
      })
      .eq('id', inspectionId)

    if (error) {
      console.error('⚠️ Failed to update inspection record:', error)
    } else {
      console.log(`🔗 Linked inspection ${inspectionId} to SOW ${sowId} with status: ${complianceStatus}`)
    }
  } catch (error) {
    console.error('❌ Error linking inspection to SOW:', error)
  }
}
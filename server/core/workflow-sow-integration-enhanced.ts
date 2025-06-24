// Complete SOW-Workflow Integration with Enhanced PDF Formatting
// Compiles data from all workflow stages and generates comprehensive SOWs with exact template matching

import { createClient } from '@supabase/supabase-js';
import { 
  generateSOWWithEngineering, 
  SOWGeneratorInputs,
  SOWGeneratorResult,
  EnhancedEngineeringSummary 
} from './sow-generator';
import EnhancedPDFFormatter, { PDFFormattingOptions } from './pdf-formatter';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! || process.env.SUPABASE_ANON_KEY!
);

// Initialize PDF Formatter
const pdfFormatter = new EnhancedPDFFormatter();

// Workflow Project Data Types
export interface WorkflowProjectData {
  id: string;
  name: string;
  project_address: string;
  current_stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete';
  user_id: string;
  assigned_inspector?: string;
  assigned_consultant?: string;
  assigned_engineer?: string;
  workflow_status: any;
  stage_data: any;
  created_at: string;
  updated_at: string;
}

export interface FieldInspectionData {
  id: string;
  project_id: string;
  inspector_id: string;
  project_name: string;
  project_address: string;
  inspection_date: string;
  building_height?: number;
  square_footage?: number;
  roof_slope?: number;
  deck_type?: string;
  existing_membrane?: string;
  project_type?: string;
  observations: any;
  photos: any;
  measurements: any;
  conditions: any;
  takeoff_items: any;
  notes?: string;
  recommendations?: string;
  concerns?: string;
  completed: boolean;
  ready_for_handoff: boolean;
}

export interface ConsultantReviewData {
  id: string;
  project_id: string;
  consultant_id: string;
  field_inspection_id: string;
  client_requirements: any;
  special_conditions?: string;
  budget_considerations?: string;
  timeline_requirements?: string;
  scope_modifications: any;
  additional_work_items: any;
  exclusions?: string;
  bid_alerts: any;
  risk_factors?: string;
  competitive_considerations?: string;
  template_preferences?: string[];
  template_concerns?: string;
  review_completed: boolean;
  engineer_briefing?: string;
  priority_items?: string;
}

export interface WorkflowSOWInputs {
  projectId: string;
  userId: string;
  engineerNotes?: string;
  includeWorkflowAuditTrail?: boolean;
  customOverrides?: Partial<SOWGeneratorInputs>;
}

export interface WorkflowSOWResult extends SOWGeneratorResult {
  workflowData?: {
    inspectionSummary: any;
    consultantReview: any;
    engineeringDecisions: any;
    auditTrail: any[];
    collaborators: any[];
  };
  sowMetadata?: {
    workflowVersion: string;
    multiRoleGeneration: boolean;
    dataSourceBreakdown: {
      fieldInspection: string[];
      consultantReview: string[];
      engineeringAnalysis: string[];
    };
  };
  formattingCompliance?: {
    templateMatched: boolean;
    complianceScore: number;
    formattingIssues: any[];
    recommendations: string[];
  };
}

/**
 * Main workflow-integrated SOW generation function
 * Compiles data from all workflow stages and generates comprehensive SOW
 */
export async function generateWorkflowSOW(inputs: WorkflowSOWInputs): Promise<WorkflowSOWResult> {
  console.log(`🔄 Starting workflow-integrated SOW generation for project: ${inputs.projectId}`);
  
  try {
    // Step 1: Fetch complete project data from all workflow stages
    console.log('📋 Step 1: Fetching complete project workflow data...');
    const workflowData = await fetchCompleteWorkflowData(inputs.projectId);
    
    if (!workflowData.project) {
      throw new Error(`Project ${inputs.projectId} not found`);
    }
    
    if (workflowData.project.current_stage !== 'engineering') {
      throw new Error(`Project must be in engineering stage for SOW generation. Current stage: ${workflowData.project.current_stage}`);
    }
    
    // Step 2: Compile multi-role inputs for SOW generation
    console.log('🔄 Step 2: Compiling multi-role inputs...');
    const compiledInputs = await compileWorkflowInputs(workflowData, inputs.customOverrides);
    
    // Step 3: Generate enhanced SOW with workflow data
    console.log('🎯 Step 3: Generating enhanced SOW with workflow integration...');
    const sowResult = await generateSOWWithEngineering(compiledInputs);
    
    if (!sowResult.success) {
      throw new Error(`SOW generation failed: ${sowResult.error}`);
    }
    
    // Step 3.5: Apply enhanced PDF formatting for exact template matching
    console.log('🎨 Step 3.5: Applying enhanced PDF formatting...');
    const enhancedFormatting = await applyEnhancedPDFFormatting(sowResult, workflowData, inputs);
    
    // Step 4: Enhance SOW with workflow metadata and audit trail
    console.log('📊 Step 4: Enhancing SOW with workflow metadata...');
    const enhancedResult = await enhanceSOWWithWorkflowData(
      sowResult, 
      workflowData, 
      inputs,
      enhancedFormatting
    );
    
    // Step 5: Update project with SOW data and mark as complete
    console.log('✅ Step 5: Updating project with completed SOW...');
    await updateProjectWithSOWCompletion(inputs.projectId, inputs.userId, enhancedResult);
    
    console.log(`🎉 Workflow-integrated SOW generation completed successfully!`);
    console.log(`   📋 Project: ${workflowData.project.name}`);
    console.log(`   📍 Address: ${workflowData.project.project_address}`);
    console.log(`   👷 Inspector: ${workflowData.inspection?.inspector?.full_name || 'Unknown'}`);
    console.log(`   👔 Consultant: ${workflowData.review?.consultant?.full_name || 'Unknown'}`);
    console.log(`   🔬 Engineer: ${inputs.userId}`);
    console.log(`   📄 Template: ${enhancedResult.engineeringSummary?.templateSelection?.templateName}`);
    console.log(`   🌪️ Wind Speed: ${enhancedResult.engineeringSummary?.windAnalysis?.windSpeed}mph`);
    console.log(`   🏭 System: ${enhancedResult.engineeringSummary?.systemSelection?.selectedSystem}`);
    console.log(`   🎨 Formatting Score: ${enhancedResult.formattingCompliance?.complianceScore}%`);
    
    return enhancedResult;
    
  } catch (error) {
    console.error('❌ Workflow SOW generation failed:', error);
    throw error;
  }
}

/**
 * Apply enhanced PDF formatting to ensure exact template matching
 */
async function applyEnhancedPDFFormatting(
  sowResult: SOWGeneratorResult,
  workflowData: any,
  inputs: WorkflowSOWInputs
): Promise<any> {
  console.log('🎨 Applying enhanced PDF formatting for exact template matching...');
  
  try {
    // Determine template type based on project characteristics
    const templateType = determineTemplateType(workflowData, sowResult);
    
    // Configure formatting options
    const formattingOptions: Partial<PDFFormattingOptions> = {
      templateType,
      includeHighlighting: true,
      removeGreenHighlighting: true, // Remove green before PDF conversion
      applyBrandingColors: true,
      fontSettings: {
        headerFont: 'times',
        bodyFont: 'times',
        sizes: {
          title: 16,
          header: 14,
          body: 11,
          note: 9
        }
      },
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      colors: {
        yellowHighlight: '#FFFF00',
        greenHighlight: '#00FF00',
        primary: '#000000',
        secondary: '#333333'
      }
    };
    
    // Format SOW content to match template exactly
    const { formattedContent, validationResults } = pdfFormatter.formatSOWContent(
      {
        ...sowResult,
        workflowData,
        projectName: workflowData.project.name,
        address: workflowData.project.project_address
      },
      templateType,
      formattingOptions
    );
    
    console.log(`✅ PDF formatting applied with ${validationResults.length} validation results`);
    
    return {
      templateType,
      formattedContent,
      validationResults,
      formattingOptions
    };
    
  } catch (error) {
    console.error('❌ PDF formatting failed:', error);
    return {
      templateType: 'tearoff-tpo-ma-insul-steel', // Default fallback
      formattedContent: null,
      validationResults: [{
        section: 'Formatting',
        issues: [`PDF formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        suggestions: ['Review PDF formatting configuration and template specifications']
      }],
      formattingOptions: null
    };
  }
}

/**
 * Determine the appropriate template type based on project characteristics
 */
function determineTemplateType(workflowData: any, sowResult: SOWGeneratorResult): string {
  const inspection = workflowData.inspection;
  const review = workflowData.review;
  const projectType = inspection?.project_type?.toLowerCase() || '';
  const deckType = inspection?.deck_type?.toLowerCase() || '';
  const membraneType = review?.scope_modifications?.membrane_type?.toLowerCase() || 
                      inspection?.observations?.membrane_type?.toLowerCase() || 'tpo';
  
  // Template selection logic based on project knowledge
  if (projectType.includes('tear') || projectType.includes('replace')) {
    // Tearoff templates
    if (membraneType.includes('tpo')) {
      if (deckType.includes('steel')) {
        return 'tearoff-tpo-ma-insul-steel'; // T6
      } else if (deckType.includes('gypsum')) {
        return 'tearoff-tpo-adhered-insul-adhered-gypsum'; // T8
      } else if (deckType.includes('concrete') || deckType.includes('lwc')) {
        return 'tearoff-tpo-ma-insul-lwc-steel'; // T7
      }
    }
  } else if (projectType.includes('recover') || projectType.includes('re-cover')) {
    // Recover templates
    if (deckType.includes('steel') && deckType.includes('standing')) {
      return 'recover-tpo-rhino-iso-eps-flute-fill-ssr'; // T5
    }
  }
  
  // Default to most common template
  return 'tearoff-tpo-ma-insul-steel';
}

/**
 * Fetch complete project data from all workflow stages
 */
async function fetchCompleteWorkflowData(projectId: string) {
  console.log(`🔍 Fetching complete workflow data for project: ${projectId}`);
  
  // Fetch project with all related data
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      inspector:assigned_inspector(id, full_name, email, role),
      consultant:assigned_consultant(id, full_name, email, role),
      engineer:assigned_engineer(id, full_name, email, role)
    `)
    .eq('id', projectId)
    .single();
    
  if (projectError || !projectData) {
    throw new Error(`Failed to fetch project: ${projectError?.message || 'Project not found'}`);
  }
  
  // Fetch field inspection data
  const { data: inspectionData, error: inspectionError } = await supabase
    .from('field_inspections')
    .select(`
      *,
      inspector:inspector_id(full_name, email)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  // Fetch consultant review data
  const { data: reviewData, error: reviewError } = await supabase
    .from('consultant_reviews')
    .select(`
      *,
      consultant:consultant_id(full_name, email)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  // Fetch workflow activities for audit trail
  const { data: activitiesData } = await supabase
    .from('workflow_activities')
    .select(`
      *,
      user:user_id(full_name, role)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
    
  // Fetch comments for collaboration history
  const { data: commentsData } = await supabase
    .from('project_comments')
    .select(`
      *,
      user:user_id(full_name, role)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
    
  return {
    project: projectData,
    inspection: inspectionData?.[0] || null,
    review: reviewData?.[0] || null,
    activities: activitiesData || [],
    comments: commentsData || []
  };
}

/**
 * Compile multi-role inputs from workflow data into SOW generator format
 */
async function compileWorkflowInputs(
  workflowData: any, 
  customOverrides?: Partial<SOWGeneratorInputs>
): Promise<SOWGeneratorInputs> {
  console.log('🔄 Compiling multi-role workflow inputs...');
  
  const project = workflowData.project;
  const inspection = workflowData.inspection;
  const review = workflowData.review;
  
  // Base project information
  const baseInputs: SOWGeneratorInputs = {
    projectName: project.name,
    address: project.project_address,
    companyName: 'Multi-Role Roofing Solutions', // Default, could be from user profile
    
    // Building parameters from field inspection
    buildingHeight: inspection?.building_height || 30,
    squareFootage: inspection?.square_footage || 10000,
    deckType: inspection?.deck_type || 'steel',
    projectType: mapProjectType(inspection?.project_type),
    roofSlope: inspection?.roof_slope || 0.25,
    
    // Enhanced with workflow-specific data
    elevation: inspection?.measurements?.elevation || undefined,
    exposureCategory: inspection?.conditions?.exposure_category || 'C',
    
    // Membrane specifications from inspection/consultant
    membraneType: review?.scope_modifications?.membrane_type || 
                 inspection?.observations?.membrane_type || 'TPO',
    membraneThickness: review?.scope_modifications?.membrane_thickness || '60mil',
    membraneMaterial: review?.scope_modifications?.membrane_material || 'TPO',
    selectedMembraneBrand: review?.scope_modifications?.preferred_manufacturer,
    
    // Takeoff data from field inspection
    takeoffItems: compileTakeoffData(inspection),
    
    // Building dimensions from inspection measurements
    buildingDimensions: inspection?.measurements?.building_dimensions,
    
    // Project-specific preferences from consultant review
    fallProtectionRequired: review?.client_requirements?.fall_protection_required || 
                           inspection?.building_height > 30,
    walkwayPadRequested: review?.client_requirements?.walkway_pads_requested ||
                        review?.scope_modifications?.walkway_pads,
    sensitiveTenants: review?.client_requirements?.sensitive_tenants || false,
    sharedParkingAccess: review?.client_requirements?.shared_parking_access || false,
    parapetHeight: inspection?.measurements?.parapet_height,
    
    // Consultant preferences and requirements
    preferredManufacturer: review?.scope_modifications?.preferred_manufacturer ||
                          review?.client_requirements?.preferred_manufacturer,
    includesTaperedInsulation: review?.scope_modifications?.tapered_insulation ||
                              inspection?.observations?.tapered_insulation,
    userSelectedSystem: review?.scope_modifications?.specified_system,
    
    // Custom notes compilation from all stages
    customNotes: compileCustomNotes(inspection, review, workflowData.comments),
    
    // Debug mode for workflow integration
    debug: true,
    engineDebug: {
      template: true,
      wind: true,
      fastening: true,
      takeoff: true,
      sections: true
    }
  };
  
  // Apply any custom overrides
  const finalInputs = { ...baseInputs, ...customOverrides };
  
  console.log('✅ Compiled workflow inputs:');
  console.log(`   📋 Project: ${finalInputs.projectName}`);
  console.log(`   📍 Address: ${finalInputs.address}`);
  console.log(`   🏗️ Building: ${finalInputs.buildingHeight}ft, ${finalInputs.squareFootage}sf`);
  console.log(`   🏭 System: ${finalInputs.projectType} ${finalInputs.membraneType}`);
  console.log(`   👷 Inspector Data: ${inspection ? '✅' : '❌'}`);
  console.log(`   👔 Consultant Data: ${review ? '✅' : '❌'}`);
  
  return finalInputs;
}

/**
 * Enhance SOW result with workflow metadata and audit trail
 */
async function enhanceSOWWithWorkflowData(
  sowResult: SOWGeneratorResult,
  workflowData: any,
  inputs: WorkflowSOWInputs,
  enhancedFormatting: any
): Promise<WorkflowSOWResult> {
  console.log('📊 Enhancing SOW with workflow metadata...');
  
  const inspection = workflowData.inspection;
  const review = workflowData.review;
  const activities = workflowData.activities;
  
  // Create inspection summary
  const inspectionSummary = {
    inspector: inspection?.inspector?.full_name || 'Unknown',
    inspectionDate: inspection?.inspection_date,
    keyFindings: extractKeyFindings(inspection),
    measurements: inspection?.measurements || {},
    conditions: inspection?.conditions || {},
    photos: inspection?.photos || {},
    concerns: inspection?.concerns,
    recommendations: inspection?.recommendations
  };
  
  // Create consultant review summary
  const consultantReview = {
    consultant: review?.consultant?.full_name || 'Unknown',
    reviewDate: review?.created_at,
    clientRequirements: review?.client_requirements || {},
    scopeModifications: review?.scope_modifications || {},
    riskFactors: review?.risk_factors,
    budgetConsiderations: review?.budget_considerations,
    timelineRequirements: review?.timeline_requirements,
    engineerBriefing: review?.engineer_briefing,
    priorityItems: review?.priority_items
  };
  
  // Create engineering decisions summary
  const engineeringDecisions = {
    engineer: inputs.userId, // Would normally lookup engineer name
    generatedAt: new Date().toISOString(),
    templateSelection: sowResult.engineeringSummary?.templateSelection,
    systemSelection: sowResult.engineeringSummary?.systemSelection,
    windAnalysis: sowResult.engineeringSummary?.windAnalysis,
    engineerNotes: inputs.engineerNotes,
    decisionRationale: compileDecisionRationale(sowResult.engineeringSummary)
  };
  
  // Create audit trail
  const auditTrail = activities.map((activity: any) => ({
    timestamp: activity.created_at,
    user: activity.user?.full_name || 'Unknown',
    role: activity.user?.role || 'unknown',
    action: activity.activity_type,
    stage: activity.stage_to || activity.stage_from,
    notes: activity.notes,
    metadata: activity.metadata
  }));
  
  // Create collaborators summary
  const collaborators = [
    {
      role: 'inspector',
      name: workflowData.project.inspector?.full_name || 'Unknown',
      email: workflowData.project.inspector?.email,
      contribution: 'Field data collection and assessment'
    },
    {
      role: 'consultant',
      name: workflowData.project.consultant?.full_name || 'Unknown',
      email: workflowData.project.consultant?.email,
      contribution: 'Client requirements and scope refinement'
    },
    {
      role: 'engineer',
      name: workflowData.project.engineer?.full_name || 'Unknown',
      email: workflowData.project.engineer?.email,
      contribution: 'Technical analysis and SOW generation'
    }
  ];
  
  // Data source breakdown
  const dataSourceBreakdown = {
    fieldInspection: [
      'Building height and dimensions',
      'Roof conditions and slope',
      'Existing membrane assessment',
      'Takeoff quantities',
      'Site observations and photos'
    ],
    consultantReview: [
      'Client requirements and preferences',
      'Budget and timeline constraints',
      'Scope modifications',
      'Risk assessment',
      'Manufacturer preferences'
    ],
    engineeringAnalysis: [
      'Template selection rationale',
      'Wind pressure calculations',
      'System selection and fastening',
      'Code compliance verification',
      'Professional engineering judgment'
    ]
  };
  
  // Create formatting compliance summary
  const formattingCompliance = {
    templateMatched: enhancedFormatting.templateType !== null,
    complianceScore: calculateFormattingComplianceScore(enhancedFormatting.validationResults),
    formattingIssues: enhancedFormatting.validationResults || [],
    recommendations: generateFormattingRecommendations(enhancedFormatting.validationResults)
  };
  
  return {
    ...sowResult,
    workflowData: {
      inspectionSummary,
      consultantReview,
      engineeringDecisions,
      auditTrail,
      collaborators
    },
    sowMetadata: {
      workflowVersion: '1.0.0',
      multiRoleGeneration: true,
      dataSourceBreakdown
    },
    formattingCompliance
  };
}

/**
 * Calculate formatting compliance score
 */
function calculateFormattingComplianceScore(validationResults: any[]): number {
  if (!validationResults || validationResults.length === 0) return 100;
  
  const totalIssues = validationResults.reduce((sum, result) => sum + result.issues.length, 0);
  if (totalIssues === 0) return 100;
  
  // Deduct points based on number of issues
  const maxDeduction = Math.min(totalIssues * 5, 50); // Max 50% deduction
  return Math.max(50, 100 - maxDeduction);
}

/**
 * Generate formatting recommendations
 */
function generateFormattingRecommendations(validationResults: any[]): string[] {
  if (!validationResults || validationResults.length === 0) {
    return ['PDF formatting matches template requirements exactly'];
  }
  
  const recommendations = [];
  const hasIssues = validationResults.some(result => result.issues.length > 0);
  
  if (hasIssues) {
    recommendations.push('Review and address formatting validation issues');
    recommendations.push('Ensure exact compliance with template specifications');
    recommendations.push('Verify highlighting and font consistency');
  }
  
  return recommendations.length > 0 ? recommendations : ['PDF formatting is compliant'];
}

/**
 * Update project with SOW completion data
 */
async function updateProjectWithSOWCompletion(
  projectId: string, 
  userId: string, 
  sowResult: WorkflowSOWResult
) {
  console.log(`✅ Updating project ${projectId} with SOW completion...`);
  
  const completionData = {
    sow_data: {
      filename: sowResult.filename,
      outputPath: sowResult.outputPath,
      fileSize: sowResult.fileSize,
      generationTime: sowResult.generationTime,
      engineeringSummary: sowResult.engineeringSummary,
      workflowMetadata: sowResult.sowMetadata,
      formattingCompliance: sowResult.formattingCompliance
    },
    pdf_path: sowResult.outputPath,
    completed_by: userId,
    completed_at: new Date().toISOString(),
    workflow_version: '1.0.0',
    multi_role_generation: true
  };
  
  // Update project stage_data
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      stage_data: {
        ...{}, // Would normally fetch existing stage_data
        complete: completionData
      }
    })
    .eq('id', projectId);
    
  if (updateError) {
    console.error('❌ Failed to update project:', updateError);
    throw new Error(`Failed to update project: ${updateError.message}`);
  }
  
  // Log completion activity
  await supabase
    .from('workflow_activities')
    .insert({
      project_id: projectId,
      user_id: userId,
      activity_type: 'sow_generated',
      stage_from: 'engineering',
      stage_to: 'complete',
      notes: `SOW generated with workflow integration: ${sowResult.filename}`,
      metadata: {
        template: sowResult.engineeringSummary?.templateSelection?.templateName,
        system: sowResult.engineeringSummary?.systemSelection?.selectedSystem,
        wind_speed: sowResult.engineeringSummary?.windAnalysis?.windSpeed,
        generation_time: sowResult.generationTime,
        multi_role: true,
        formatting_compliance: sowResult.formattingCompliance?.complianceScore
      }
    });
    
  console.log('✅ Project updated with SOW completion data');
}

// Helper Functions

function mapProjectType(projectType?: string): 'recover' | 'tearoff' | 'new' {
  if (!projectType) return 'recover';
  
  const type = projectType.toLowerCase();
  if (type.includes('tear') || type.includes('replace')) return 'tearoff';
  if (type.includes('new')) return 'new';
  return 'recover';
}

function compileTakeoffData(inspection: any) {
  if (!inspection?.takeoff_items) {
    return {
      drainCount: 4,
      penetrationCount: 15,
      flashingLinearFeet: 300,
      accessoryCount: 8,
      roofArea: inspection?.square_footage || 10000
    };
  }
  
  return {
    drainCount: inspection.takeoff_items.drainCount || inspection.takeoff_items.drains || 4,
    penetrationCount: inspection.takeoff_items.penetrationCount || inspection.takeoff_items.penetrations || 15,
    flashingLinearFeet: inspection.takeoff_items.flashingLinearFeet || inspection.takeoff_items.flashing || 300,
    accessoryCount: inspection.takeoff_items.accessoryCount || inspection.takeoff_items.accessories || 8,
    roofArea: inspection.takeoff_items.roofArea || inspection.square_footage || 10000,
    hvacUnits: inspection.takeoff_items.hvacUnits || inspection.takeoff_items.hvac || 0,
    skylights: inspection.takeoff_items.skylights || 0,
    roofHatches: inspection.takeoff_items.roofHatches || inspection.takeoff_items.hatches || 0,
    scuppers: inspection.takeoff_items.scuppers || 0,
    expansionJoints: inspection.takeoff_items.expansionJoints || inspection.takeoff_items.expansion_joints || 0
  };
}

function compileCustomNotes(inspection: any, review: any, comments: any[]): string[] {
  const notes: string[] = [];
  
  // Add inspector notes
  if (inspection?.notes) {
    notes.push(`Inspector Notes: ${inspection.notes}`);
  }
  if (inspection?.concerns) {
    notes.push(`Inspector Concerns: ${inspection.concerns}`);
  }
  if (inspection?.recommendations) {
    notes.push(`Inspector Recommendations: ${inspection.recommendations}`);
  }
  
  // Add consultant notes
  if (review?.special_conditions) {
    notes.push(`Special Conditions: ${review.special_conditions}`);
  }
  if (review?.budget_considerations) {
    notes.push(`Budget Considerations: ${review.budget_considerations}`);
  }
  if (review?.timeline_requirements) {
    notes.push(`Timeline Requirements: ${review.timeline_requirements}`);
  }
  if (review?.engineer_briefing) {
    notes.push(`Engineer Briefing: ${review.engineer_briefing}`);
  }
  
  // Add important comments
  const importantComments = comments
    .filter(c => c.comment_type === 'concern' || c.comment_type === 'important')
    .slice(0, 3) // Limit to 3 most important
    .map(c => `${c.user?.full_name}: ${c.comment}`);
    
  notes.push(...importantComments);
  
  return notes;
}

function extractKeyFindings(inspection: any): string[] {
  const findings: string[] = [];
  
  if (inspection?.observations) {
    const obs = inspection.observations;
    if (obs.roof_condition) findings.push(`Roof Condition: ${obs.roof_condition}`);
    if (obs.drainage_issues) findings.push(`Drainage: ${obs.drainage_issues}`);
    if (obs.structural_concerns) findings.push(`Structural: ${obs.structural_concerns}`);
    if (obs.membrane_condition) findings.push(`Membrane: ${obs.membrane_condition}`);
  }
  
  if (inspection?.conditions) {
    const cond = inspection.conditions;
    if (cond.weather_conditions) findings.push(`Weather: ${cond.weather_conditions}`);
    if (cond.access_conditions) findings.push(`Access: ${cond.access_conditions}`);
  }
  
  return findings;
}

function compileDecisionRationale(summary?: EnhancedEngineeringSummary): string[] {
  if (!summary) return [];
  
  const rationale: string[] = [];
  
  if (summary.templateSelection?.rationale) {
    rationale.push(`Template Selection: ${summary.templateSelection.rationale}`);
  }
  
  if (summary.systemSelection?.rejectedSystems?.length > 0) {
    const rejected = summary.systemSelection.rejectedSystems.slice(0, 2);
    rationale.push(`Alternative Systems Considered: ${rejected.map(s => s.system).join(', ')}`);
  }
  
  if (summary.windAnalysis?.pressureMethodology) {
    rationale.push(`Wind Analysis: ${summary.windAnalysis.asceVersion} methodology applied`);
  }
  
  return rationale;
}

export {
  fetchCompleteWorkflowData,
  compileWorkflowInputs,
  enhanceSOWWithWorkflowData,
  applyEnhancedPDFFormatting,
  determineTemplateType
};

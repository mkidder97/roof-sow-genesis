import { supabase } from '../lib/supabase';
import type { 
  Project, 
  ProjectInsert, 
  ProjectUpdate, 
  SOWOutput, 
  SOWOutputInsert, 
  SOWOutputUpdate,
  ProjectWithSOWs,
  SOWOutputWithProject
} from '../types/supabase';
import type { SOWGeneratorInputs, EngineeringSummaryOutput } from '../core/sow-generator';

// Default test user ID for development/testing when no auth is provided
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Find or create a project based on name and address
 */
export async function findOrCreateProject(
  inputs: SOWGeneratorInputs, 
  userId?: string
): Promise<{ project: Project; isNew: boolean }> {
  const effectiveUserId = userId || TEST_USER_ID;
  
  try {
    // First, try to find existing project by name and address
    const { data: existingProjects, error: searchError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('name', inputs.projectName)
      .eq('address', inputs.address)
      .limit(1);

    if (searchError) {
      console.error('❌ Error searching for existing project:', searchError);
      throw new Error(`Database search error: ${searchError.message}`);
    }

    // If project exists, update it with latest data and return
    if (existingProjects && existingProjects.length > 0) {
      const existingProject = existingProjects[0];
      console.log(`📄 Found existing project: ${existingProject.id}`);
      
      // Update with latest input data
      const updateData = mapInputsToProjectUpdate(inputs);
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', existingProject.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating existing project:', updateError);
        throw new Error(`Project update error: ${updateError.message}`);
      }

      return { project: updatedProject, isNew: false };
    }

    // Create new project
    const projectData = mapInputsToProjectInsert(inputs, effectiveUserId);
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating new project:', insertError);
      throw new Error(`Project creation error: ${insertError.message}`);
    }

    console.log(`✨ Created new project: ${newProject.id}`);
    return { project: newProject, isNew: true };

  } catch (error) {
    console.error('❌ Database operation failed:', error);
    throw error;
  }
}

/**
 * Save SOW output metadata to database
 */
export async function saveSOWOutput(
  projectId: string,
  engineeringSummary: EngineeringSummaryOutput,
  pdfInfo: {
    filename: string;
    outputPath: string;
    fileSize: number;
    generationTime: number;
  },
  userId?: string
): Promise<SOWOutput> {
  const effectiveUserId = userId || TEST_USER_ID;

  try {
    const sowData: SOWOutputInsert = {
      project_id: projectId,
      user_id: effectiveUserId,
      template_name: engineeringSummary.templateSelection.templateName,
      rationale: engineeringSummary.templateSelection.rationale,
      asce_version: engineeringSummary.jurisdictionAnalysis.jurisdiction.asceVersion,
      hvhz: engineeringSummary.jurisdictionAnalysis.jurisdiction.hvhz,
      wind_speed: engineeringSummary.jurisdictionAnalysis.windAnalysis.basicWindSpeed,
      
      // Zone pressures (stored as negative for uplift)
      zone1_field: engineeringSummary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone1Field,
      zone1_perimeter: engineeringSummary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone1Perimeter,
      zone2_perimeter: engineeringSummary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone2Perimeter,
      zone3_corner: engineeringSummary.jurisdictionAnalysis.windAnalysis.windUpliftPressures.zone3Corner,
      
      // Manufacturer and fastening specifications
      manufacturer: engineeringSummary.systemSelection.selectedSystem.manufacturer,
      spacing_field: engineeringSummary.systemSelection.fasteningSpecifications.fieldSpacing,
      spacing_perimeter: engineeringSummary.systemSelection.fasteningSpecifications.perimeterSpacing,
      spacing_corner: engineeringSummary.systemSelection.fasteningSpecifications.cornerSpacing,
      penetration_depth: engineeringSummary.systemSelection.fasteningSpecifications.penetrationDepth,
      
      // Takeoff risk assessment
      takeoff_risk: engineeringSummary.metadata.takeoffSummary.overallRisk,
      key_issues: engineeringSummary.metadata.takeoffSummary.keyIssues,
      
      // PDF file information
      file_url: pdfInfo.outputPath, // This should be a publicly accessible URL
      filename: pdfInfo.filename,
      file_size: pdfInfo.fileSize,
      generation_time_ms: pdfInfo.generationTime,
      
      // Complete engineering summary as JSONB
      engineering_summary: engineeringSummary as any,
      
      // Additional metadata
      metadata: {
        engineVersion: 'v3.0.0',
        generatedAt: new Date().toISOString(),
        calculationFactors: engineeringSummary.jurisdictionAnalysis.windAnalysis.calculationFactors,
        templateApplicableConditions: engineeringSummary.templateSelection.applicableConditions,
        complianceNotes: engineeringSummary.metadata.complianceNotes
      }
    };

    const { data: sowOutput, error } = await supabase
      .from('sow_outputs')
      .insert(sowData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving SOW output:', error);
      throw new Error(`SOW output save error: ${error.message}`);
    }

    console.log(`💾 Saved SOW output: ${sowOutput.id}`);
    return sowOutput;

  } catch (error) {
    console.error('❌ Failed to save SOW output:', error);
    throw error;
  }
}

/**
 * Get project with all SOW outputs
 */
export async function getProjectWithSOWs(projectId: string, userId?: string): Promise<ProjectWithSOWs | null> {
  const effectiveUserId = userId || TEST_USER_ID;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        sow_outputs (*)
      `)
      .eq('id', projectId)
      .eq('user_id', effectiveUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data as ProjectWithSOWs;

  } catch (error) {
    console.error('❌ Error fetching project with SOWs:', error);
    throw error;
  }
}

/**
 * Get all projects for a user
 */
export async function getUserProjects(userId?: string, limit: number = 50): Promise<ProjectWithSOWs[]> {
  const effectiveUserId = userId || TEST_USER_ID;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        sow_outputs (
          id,
          template_name,
          filename,
          file_url,
          created_at,
          takeoff_risk,
          wind_speed,
          hvhz
        )
      `)
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as ProjectWithSOWs[];

  } catch (error) {
    console.error('❌ Error fetching user projects:', error);
    throw error;
  }
}

/**
 * Get SOW output by ID with project info
 */
export async function getSOWOutput(sowId: string, userId?: string): Promise<SOWOutputWithProject | null> {
  const effectiveUserId = userId || TEST_USER_ID;

  try {
    const { data, error } = await supabase
      .from('sow_outputs')
      .select(`
        *,
        project:projects (*)
      `)
      .eq('id', sowId)
      .eq('user_id', effectiveUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data as SOWOutputWithProject;

  } catch (error) {
    console.error('❌ Error fetching SOW output:', error);
    throw error;
  }
}

/**
 * Update SOW output (for file URL updates, etc.)
 */
export async function updateSOWOutput(sowId: string, updates: SOWOutputUpdate, userId?: string): Promise<SOWOutput> {
  const effectiveUserId = userId || TEST_USER_ID;

  try {
    const { data, error } = await supabase
      .from('sow_outputs')
      .update(updates)
      .eq('id', sowId)
      .eq('user_id', effectiveUserId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`🔄 Updated SOW output: ${sowId}`);
    return data;

  } catch (error) {
    console.error('❌ Error updating SOW output:', error);
    throw error;
  }
}

/**
 * Delete project and all associated SOW outputs
 */
export async function deleteProject(projectId: string, userId?: string): Promise<boolean> {
  const effectiveUserId = userId || TEST_USER_ID;

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', effectiveUserId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`🗑️ Deleted project: ${projectId}`);
    return true;

  } catch (error) {
    console.error('❌ Error deleting project:', error);
    throw error;
  }
}

// Helper functions to map between types
function mapInputsToProjectInsert(inputs: SOWGeneratorInputs, userId: string): ProjectInsert {
  return {
    user_id: userId,
    name: inputs.projectName,
    address: inputs.address,
    company_name: inputs.companyName,
    square_footage: inputs.squareFootage,
    building_height: inputs.buildingHeight,
    building_dimensions: inputs.buildingDimensions,
    deck_type: inputs.deckType,
    project_type: inputs.projectType,
    roof_slope: inputs.roofSlope,
    elevation: inputs.elevation,
    exposure_category: inputs.exposureCategory,
    membrane_type: inputs.membraneType,
    membrane_thickness: inputs.membraneThickness,
    membrane_material: inputs.membraneMaterial,
    selected_membrane_brand: inputs.selectedMembraneBrand,
    takeoff_data: inputs.takeoffItems,
    basic_wind_speed: inputs.basicWindSpeed,
    preferred_manufacturer: inputs.preferredManufacturer,
    includes_tapered_insulation: inputs.includesTaperedInsulation,
    user_selected_system: inputs.userSelectedSystem,
    custom_notes: inputs.customNotes
  };
}

function mapInputsToProjectUpdate(inputs: SOWGeneratorInputs): ProjectUpdate {
  return {
    company_name: inputs.companyName,
    square_footage: inputs.squareFootage,
    building_height: inputs.buildingHeight,
    building_dimensions: inputs.buildingDimensions,
    deck_type: inputs.deckType,
    project_type: inputs.projectType,
    roof_slope: inputs.roofSlope,
    elevation: inputs.elevation,
    exposure_category: inputs.exposureCategory,
    membrane_type: inputs.membraneType,
    membrane_thickness: inputs.membraneThickness,
    membrane_material: inputs.membraneMaterial,
    selected_membrane_brand: inputs.selectedMembraneBrand,
    takeoff_data: inputs.takeoffItems,
    basic_wind_speed: inputs.basicWindSpeed,
    preferred_manufacturer: inputs.preferredManufacturer,
    includes_tapered_insulation: inputs.includesTaperedInsulation,
    user_selected_system: inputs.userSelectedSystem,
    custom_notes: inputs.customNotes
  };
}

/**
 * Database health check
 */
export async function databaseHealthCheck() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1);

    return {
      status: error ? 'error' : 'ok',
      connected: !error,
      error: error?.message,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

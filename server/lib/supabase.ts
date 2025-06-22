/**
 * SUPABASE CLIENT SETUP
 * Database integration for SOW Generator project storage
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase environment variables not configured. Database features will be disabled.');
  console.warn('   Set SUPABASE_URL and SUPABASE_KEY in your .env file to enable database storage.');
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Database table interfaces matching Lovable's schema
export interface ProjectInput {
  id?: string;
  user_id?: string;
  project_name: string;
  address: string;
  company_name: string;
  square_footage: number;
  building_height: number;
  length?: number;
  width?: number;
  project_type: string;
  membrane_thickness: string;
  membrane_color: string;
  created_at?: string;
}

export interface SOWOutput {
  id?: string;
  project_id: string;
  template_name: string;
  rationale: string;
  asce_version: string;
  wind_speed: number;
  hvhz: boolean;
  zone1_field: number;
  zone2_perimeter: number;
  zone3_corner: number;
  manufacturer: string;
  spacing_corner: string;
  spacing_field: string;
  penetration_depth: string;
  takeoff_risk: string;
  key_issues: string;
  generation_time_ms: number;
  file_url: string;
  created_at?: string;
}

/**
 * Check if Supabase is configured and available
 */
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

/**
 * Save project inputs to the projects table
 */
export async function saveProjectInputs(projectData: ProjectInput): Promise<string | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - skipping project save');
    return null;
  }

  try {
    console.log('💾 Saving project inputs to Supabase...');
    
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error saving project to Supabase:', error);
      return null;
    }

    console.log(`✅ Project saved to Supabase with ID: ${data.id}`);
    return data.id;
    
  } catch (error) {
    console.error('❌ Supabase save error:', error);
    return null;
  }
}

/**
 * Save SOW output metadata to the sow_outputs table
 */
export async function saveSOWOutput(outputData: SOWOutput): Promise<string | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - skipping SOW output save');
    return null;
  }

  try {
    console.log('💾 Saving SOW output metadata to Supabase...');
    
    const { data, error } = await supabase
      .from('sow_outputs')
      .insert([outputData])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error saving SOW output to Supabase:', error);
      return null;
    }

    console.log(`✅ SOW output saved to Supabase with ID: ${data.id}`);
    return data.id;
    
  } catch (error) {
    console.error('❌ Supabase SOW output save error:', error);
    return null;
  }
}

/**
 * Fetch project history for a user
 */
export async function getProjectHistory(userId: string): Promise<ProjectInput[]> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - returning empty history');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching project history:', error);
      return [];
    }

    return data || [];
    
  } catch (error) {
    console.error('❌ Supabase fetch error:', error);
    return [];
  }
}

/**
 * Fetch SOW outputs for a specific project
 */
export async function getProjectSOWs(projectId: string): Promise<SOWOutput[]> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - returning empty SOW history');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('sow_outputs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching project SOWs:', error);
      return [];
    }

    return data || [];
    
  } catch (error) {
    console.error('❌ Supabase SOW fetch error:', error);
    return [];
  }
}

/**
 * Get project with its SOW outputs
 */
export async function getProjectWithSOWs(projectId: string): Promise<{
  project: ProjectInput | null;
  sows: SOWOutput[];
}> {
  if (!supabase) {
    return { project: null, sows: [] };
  }

  try {
    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('❌ Error fetching project:', projectError);
      return { project: null, sows: [] };
    }

    // Fetch associated SOWs
    const sows = await getProjectSOWs(projectId);

    return { project, sows };
    
  } catch (error) {
    console.error('❌ Error fetching project with SOWs:', error);
    return { project: null, sows: [] };
  }
}

/**
 * Update project inputs
 */
export async function updateProject(projectId: string, updates: Partial<ProjectInput>): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - skipping project update');
    return false;
  }

  try {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      console.error('❌ Error updating project:', error);
      return false;
    }

    console.log(`✅ Project ${projectId} updated successfully`);
    return true;
    
  } catch (error) {
    console.error('❌ Supabase update error:', error);
    return false;
  }
}

/**
 * Delete a project and its associated SOWs
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - skipping project deletion');
    return false;
  }

  try {
    // First delete associated SOWs
    await supabase
      .from('sow_outputs')
      .delete()
      .eq('project_id', projectId);

    // Then delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('❌ Error deleting project:', error);
      return false;
    }

    console.log(`✅ Project ${projectId} deleted successfully`);
    return true;
    
  } catch (error) {
    console.error('❌ Supabase deletion error:', error);
    return false;
  }
}

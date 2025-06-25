
import { supabase } from "@/integrations/supabase/client";
import { SOWGenerationRequest, SOWGenerationRecord, DashboardMetrics, GenerationStatus } from "@/types/sow";

// Create new SOW generation record
export async function createSOWGeneration(data: {
  inspectionId?: string;
  templateType: string;
  inputData: SOWGenerationRequest;
}): Promise<{ data: SOWGenerationRecord | null; error: string | null }> {
  try {
    // Separate file handling from JSON data
    const { takeoffFile, ...jsonData } = data.inputData;
    
    const { data: result, error } = await supabase
      .from('sow_generations')
      .insert({
        inspection_id: data.inspectionId,
        template_type: data.templateType,
        generation_status: 'pending' as GenerationStatus,
        input_data: jsonData,
        generation_started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data: result as SOWGenerationRecord, error: null };
  } catch (error) {
    console.error('Error creating SOW generation:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Update SOW generation status
export async function updateSOWGeneration(
  id: string, 
  updates: Partial<SOWGenerationRecord>
): Promise<{ data: SOWGenerationRecord | null; error: string | null }> {
  try {
    const { data: result, error } = await supabase
      .from('sow_generations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: result as SOWGenerationRecord, error: null };
  } catch (error) {
    console.error('Error updating SOW generation:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get SOW generation by ID
export async function getSOWGeneration(id: string): Promise<{ data: SOWGenerationRecord | null; error: string | null }> {
  try {
    const { data: result, error } = await supabase
      .from('sow_generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: result as SOWGenerationRecord, error: null };
  } catch (error) {
    console.error('Error fetching SOW generation:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get SOW generation history for user
export async function getSOWHistory(limit: number = 10): Promise<{ data: SOWGenerationRecord[]; error: string | null }> {
  try {
    const { data: result, error } = await supabase
      .from('sow_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: (result || []) as SOWGenerationRecord[], error: null };
  } catch (error) {
    console.error('Error fetching SOW history:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get dashboard metrics
export async function getDashboardMetrics(): Promise<{ data: DashboardMetrics | null; error: string | null }> {
  try {
    // Get inspection count
    const { count: totalInspections, error: inspectionError } = await supabase
      .from('field_inspections')
      .select('*', { count: 'exact', head: true });

    if (inspectionError) throw inspectionError;

    // Get SOW generation stats
    const { data: sowStats, error: sowError } = await supabase
      .from('sow_generations')
      .select('generation_status, generation_duration_seconds, created_at');

    if (sowError) throw sowError;

    const totalSOWsGenerated = sowStats?.filter(s => s.generation_status === 'completed').length || 0;
    const pendingSOWs = sowStats?.filter(s => s.generation_status === 'pending' || s.generation_status === 'processing').length || 0;
    
    const completedSOWs = sowStats?.filter(s => s.generation_status === 'completed' && s.generation_duration_seconds) || [];
    const avgGenerationTime = completedSOWs.length > 0 
      ? completedSOWs.reduce((sum, sow) => sum + (sow.generation_duration_seconds || 0), 0) / completedSOWs.length
      : 0;

    // Get recent generations
    const { data: recentGenerations, error: recentError } = await supabase
      .from('sow_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    return {
      data: {
        totalInspections: totalInspections || 0,
        totalSOWsGenerated,
        pendingSOWs,
        avgGenerationTime: Math.round(avgGenerationTime),
        recentGenerations: (recentGenerations || []) as SOWGenerationRecord[]
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Update inspection SOW status
export async function updateInspectionSOWStatus(inspectionId: string, sowGenerated: boolean): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('field_inspections')
      .update({ 
        sow_generated: sowGenerated,
        sow_generation_count: sowGenerated ? 1 : 0
      })
      .eq('id', inspectionId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating inspection SOW status:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get available templates
export async function getSOWTemplates(): Promise<{ data: any[]; error: string | null }> {
  try {
    const { data: result, error } = await supabase
      .from('sow_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { data: result || [], error: null };
  } catch (error) {
    console.error('Error fetching SOW templates:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Export the record type for use in other files
export type { SOWGenerationRecord };

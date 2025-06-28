import { supabase } from '@/integrations/supabase/client';
import { SOWGenerationRequest, SOWGenerationRecord, DashboardMetrics, GenerationStatus } from '@/types/sow';

export async function createSOWGeneration(data: { 
  inspectionId?: string; 
  templateType: string; 
  inputData: SOWGenerationRequest 
}) {
  try {
    // Create a clean serializable copy without File objects
    const { takeoffFile, ...serializableData } = data.inputData;
    
    // Serialize complex objects for database storage
    const serializedInputData = {
      ...serializableData,
      // Convert ASCERequirements to plain object for JSON storage
      asceRequirements: data.inputData.asceRequirements ? JSON.stringify(data.inputData.asceRequirements) : null,
      // Store takeoff file metadata if present
      takeoffFileMetadata: takeoffFile ? {
        name: takeoffFile.name,
        size: takeoffFile.size,
        type: takeoffFile.type
      } : null
    };

    const { data: result, error } = await supabase
      .from('sow_generations')
      .insert({
        inspectionId: data.inspectionId, // Use correct column name
        template_type: data.templateType,
        input_data: serializedInputData,
        generation_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { data: result, error: null };
  } catch (error) {
    console.error('Failed to create SOW generation:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to create SOW generation' 
    };
  }
}

export async function updateSOWGeneration(id: string, updates: Partial<SOWGenerationRecord>) {
  try {
    const { data, error } = await supabase
      .from('sow_generations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Failed to update SOW generation:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to update SOW generation' 
    };
  }
}

export async function getSOWGeneration(id: string) {
  try {
    const { data, error } = await supabase
      .from('sow_generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Failed to get SOW generation:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to get SOW generation' 
    };
  }
}

export async function getSOWHistory(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('sow_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Cast the data to correct type with proper GenerationStatus
    const typedData = (data || []).map(item => ({
      ...item,
      generation_status: item.generation_status as GenerationStatus
    })) as SOWGenerationRecord[];
    
    return { data: typedData, error: null };
  } catch (error) {
    console.error('Failed to get SOW history:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to get SOW history' 
    };
  }
}

export async function getDashboardMetrics(): Promise<{ data: DashboardMetrics | null; error: string | null }> {
  try {
    // Get total inspections
    const { count: totalInspections, error: inspectionsError } = await supabase
      .from('field_inspections')
      .select('*', { count: 'exact', head: true });

    if (inspectionsError) throw inspectionsError;

    // Get SOW generation stats
    const { data: sowStats, error: sowError } = await supabase
      .from('sow_generations')
      .select('generation_status, generation_duration_seconds, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (sowError) throw sowError;

    const totalSOWsGenerated = sowStats?.length || 0;
    const pendingSOWs = sowStats?.filter(s => s.generation_status === 'pending').length || 0;
    const completedSOWs = sowStats?.filter(s => s.generation_status === 'completed') || [];
    const avgGenerationTime = completedSOWs.length > 0 
      ? completedSOWs.reduce((acc, sow) => acc + (sow.generation_duration_seconds || 0), 0) / completedSOWs.length
      : 0;

    // Get recent generations (last 10)
    const { data: recentGenerations, error: recentError } = await supabase
      .from('sow_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    // Cast to proper types
    const typedRecentGenerations = (recentGenerations || []).map(item => ({
      ...item,
      generation_status: item.generation_status as GenerationStatus
    })) as SOWGenerationRecord[];

    const metrics: DashboardMetrics = {
      totalInspections: totalInspections || 0,
      totalSOWsGenerated,
      pendingSOWs,
      avgGenerationTime,
      recentGenerations: typedRecentGenerations
    };

    return { data: metrics, error: null };
  } catch (error) {
    console.error('Failed to get dashboard metrics:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to get dashboard metrics' 
    };
  }
}

export async function updateInspectionSOWStatus(inspectionId: string, sowGenerated: boolean) {
  try {
    const { error } = await supabase
      .from('field_inspections')
      .update({ sow_generated: sowGenerated })
      .eq('id', inspectionId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Failed to update inspection SOW status:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to update inspection SOW status' 
    };
  }
}

export async function getSOWTemplates() {
  try {
    const { data, error } = await supabase
      .from('sow_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Failed to get SOW templates:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to get SOW templates' 
    };
  }
}

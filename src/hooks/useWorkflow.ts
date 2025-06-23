
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkflowProject {
  id: string;
  project_name: string;
  address: string;
  current_stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete';
  user_id: string;
  assigned_inspector?: string;
  assigned_consultant?: string;
  assigned_engineer?: string;
  workflow_status: any;
  stage_data: any;
  building_height?: number;
  square_footage?: number;
  deck_type?: string;
  project_type?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  project_name: string;
  address: string;
  assigned_inspector?: string;
  assigned_consultant?: string;
  assigned_engineer?: string;
  building_height?: number;
  square_footage?: number;
  deck_type?: string;
  project_type?: string;
}

export function useWorkflow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<WorkflowProject | null>(null);

  // Get user's projects based on their role
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['workflow-projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          inspector:assigned_inspector(full_name, email),
          consultant:assigned_consultant(full_name, email),
          engineer:assigned_engineer(full_name, email)
        `)
        .or(`user_id.eq.${user.id},assigned_inspector.eq.${user.id},assigned_consultant.eq.${user.id},assigned_engineer.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get user's role-specific tasks
  const { data: userTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['workflow-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) return [];

      let stageFilter: 'inspection' | 'consultant_review' | 'engineering' | 'complete' = 'inspection';
      switch (profile.role) {
        case 'inspector':
          stageFilter = 'inspection';
          break;
        case 'consultant':
          stageFilter = 'consultant_review';
          break;
        case 'engineer':
          stageFilter = 'engineering';
          break;
        default:
          return [];
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('current_stage', stageFilter)
        .or(`assigned_inspector.eq.${user.id},assigned_consultant.eq.${user.id},assigned_engineer.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Create new project
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          user_id: user.id,
          current_stage: 'inspection' as const,
          workflow_status: {},
          stage_data: {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-projects'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });
    },
  });

  // Update project stage
  const updateProjectStageMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      newStage, 
      stageData 
    }: { 
      projectId: string; 
      newStage: WorkflowProject['current_stage']; 
      stageData?: any;
    }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({
          current_stage: newStage,
          stage_data: stageData || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-projects'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });
    },
  });

  // Handoff project to next stage
  const handoffProjectMutation = useMutation({
    mutationFn: async ({
      projectId,
      toUserId,
      fromStage,
      toStage,
      notes
    }: {
      projectId: string;
      toUserId: string;
      fromStage: WorkflowProject['current_stage'];
      toStage: WorkflowProject['current_stage'];
      notes?: string;
    }) => {
      // Create handoff record
      const { error: handoffError } = await supabase
        .from('project_handoffs')
        .insert({
          project_id: projectId,
          from_user_id: user?.id,
          to_user_id: toUserId,
          from_stage: fromStage,
          to_stage: toStage,
          notes,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (handoffError) throw handoffError;

      // Update project stage
      const { data, error } = await supabase
        .from('projects')
        .update({
          current_stage: toStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase
        .from('workflow_activities')
        .insert({
          project_id: projectId,
          user_id: user?.id,
          activity_type: `handoff_to_${toStage}`,
          stage_from: fromStage,
          stage_to: toStage,
          notes,
          metadata: { handoff_to: toUserId }
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-projects'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });
    },
  });

  return {
    projects: projects || [],
    userTasks: userTasks || [],
    selectedProject,
    setSelectedProject,
    projectsLoading,
    tasksLoading,
    projectsError,
    
    // Mutations
    createProject: createProjectMutation.mutate,
    isCreatingProject: createProjectMutation.isPending,
    
    updateProjectStage: updateProjectStageMutation.mutate,
    isUpdatingStage: updateProjectStageMutation.isPending,
    
    handoffProject: handoffProjectMutation.mutate,
    isHandingOff: handoffProjectMutation.isPending,
  };
}

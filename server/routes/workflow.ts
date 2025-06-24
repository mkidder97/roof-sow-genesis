// File: server/routes/workflow.ts
// Complete workflow management API for multi-role SOW system

import express from 'express';
import { getSupabaseClient } from '../core/supabase-client.js';

const router = express.Router();

// Types matching Lovable's schema implementation
interface UserProfile {
  id: string;
  role: 'inspector' | 'consultant' | 'engineer' | 'admin';
  company_id?: string;
  email: string;
  full_name?: string;
  phone?: string;
  permissions: string[];
  preferences: any;
}

interface WorkflowProject {
  id: string;
  name: string;
  description?: string;
  project_address?: string;
  user_id: string;
  current_stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete';
  assigned_inspector?: string;
  assigned_consultant?: string;
  assigned_engineer?: string;
  workflow_status: any;
  stage_data: any;
  created_at: string;
  updated_at: string;
}

interface WorkflowRequest extends express.Request {
  user?: {
    id: string;
    profile: UserProfile;
  };
}

// ======================
// AUTHENTICATION MIDDLEWARE
// ======================

const authenticateUser = async (req: WorkflowRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header',
        details: 'Include Bearer token in Authorization header'
      });
    }

    const token = authHeader.substring(7);
    
    // Get Supabase client lazily
    const supabase = getSupabaseClient();
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        details: authError?.message || 'Token verification failed'
      });
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ 
        error: 'User profile not found',
        details: 'User profile may not be set up correctly'
      });
    }

    req.user = {
      id: user.id,
      profile: profile as UserProfile
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: 'Internal authentication error'
    });
  }
};

// ======================
// PROJECT LIFECYCLE MANAGEMENT
// ======================

// Create new project with workflow setup
router.post('/projects', authenticateUser, async (req: WorkflowRequest, res) => {
  try {
    const { 
      name, 
      description, 
      project_address,
      assigned_inspector,
      assigned_consultant,
      assigned_engineer 
    } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Project name is required',
        details: 'Provide a name for the project'
      });
    }

    const supabase = getSupabaseClient();

    const projectData = {
      name,
      description,
      project_address,
      user_id: req.user!.id,
      current_stage: 'inspection' as const,
      assigned_inspector: assigned_inspector || req.user!.id,
      assigned_consultant,
      assigned_engineer,
      metadata: {},
      workflow_status: {
        created_at: new Date().toISOString(),
        created_by: req.user!.id,
        stage_history: [
          {
            stage: 'inspection',
            entered_at: new Date().toISOString(),
            entered_by: req.user!.id
          }
        ]
      },
      stage_data: {
        inspection: {
          status: 'pending',
          assigned_to: assigned_inspector || req.user!.id
        }
      }
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select(`
        *,
        inspector:assigned_inspector(id, full_name, role),
        consultant:assigned_consultant(id, full_name, role),
        engineer:assigned_engineer(id, full_name, role)
      `)
      .single();

    if (error) {
      console.error('Project creation error:', error);
      return res.status(400).json({ 
        error: 'Failed to create project',
        details: error.message 
      });
    }

    // Log project creation activity
    await supabase
      .from('workflow_activities')
      .insert({
        project_id: project.id,
        user_id: req.user!.id,
        activity_type: 'project_created',
        notes: `Project "${name}" created`,
        metadata: {
          project_name: name,
          assigned_inspector,
          assigned_consultant,
          assigned_engineer
        }
      });

    res.json({ 
      success: true, 
      project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create project',
      details: 'Internal server error'
    });
  }
});

// Get projects for current user based on role
router.get('/projects', authenticateUser, async (req: WorkflowRequest, res) => {
  try {
    const { stage, status, limit = 50 } = req.query;
    const userRole = req.user!.profile.role;
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('projects')
      .select(`
        *,
        inspector:assigned_inspector(id, full_name, role, email),
        consultant:assigned_consultant(id, full_name, role, email),
        engineer:assigned_engineer(id, full_name, role, email),
        field_inspections(id, completed, ready_for_handoff, created_at),
        consultant_reviews(id, review_completed, reviewed_at),
        project_comments(count)
      `);

    // Filter based on user role and assignments
    switch (userRole) {
      case 'inspector':
        query = query.eq('assigned_inspector', req.user!.id);
        break;
      case 'consultant':
        query = query.eq('assigned_consultant', req.user!.id);
        break;
      case 'engineer':
        query = query.eq('assigned_engineer', req.user!.id);
        break;
      case 'admin':
        // Admin can see all projects in their company
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', req.user!.id)
          .single();
        
        if (userProfile?.company_id) {
          // Filter by company if user has one
          query = query.in('user_id', 
            supabase
              .from('user_profiles')
              .select('id')
              .eq('company_id', userProfile.company_id)
          );
        }
        break;
    }

    if (stage) {
      query = query.eq('current_stage', stage);
    }

    const { data: projects, error } = await query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      console.error('Project fetch error:', error);
      return res.status(400).json({ 
        error: 'Failed to fetch projects',
        details: error.message 
      });
    }

    // Enhance projects with status information
    const enhancedProjects = projects.map(project => ({
      ...project,
      status: getProjectStatus(project),
      next_action: getNextAction(project, userRole),
      completion_percentage: getCompletionPercentage(project)
    }));

    res.json({ 
      success: true, 
      projects: enhancedProjects,
      total: projects.length,
      user_role: userRole
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch projects',
      details: 'Internal server error'
    });
  }
});

// Get single project with complete details
router.get('/projects/:id', authenticateUser, async (req: WorkflowRequest, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        inspector:assigned_inspector(id, full_name, role, email),
        consultant:assigned_consultant(id, full_name, role, email),
        engineer:assigned_engineer(id, full_name, role, email),
        field_inspections(
          *,
          inspector:inspector_id(full_name, email)
        ),
        consultant_reviews(
          *,
          consultant:consultant_id(full_name, email)
        ),
        project_comments(
          *,
          user:user_id(full_name, role)
        ),
        workflow_activities(
          *,
          user:user_id(full_name, role)
        ),
        project_handoffs(
          *,
          from_user:from_user_id(full_name, role),
          to_user:to_user_id(full_name, role)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !project) {
      return res.status(404).json({ 
        error: 'Project not found',
        details: error?.message || 'Project does not exist'
      });
    }

    // Check if user has access to this project
    const hasAccess = 
      project.user_id === req.user!.id ||
      project.assigned_inspector === req.user!.id ||
      project.assigned_consultant === req.user!.id ||
      project.assigned_engineer === req.user!.id ||
      req.user!.profile.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'You do not have permission to view this project'
      });
    }

    // Enhance project with workflow information
    const enhancedProject = {
      ...project,
      status: getProjectStatus(project),
      next_action: getNextAction(project, req.user!.profile.role),
      completion_percentage: getCompletionPercentage(project),
      workflow_summary: getWorkflowSummary(project)
    };

    res.json({ 
      success: true, 
      project: enhancedProject
    });
  } catch (error) {
    console.error('Project details fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch project details',
      details: 'Internal server error'
    });
  }
});

// Get user dashboard data
router.get('/dashboard', authenticateUser, async (req: WorkflowRequest, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.profile.role;
    const supabase = getSupabaseClient();

    // Get projects assigned to user
    let projectsQuery = supabase
      .from('projects')
      .select(`
        id, name, current_stage, created_at,
        field_inspections(completed),
        consultant_reviews(review_completed),
        project_comments(count)
      `);

    // Filter by role
    switch (userRole) {
      case 'inspector':
        projectsQuery = projectsQuery.eq('assigned_inspector', userId);
        break;
      case 'consultant':
        projectsQuery = projectsQuery.eq('assigned_consultant', userId);
        break;
      case 'engineer':
        projectsQuery = projectsQuery.eq('assigned_engineer', userId);
        break;
    }

    const { data: projects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      console.error('Dashboard projects error:', projectsError);
      return res.status(400).json({ 
        error: 'Failed to fetch dashboard data',
        details: projectsError.message 
      });
    }

    // Get recent activities
    const { data: activities, error: activitiesError } = await supabase
      .from('workflow_activities')
      .select(`
        *,
        projects(name),
        user:user_id(full_name, role)
      `)
      .in('project_id', projects?.map(p => p.id) || [])
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate dashboard metrics
    const metrics = {
      total_projects: projects?.length || 0,
      pending_projects: projects?.filter(p => 
        (userRole === 'inspector' && p.current_stage === 'inspection') ||
        (userRole === 'consultant' && p.current_stage === 'consultant_review') ||
        (userRole === 'engineer' && p.current_stage === 'engineering')
      ).length || 0,
      completed_projects: projects?.filter(p => p.current_stage === 'complete').length || 0,
      recent_activity_count: activities?.length || 0
    };

    res.json({ 
      success: true, 
      dashboard: {
        user_profile: req.user!.profile,
        metrics,
        projects: projects?.slice(0, 5) || [], // Latest 5 projects
        recent_activities: activities || []
      }
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: 'Internal server error'
    });
  }
});

// ======================
// UTILITY FUNCTIONS
// ======================

function getProjectStatus(project: any): string {
  switch (project.current_stage) {
    case 'inspection':
      return project.field_inspections?.[0]?.completed ? 'inspection_complete' : 'inspection_pending';
    case 'consultant_review':
      return project.consultant_reviews?.[0]?.review_completed ? 'review_complete' : 'review_pending';
    case 'engineering':
      return 'engineering_in_progress';
    case 'complete':
      return 'completed';
    default:
      return 'unknown';
  }
}

function getNextAction(project: any, userRole: string): string {
  switch (project.current_stage) {
    case 'inspection':
      return userRole === 'inspector' ? 'Complete field inspection' : 'Waiting for inspector';
    case 'consultant_review':
      return userRole === 'consultant' ? 'Review and prepare for engineering' : 'Waiting for consultant review';
    case 'engineering':
      return userRole === 'engineer' ? 'Generate SOW and complete project' : 'Waiting for engineering';
    case 'complete':
      return 'Project completed';
    default:
      return 'No action required';
  }
}

function getCompletionPercentage(project: any): number {
  const stageWeights = {
    inspection: 25,
    consultant_review: 50,
    engineering: 75,
    complete: 100
  };

  return stageWeights[project.current_stage as keyof typeof stageWeights] || 0;
}

function getWorkflowSummary(project: any) {
  return {
    total_stages: 4,
    current_stage_index: ['inspection', 'consultant_review', 'engineering', 'complete'].indexOf(project.current_stage) + 1,
    stage_history: project.workflow_status?.stage_history || [],
    estimated_completion: project.current_stage === 'complete' ? null : 'TBD'
  };
}

export default router;

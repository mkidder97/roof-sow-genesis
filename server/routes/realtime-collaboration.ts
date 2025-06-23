// Real-Time Collaboration API Routes
// Provides REST endpoints for notifications, activity feeds, and real-time features

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import RealtimeServer from '../core/realtime-server.js';
import NotificationSystem from '../core/notification-system.js';
import ActivityFeedSystem from '../core/activity-feed.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! || process.env.SUPABASE_ANON_KEY!
);

// Global instances (will be injected by main server)
let realtimeServer: RealtimeServer;
let notificationSystem: NotificationSystem;
let activityFeedSystem: ActivityFeedSystem;

// Middleware for authentication
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    profile: {
      id: string;
      role: 'inspector' | 'consultant' | 'engineer' | 'admin';
      company_id?: string;
      email: string;
      full_name?: string;
    };
  };
}

const authenticateUser = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header',
        details: 'Include Bearer token in Authorization header'
      });
    }

    const token = authHeader.substring(7);
    
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
      profile: profile as any
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
// REAL-TIME STATUS ENDPOINTS
// ======================

// Get real-time server status
router.get('/status', (req, res) => {
  const stats = realtimeServer?.getRoomStatistics() || {
    activeRooms: 0,
    connectedUsers: 0,
    roomDetails: []
  };

  res.json({
    success: true,
    realtime: {
      server_status: 'running',
      connected_users: stats.connectedUsers,
      active_rooms: stats.activeRooms,
      room_details: stats.roomDetails
    },
    notifications: {
      system_status: 'operational',
      available_templates: notificationSystem?.getAvailableTemplates().length || 0
    },
    activity_feed: {
      system_status: 'operational',
      available_categories: activityFeedSystem?.getActivityCategories() || []
    },
    timestamp: new Date().toISOString()
  });
});

// Get connected users for a project
router.get('/projects/:projectId/users', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify user has access to project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const hasAccess = 
      project.user_id === req.user!.id ||
      project.assigned_inspector === req.user!.id ||
      project.assigned_consultant === req.user!.id ||
      project.assigned_engineer === req.user!.id ||
      req.user!.profile.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }

    const connectedUsers = realtimeServer?.getProjectUsers(projectId) || [];

    res.json({
      success: true,
      project_id: projectId,
      connected_users: connectedUsers.map(user => ({
        id: user.id,
        full_name: user.fullName,
        role: user.role,
        connected_at: user.connectedAt,
        last_seen: user.lastSeen
      }))
    });

  } catch (error) {
    console.error('Error getting connected users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connected users'
    });
  }
});

// ======================
// NOTIFICATION ENDPOINTS
// ======================

// Get user notification preferences
router.get('/notifications/preferences', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const preferences = await notificationSystem?.getUserPreferences(req.user!.id);
    
    res.json({
      success: true,
      preferences: preferences || null
    });

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences'
    });
  }
});

// Update user notification preferences
router.put('/notifications/preferences', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const updates = req.body;
    
    const success = await notificationSystem?.updateUserPreferences(req.user!.id, updates);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification preferences updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update notification preferences'
      });
    }

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

// Get user's in-app notifications
router.get('/notifications/inbox', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = '50', offset = '0', unread_only = 'false' } = req.query;
    
    let query = supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (unread_only === 'true') {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      notifications: notifications || [],
      unread_count: await notificationSystem?.getUnreadCount(req.user!.id) || 0
    });

  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { notificationId } = req.params;
    
    const success = await notificationSystem?.markInAppNotificationRead(notificationId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Get notification history
router.get('/notifications/history', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = '50' } = req.query;
    
    const history = await notificationSystem?.getNotificationHistory(
      req.user!.id,
      parseInt(limit as string)
    ) || [];

    res.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification history'
    });
  }
});

// ======================
// ACTIVITY FEED ENDPOINTS
// ======================

// Get project activity feed
router.get('/activity/project/:projectId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const { 
      limit = '50',
      offset = '0',
      category,
      userId,
      stage,
      dateFrom,
      dateTo,
      priority
    } = req.query;

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const hasAccess = 
      project.user_id === req.user!.id ||
      project.assigned_inspector === req.user!.id ||
      project.assigned_consultant === req.user!.id ||
      project.assigned_engineer === req.user!.id ||
      req.user!.profile.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }

    const result = await activityFeedSystem?.getProjectActivityFeed(projectId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      category: category as string,
      userId: userId as string,
      stage: stage as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      priority: priority as string
    }) || { activities: [], total: 0, hasMore: false };

    res.json({
      success: true,
      project_id: projectId,
      ...result
    });

  } catch (error) {
    console.error('Error getting project activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project activity feed'
    });
  }
});

// Get user activity feed across all projects
router.get('/activity/user', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = '50', offset = '0', project_ids } = req.query;
    
    let projectIds: string[] | undefined;
    if (project_ids) {
      projectIds = typeof project_ids === 'string' 
        ? project_ids.split(',') 
        : project_ids as string[];
    }

    const result = await activityFeedSystem?.getUserActivityFeed(req.user!.id, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      projectIds
    }) || { activities: [], total: 0, hasMore: false };

    res.json({
      success: true,
      user_id: req.user!.id,
      ...result
    });

  } catch (error) {
    console.error('Error getting user activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user activity feed'
    });
  }
});

// Get project timeline
router.get('/activity/timeline/:projectId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;

    // Verify project access (same logic as above)
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const hasAccess = 
      project.user_id === req.user!.id ||
      project.assigned_inspector === req.user!.id ||
      project.assigned_consultant === req.user!.id ||
      project.assigned_engineer === req.user!.id ||
      req.user!.profile.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }

    const timeline = await activityFeedSystem?.generateProjectTimeline(projectId);

    if (timeline) {
      res.json({
        success: true,
        timeline
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Timeline not found'
      });
    }

  } catch (error) {
    console.error('Error getting project timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project timeline'
    });
  }
});

// Get live activity stream for dashboard
router.get('/activity/live', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = '100', categories, priorities } = req.query;

    // Get user's project IDs
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .or(`user_id.eq.${req.user!.id},assigned_inspector.eq.${req.user!.id},assigned_consultant.eq.${req.user!.id},assigned_engineer.eq.${req.user!.id}`);

    const projectIds = projects?.map(p => p.id) || [];

    if (projectIds.length === 0) {
      return res.json({
        success: true,
        activities: []
      });
    }

    const activities = await activityFeedSystem?.getLiveActivityStream(projectIds, {
      limit: parseInt(limit as string),
      categories: categories ? (categories as string).split(',') : undefined,
      priorities: priorities ? (priorities as string).split(',') : undefined
    }) || [];

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Error getting live activity stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get live activity stream'
    });
  }
});

// Get activity statistics for a project
router.get('/activity/stats/:projectId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const hasAccess = 
      project.user_id === req.user!.id ||
      project.assigned_inspector === req.user!.id ||
      project.assigned_consultant === req.user!.id ||
      project.assigned_engineer === req.user!.id ||
      req.user!.profile.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }

    const statistics = await activityFeedSystem?.getActivityStatistics(projectId) || {
      totalActivities: 0,
      activitiesLast24h: 0,
      activitiesLast7d: 0,
      mostActiveUser: '',
      mostActiveStage: ''
    };

    res.json({
      success: true,
      project_id: projectId,
      statistics
    });

  } catch (error) {
    console.error('Error getting activity statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity statistics'
    });
  }
});

// ======================
// MANUAL NOTIFICATION TRIGGERS
// ======================

// Send test notification
router.post('/notifications/test', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { template_id, test_data } = req.body;

    if (req.user!.profile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required for test notifications'
      });
    }

    const success = await notificationSystem?.sendNotification({
      userId: req.user!.id,
      templateId: template_id || 'project_comment',
      priority: 'normal',
      data: test_data || {
        projectName: 'Test Project',
        userName: req.user!.profile.full_name || 'Test User',
        comment: 'This is a test notification',
        projectUrl: process.env.FRONTEND_URL + '/projects/test'
      },
      channels: ['email', 'in_app']
    });

    res.json({
      success: !!success,
      message: success ? 'Test notification sent' : 'Failed to send test notification'
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

// Manual activity logging
router.post('/activity/log', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      project_id,
      activity_type,
      title,
      description,
      stage,
      metadata,
      priority,
      category
    } = req.body;

    if (!project_id || !activity_type || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: project_id, activity_type, title'
      });
    }

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const hasAccess = 
      project.user_id === req.user!.id ||
      project.assigned_inspector === req.user!.id ||
      project.assigned_consultant === req.user!.id ||
      project.assigned_engineer === req.user!.id ||
      req.user!.profile.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }

    const activity = await activityFeedSystem?.logActivity({
      projectId: project_id,
      userId: req.user!.id,
      activityType: activity_type,
      title,
      description: description || '',
      stage,
      metadata,
      priority,
      category
    });

    if (activity) {
      res.json({
        success: true,
        activity,
        message: 'Activity logged successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to log activity'
      });
    }

  } catch (error) {
    console.error('Error logging manual activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log activity'
    });
  }
});

// ======================
// CONFIGURATION ENDPOINTS
// ======================

// Get available notification templates
router.get('/notifications/templates', (req, res) => {
  const templates = notificationSystem?.getAvailableTemplates() || [];
  
  res.json({
    success: true,
    templates: templates.map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      defaultEnabled: template.defaultEnabled,
      roles: template.roles
    }))
  });
});

// Get activity categories and types
router.get('/activity/config', (req, res) => {
  res.json({
    success: true,
    categories: activityFeedSystem?.getActivityCategories() || [],
    types: activityFeedSystem?.getActivityTypes() || [],
    priorities: ['low', 'normal', 'high'],
    stages: ['inspection', 'consultant_review', 'engineering', 'complete']
  });
});

// Initialize systems (called by main server)
export function initializeRealtimeSystems(
  realtimeServerInstance: RealtimeServer,
  notificationSystemInstance: NotificationSystem,
  activityFeedSystemInstance: ActivityFeedSystem
) {
  realtimeServer = realtimeServerInstance;
  notificationSystem = notificationSystemInstance;
  activityFeedSystem = activityFeedSystemInstance;
  
  console.log('🔗 Real-time collaboration systems initialized in routes');
}

export default router;
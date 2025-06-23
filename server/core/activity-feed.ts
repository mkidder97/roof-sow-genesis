// Activity Feed and Timeline System for Real-Time Collaboration
// Provides live activity tracking, timeline visualization, and audit logs

import { createClient } from '@supabase/supabase-js';
import RealtimeServer from './realtime-server.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! || process.env.SUPABASE_ANON_KEY!
);

export interface ActivityItem {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  activityType: string;
  title: string;
  description: string;
  stage?: string;
  metadata: Record<string, any>;
  timestamp: string;
  priority: 'low' | 'normal' | 'high';
  category: 'project' | 'file' | 'handoff' | 'comment' | 'system';
  relatedItems?: {
    type: 'file' | 'comment' | 'handoff' | 'sow';
    id: string;
    name: string;
  }[];
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  timestamp: string;
  type: 'milestone' | 'handoff' | 'update' | 'issue' | 'completion';
  title: string;
  description: string;
  stage: string;
  participants: {
    userId: string;
    userName: string;
    role: string;
  }[];
  duration?: number; // in milliseconds
  metadata: Record<string, any>;
}

export interface ProjectTimeline {
  projectId: string;
  projectName: string;
  startDate: string;
  currentStage: string;
  completionPercentage: number;
  milestones: TimelineEvent[];
  handoffs: TimelineEvent[];
  activities: ActivityItem[];
  statistics: {
    totalActivities: number;
    activitiesByStage: Record<string, number>;
    activitiesByUser: Record<string, number>;
    averageStageTime: Record<string, number>;
    currentStageTime: number;
  };
}

export class ActivityFeedSystem {
  private realtimeServer?: RealtimeServer;
  private activityCache: Map<string, ActivityItem[]> = new Map();
  private timelineCache: Map<string, ProjectTimeline> = new Map();

  constructor(realtimeServer?: RealtimeServer) {
    this.realtimeServer = realtimeServer;
    this.startCacheCleanup();
    console.log('📊 Activity feed system initialized');
  }

  // Core activity logging
  public async logActivity(data: {
    projectId: string;
    userId: string;
    activityType: string;
    title: string;
    description: string;
    stage?: string;
    metadata?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
    category?: 'project' | 'file' | 'handoff' | 'comment' | 'system';
    relatedItems?: Array<{
      type: 'file' | 'comment' | 'handoff' | 'sow';
      id: string;
      name: string;
    }>;
  }): Promise<ActivityItem | null> {
    try {
      // Get user details
      const { data: user } = await supabase
        .from('user_profiles')
        .select('full_name, role')
        .eq('id', data.userId)
        .single();

      if (!user) {
        console.error(`User not found: ${data.userId}`);
        return null;
      }

      const activity: ActivityItem = {
        id: crypto.randomUUID(),
        projectId: data.projectId,
        userId: data.userId,
        userName: user.full_name || 'Unknown User',
        userRole: user.role,
        activityType: data.activityType,
        title: data.title,
        description: data.description,
        stage: data.stage,
        metadata: data.metadata || {},
        timestamp: new Date().toISOString(),
        priority: data.priority || 'normal',
        category: data.category || 'project',
        relatedItems: data.relatedItems || []
      };

      // Save to database
      const { error } = await supabase
        .from('workflow_activities')
        .insert({
          id: activity.id,
          project_id: activity.projectId,
          user_id: activity.userId,
          activity_type: activity.activityType,
          stage_from: activity.stage,
          notes: activity.description,
          metadata: {
            title: activity.title,
            priority: activity.priority,
            category: activity.category,
            relatedItems: activity.relatedItems,
            userName: activity.userName,
            userRole: activity.userRole
          }
        });

      if (error) {
        throw error;
      }

      // Update cache
      this.addToCache(data.projectId, activity);

      // Broadcast real-time update
      if (this.realtimeServer) {
        this.realtimeServer.broadcastToProject(data.projectId, 'new_activity', {
          activity,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`📝 Activity logged: ${activity.title} by ${activity.userName}`);
      return activity;

    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  }

  // Get activity feed for a project
  public async getProjectActivityFeed(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
      category?: string;
      userId?: string;
      stage?: string;
      dateFrom?: string;
      dateTo?: string;
      priority?: string;
    } = {}
  ): Promise<{
    activities: ActivityItem[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let query = supabase
        .from('workflow_activities')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId);

      // Apply filters
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.stage) {
        query = query.eq('stage_from', options.stage);
      }

      if (options.dateFrom) {
        query = query.gte('created_at', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('created_at', options.dateTo);
      }

      // Order and paginate
      query = query
        .order('created_at', { ascending: false })
        .range(
          options.offset || 0,
          (options.offset || 0) + (options.limit || 50) - 1
        );

      const { data: rawActivities, error, count } = await query;

      if (error) {
        throw error;
      }

      // Transform to ActivityItem format
      const activities: ActivityItem[] = (rawActivities || []).map(this.transformDbActivity);

      // Filter by category and priority if specified
      let filteredActivities = activities;
      if (options.category) {
        filteredActivities = activities.filter(a => a.category === options.category);
      }
      if (options.priority) {
        filteredActivities = activities.filter(a => a.priority === options.priority);
      }

      const total = count || 0;
      const hasMore = (options.offset || 0) + (options.limit || 50) < total;

      return {
        activities: filteredActivities,
        total,
        hasMore
      };

    } catch (error) {
      console.error('Error getting project activity feed:', error);
      return { activities: [], total: 0, hasMore: false };
    }
  }

  // Get user activity across all projects
  public async getUserActivityFeed(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      projectIds?: string[];
    } = {}
  ): Promise<{
    activities: ActivityItem[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let query = supabase
        .from('workflow_activities')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (options.projectIds && options.projectIds.length > 0) {
        query = query.in('project_id', options.projectIds);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(
          options.offset || 0,
          (options.offset || 0) + (options.limit || 50) - 1
        );

      const { data: rawActivities, error, count } = await query;

      if (error) {
        throw error;
      }

      const activities = (rawActivities || []).map(this.transformDbActivity);
      const total = count || 0;
      const hasMore = (options.offset || 0) + (options.limit || 50) < total;

      return {
        activities,
        total,
        hasMore
      };

    } catch (error) {
      console.error('Error getting user activity feed:', error);
      return { activities: [], total: 0, hasMore: false };
    }
  }

  // Generate project timeline
  public async generateProjectTimeline(projectId: string): Promise<ProjectTimeline | null> {
    try {
      // Check cache first
      if (this.timelineCache.has(projectId)) {
        const cached = this.timelineCache.get(projectId)!;
        // Return cached if less than 5 minutes old
        if (Date.now() - new Date(cached.statistics.currentStageTime).getTime() < 5 * 60 * 1000) {
          return cached;
        }
      }

      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('name, current_stage, created_at')
        .eq('id', projectId)
        .single();

      if (!project) {
        return null;
      }

      // Get all activities for timeline
      const { data: rawActivities } = await supabase
        .from('workflow_activities')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      const activities = (rawActivities || []).map(this.transformDbActivity);

      // Extract timeline events
      const { milestones, handoffs } = this.extractTimelineEvents(activities);

      // Calculate statistics
      const statistics = await this.calculateProjectStatistics(projectId, activities);

      // Calculate completion percentage
      const completionPercentage = this.calculateCompletionPercentage(project.current_stage, activities);

      const timeline: ProjectTimeline = {
        projectId,
        projectName: project.name,
        startDate: project.created_at,
        currentStage: project.current_stage || 'inspection',
        completionPercentage,
        milestones,
        handoffs,
        activities: activities.slice(-20), // Last 20 activities
        statistics
      };

      // Cache the timeline
      this.timelineCache.set(projectId, timeline);

      return timeline;

    } catch (error) {
      console.error('Error generating project timeline:', error);
      return null;
    }
  }

  // Real-time activity stream
  public async getLiveActivityStream(
    projectIds: string[],
    options: {
      limit?: number;
      categories?: string[];
      priorities?: string[];
    } = {}
  ): Promise<ActivityItem[]> {
    try {
      let query = supabase
        .from('workflow_activities')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(options.limit || 100);

      const { data: rawActivities, error } = await query;

      if (error) {
        throw error;
      }

      let activities = (rawActivities || []).map(this.transformDbActivity);

      // Apply filters
      if (options.categories && options.categories.length > 0) {
        activities = activities.filter(a => options.categories!.includes(a.category));
      }

      if (options.priorities && options.priorities.length > 0) {
        activities = activities.filter(a => options.priorities!.includes(a.priority));
      }

      return activities;

    } catch (error) {
      console.error('Error getting live activity stream:', error);
      return [];
    }
  }

  // Convenience methods for common activities
  public async logHandoffActivity(data: {
    projectId: string;
    fromUserId: string;
    toUserId: string;
    fromStage: string;
    toStage: string;
    notes?: string;
  }): Promise<ActivityItem | null> {
    const { data: toUser } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', data.toUserId)
      .single();

    return this.logActivity({
      projectId: data.projectId,
      userId: data.fromUserId,
      activityType: 'handoff',
      title: `Project handed off to ${toUser?.full_name || 'user'}`,
      description: `Handed off from ${data.fromStage} to ${data.toStage}${data.notes ? '. Notes: ' + data.notes : ''}`,
      stage: data.fromStage,
      category: 'handoff',
      priority: 'high',
      metadata: {
        toUserId: data.toUserId,
        toUserName: toUser?.full_name,
        toUserRole: toUser?.role,
        fromStage: data.fromStage,
        toStage: data.toStage,
        notes: data.notes
      }
    });
  }

  public async logFileActivity(data: {
    projectId: string;
    userId: string;
    fileId: string;
    fileName: string;
    fileType: string;
    action: 'uploaded' | 'updated' | 'deleted';
    stage: string;
  }): Promise<ActivityItem | null> {
    const actionPastTense = {
      uploaded: 'uploaded',
      updated: 'updated',
      deleted: 'deleted'
    };

    return this.logActivity({
      projectId: data.projectId,
      userId: data.userId,
      activityType: 'file_' + data.action,
      title: `File ${actionPastTense[data.action]}: ${data.fileName}`,
      description: `${data.fileType} file ${actionPastTense[data.action]} in ${data.stage} stage`,
      stage: data.stage,
      category: 'file',
      priority: 'normal',
      metadata: {
        fileId: data.fileId,
        fileName: data.fileName,
        fileType: data.fileType,
        action: data.action
      },
      relatedItems: [{
        type: 'file',
        id: data.fileId,
        name: data.fileName
      }]
    });
  }

  public async logCommentActivity(data: {
    projectId: string;
    userId: string;
    commentId: string;
    comment: string;
    stage?: string;
  }): Promise<ActivityItem | null> {
    const preview = data.comment.length > 100 
      ? data.comment.substring(0, 100) + '...' 
      : data.comment;

    return this.logActivity({
      projectId: data.projectId,
      userId: data.userId,
      activityType: 'comment_added',
      title: 'Added a comment',
      description: `"${preview}"`,
      stage: data.stage,
      category: 'comment',
      priority: 'normal',
      metadata: {
        commentId: data.commentId,
        commentPreview: preview,
        fullComment: data.comment
      },
      relatedItems: [{
        type: 'comment',
        id: data.commentId,
        name: 'Comment'
      }]
    });
  }

  public async logSOWActivity(data: {
    projectId: string;
    userId: string;
    sowId: string;
    templateName: string;
    action: 'generated' | 'updated' | 'downloaded';
  }): Promise<ActivityItem | null> {
    const actionText = {
      generated: 'generated',
      updated: 'updated',
      downloaded: 'downloaded'
    };

    return this.logActivity({
      projectId: data.projectId,
      userId: data.userId,
      activityType: 'sow_' + data.action,
      title: `SOW ${actionText[data.action]}`,
      description: `Scope of Work ${actionText[data.action]} using ${data.templateName} template`,
      category: 'project',
      priority: 'high',
      metadata: {
        sowId: data.sowId,
        templateName: data.templateName,
        action: data.action
      },
      relatedItems: [{
        type: 'sow',
        id: data.sowId,
        name: `SOW - ${data.templateName}`
      }]
    });
  }

  // Utility methods
  private transformDbActivity(dbActivity: any): ActivityItem {
    const metadata = dbActivity.metadata || {};
    
    return {
      id: dbActivity.id,
      projectId: dbActivity.project_id,
      userId: dbActivity.user_id,
      userName: metadata.userName || 'Unknown User',
      userRole: metadata.userRole || 'unknown',
      activityType: dbActivity.activity_type,
      title: metadata.title || dbActivity.activity_type,
      description: dbActivity.notes || '',
      stage: dbActivity.stage_from,
      metadata,
      timestamp: dbActivity.created_at,
      priority: metadata.priority || 'normal',
      category: metadata.category || 'project',
      relatedItems: metadata.relatedItems || []
    };
  }

  private extractTimelineEvents(activities: ActivityItem[]): {
    milestones: TimelineEvent[];
    handoffs: TimelineEvent[];
  } {
    const milestones: TimelineEvent[] = [];
    const handoffs: TimelineEvent[] = [];

    activities.forEach(activity => {
      if (activity.category === 'handoff') {
        handoffs.push({
          id: activity.id,
          projectId: activity.projectId,
          timestamp: activity.timestamp,
          type: 'handoff',
          title: activity.title,
          description: activity.description,
          stage: activity.stage || 'unknown',
          participants: [
            {
              userId: activity.userId,
              userName: activity.userName,
              role: activity.userRole
            }
          ],
          metadata: activity.metadata
        });
      }

      // Define milestone activities
      const milestoneTypes = ['project_created', 'sow_generated', 'project_completed'];
      if (milestoneTypes.includes(activity.activityType)) {
        milestones.push({
          id: activity.id,
          projectId: activity.projectId,
          timestamp: activity.timestamp,
          type: 'milestone',
          title: activity.title,
          description: activity.description,
          stage: activity.stage || 'unknown',
          participants: [
            {
              userId: activity.userId,
              userName: activity.userName,
              role: activity.userRole
            }
          ],
          metadata: activity.metadata
        });
      }
    });

    return { milestones, handoffs };
  }

  private async calculateProjectStatistics(
    projectId: string,
    activities: ActivityItem[]
  ): Promise<ProjectTimeline['statistics']> {
    const activitiesByStage: Record<string, number> = {};
    const activitiesByUser: Record<string, number> = {};
    const stageTimestamps: Record<string, string[]> = {};

    activities.forEach(activity => {
      // Count by stage
      if (activity.stage) {
        activitiesByStage[activity.stage] = (activitiesByStage[activity.stage] || 0) + 1;
        
        if (!stageTimestamps[activity.stage]) {
          stageTimestamps[activity.stage] = [];
        }
        stageTimestamps[activity.stage].push(activity.timestamp);
      }

      // Count by user
      const userKey = `${activity.userName} (${activity.userRole})`;
      activitiesByUser[userKey] = (activitiesByUser[userKey] || 0) + 1;
    });

    // Calculate average stage times
    const averageStageTime: Record<string, number> = {};
    Object.keys(stageTimestamps).forEach(stage => {
      const timestamps = stageTimestamps[stage]
        .map(ts => new Date(ts).getTime())
        .sort((a, b) => a - b);
      
      if (timestamps.length > 1) {
        const totalTime = timestamps[timestamps.length - 1] - timestamps[0];
        averageStageTime[stage] = totalTime;
      }
    });

    // Get current stage start time
    const { data: project } = await supabase
      .from('projects')
      .select('current_stage, updated_at')
      .eq('id', projectId)
      .single();

    const currentStageTime = project ? 
      Date.now() - new Date(project.updated_at).getTime() : 0;

    return {
      totalActivities: activities.length,
      activitiesByStage,
      activitiesByUser,
      averageStageTime,
      currentStageTime
    };
  }

  private calculateCompletionPercentage(currentStage: string, activities: ActivityItem[]): number {
    const stageWeights = {
      inspection: 25,
      consultant_review: 50,
      engineering: 75,
      complete: 100
    };

    let basePercentage = stageWeights[currentStage as keyof typeof stageWeights] || 0;

    // Add bonus based on activity density in current stage
    const currentStageActivities = activities.filter(a => a.stage === currentStage).length;
    const activityBonus = Math.min(currentStageActivities * 2, 15); // Max 15% bonus

    return Math.min(basePercentage + activityBonus, 100);
  }

  private addToCache(projectId: string, activity: ActivityItem) {
    if (!this.activityCache.has(projectId)) {
      this.activityCache.set(projectId, []);
    }
    
    const cache = this.activityCache.get(projectId)!;
    cache.unshift(activity);
    
    // Keep only last 100 activities in cache
    if (cache.length > 100) {
      cache.splice(100);
    }
  }

  private startCacheCleanup() {
    // Clean up cache every 30 minutes
    setInterval(() => {
      this.activityCache.clear();
      this.timelineCache.clear();
      console.log('🧹 Activity feed cache cleaned up');
    }, 30 * 60 * 1000);
  }

  // Public API methods
  public getActivityTypes(): string[] {
    return [
      'project_created',
      'project_updated',
      'handoff',
      'file_uploaded',
      'file_updated',
      'file_deleted',
      'comment_added',
      'sow_generated',
      'sow_updated',
      'sow_downloaded',
      'project_completed'
    ];
  }

  public getActivityCategories(): string[] {
    return ['project', 'file', 'handoff', 'comment', 'system'];
  }

  public async getActivityStatistics(projectId: string): Promise<{
    totalActivities: number;
    activitiesLast24h: number;
    activitiesLast7d: number;
    mostActiveUser: string;
    mostActiveStage: string;
  }> {
    try {
      const { data: activities } = await supabase
        .from('workflow_activities')
        .select('*')
        .eq('project_id', projectId);

      if (!activities) {
        return {
          totalActivities: 0,
          activitiesLast24h: 0,
          activitiesLast7d: 0,
          mostActiveUser: '',
          mostActiveStage: ''
        };
      }

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      const activitiesLast24h = activities.filter(
        a => new Date(a.created_at).getTime() > oneDayAgo
      ).length;

      const activitiesLast7d = activities.filter(
        a => new Date(a.created_at).getTime() > sevenDaysAgo
      ).length;

      // Find most active user
      const userCounts: Record<string, number> = {};
      const stageCounts: Record<string, number> = {};

      activities.forEach(activity => {
        const metadata = activity.metadata || {};
        const userName = metadata.userName || 'Unknown';
        userCounts[userName] = (userCounts[userName] || 0) + 1;

        const stage = activity.stage_from || 'unknown';
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      });

      const mostActiveUser = Object.keys(userCounts).reduce((a, b) => 
        userCounts[a] > userCounts[b] ? a : b, '');

      const mostActiveStage = Object.keys(stageCounts).reduce((a, b) => 
        stageCounts[a] > stageCounts[b] ? a : b, '');

      return {
        totalActivities: activities.length,
        activitiesLast24h,
        activitiesLast7d,
        mostActiveUser,
        mostActiveStage
      };

    } catch (error) {
      console.error('Error getting activity statistics:', error);
      return {
        totalActivities: 0,
        activitiesLast24h: 0,
        activitiesLast7d: 0,
        mostActiveUser: '',
        mostActiveStage: ''
      };
    }
  }
}

export default ActivityFeedSystem;
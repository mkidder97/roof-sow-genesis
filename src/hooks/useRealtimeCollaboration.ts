// Real-Time Collaboration Hook for React Frontend
// Integrates with Socket.io backend for complete multi-role workflow collaboration

import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

// Types matching backend interfaces
export interface RealtimeUser {
  id: string;
  email: string;
  role: 'inspector' | 'consultant' | 'engineer' | 'admin';
  fullName: string;
  companyId?: string;
  connectedAt: string;
  lastSeen: string;
}

export interface RealtimeEvent {
  type: string;
  payload: any;
  userId: string;
  userRole: string;
  projectId?: string;
  timestamp: string;
  metadata?: any;
}

export interface ActivityItem {
  id: string;
  projectId: string;
  userId: string;
  activityType: string;
  title: string;
  description: string;
  stage?: string;
  metadata?: any;
  priority: 'low' | 'normal' | 'high';
  category: string;
  createdAt: string;
  user?: {
    fullName: string;
    role: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
}

export interface NotificationPreferences {
  emailNotifications: {
    handoffs: boolean;
    comments: boolean;
    projectUpdates: boolean;
    sowGeneration: boolean;
  };
  inAppNotifications: {
    handoffs: boolean;
    comments: boolean;
    projectUpdates: boolean;
    sowGeneration: boolean;
    fileUploads: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    criticalOnly: boolean;
  };
}

export interface UseRealtimeCollaborationOptions {
  projectId?: string;
  apiBaseUrl?: string;
  enableDebugLogging?: boolean;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export interface UseRealtimeCollaborationReturn {
  // Connection state
  isConnected: boolean;
  isReconnecting: boolean;
  connectionError: string | null;
  
  // Users and presence
  connectedUsers: RealtimeUser[];
  currentUser: RealtimeUser | null;
  typingUsers: { userId: string; userName: string; location?: string }[];
  
  // Activity feed
  activities: ActivityItem[];
  liveActivities: ActivityItem[];
  loadingActivities: boolean;
  activityError: string | null;
  
  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  notificationPreferences: NotificationPreferences | null;
  loadingNotifications: boolean;
  notificationError: string | null;
  
  // Project status
  projectStatus: any;
  projectTimeline: any[];
  
  // Actions
  sendComment: (comment: string, commentType?: string, stage?: string) => Promise<void>;
  sendProjectUpdate: (status: string, stage?: string, notes?: string) => Promise<void>;
  sendHandoff: (fromStage: string, toStage: string, toUserId: string, handoffData: any, notes?: string) => Promise<void>;
  notifyFileUpload: (fileId: string, fileName: string, fileType: string, stage?: string) => void;
  notifySOWGeneration: (status: 'started' | 'completed' | 'failed', data?: any) => void;
  
  // Typing indicators
  startTyping: (location?: string) => void;
  stopTyping: () => void;
  
  // Presence
  updatePresence: (status: string, location?: string) => void;
  
  // Activity management
  refreshActivities: () => Promise<void>;
  loadMoreActivities: () => Promise<void>;
  logActivity: (activityType: string, title: string, description?: string, metadata?: any) => Promise<void>;
  
  // Notification management
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Utility
  disconnect: () => void;
  reconnect: () => void;
}

export const useRealtimeCollaboration = (
  authToken: string,
  options: UseRealtimeCollaborationOptions = {}
): UseRealtimeCollaborationReturn => {
  const {
    projectId,
    apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001',
    enableDebugLogging = false,
    autoReconnect = true,
    reconnectDelay = 5000
  } = options;

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Users and presence
  const [connectedUsers, setConnectedUsers] = useState<RealtimeUser[]>([]);
  const [currentUser, setCurrentUser] = useState<RealtimeUser | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string; location?: string }[]>([]);

  // Activity feed
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [liveActivities, setLiveActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  // Project status
  const [projectStatus, setProjectStatus] = useState<any>(null);
  const [projectTimeline, setProjectTimeline] = useState<any[]>([]);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging
  const log = useCallback((message: string, ...args: any[]) => {
    if (enableDebugLogging) {
      console.log(`[RealtimeCollaboration] ${message}`, ...args);
    }
  }, [enableDebugLogging]);

  // API helper
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'API call failed');
    }

    return response.json();
  }, [apiBaseUrl, authToken]);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    log('Initializing socket connection...');
    
    const socket = io(apiBaseUrl, {
      auth: {
        token: authToken
      },
      transports: ['websocket', 'polling'],
      reconnection: autoReconnect,
      reconnectionDelay: reconnectDelay,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      log('Connected to real-time server');
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      log('Disconnected from real-time server:', reason);
      setIsConnected(false);
      setConnectedUsers([]);
      setTypingUsers([]);
    });

    socket.on('connect_error', (error) => {
      log('Connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      log('Reconnected after', attemptNumber, 'attempts');
      setIsReconnecting(false);
    });

    socket.on('reconnecting', (attemptNumber) => {
      log('Reconnecting attempt', attemptNumber);
      setIsReconnecting(true);
    });

    // Initial connection confirmation
    socket.on('connected', (data) => {
      log('Received connection confirmation:', data);
      setCurrentUser(data.user);
    });

    // Project room events
    socket.on('project_room_status', (data) => {
      log('Project room status:', data);
      setConnectedUsers(data.activeUsers || []);
      setActivities(prev => [...data.recentActivity || [], ...prev].slice(0, 100));
    });

    socket.on('user_joined_project', (data) => {
      log('User joined project:', data.user.fullName);
      setConnectedUsers(prev => {
        const exists = prev.find(u => u.id === data.user.id);
        if (exists) return prev;
        return [...prev, data.user];
      });
    });

    socket.on('user_left_project', (data) => {
      log('User left project:', data.user.fullName);
      setConnectedUsers(prev => prev.filter(u => u.id !== data.user.id));
    });

    // Project status updates
    socket.on('project_status_updated', (event: RealtimeEvent) => {
      log('Project status updated:', event);
      setProjectStatus(event.payload);
      
      // Add to live activities
      const activity: ActivityItem = {
        id: `live-${Date.now()}`,
        projectId: event.projectId || '',
        userId: event.userId,
        activityType: event.type,
        title: event.metadata?.userName ? `${event.metadata.userName} updated project status` : 'Project status updated',
        description: `Status changed to ${event.payload.status}`,
        stage: event.payload.stage,
        metadata: event.metadata,
        priority: 'normal',
        category: 'project_update',
        createdAt: event.timestamp,
        user: {
          fullName: event.metadata?.userName || 'Unknown User',
          role: event.userRole
        }
      };
      
      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
    });

    // Handoff events
    socket.on('project_handoff_initiated', (event: RealtimeEvent) => {
      log('Project handoff initiated:', event);
      
      const activity: ActivityItem = {
        id: `handoff-${Date.now()}`,
        projectId: event.projectId || '',
        userId: event.userId,
        activityType: event.type,
        title: `${event.metadata?.userName} initiated handoff`,
        description: `${event.payload.fromStage} → ${event.payload.toStage}`,
        stage: event.payload.toStage,
        metadata: event.metadata,
        priority: 'high',
        category: 'workflow_transition',
        createdAt: event.timestamp,
        user: {
          fullName: event.metadata?.userName || 'Unknown User',
          role: event.userRole
        }
      };
      
      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
    });

    socket.on('handoff_received', (event: RealtimeEvent) => {
      log('Handoff received:', event);
      
      // Show notification for incoming handoff
      if (event.isRecipient) {
        // Could trigger toast notification here
        console.info('You have received a project handoff!');
      }
    });

    // File upload events
    socket.on('file_uploaded', (event: RealtimeEvent) => {
      log('File uploaded:', event.payload.fileName);
      
      const activity: ActivityItem = {
        id: `file-${Date.now()}`,
        projectId: event.projectId || '',
        userId: event.userId,
        activityType: event.type,
        title: `${event.metadata?.userName} uploaded file`,
        description: `${event.payload.fileName} (${event.payload.fileType})`,
        stage: event.payload.stage,
        metadata: event.metadata,
        priority: 'normal',
        category: 'file_management',
        createdAt: event.timestamp,
        user: {
          fullName: event.metadata?.userName || 'Unknown User',
          role: event.userRole
        }
      };
      
      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
    });

    // SOW generation events
    socket.on('sow_generation_started', (event: RealtimeEvent) => {
      log('SOW generation started:', event);
      
      const activity: ActivityItem = {
        id: `sow-start-${Date.now()}`,
        projectId: event.projectId || '',
        userId: event.userId,
        activityType: event.type,
        title: 'SOW generation started',
        description: `${event.payload.initiatedBy} started generating SOW document`,
        stage: 'engineering',
        metadata: event.payload,
        priority: 'high',
        category: 'sow_generation',
        createdAt: event.timestamp,
        user: {
          fullName: event.payload.initiatedBy || 'Engineer',
          role: 'engineer'
        }
      };
      
      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
    });

    socket.on('sow_generation_completed', (event: RealtimeEvent) => {
      log('SOW generation completed:', event);
      
      const activity: ActivityItem = {
        id: `sow-complete-${Date.now()}`,
        projectId: event.projectId || '',
        userId: event.userId,
        activityType: event.type,
        title: 'SOW generation completed',
        description: `Generated ${event.payload.filename} in ${event.payload.generationTime}`,
        stage: 'engineering',
        metadata: event.payload,
        priority: 'high',
        category: 'sow_generation',
        createdAt: event.timestamp,
        user: {
          fullName: event.payload.completedBy || 'Engineer',
          role: 'engineer'
        }
      };
      
      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
    });

    socket.on('sow_generation_failed', (event: RealtimeEvent) => {
      log('SOW generation failed:', event);
      
      const activity: ActivityItem = {
        id: `sow-failed-${Date.now()}`,
        projectId: event.projectId || '',
        userId: event.userId,
        activityType: event.type,
        title: 'SOW generation failed',
        description: `Error: ${event.payload.error}`,
        stage: 'engineering',
        metadata: event.payload,
        priority: 'high',
        category: 'sow_generation',
        createdAt: event.timestamp,
        user: {
          fullName: 'System',
          role: 'engineer'
        }
      };
      
      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
    });

    // Comment events
    socket.on('new_comment', (event: RealtimeEvent) => {
      log('New comment:', event);
      
      const activity: ActivityItem = {
        id: `comment-${Date.now()}`,
        projectId: event.projectId || '',
        userId: event.userId,
        activityType: event.type,
        title: `${event.payload.userName} added a comment`,
        description: event.payload.comment.substring(0, 100) + (event.payload.comment.length > 100 ? '...' : ''),
        stage: event.payload.stage,
        metadata: event.payload,
        priority: 'normal',
        category: 'collaboration',
        createdAt: event.timestamp,
        user: {
          fullName: event.payload.userName || 'Unknown User',
          role: event.payload.userRole
        }
      };
      
      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
    });

    // Typing indicators
    socket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [...filtered, { userId: data.userId, userName: data.userName, location: data.location }];
      });
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }, 3000);
    });

    socket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    // Presence updates
    socket.on('user_presence_update', (data) => {
      setConnectedUsers(prev => prev.map(user => 
        user.id === data.userId 
          ? { ...user, lastSeen: data.lastSeen }
          : user
      ));
    });

    // Direct notifications
    socket.on('direct_notification', (notification) => {
      log('Direct notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Error handling
    socket.on('error', (error) => {
      log('Socket error:', error.message);
      setConnectionError(error.message);
    });

    socket.on('rate_limit_exceeded', (data) => {
      log('Rate limit exceeded:', data.message);
      // Could show user-friendly message here
    });

  }, [apiBaseUrl, authToken, autoReconnect, reconnectDelay, log]);

  // Initialize socket on mount
  useEffect(() => {
    if (authToken) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [authToken, initializeSocket]);

  // Load initial data
  useEffect(() => {
    if (isConnected && projectId) {
      refreshActivities();
      refreshNotifications();
      loadNotificationPreferences();
    }
  }, [isConnected, projectId]);

  // Action implementations
  const sendComment = useCallback(async (comment: string, commentType = 'general', stage?: string) => {
    if (!socketRef.current || !projectId) return;

    socketRef.current.emit('project_comment', {
      projectId,
      comment,
      commentType,
      stage,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  }, [projectId]);

  const sendProjectUpdate = useCallback(async (status: string, stage?: string, notes?: string) => {
    if (!socketRef.current || !projectId) return;

    socketRef.current.emit('project_status_update', {
      projectId,
      status,
      stage,
      notes,
      previousStage: stage // Could be derived from current project state
    });
  }, [projectId]);

  const sendHandoff = useCallback(async (fromStage: string, toStage: string, toUserId: string, handoffData: any, notes?: string) => {
    if (!socketRef.current || !projectId) return;

    socketRef.current.emit('project_handoff', {
      projectId,
      fromStage,
      toStage,
      toUserId,
      handoffData,
      notes
    });
  }, [projectId]);

  const notifyFileUpload = useCallback((fileId: string, fileName: string, fileType: string, stage?: string) => {
    if (!socketRef.current || !projectId) return;

    socketRef.current.emit('file_uploaded', {
      projectId,
      fileId,
      fileName,
      fileType,
      stage
    });
  }, [projectId]);

  const notifySOWGeneration = useCallback((status: 'started' | 'completed' | 'failed', data?: any) => {
    if (!socketRef.current || !projectId) return;

    const eventType = `sow_generation_${status}`;
    socketRef.current.emit(eventType, {
      projectId,
      ...data
    });
  }, [projectId]);

  const startTyping = useCallback((location?: string) => {
    if (!socketRef.current || !projectId) return;

    socketRef.current.emit('typing_start', {
      projectId,
      location
    });

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [projectId]);

  const stopTyping = useCallback(() => {
    if (!socketRef.current || !projectId) return;

    socketRef.current.emit('typing_stop', {
      projectId
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [projectId]);

  const updatePresence = useCallback((status: string, location?: string) => {
    if (!socketRef.current || !projectId) return;

    socketRef.current.emit('presence_update', {
      projectId,
      status,
      location
    });
  }, [projectId]);

  // Activity management
  const refreshActivities = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoadingActivities(true);
      setActivityError(null);
      
      const response = await apiCall(`/api/realtime/activity/project/${projectId}?limit=50`);
      setActivities(response.activities || []);
    } catch (error) {
      setActivityError(error instanceof Error ? error.message : 'Failed to load activities');
    } finally {
      setLoadingActivities(false);
    }
  }, [projectId, apiCall]);

  const loadMoreActivities = useCallback(async () => {
    if (!projectId || loadingActivities) return;

    try {
      setLoadingActivities(true);
      
      const response = await apiCall(`/api/realtime/activity/project/${projectId}?limit=50&offset=${activities.length}`);
      setActivities(prev => [...prev, ...(response.activities || [])]);
    } catch (error) {
      setActivityError(error instanceof Error ? error.message : 'Failed to load more activities');
    } finally {
      setLoadingActivities(false);
    }
  }, [projectId, activities.length, loadingActivities, apiCall]);

  const logActivity = useCallback(async (activityType: string, title: string, description = '', metadata?: any) => {
    if (!projectId) return;

    try {
      await apiCall('/api/realtime/activity/log', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          activity_type: activityType,
          title,
          description,
          metadata,
          priority: 'normal',
          category: 'user_action'
        })
      });
    } catch (error) {
      log('Failed to log activity:', error);
    }
  }, [projectId, apiCall, log]);

  // Notification management
  const refreshNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      setNotificationError(null);
      
      const response = await apiCall('/api/realtime/notifications/inbox?limit=50');
      setNotifications(response.notifications || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : 'Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  }, [apiCall]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await apiCall(`/api/realtime/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      log('Failed to mark notification as read:', error);
    }
  }, [apiCall, log]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.read);
      
      await Promise.all(
        unreadNotifications.map(n => 
          apiCall(`/api/realtime/notifications/${n.id}/read`, { method: 'PATCH' })
        )
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      log('Failed to mark all notifications as read:', error);
    }
  }, [notifications, apiCall, log]);

  const loadNotificationPreferences = useCallback(async () => {
    try {
      const response = await apiCall('/api/realtime/notifications/preferences');
      setNotificationPreferences(response.preferences);
    } catch (error) {
      log('Failed to load notification preferences:', error);
    }
  }, [apiCall, log]);

  const updateNotificationPreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    try {
      await apiCall('/api/realtime/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });
      
      setNotificationPreferences(prev => prev ? { ...prev, ...preferences } : null);
    } catch (error) {
      log('Failed to update notification preferences:', error);
      throw error;
    }
  }, [apiCall, log]);

  // Utility functions
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    } else {
      initializeSocket();
    }
  }, [initializeSocket]);

  return {
    // Connection state
    isConnected,
    isReconnecting,
    connectionError,
    
    // Users and presence
    connectedUsers,
    currentUser,
    typingUsers,
    
    // Activity feed
    activities,
    liveActivities,
    loadingActivities,
    activityError,
    
    // Notifications
    notifications,
    unreadCount,
    notificationPreferences,
    loadingNotifications,
    notificationError,
    
    // Project status
    projectStatus,
    projectTimeline,
    
    // Actions
    sendComment,
    sendProjectUpdate,
    sendHandoff,
    notifyFileUpload,
    notifySOWGeneration,
    
    // Typing indicators
    startTyping,
    stopTyping,
    
    // Presence
    updatePresence,
    
    // Activity management
    refreshActivities,
    loadMoreActivities,
    logActivity,
    
    // Notification management
    markNotificationRead,
    markAllNotificationsRead,
    updateNotificationPreferences,
    refreshNotifications,
    
    // Utility
    disconnect,
    reconnect
  };
};

export default useRealtimeCollaboration;


import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface CollaborationUser {
  id: string;
  name: string;
  role: 'inspector' | 'consultant' | 'engineer';
  avatar?: string;
  lastSeen: string;
}

export interface RealtimeEvent {
  type: 'user_joined' | 'user_left' | 'data_updated' | 'message_sent';
  user: CollaborationUser;
  data?: any;
  timestamp: string;
}

export interface ActivityItem {
  id: string;
  activityType: 'project_created' | 'handoff_to_consultant' | 'handoff_to_engineer' | 'file_uploaded' | 'sow_generation_started' | 'sow_generation_completed' | 'sow_generation_failed' | 'project_comment';
  title: string;
  description: string;
  stage?: string;
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
  read: boolean;
}

// Fix 3: Remove fullName from RealtimeUser interface
export interface RealtimeUser {
  id: string;
  name: string;
  role: 'inspector' | 'consultant' | 'engineer' | 'admin';
  status?: 'online' | 'away' | 'offline';
  avatar?: string;
  last_seen?: string;
}

export function useRealtimeCollaboration(projectId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase.channel(`project:${projectId}`, {
      config: {
        presence: {
          key: 'user',
        },
      },
    });

    channelRef.current = channel;

    // Subscribe to presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Safe type conversion for presence data
        const users = Object.values(state).flat().map((presence: any) => ({
          id: presence.user_id || presence.id || 'unknown',
          name: presence.name || presence.display_name || 'Unknown User',
          role: (presence.role as 'inspector' | 'consultant' | 'engineer') || 'inspector',
          lastSeen: new Date().toISOString()
        })) as CollaborationUser[];
        setCollaborators(users);
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Safe type conversion
        const presence = newPresences[0] as any;
        const user: CollaborationUser = {
          id: presence.user_id || presence.id || 'unknown',
          name: presence.name || presence.display_name || 'Unknown User',
          role: presence.role || 'inspector',
          lastSeen: new Date().toISOString()
        };
        addEvent({
          type: 'user_joined',
          user,
          timestamp: new Date().toISOString(),
        });
        toast.success(`${user.name} joined the project`);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Safe type conversion
        const presence = leftPresences[0] as any;
        const user: CollaborationUser = {
          id: presence.user_id || presence.id || 'unknown',
          name: presence.name || presence.display_name || 'Unknown User',
          role: presence.role || 'inspector',
          lastSeen: new Date().toISOString()
        };
        addEvent({
          type: 'user_left',
          user,
          timestamp: new Date().toISOString(),
        });
        toast.info(`${user.name} left the project`);
      })
      .on('broadcast', { event: 'data_update' }, ({ payload }) => {
        addEvent({
          type: 'data_updated',
          user: payload.user,
          data: payload.data,
          timestamp: new Date().toISOString(),
        });
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [projectId]);

  const addEvent = (event: RealtimeEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 50));
  };

  const joinProject = async (user: CollaborationUser) => {
    if (channelRef.current) {
      await channelRef.current.track(user);
    }
  };

  const leaveProject = async () => {
    if (channelRef.current) {
      await channelRef.current.untrack();
    }
  };

  const broadcastUpdate = async (data: any, user: CollaborationUser) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'data_update',
        payload: { data, user },
      });
    }
  };

  // Fix 3: Proper type conversion without fullName
  const connectedUsers: RealtimeUser[] = collaborators.map((user: CollaborationUser) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    status: 'online' as const,
    avatar: user.avatar,
    last_seen: user.lastSeen
  }));

  return {
    isConnected,
    collaborators,
    events,
    joinProject,
    leaveProject,
    broadcastUpdate,
    // Add missing properties for RealtimeCollaboration component
    isReconnecting: false,
    connectedUsers,
    currentUser: null as RealtimeUser | null,
    typingUsers: [] as { userId: string; userName: string; location?: string }[],
    activities: [] as ActivityItem[],
    liveActivities: [] as ActivityItem[],
    loadingActivities: false,
    notifications: [] as NotificationItem[],
    unreadCount: 0,
    sendComment: async (comment: string) => {},
    startTyping: () => {},
    stopTyping: () => {},
    markNotificationRead: async (id: string) => {},
    markAllNotificationsRead: async () => {},
    loadMoreActivities: async () => {}
  };
}

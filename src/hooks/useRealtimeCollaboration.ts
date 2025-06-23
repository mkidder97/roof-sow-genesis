
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
        const users = Object.values(state).flat() as CollaborationUser[];
        setCollaborators(users);
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const user = newPresences[0] as CollaborationUser;
        addEvent({
          type: 'user_joined',
          user,
          timestamp: new Date().toISOString(),
        });
        toast.success(`${user.name} joined the project`);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const user = leftPresences[0] as CollaborationUser;
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

  return {
    isConnected,
    collaborators,
    events,
    joinProject,
    leaveProject,
    broadcastUpdate,
  };
}

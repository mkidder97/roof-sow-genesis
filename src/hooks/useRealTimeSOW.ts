
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { SOWGenerationRecord } from '@/types/sow';
import { useQueryClient } from '@tanstack/react-query';

export function useRealTimeSOWUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('sow-generations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sow_generations'
        },
        (payload) => {
          console.log('SOW generation update:', payload);
          
          // Invalidate and refetch relevant queries
          queryClient.invalidateQueries({ queryKey: ['sow-history'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedRecord = payload.new as SOWGenerationRecord;
            queryClient.setQueryData(['sow-generation', updatedRecord.id], updatedRecord);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('Real-time connection status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { isConnected };
}

// Hook for monitoring specific SOW generation
export function useSOWGenerationMonitor(sowId: string | null) {
  const [status, setStatus] = useState<SOWGenerationRecord | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sowId) return;

    const channel = supabase
      .channel(`sow-generation-${sowId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sow_generations',
          filter: `id=eq.${sowId}`
        },
        (payload) => {
          console.log('SOW generation status update:', payload);
          const updatedRecord = payload.new as SOWGenerationRecord;
          setStatus(updatedRecord);
          queryClient.setQueryData(['sow-generation', sowId], updatedRecord);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sowId, queryClient]);

  return { status };
}

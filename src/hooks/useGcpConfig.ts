
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GcpConfig, GcpConfigCreateInput, GcpConfigUpdateInput } from '@/types/gcpConfig';
import { useToast } from '@/hooks/use-toast';

export const useGcpConfig = () => {
  const [configs, setConfigs] = useState<GcpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gcp_config')
        .select('*')
        .order('roof_type', { ascending: true })
        .order('zone', { ascending: true });

      if (error) throw error;
      setConfigs(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GCP configs');
      toast({
        title: "Error",
        description: "Failed to load GCP configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createConfig = async (input: GcpConfigCreateInput): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('gcp_config')
        .insert([input]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "GCP configuration created successfully"
      });
      
      await fetchConfigs();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create GCP config';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateConfig = async (input: GcpConfigUpdateInput): Promise<boolean> => {
    try {
      const { id, ...updateData } = input;
      const { error } = await supabase
        .from('gcp_config')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "GCP configuration updated successfully"
      });
      
      await fetchConfigs();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update GCP config';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteConfig = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('gcp_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "GCP configuration deleted successfully"
      });
      
      await fetchConfigs();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete GCP config';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    loading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    refetch: fetchConfigs
  };
};

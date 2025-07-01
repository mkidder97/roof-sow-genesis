
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GCPConfig, GCPConfigFormData } from '@/types/gcpConfig';
import { useToast } from '@/hooks/use-toast';

export function useGCPConfig() {
  const [configs, setConfigs] = useState<GCPConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('gcp_config')
        .select('*')
        .order('roof_type', { ascending: true });

      if (error) throw error;
      setConfigs(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch GCP configurations';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createConfig = async (formData: GCPConfigFormData) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('gcp_config')
        .insert([formData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A configuration for this roof type and zone combination already exists');
        }
        throw error;
      }

      await fetchConfigs();
      toast({
        title: 'Success',
        description: 'GCP configuration created successfully',
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create GCP configuration';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (id: string, formData: GCPConfigFormData) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('gcp_config')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A configuration for this roof type and zone combination already exists');
        }
        throw error;
      }

      await fetchConfigs();
      toast({
        title: 'Success',
        description: 'GCP configuration updated successfully',
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update GCP configuration';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteConfig = async (id: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('gcp_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchConfigs();
      toast({
        title: 'Success',
        description: 'GCP configuration deleted successfully',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete GCP configuration';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getConfigById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('gcp_config')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch GCP configuration';
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    loading,
    error,
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    getConfigById,
  };
}


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FieldInspection } from '@/types/fieldInspection';

export function useFieldInspections() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<FieldInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('field_inspections')
        .select('*')
        .eq('inspector_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInspections(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inspections');
    } finally {
      setLoading(false);
    }
  };

  const createInspection = async (inspection: Partial<FieldInspection>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('field_inspections')
        .insert({
          ...inspection,
          inspector_id: user.id,
          inspector_name: user.user_metadata?.full_name || user.email || 'Unknown Inspector',
        })
        .select()
        .single();

      if (error) throw error;
      
      setInspections(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create inspection');
    }
  };

  const updateInspection = async (id: string, updates: Partial<FieldInspection>) => {
    try {
      const { data, error } = await supabase
        .from('field_inspections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInspections(prev => 
        prev.map(inspection => 
          inspection.id === id ? { ...inspection, ...data } : inspection
        )
      );
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update inspection');
    }
  };

  const deleteInspection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('field_inspections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInspections(prev => prev.filter(inspection => inspection.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete inspection');
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [user]);

  return {
    inspections,
    loading,
    error,
    createInspection,
    updateInspection,
    deleteInspection,
    refetch: fetchInspections,
  };
}

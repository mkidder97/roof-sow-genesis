
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GCPConfigDetailProps {
  configId: string;
  onBack: () => void;
  onEdit: (config: any) => void;
}

interface GCPConfig {
  id: string;
  roof_type: string;
  zone: string;
  gc_p_value: number;
  created_at: string;
  updated_at: string;
}

const GCPConfigDetail: React.FC<GCPConfigDetailProps> = ({ configId, onBack, onEdit }) => {
  const { toast } = useToast();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['gcp-config', configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gcp_config')
        .select('*')
        .eq('id', configId)
        .single();
      
      if (error) throw error;
      return data as GCPConfig;
    },
    enabled: !!configId
  });

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('gcp_config')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "GCP config deleted successfully",
      });
      
      onBack();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete GCP config",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading GCP config...</span>
      </div>
    );
  }

  if (error || !config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 text-center">
            <p>Error loading GCP config: {error ? (error as Error).message : 'Config not found'}</p>
            <Button onClick={onBack} className="mt-2" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">GCP Configuration Details</h2>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => onEdit(config)} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Roof Type</label>
              <p className="text-lg font-semibold">{config.roof_type}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Zone</label>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{config.zone}</p>
                <Badge variant="outline">Zone {config.zone}</Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">GcP Value</label>
              <p className="text-lg font-semibold">{config.gc_p_value}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">ID</label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">{config.id}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-sm">{new Date(config.created_at).toLocaleString()}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Updated At</label>
              <p className="text-sm">{new Date(config.updated_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              This configuration defines a GcP value of <strong>{config.gc_p_value}</strong> for 
              <strong> {config.roof_type}</strong> roof type in <strong>Zone {config.zone}</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GCPConfigDetail;


import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GCPConfig {
  id: string;
  roof_type: string;
  zone: string;
  gc_p_value: number;
  created_at: string;
  updated_at: string;
}

const GCPConfigList = () => {
  const { toast } = useToast();

  const { data: configs, isLoading, error, refetch } = useQuery({
    queryKey: ['gcp-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gcp_config')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GCPConfig[];
    }
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gcp_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "GCP config deleted successfully",
      });
      
      refetch();
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
        <span className="ml-2">Loading GCP configs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 text-center">
            <p>Error loading GCP configs: {(error as Error).message}</p>
            <Button onClick={() => refetch()} className="mt-2" variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">GCP Configuration</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Config
        </Button>
      </div>

      <div className="grid gap-4">
        {configs?.map((config) => (
          <Card key={config.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{config.roof_type}</h3>
                    <Badge variant="outline">Zone {config.zone}</Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">GcP Value:</span> {config.gc_p_value}</p>
                    <p><span className="font-medium">Created:</span> {new Date(config.created_at).toLocaleDateString()}</p>
                    <p><span className="font-medium">Updated:</span> {new Date(config.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {configs?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No GCP configs found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first GCP configuration.</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Config
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GCPConfigList;

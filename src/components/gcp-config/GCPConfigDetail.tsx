
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useGCPConfig } from '@/hooks/useGCPConfig';
import { GCPConfig } from '@/types/gcpConfig';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function GCPConfigDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getConfigById, deleteConfig } = useGCPConfig();
  const [config, setConfig] = useState<GCPConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!id) return;
      
      try {
        const data = await getConfigById(id);
        setConfig(data);
      } catch (error) {
        // Error is handled in the hook
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [id, getConfigById]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteConfig(id);
      navigate('/gcp-config');
    } catch (error) {
      // Error is handled in the hook
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <LoadingSkeleton className="h-10 w-10" />
          <LoadingSkeleton className="h-8 w-48" />
        </div>
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/gcp-config">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Configuration Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg">The requested GCP configuration could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/gcp-config">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{config.roof_type}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/gcp-config/${config.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this GCP configuration for {config.roof_type} - {config.zone}? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Roof Type</label>
              <p className="text-lg font-semibold">{config.roof_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Zone</label>
              <div className="mt-1">
                <Badge variant="secondary" className="text-sm">{config.zone}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">GC/P Value</label>
              <p className="text-lg font-semibold">{config.gc_p_value}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID</label>
              <p className="text-sm font-mono text-muted-foreground">{config.id}</p>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{new Date(config.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{new Date(config.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

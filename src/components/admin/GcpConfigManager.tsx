
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Settings } from 'lucide-react';
import { useGcpConfig } from '@/hooks/useGcpConfig';
import { GcpConfig } from '@/types/gcpConfig';
import { GcpConfigForm } from './GcpConfigForm';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const GcpConfigManager: React.FC = () => {
  const { configs, loading, deleteConfig } = useGcpConfig();
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<GcpConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleEdit = (config: GcpConfig) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingConfig(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingConfig(null);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteConfig(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const getRoofTypeLabel = (roofType: string) => {
    return roofType === 'low_slope' ? 'Low Slope' : 'Steep Slope';
  };

  const getZoneLabel = (zone: string) => {
    return zone.charAt(0).toUpperCase() + zone.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading GCP configurations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                GCₚ Value Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage wind pressure coefficients for different roof types and zones
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Configuration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {configs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No GCP configurations found. Add your first configuration.
              </div>
            ) : (
              configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">
                        {getRoofTypeLabel(config.roof_type)} - {getZoneLabel(config.zone)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        GCₚ Value: <span className="font-mono">{config.gc_p_value}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{config.roof_type}</Badge>
                      <Badge variant="secondary">{config.zone}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(config.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <GcpConfigForm
          config={editingConfig}
          onClose={handleCloseForm}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this GCP configuration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

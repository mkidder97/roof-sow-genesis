
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useGCPConfig } from '@/hooks/useGCPConfig';
import { GCPConfigFormData, ROOF_TYPES, ZONES } from '@/types/gcpConfig';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

const formSchema = z.object({
  roof_type: z.string().min(1, 'Roof type is required'),
  zone: z.string().min(1, 'Zone is required'),
  gc_p_value: z.number().positive('GC/P value must be greater than 0'),
});

interface GCPConfigFormProps {
  isEdit?: boolean;
}

export function GCPConfigForm({ isEdit = false }: GCPConfigFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createConfig, updateConfig, getConfigById } = useGCPConfig();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GCPConfigFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roof_type: '',
      zone: '',
      gc_p_value: 0,
    },
  });

  const watchedRoofType = watch('roof_type');
  const watchedZone = watch('zone');

  useEffect(() => {
    if (isEdit && id) {
      const fetchConfig = async () => {
        try {
          const config = await getConfigById(id);
          setValue('roof_type', config.roof_type);
          setValue('zone', config.zone);
          setValue('gc_p_value', config.gc_p_value);
        } catch (error) {
          // Error handled in hook
        } finally {
          setInitialLoading(false);
        }
      };
      fetchConfig();
    }
  }, [isEdit, id, getConfigById, setValue]);

  const onSubmit = async (data: GCPConfigFormData) => {
    setLoading(true);
    
    try {
      if (isEdit && id) {
        await updateConfig(id, data);
      } else {
        await createConfig(data);
      }
      navigate('/gcp-config');
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <LoadingSkeleton className="h-10 w-10" />
          <LoadingSkeleton className="h-8 w-48" />
        </div>
        <LoadingSkeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/gcp-config">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit GCP Configuration' : 'Create GCP Configuration'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="roof_type">Roof Type *</Label>
                <Select
                  value={watchedRoofType}
                  onValueChange={(value) => setValue('roof_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select roof type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOF_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roof_type && (
                  <p className="text-sm text-red-500">{errors.roof_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Zone *</Label>
                <Select
                  value={watchedZone}
                  onValueChange={(value) => setValue('zone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONES.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.zone && (
                  <p className="text-sm text-red-500">{errors.zone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gc_p_value">GC/P Value *</Label>
                <Input
                  id="gc_p_value"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter GC/P value"
                  {...register('gc_p_value', { valueAsNumber: true })}
                />
                {errors.gc_p_value && (
                  <p className="text-sm text-red-500">{errors.gc_p_value.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be greater than 0
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link to="/gcp-config">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || loading}>
                <Save className="w-4 h-4 mr-2" />
                {isEdit ? 'Update Configuration' : 'Create Configuration'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

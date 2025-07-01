
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useGcpConfig } from '@/hooks/useGcpConfig';
import { GcpConfig, ROOF_TYPES, ZONES } from '@/types/gcpConfig';

interface GcpConfigFormProps {
  config: GcpConfig | null;
  onClose: () => void;
}

export const GcpConfigForm: React.FC<GcpConfigFormProps> = ({ config, onClose }) => {
  const { createConfig, updateConfig } = useGcpConfig();
  const [formData, setFormData] = useState({
    roof_type: '',
    zone: '',
    gc_p_value: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        roof_type: config.roof_type,
        zone: config.zone,
        gc_p_value: config.gc_p_value.toString()
      });
    }
  }, [config]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.roof_type) {
      newErrors.roof_type = 'Roof type is required';
    }

    if (!formData.zone) {
      newErrors.zone = 'Zone is required';
    }

    if (!formData.gc_p_value) {
      newErrors.gc_p_value = 'GCₚ value is required';
    } else {
      const value = parseFloat(formData.gc_p_value);
      if (isNaN(value) || value <= 0) {
        newErrors.gc_p_value = 'GCₚ value must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    const submitData = {
      roof_type: formData.roof_type,
      zone: formData.zone,
      gc_p_value: parseFloat(formData.gc_p_value)
    };

    let success = false;
    if (config) {
      success = await updateConfig({ ...submitData, id: config.id });
    } else {
      success = await createConfig(submitData);
    }

    setSubmitting(false);
    
    if (success) {
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {config ? 'Edit' : 'Create'} GCP Configuration
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="roof_type">Roof Type</Label>
                <Select
                  value={formData.roof_type}
                  onValueChange={(value) => handleInputChange('roof_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select roof type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOF_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roof_type && (
                  <p className="text-sm text-red-500 mt-1">{errors.roof_type}</p>
                )}
              </div>

              <div>
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={formData.zone}
                  onValueChange={(value) => handleInputChange('zone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONES.map((zone) => (
                      <SelectItem key={zone.value} value={zone.value}>
                        {zone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.zone && (
                  <p className="text-sm text-red-500 mt-1">{errors.zone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="gc_p_value">GCₚ Value</Label>
                <Input
                  id="gc_p_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.gc_p_value}
                  onChange={(e) => handleInputChange('gc_p_value', e.target.value)}
                  placeholder="Enter GCₚ value (e.g., 0.18)"
                />
                {errors.gc_p_value && (
                  <p className="text-sm text-red-500 mt-1">{errors.gc_p_value}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Saving...' : (config ? 'Update' : 'Create')}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
};

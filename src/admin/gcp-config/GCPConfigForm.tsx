
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GCPConfigFormProps {
  config?: any;
  onBack: () => void;
  onSave: () => void;
}

const GCPConfigForm: React.FC<GCPConfigFormProps> = ({ config, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    roof_type: '',
    zone: '',
    gc_p_value: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const roofTypes = [
    'Flat Roof',
    'Sloped Roof',
    'Gable Roof',
    'Hip Roof',
    'Mansard Roof',
    'Shed Roof',
    'Butterfly Roof',
    'Gambrel Roof'
  ];

  const zones = [
    '1', '2', '3', '4', '5'
  ];

  useEffect(() => {
    if (config) {
      setFormData({
        roof_type: config.roof_type || '',
        zone: config.zone || '',
        gc_p_value: config.gc_p_value?.toString() || ''
      });
    }
  }, [config]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.roof_type.trim()) {
      newErrors.roof_type = 'Roof type is required';
    }

    if (!formData.zone.trim()) {
      newErrors.zone = 'Zone is required';
    }

    if (!formData.gc_p_value.trim()) {
      newErrors.gc_p_value = 'GcP value is required';
    } else {
      const value = parseFloat(formData.gc_p_value);
      if (isNaN(value) || value <= 0) {
        newErrors.gc_p_value = 'GcP value must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const submitData = {
        roof_type: formData.roof_type,
        zone: formData.zone,
        gc_p_value: parseFloat(formData.gc_p_value)
      };

      if (config) {
        // Update existing config
        const { error } = await supabase
          .from('gcp_config')
          .update(submitData)
          .eq('id', config.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "GCP config updated successfully",
        });
      } else {
        // Create new config
        const { error } = await supabase
          .from('gcp_config')
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "GCP config created successfully",
        });
      }

      onSave();
    } catch (error: any) {
      let errorMessage = "Failed to save GCP config";
      
      if (error.code === '23505') {
        errorMessage = "A configuration with this roof type and zone combination already exists";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">
          {config ? 'Edit GCP Configuration' : 'Create GCP Configuration'}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="roof_type">Roof Type *</Label>
                <Select 
                  value={formData.roof_type} 
                  onValueChange={(value) => handleInputChange('roof_type', value)}
                >
                  <SelectTrigger className={errors.roof_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select roof type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roofTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roof_type && (
                  <p className="text-sm text-red-600">{errors.roof_type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Zone *</Label>
                <Select 
                  value={formData.zone} 
                  onValueChange={(value) => handleInputChange('zone', value)}
                >
                  <SelectTrigger className={errors.zone ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        Zone {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.zone && (
                  <p className="text-sm text-red-600">{errors.zone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gc_p_value">GcP Value *</Label>
              <Input
                id="gc_p_value"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter GcP value (must be > 0)"
                value={formData.gc_p_value}
                onChange={(e) => handleInputChange('gc_p_value', e.target.value)}
                className={errors.gc_p_value ? 'border-red-500' : ''}
              />
              {errors.gc_p_value && (
                <p className="text-sm text-red-600">{errors.gc_p_value}</p>
              )}
              <p className="text-sm text-gray-600">
                The GcP value must be a positive number representing the coefficient value.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {config ? 'Update' : 'Create'} Configuration
                  </>
                )}
              </Button>
              
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unique Constraint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Each combination of Roof Type and Zone must be unique. 
              You cannot create duplicate configurations with the same roof type and zone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GCPConfigForm;

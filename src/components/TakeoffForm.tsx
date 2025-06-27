// SOW Takeoff Form Component
// Location: src/components/TakeoffForm.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { sowApi, TakeoffFormData, FORM_OPTIONS, validateFormData, WorkflowResponse } from '@/lib/api/sow-api';

interface TakeoffFormProps {
  onSubmissionComplete?: (result: WorkflowResponse) => void;
}

export const TakeoffForm: React.FC<TakeoffFormProps> = ({ onSubmissionComplete }) => {
  // Form state
  const [formData, setFormData] = useState<Partial<TakeoffFormData>>({
    membrane_type: 'TPO',
    fastening_pattern: 'Mechanically Attached',
    building_code: 'IBC2021',
    asce_version: '7-16',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [submissionResult, setSubmissionResult] = useState<WorkflowResponse | null>(null);
  const [realTimeValidation, setRealTimeValidation] = useState(true);

  // Real-time validation effect
  useEffect(() => {
    if (!realTimeValidation) return;

    const validateRealTime = async () => {
      try {
        // Only validate if we have required fields
        if (formData.project_name && formData.address && formData.roof_area) {
          const result = await sowApi.validateTakeoffData(formData as TakeoffFormData);
          setValidationErrors(result.errors);
          setValidationWarnings(result.warnings);
        }
      } catch (error) {
        // Ignore real-time validation errors
      }
    };

    const debounceTimer = setTimeout(validateRealTime, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData, realTimeValidation]);

  // Handle form field changes
  const handleInputChange = (field: keyof TakeoffFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Client-side validation
      const clientErrors = validateFormData(formData);
      if (clientErrors.length > 0) {
        setValidationErrors(clientErrors);
        setIsSubmitting(false);
        return;
      }

      // Submit to API
      const result = await sowApi.submitTakeoffForm(formData as TakeoffFormData);
      setSubmissionResult(result);
      
      if (onSubmissionComplete) {
        onSubmissionComplete(result);
      }

    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Submission failed']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PDF download
  const handleDownload = async () => {
    if (!submissionResult?.download_url) return;

    try {
      const filename = submissionResult.download_url.split('/').pop() || 'sow-document.pdf';
      await sowApi.triggerPDFDownload(filename);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>SOW Takeoff Form</CardTitle>
          <CardDescription>
            Enter project details to generate a Scope of Work document
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Project Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  value={formData.project_name || ''}
                  onChange={(e) => handleInputChange('project_name', e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roof_area">Roof Area (sq ft) *</Label>
                <Input
                  id="roof_area"
                  type="number"
                  value={formData.roof_area || ''}
                  onChange={(e) => handleInputChange('roof_area', parseFloat(e.target.value))}
                  placeholder="Enter roof area"
                  min="100"
                  max="1000000"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Project Address *</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter complete project address"
                required
              />
            </div>

            {/* Roof System Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="membrane_type">Membrane Type *</Label>
                <Select value={formData.membrane_type} onValueChange={(value) => handleInputChange('membrane_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select membrane type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.membrane_types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fastening_pattern">Fastening Pattern *</Label>
                <Select value={formData.fastening_pattern} onValueChange={(value) => handleInputChange('fastening_pattern', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fastening pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.fastening_patterns.map(pattern => (
                      <SelectItem key={pattern} value={pattern}>{pattern}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insulation_type">Insulation Type</Label>
                <Select value={formData.insulation_type || ''} onValueChange={(value) => handleInputChange('insulation_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select insulation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.insulation_types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insulation_thickness">Insulation Thickness (in)</Label>
                <Input
                  id="insulation_thickness"
                  type="number"
                  value={formData.insulation_thickness || ''}
                  onChange={(e) => handleInputChange('insulation_thickness', parseFloat(e.target.value))}
                  placeholder="Thickness in inches"
                  min="0"
                  max="12"
                  step="0.25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deck_type">Deck Type</Label>
                <Select value={formData.deck_type || ''} onValueChange={(value) => handleInputChange('deck_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select deck type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.deck_types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Building & Code Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building_height">Building Height (ft)</Label>
                <Input
                  id="building_height"
                  type="number"
                  value={formData.building_height || ''}
                  onChange={(e) => handleInputChange('building_height', parseFloat(e.target.value))}
                  placeholder="Height in feet"
                  min="8"
                  max="500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wind_zone">Wind Zone</Label>
                <Select value={formData.wind_zone || ''} onValueChange={(value) => handleInputChange('wind_zone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select wind zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.wind_zones.map(zone => (
                      <SelectItem key={zone} value={zone}>Zone {zone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                  placeholder="TX"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={formData.county || ''}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  placeholder="County name"
                />
              </div>
            </div>

            {/* Code Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building_code">Building Code</Label>
                <Select value={formData.building_code || ''} onValueChange={(value) => handleInputChange('building_code', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select building code" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.building_codes.map(code => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asce_version">ASCE Version</Label>
                <Select value={formData.asce_version || ''} onValueChange={(value) => handleInputChange('asce_version', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ASCE version" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.asce_versions.map(version => (
                      <SelectItem key={version} value={version}>ASCE {version}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* HVHZ Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hvhz_zone"
                checked={formData.hvhz_zone || false}
                onCheckedChange={(checked) => handleInputChange('hvhz_zone', checked)}
              />
              <Label htmlFor="hvhz_zone">High Velocity Hurricane Zone (HVHZ)</Label>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {validationWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isSubmitting || validationErrors.length > 0}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating SOW...
                </>
              ) : (
                'Generate SOW Document'
              )}
            </Button>

            {/* Submission Result */}
            {submissionResult && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {submissionResult.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {submissionResult.status === 'success' ? 'SOW Generated Successfully!' : 'Generation Failed'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Workflow ID: {submissionResult.workflow_id}
                        </p>
                      </div>
                    </div>
                    
                    {submissionResult.download_url && (
                      <Button onClick={handleDownload} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    )}
                  </div>

                  {submissionResult.validation_warnings.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Warnings:</p>
                      <ul className="text-sm text-muted-foreground list-disc pl-4">
                        {submissionResult.validation_warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
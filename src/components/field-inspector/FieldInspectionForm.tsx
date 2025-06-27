import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Clock, Upload, Camera, Save, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { FieldInspectionData } from '@/types/fieldInspection';

import { ProjectInfoStep } from './form-steps/ProjectInfoStep';
import { BuildingSpecsStep } from './form-steps/BuildingSpecsStep';
import { RoofAssessmentStep } from './form-steps/RoofAssessmentStep';
import { EquipmentInventoryStep } from './form-steps/EquipmentInventoryStep';
import { PhotoDocumentationStep } from './form-steps/PhotoDocumentationStep';
import { AssessmentNotesStep } from './form-steps/AssessmentNotesStep';
import { HandoffPreparationPanel } from './HandoffPreparationPanel';
import { PhotoCaptureSystem } from './PhotoCaptureSystem';

interface FieldInspectionFormProps {
  inspectionId?: string;
  onSave?: (data: FieldInspectionData) => void;
  onComplete?: (data: FieldInspectionData) => void;
  readOnly?: boolean;
}

export const FieldInspectionForm: React.FC<FieldInspectionFormProps> = ({
  inspectionId,
  onSave,
  onComplete,
  readOnly = false
}) => {
  const { toast } = useToast();
  const {
    createInspection,
    updateInspection,
    getInspection,
    isLoading,
    error
  } = useFieldInspections();

  const [formData, setFormData] = useState<Partial<FieldInspectionData>>({
    project_name: '',
    project_address: '',
    inspector_name: '',
    status: 'Draft',
    priority_level: 'Standard',
    weather_conditions: 'Clear',
    access_method: 'internal_hatch',
    deck_type: 'steel',
    existing_membrane_type: 'tpo',
    insulation_type: 'polyiso',
    roof_slope: 'flat',
    insulation_condition: 'good',
    existing_membrane_condition: 5,
    roof_age_years: 10,
    building_height: 20,
    building_length: 100,
    building_width: 100,
    square_footage: 10000,
    number_of_stories: 1,
    hvac_units: [],
    roof_drains: [],
    penetrations: [],
    skylights: 0,
    roof_hatches: 0,
    overall_condition: 5,
    photos: [],
    completed: false,
    ready_for_handoff: false
  });

  const [activeTab, setActiveTab] = useState('project-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (inspectionId) {
      const fetchInspection = async () => {
        try {
          const inspectionData = await getInspection.mutateAsync(inspectionId);
          setFormData(inspectionData);
        } catch (err) {
          console.error('Error fetching inspection:', err);
          toast({
            title: "Error Fetching Inspection",
            description: "Failed to retrieve inspection data. Please try again.",
            variant: "destructive",
          });
        }
      };
      fetchInspection();
    }
  }, [inspectionId, getInspection, toast]);

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    switch (activeTab) {
      case 'project-info':
        if (!formData.project_name?.trim()) errors.push('Project name is required');
        if (!formData.project_address?.trim()) errors.push('Project address is required');
        if (!formData.inspector_name?.trim()) errors.push('Inspector name is required');
        break;
      case 'building-specs':
        if (!formData.building_height || formData.building_height <= 0) errors.push('Building height must be greater than 0');
        if (!formData.square_footage || formData.square_footage <= 0) errors.push('Square footage must be greater than 0');
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (inspectionId) {
        result = await updateInspection.mutateAsync({
          id: inspectionId,
          updates: formData
        });
      } else {
        result = await createInspection.mutateAsync(formData as FieldInspectionData);
      }

      if (onSave) {
        onSave(result);
      }

      toast({
        title: "Inspection Saved",
        description: "Your inspection has been saved successfully.",
      });

    } catch (error) {
      console.error('Error saving inspection:', error);
      toast({
        title: "Save Error",
        description: "Failed to save inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before marking as complete.",
        variant: "destructive",
      });
      return;
    }

    const completedData = {
      ...formData,
      completed: true,
      completed_at: new Date().toISOString(),
      status: 'Completed'
    };

    setIsSubmitting(true);
    try {
      let result;
      if (inspectionId) {
        result = await updateInspection.mutateAsync({
          id: inspectionId,
          updates: completedData
        });
      } else {
        result = await createInspection.mutateAsync(completedData as FieldInspectionData);
      }

      if (onComplete) {
        onComplete(result);
      }

      toast({
        title: "Inspection Completed",
        description: "Your inspection has been marked as complete and is ready for handoff.",
      });

    } catch (error) {
      console.error('Error completing inspection:', error);
      toast({
        title: "Completion Error",
        description: "Failed to complete inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FieldInspectionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: 'project-info', label: 'Project Info', icon: FileText },
    { id: 'building-specs', label: 'Building Specs', icon: CheckCircle },
    { id: 'roof-assessment', label: 'Roof Assessment', icon: AlertTriangle },
    { id: 'equipment-inventory', label: 'Equipment', icon: Clock },
    { id: 'photo-documentation', label: 'Photos', icon: Camera },
    { id: 'assessment-notes', label: 'Notes', icon: FileText },
  ];

  const getTabStatus = (tabId: string) => {
    // Simple validation logic for tab status
    switch (tabId) {
      case 'project-info':
        return formData.project_name && formData.project_address && formData.inspector_name ? 'complete' : 'incomplete';
      case 'building-specs':
        return formData.building_height && formData.square_footage ? 'complete' : 'incomplete';
      default:
        return 'optional';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Field Inspection Form
                {formData.completed && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {formData.project_name || 'New Inspection'} - {formData.project_address || 'No address specified'}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {!readOnly && !formData.completed && (
                <>
                  <Button onClick={handleSave} disabled={isSubmitting} variant="outline">
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Draft
                  </Button>
                  
                  <Button onClick={handleComplete} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Complete Inspection
                  </Button>
                </>
              )}
              
              <Button 
                onClick={() => setShowPhotoCapture(true)} 
                variant="outline"
                disabled={readOnly}
              >
                <Camera className="h-4 w-4 mr-2" />
                Quick Photo
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab Navigation */}
            <div className="border-b bg-gray-50/50 p-4">
              <TabsList className="grid w-full grid-cols-6 h-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const status = getTabStatus(tab.id);
                  
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-white"
                    >
                      <div className="flex items-center gap-1">
                        <Icon className="h-4 w-4" />
                        {status === 'complete' && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                        {status === 'incomplete' && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                      </div>
                      <span className="text-xs">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value="project-info" className="mt-0">
                <ProjectInfoStep
                  data={formData}
                  onChange={handleInputChange}
                  readOnly={readOnly}
                />
              </TabsContent>

              <TabsContent value="building-specs" className="mt-0">
                <BuildingSpecsStep
                  data={formData}
                  onChange={handleInputChange}
                  readOnly={readOnly}
                />
              </TabsContent>

              <TabsContent value="roof-assessment" className="mt-0">
                <RoofAssessmentStep
                  data={formData}
                  onChange={handleInputChange}
                  readOnly={readOnly}
                />
              </TabsContent>

              <TabsContent value="equipment-inventory" className="mt-0">
                <EquipmentInventoryStep
                  data={formData}
                  onChange={handleInputChange}
                  readOnly={readOnly}
                />
              </TabsContent>

              <TabsContent value="photo-documentation" className="mt-0">
                <PhotoDocumentationStep
                  data={formData}
                  onChange={handleInputChange}
                  readOnly={readOnly}
                />
              </TabsContent>

              <TabsContent value="assessment-notes" className="mt-0">
                <AssessmentNotesStep
                  data={formData}
                  onChange={handleInputChange}
                  readOnly={readOnly}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Handoff Panel - Only show if inspection is completed */}
      {formData.completed && (
        <HandoffPreparationPanel
          inspectionData={formData as FieldInspectionData}
          inspectionId={inspectionId}
        />
      )}

      {/* Photo Capture Modal */}
      {showPhotoCapture && (
        <PhotoCaptureSystem
          onPhotoCapture={(photoUrl) => {
            const currentPhotos = formData.photos || [];
            handleInputChange('photos', [...currentPhotos, photoUrl]);
            setShowPhotoCapture(false);
            toast({
              title: "Photo Added",
              description: "Photo has been added to the inspection.",
            });
          }}
          onClose={() => setShowPhotoCapture(false)}
        />
      )}
    </div>
  );
};
